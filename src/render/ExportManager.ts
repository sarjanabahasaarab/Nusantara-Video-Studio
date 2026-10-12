/**
 * Nusantara Video Studio - Export Manager
 * Phase 9: Professional Rendering & Export Engine (Requirements 30, 33, 34, 56, 57, 77)
 */

import {
  RenderSettings,
  ExportHistoryItem,
} from '../types/render';
import { Project } from '../types';
import { RenderEngine } from './RenderEngine';
import { RenderQueueManager } from './RenderQueue';

export class ExportManager {
  private static STORAGE_KEY = 'nvs_export_history_v9';

  /**
   * Generates formatted SRT subtitle string from project subtitle track
   */
  public static exportSubtitlesToSrt(project: Project, trackId?: string): string {
    const subtitleTracks = project.timeline?.subtitleTracks || [];
    const track = trackId
      ? subtitleTracks.find((t) => t.id === trackId)
      : subtitleTracks[0];

    if (!track || !track.items || track.items.length === 0) {
      return '';
    }

    const formatSrtTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.floor((seconds % 1) * 1000);
      const pad = (n: number, w = 2) => String(n).padStart(w, '0');
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
    };

    return track.items
      .map((item, idx) => {
        return `${idx + 1}\n${formatSrtTime(item.startTime)} --> ${formatSrtTime(item.endTime)}\n${item.text}\n`;
      })
      .join('\n');
  }

  /**
   * Generates formatted WebVTT subtitle string
   */
  public static exportSubtitlesToVtt(project: Project, trackId?: string): string {
    const srt = this.exportSubtitlesToSrt(project, trackId);
    if (!srt) return 'WEBVTT\n\n';
    return `WEBVTT\n\n${srt.replace(/,/g, '.')}`;
  }

  /**
   * Converts timeline markers into standard FFmetadata chapter format (Requirement 65)
   * Example:
   * ;FFMETADATA1
   * [CHAPTER]
   * TIMEBASE=1/1000
   * START=0
   * END=15000
   * title=Intro
   */
  public static exportChaptersToFFmetadata(project: Project): string {
    const markers = project.timeline?.markers || [];
    if (!markers || markers.length === 0) return '';

    const sorted = [...markers].sort((a, b) => a.time - b.time);
    const totalDurationMs = Math.floor((project.timeline?.duration || 10) * 1000);

    let result = ';FFMETADATA1\n';
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const startMs = Math.floor(cur.time * 1000);
      let endMs = totalDurationMs;
      if (cur.duration && cur.duration > 0) {
        endMs = Math.floor((cur.time + cur.duration) * 1000);
      } else if (i < sorted.length - 1) {
        endMs = Math.floor(sorted[i + 1].time * 1000);
      }

      result += `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${startMs}\nEND=${endMs}\ntitle=${cur.label || cur.name || `Chapter ${i + 1}`}\n`;
    }

    return result;
  }

  /**
   * Dispatches Batch Export for multiple aspect ratios or resolutions
   * (e.g. 16:9 Landscape, 9:16 Vertical Reels, 1:1 Square)
   */
  public static async queueMultiRatioBatchExport(
    project: Project,
    baseSettings: RenderSettings,
    ratios: Array<'16:9' | '9:16' | '1:1'>
  ): Promise<string[]> {
    const jobIds: string[] = [];

    for (const ratio of ratios) {
      let width = baseSettings.width;
      let height = baseSettings.height;

      if (ratio === '9:16') {
        width = 1080;
        height = 1920;
      } else if (ratio === '1:1') {
        width = 1080;
        height = 1080;
      }

      const ratioSettings: RenderSettings = {
        ...baseSettings,
        width,
        height,
        smartReframeRatio: ratio,
        outputPath: baseSettings.outputPath
          ? baseSettings.outputPath.replace(/(\.[^.]+)$/, `_${ratio.replace(':', 'x')}$1`)
          : '',
      };

      const job = await RenderEngine.prepareAndQueueRender(
        project,
        ratioSettings,
        `${project.name} (${ratio})`
      );
      jobIds.push(job.id);
    }

    return jobIds;
  }

  /**
   * Gets export history
   */
  public static getExportHistory(): ExportHistoryItem[] {
    if (typeof localStorage === 'undefined') return [];
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Saves item to export history
   */
  public static addHistoryItem(item: ExportHistoryItem): void {
    const current = this.getExportHistory().filter((h) => h.id !== item.id);
    const updated = [item, ...current].slice(0, 50);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public static deleteHistoryItem(id: string): void {
    const updated = this.getExportHistory().filter((h) => h.id !== id);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  public static clearHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}
