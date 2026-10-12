/**
 * Nusantara Video Studio - AI Store
 * Phase 7: AI-Assisted Editing
 *
 * Coordinates AI Workspace state, background job queue subscription,
 * results caching, and non-destructive timeline integration with full undo/redo.
 */

import { create } from 'zustand';
import {
  AICapability,
  AIJob,
  AIResult,
  AISettings,
  Scene,
  SilenceRegion,
  TranscriptData,
  SmartReframeResult,
  AudioCleanupResult,
} from '../types/ai';
import { AIEngine, SuggestedCut } from '../ai/AIEngine';
import { AISettingsManager, DEFAULT_AI_SETTINGS } from '../ai/AISettings';
import { TranscriptionEngine } from '../ai/capabilities/transcription';
import { useProjectStore } from './projectStore';
import { useSubtitleStore } from './subtitleStore';
import { Clip } from '../types';

interface AIState {
  jobs: AIJob[];
  settings: AISettings;
  selectedTool: AICapability | 'smart-cut';
  selectedClipId: string | null;
  selectedMediaId: string | null;

  // Cached results for active session
  detectedScenes: Scene[];
  detectedSilences: SilenceRegion[];
  currentTranscript: TranscriptData | null;
  reframeResult: SmartReframeResult | null;
  cleanupResult: AudioCleanupResult | null;
  smartCutSuggestions: SuggestedCut[];
  selectedCutIds: string[];

  // Actions
  updateSettings: (partial: Partial<AISettings>) => void;
  setSelectedTool: (tool: AICapability | 'smart-cut') => void;
  setSelectedClipId: (clipId: string | null) => void;
  setSelectedMediaId: (mediaId: string | null) => void;

  // Job Queue management
  cancelJob: (jobId: string) => void;
  retryJob: (jobId: string) => void;
  removeJob: (jobId: string) => void;
  clearCompletedJobs: () => void;

  // Tool Launchers
  runSceneDetection: (mediaId: string, videoUrl?: string, duration?: number) => void;
  runSilenceDetection: (mediaId: string, duration?: number, channelData?: Float32Array) => void;
  runSmartReframe: (clipId: string, targetAspectRatio: '16:9' | '9:16' | '1:1' | '4:5') => void;
  runAudioCleanup: (clipId: string, options?: { removeHum?: boolean; humFrequency?: 50 | 60; noiseReductionDb?: number }) => void;
  runTranscription: (mediaId: string, audioUrl?: string) => void;

  // Direct Timeline Actions (Non-destructive, Undoable)
  addScenesAsMarkers: () => void;
  createSubclipsFromScenes: () => void;
  applyRemoveSilence: (removeAll?: boolean) => void;
  applySmartCutEdits: (cutIds?: string[]) => void;
  generateSubtitlesToTrack: (options?: { maxCharsPerLine?: number; maxLines?: number; minDurationSec?: number }) => void;
  applySmartReframeToClip: (clipId?: string) => void;
  applyAudioCleanupToClip: (clipId?: string) => void;
}

const aiEngine = AIEngine.getInstance();
const jobQueue = aiEngine.getJobQueue();

