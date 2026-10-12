/**
 * Nusantara Video Studio - Master Render Engine
 * Phase 9: Professional Rendering & Export Engine (Requirements 1, 3, 4, 5, 47, 68)
 *
 * Coordinates project timeline extraction, unified RenderGraph compilation,
 * FFmpeg arguments generation, and execution through the Render Queue.
 */

import { Project } from '../types';
import {
  RenderGraph,
  RenderSettings,
  VideoRenderTrack,
  AudioRenderTrack,
  RenderOverlay,
} from '../types/render';
import { RenderJobInstance } from './RenderJob';
import { RenderQueueManager } from './RenderQueue';
import { RenderValidator } from './RenderValidator';
import { FFmpegAdapter } from './adapters/FFmpegAdapter';
import { RenderSettingsManager } from './RenderSettings';

export class RenderEngine {
  /**
   * Compiles the source-of-truth RenderGraph from Project Timeline (Requirement 5)
   */
  public static buildRenderGraph(
    project: Project,
    settings: RenderSettings
  ): RenderGraph {
    const { settings: projSettings, timeline, media } = project;
    const mediaMap = new Map((media || []).map((m) => [m.id, m]));

    const fps = settings.fps || projSettings?.fps || 30;
    const width = settings.width || projSettings?.width || 1920;
    const height = settings.height || projSettings?.height || 1080;

    let inPointSec = 0;
    let outPointSec = timeline?.duration || 10;

    if (settings.rangeType === 'in_out') {
      inPointSec = settings.rangeInSec !== undefined ? settings.rangeInSec : 0;
      outPointSec = settings.rangeOutSec !== undefined ? settings.rangeOutSec : (timeline?.duration || 10);
    }

    const durationSec = Math.max(0.1, outPointSec - inPointSec);

    // Build video render tracks
    const videoTracks: VideoRenderTrack[] = [];
    const audioTracks: AudioRenderTrack[] = [];
    const overlays: RenderOverlay[] = [];

    (timeline?.tracks || []).forEach((track, tIdx) => {
      if (track.hidden || track.muted) return;

      if (track.type === 'video') {
        const clips = track.clips
          .filter((c) => {
            if (settings.rangeType === 'selected_clip' && settings.selectedClipId) {
              return c.id === settings.selectedClipId;
            }
            return c.startTime + c.duration > inPointSec && c.startTime < outPointSec;
          })
          .map((clip) => {
            const mediaItem = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
            // Respect proxy rule: use original media unless requested or offline (Requirement 58)
            let sourcePath = mediaItem?.path || mediaItem?.blobUrl || '';
            if (settings.useProxyMedia && mediaItem?.proxy?.status === 'ready') {
              sourcePath = mediaItem.proxy.proxyPath || mediaItem.proxy.proxyBlobUrl || sourcePath;
            }

            return {
              id: clip.id,
              mediaId: clip.mediaId,
              sourcePath,
              timelineStart: clip.startTime,
              duration: clip.duration,
              sourceStart: clip.sourceStartTime || 0,
              speed: clip.speed?.rate || 1.0,
              opacity: clip.transform?.opacity ?? 1.0,
              transform: {
                positionX: clip.transform?.positionX || 0,
                positionY: clip.transform?.positionY || 0,
                scaleX: clip.transform?.scaleX || 1.0,
                scaleY: clip.transform?.scaleY || 1.0,
                rotation: clip.transform?.rotation || 0,
              },
              effects: clip.effects || [],
              colorGrading: clip.colorGrading,
              chromaKey: clip.chromaKey,
              masks: clip.masks || [],
              keyframes: clip.animatedProperties || [],
            };
          });

        if (clips.length > 0) {
          videoTracks.push({
            id: track.id,
            name: track.name,
            index: tIdx,
            clips,
          });
        }
      } else if (track.type === 'audio') {
        const aClips = track.clips
          .filter((c) => c.startTime + c.duration > inPointSec && c.startTime < outPointSec)
          .map((clip) => {
            const mediaItem = clip.mediaId ? mediaMap.get(clip.mediaId) : undefined;
            const sourcePath = mediaItem?.path || mediaItem?.blobUrl || '';
            return {
              id: clip.id,
              mediaId: clip.mediaId,
              sourcePath,
              timelineStart: clip.startTime,
              duration: clip.duration,
              sourceStart: clip.sourceStartTime || 0,
              volume: clip.audio?.volume ?? 1.0,
              speed: clip.speed?.rate || 1.0,
            };
          });

        if (aClips.length > 0) {
          audioTracks.push({
            id: track.id,
            name: track.name,
            index: tIdx,
            volume: 1.0,
            pan: 0,
            muted: track.muted,
            solo: !!track.solo,
            clips: aClips,
          });
        }
      }
    });

    // Subtitle pipeline
    const subtitlePipeline = {
      mode: settings.subtitleMode,
      items: (timeline?.subtitleTracks?.[0]?.items || []).map((s) => ({
        startSec: s.startTime,
        endSec: s.endTime,
        text: s.text,
      })),
    };

    return {
      durationSec,
      fps,
      width,
      height,
      videoTracks,
      audioTracks,
      effects: [],
      transitions: timeline?.transitions || [],
      overlays,
      subtitlePipeline,
      inPointSec,
      outPointSec,
    };
  }

  /**
   * Prepares, generates FFmpeg arguments, and submits a render job to the queue
   */
  public static async prepareAndQueueRender(
    project: Project,
    settings: RenderSettings,
    jobTitle?: string
  ): Promise<RenderJobInstance> {
    // 1. Run Preflight
    const preflight = await RenderValidator.validatePreflight(project, settings);
    if (!preflight.canProceed) {
      const err = preflight.issues.find((i) => i.severity === 'error');
      throw new Error(err ? err.message : 'Render preflight gagal.');
    }

    // 2. Build RenderGraph
    const graph = this.buildRenderGraph(project, settings);

    // 3. Resolve destination output path if empty
    let finalSettings = { ...settings };
    if (!finalSettings.outputPath) {
      const ext = finalSettings.format === 'webm' ? '.webm' : finalSettings.format === 'mov' ? '.mov' : '.mp4';
      const filename = RenderSettingsManager.generateFilename('{project}_{resolution}_{date}', {
        projectName: project.name || 'Nusantara',
        resolution: `${finalSettings.width}x${finalSettings.height}`,
        presetName: finalSettings.qualityPreset,
        extension: ext,
      });
      finalSettings.outputPath = `/exports/${filename}`;
    }

    // 4. Generate FFmpeg argument array
    const { args } = await FFmpegAdapter.buildExecutionArgs(graph, finalSettings);

    // 5. Create Job Instance
    const job = new RenderJobInstance(
      project.id,
      jobTitle || project.name || 'Proyek Video',
      finalSettings
    );

    // 6. Submit to backend API
    try {
      await fetch('/api/render/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          settings: finalSettings,
          args,
          durationSec: graph.durationSec,
          fps: graph.fps,
          projectName: project.name,
        }),
      });
    } catch {
      // offline / fallback
    }

    // 7. Enqueue into RenderQueueManager
    RenderQueueManager.getInstance().addJob(job);

    return job;
  }
}