export const useAIStore = create<AIState>((set, get) => {
  // Subscribe to job queue events
  jobQueue.subscribe((jobs) => {
    set({ jobs });

    // Sync latest completed results
    const latestCompleted = jobs.find((j) => j.status === 'completed' && j.result);
    if (latestCompleted && latestCompleted.result) {
      const res = latestCompleted.result;
      if (res.type === 'scene-detection') {
        set({ detectedScenes: res.data.scenes });
      } else if (res.type === 'silence-detection') {
        set({
          detectedSilences: res.data.regions,
          smartCutSuggestions: aiEngine.generateSmartCutSuggestions(res.data.regions, get().detectedScenes),
          selectedCutIds: res.data.regions.map((r) => `sug-silence-${r.id}`),
        });
      } else if (res.type === 'transcription') {
        set({ currentTranscript: res.data });
      } else if (res.type === 'smart-reframe') {
        set({ reframeResult: res.data });
      } else if (res.type === 'audio-cleanup') {
        set({ cleanupResult: res.data });
      }
    }
  });

  return {
    jobs: jobQueue.getJobs(),
    settings: AISettingsManager.getSettings(),
    selectedTool: 'scene-detection',
    selectedClipId: null,
    selectedMediaId: null,

    detectedScenes: [],
    detectedSilences: [],
    currentTranscript: null,
    reframeResult: null,
    cleanupResult: null,
    smartCutSuggestions: [],
    selectedCutIds: [],

    updateSettings: (partial) => {
      const updated = { ...get().settings, ...partial };
      AISettingsManager.saveSettings(updated);
      set({ settings: updated });
    },

    setSelectedTool: (selectedTool) => set({ selectedTool }),
    setSelectedClipId: (selectedClipId) => set({ selectedClipId }),
    setSelectedMediaId: (selectedMediaId) => set({ selectedMediaId }),

    cancelJob: (jobId) => jobQueue.cancel(jobId),
    retryJob: (jobId) => jobQueue.retry(jobId),
    removeJob: (jobId) => jobQueue.remove(jobId),
    clearCompletedJobs: () => jobQueue.clearCompleted(),

    runSceneDetection: (mediaId, videoUrl, duration) => {
      aiEngine.detectScenes(mediaId, { videoUrl, duration });
    },

    runSilenceDetection: (mediaId, duration, channelData) => {
      aiEngine.detectSilence(mediaId, { duration, channelData });
    },

    runSmartReframe: (clipId, targetAspectRatio) => {
      aiEngine.smartReframe(clipId, targetAspectRatio);
    },

    runAudioCleanup: (clipId, options) => {
      aiEngine.cleanAudio(clipId, options);
    },

    runTranscription: (mediaId, audioUrl) => {
      aiEngine.transcribe(mediaId, { audioUrl });
    },

    // Timeline Integration (Requirement 15: Add scenes as markers / create subclips)
    addScenesAsMarkers: () => {
      const { detectedScenes } = get();
      if (detectedScenes.length === 0) return;

      const projectStore = useProjectStore.getState();
      projectStore.pushHistorySnapshot();

      detectedScenes.forEach((sc, idx) => {
        projectStore.addMarker(
          sc.start,
          `Scene ${String(idx + 1).padStart(2, '0')}`,
          '#3b82f6'
        );
      });
    },

    createSubclipsFromScenes: () => {
      const { detectedScenes, selectedMediaId } = get();
      if (detectedScenes.length === 0) return;

      const projectStore = useProjectStore.getState();
      const mediaList = projectStore.currentProject.media;
      const parentMedia = mediaList.find((m) => m.id === selectedMediaId) || mediaList[0];
      if (!parentMedia) return;

      projectStore.pushHistorySnapshot();

      const newSubclips = detectedScenes.map((sc, idx) => ({
        ...parentMedia,
        id: `media-subclip-${Date.now()}-${idx}`,
        name: `${parentMedia.name} - Scene ${String(idx + 1).padStart(2, '0')}`,
        duration: Math.max(0.1, sc.end - sc.start),
        createdAt: new Date().toISOString(),
      }));

      useProjectStore.setState((state) => ({
        currentProject: {
          ...state.currentProject,
          media: [...state.currentProject.media, ...newSubclips],
        },
        isDirty: true,
      }));
    },

    // Non-destructive Silence Removal Ripple Cut (Requirement 17)
    applyRemoveSilence: (removeAll = true) => {
      const { detectedSilences, selectedClipId } = get();
      if (detectedSilences.length === 0) return;

      const projectStore = useProjectStore.getState();
      projectStore.pushHistorySnapshot();

      const tracks = projectStore.currentProject.timeline.tracks.map((track) => {
        const clipIdx = track.clips.findIndex(
          (c) => c.id === selectedClipId || (selectedClipId == null && c.type === 'video')
        );
        if (clipIdx === -1) return track;

        const targetClip = track.clips[clipIdx];
        const silencesToCut = removeAll ? detectedSilences : detectedSilences.slice(0, 1);

        // Compute active speech slices (inversion of silence regions)
        const keepSegments: { start: number; end: number }[] = [];
        let cur = 0;

        for (const sil of silencesToCut) {
          if (sil.start > cur) {
            keepSegments.push({ start: cur, end: Math.min(sil.start, targetClip.duration) });
          }
          cur = Math.max(cur, sil.end);
        }
        if (cur < targetClip.duration) {
          keepSegments.push({ start: cur, end: targetClip.duration });
        }

        // Generate non-destructive ripple cut clips
        let runningTimelineStart = targetClip.startTime;
        const newClips: Clip[] = [];

        keepSegments.forEach((seg, idx) => {
          const segDuration = seg.end - seg.start;
          if (segDuration > 0.1) {
            newClips.push({
              ...targetClip,
              id: `${targetClip.id}-cut-${idx + 1}-${Date.now().toString(36)}`,
              startTime: runningTimelineStart,
              start: runningTimelineStart,
              duration: segDuration,
              sourceStartTime: (targetClip.sourceStartTime || 0) + seg.start,
              sourceStart: (targetClip.sourceStartTime || 0) + seg.start,
            });
            runningTimelineStart += segDuration;
          }
        });

        if (newClips.length === 0) return track;

        const updatedClips = [...track.clips];
        updatedClips.splice(clipIdx, 1, ...newClips);
        return { ...track, clips: updatedClips };
      });

      projectStore.updateTracks(tracks);
    },

    applySmartCutEdits: (cutIds) => {
      get().applyRemoveSilence(true);
    },

    // Subtitle track generation from transcript (Requirement 11)
    generateSubtitlesToTrack: (options) => {
      const { currentTranscript } = get();
      if (!currentTranscript) return;

      const subtitleItems = TranscriptionEngine.convertToSubtitles(currentTranscript, options);
      const subtitleStore = useSubtitleStore.getState();
      const track = subtitleStore.createSubtitleTrack('AI Subtitles', currentTranscript.language || 'id');

      // Populate track items
      useProjectStore.setState((state) => {
        const subTracks = (state.currentProject.timeline.subtitleTracks || []).map((t) =>
          t.id === track.id ? { ...t, items: subtitleItems } : t
        );
        return {
          currentProject: {
            ...state.currentProject,
            timeline: { ...state.currentProject.timeline, subtitleTracks: subTracks },
          },
          isDirty: true,
        };
      });
    },

    applySmartReframeToClip: (clipId) => {
      const { reframeResult, selectedClipId } = get();
      if (!reframeResult) return;
      const targetId = clipId || selectedClipId;
      if (!targetId) return;

      const projectStore = useProjectStore.getState();
      projectStore.pushHistorySnapshot();

      const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => {
          if (c.id === targetId) {
            return {
              ...c,
              transform: {
                ...c.transform,
                scaleX: reframeResult.recommendedScale,
                scaleY: reframeResult.recommendedScale,
                positionX: (c.transform.positionX || 0) + reframeResult.cropPanX * 2,
              },
            };
          }
          return c;
        }),
      }));

      projectStore.updateTracks(tracks);
    },

    applyAudioCleanupToClip: (clipId) => {
      const { cleanupResult, selectedClipId } = get();
      if (!cleanupResult) return;
      const targetId = clipId || selectedClipId;
      if (!targetId) return;

      const projectStore = useProjectStore.getState();
      projectStore.pushHistorySnapshot();

      const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
        ...t,
        clips: t.clips.map((c) => {
          if (c.id === targetId) {
            return {
              ...c,
              audio: {
                volume: Math.min(100, Math.max(0, (c.audio?.volume || 100) + cleanupResult.peakDbGain * 3)),
                pan: c.audio?.pan ?? 0,
                mute: c.audio?.mute ?? false,
                gain: (c.audio?.gain || 0) + cleanupResult.peakDbGain,
              },
              audioEffects: c.audioEffects ? {
                ...c.audioEffects,
                eq: {
                  ...c.audioEffects.eq,
                  enabled: true,
                },
                noiseReduction: {
                  ...c.audioEffects.noiseReduction,
                  enabled: true,
                  reductionDb: Math.abs(cleanupResult.noiseReductionDb),
                },
              } : undefined,
            };
          }
          return c;
        }),
      }));

      projectStore.updateTracks(tracks);
    },
  };
});
