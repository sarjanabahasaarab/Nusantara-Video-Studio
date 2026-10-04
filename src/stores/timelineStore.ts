/**
 * Nusantara Video Studio - Timeline Store
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Coordinates multi-track timeline, transport playhead, interactive scrubbing,
 * non-destructive clip editing, snapping engine, audio keyframing, and waveform cache.
 */

import { create } from 'zustand';
import {
  AudioKeyframe,
  Clip,
  ClipAppearance,
  ClipAudio,
  ClipBasicEffects,
  ClipTextProperties,
  ClipTransform,
  Track,
  TrackType,
} from '../types';
import { useProjectStore } from './projectStore';
import { useSelectionStore } from './selectionStore';

// In-memory persistent audio waveform cache (Requirement 21)
const waveformCache = new Map<string, number[]>();

export interface TimelineState {
  currentTime: number; // in seconds
  isPlaying: boolean;
  zoom: number; // pixels per second (min: 10, max: 300, default: 45)
  scrollLeft: number;
  snapping: boolean;
  loop: boolean;
  previewVolume: number; // 0 to 100
  previewMuted: boolean;

  // Actions - Transport
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  previousFrame: () => void;
  nextFrame: () => void;
  jumpToBeginning: () => void;
  jumpToEnd: () => void;

  // Zoom & View
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (containerWidth: number) => void;
  setScrollLeft: (scroll: number) => void;
  setSnapping: (snapping: boolean) => void;
  setLoop: (loop: boolean) => void;
  setPreviewVolume: (vol: number) => void;
  setPreviewMuted: (muted: boolean) => void;

  // Snapping Calculation
  getSnappedTime: (rawTime: number, excludeClipId?: string, thresholdPx?: number) => number;

  // Track operations
  addTrack: (type: TrackType) => void;
  deleteTrack: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackHidden: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  renameTrack: (trackId: string, newName: string) => void;

  // Clip operations
  addClipToTrack: (trackId: string, clip: Clip) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartTime: number) => void;
  trimClipLeft: (clipId: string, deltaSeconds: number) => void;
  trimClipRight: (clipId: string, deltaSeconds: number) => void;
  splitClipAtCurrentTime: (clipId: string) => void;
  splitSelectedClipsAtPlayhead: () => void;
  removeClip: (clipId: string) => void;
  removeMultipleClips: (clipIds: string[]) => void;
  duplicateClip: (clipId: string) => void;
  duplicateMultipleClips: (clipIds: string[]) => void;
  duplicateSelectedClips: () => void;
  deleteSelectedClips: () => void;
  copySelectedClips: () => number;
  pasteClipsAtPlayhead: () => boolean;
  selectAllClips: () => void;
  updateClip: (clipId: string, partial: Partial<Clip>) => void;
  updateClipTransform: (clipId: string, transform: Partial<ClipTransform>) => void;
  updateClipAppearance: (clipId: string, appearance: Partial<ClipAppearance>) => void;
  updateClipBasicEffects: (clipId: string, effects: Partial<ClipBasicEffects>) => void;
  updateClipAudio: (clipId: string, audio: Partial<ClipAudio>) => void;
  updateClipText: (clipId: string, textProps: Partial<ClipTextProperties>) => void;
  resetClipProperties: (clipId: string) => void;

  // Audio Keyframes
  addAudioKeyframe: (clipId: string, time: number, volume: number) => void;
  removeAudioKeyframe: (clipId: string, keyframeId: string) => void;

  // Audio Waveform
  getAudioWaveform: (mediaKey: string, duration?: number) => number[];
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  currentTime: 0,
  isPlaying: false,
  zoom: 45, // 45px per second
  scrollLeft: 0,
  snapping: true,
  loop: false,
  previewVolume: 80,
  previewMuted: false,

  setCurrentTime: (time) => {
    const duration = useProjectStore.getState().currentProject.timeline.duration;
    const clamped = Math.max(0, Math.min(time, duration));
    set({ currentTime: clamped });
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  stop: () => {
    set({ isPlaying: false, currentTime: 0 });
  },

  previousFrame: () => {
    const fps = useProjectStore.getState().currentProject.settings.fps || 30;
    const frameDuration = 1 / fps;
    const newTime = Math.max(0, get().currentTime - frameDuration);
    set({ currentTime: newTime, isPlaying: false });
  },

  nextFrame: () => {
    const fps = useProjectStore.getState().currentProject.settings.fps || 30;
    const duration = useProjectStore.getState().currentProject.timeline.duration;
    const frameDuration = 1 / fps;
    const newTime = Math.min(duration, get().currentTime + frameDuration);
    set({ currentTime: newTime, isPlaying: false });
  },

  jumpToBeginning: () => set({ currentTime: 0 }),

  jumpToEnd: () => {
    const tracks = useProjectStore.getState().currentProject.timeline.tracks;
    let maxTime = 0;
    tracks.forEach((t) => {
      t.clips.forEach((c) => {
        const end = c.startTime + c.duration;
        if (end > maxTime) maxTime = end;
      });
    });
    set({ currentTime: maxTime });
  },

  setZoom: (zoom) => {
    const clamped = Math.max(10, Math.min(zoom, 300));
    set({ zoom: clamped });
  },

  zoomIn: () => {
    const { zoom } = get();
    get().setZoom(zoom * 1.3);
  },

  zoomOut: () => {
    const { zoom } = get();
    get().setZoom(zoom / 1.3);
  },

  zoomToFit: (containerWidth) => {
    const duration = useProjectStore.getState().currentProject.timeline.duration;
    if (duration > 0 && containerWidth > 0) {
      const calculated = Math.max(10, Math.min(300, (containerWidth - 60) / duration));
      get().setZoom(calculated);
      set({ scrollLeft: 0 });
    }
  },

  setScrollLeft: (scrollLeft) => set({ scrollLeft }),
  setSnapping: (snapping) => set({ snapping }),
  setLoop: (loop) => set({ loop }),
  setPreviewVolume: (previewVolume) => set({ previewVolume }),
  setPreviewMuted: (previewMuted) => set({ previewMuted }),

  /**
   * Snapping Engine (Requirement 13)
   * Evaluates playhead, clip boundaries, and markers.
   */
  getSnappedTime: (rawTime, excludeClipId, thresholdPx = 10) => {
    if (!get().snapping) return rawTime;

    const zoom = get().zoom;
    const thresholdSec = thresholdPx / zoom;
    const candidates: number[] = [0, get().currentTime];

    const project = useProjectStore.getState().currentProject;

    // Add timeline markers
    if (project.timeline.markers) {
      project.timeline.markers.forEach((m) => candidates.push(m.time));
    }

    // Add clip start and end points
    project.timeline.tracks.forEach((t) => {
      t.clips.forEach((c) => {
        if (c.id !== excludeClipId) {
          candidates.push(c.startTime);
          candidates.push(c.startTime + c.duration);
        }
      });
    });

    let bestDist = thresholdSec;
    let snappedTime = rawTime;

    for (const target of candidates) {
      const dist = Math.abs(rawTime - target);
      if (dist < bestDist) {
        bestDist = dist;
        snappedTime = target;
      }
    }

    return snappedTime;
  },

  addTrack: (type) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const tracks = [...projectStore.currentProject.timeline.tracks];

    const countOfType = tracks.filter((t) => t.type === type).length + 1;
    const prefix = type === 'video' ? `V${countOfType}` : `A${countOfType}`;
    const newTrack: Track = {
      id: `track-${type}-${Date.now()}`,
      name: `${prefix} (${type === 'video' ? 'Video' : 'Audio'})`,
      type,
      index: tracks.length,
      locked: false,
      muted: false,
      hidden: false,
      solo: false,
      clips: [],
    };

    if (type === 'video') {
      tracks.unshift(newTrack);
    } else {
      tracks.push(newTrack);
    }

    projectStore.updateTracks(tracks);
  },

  deleteTrack: (trackId) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const filtered = projectStore.currentProject.timeline.tracks.filter((t) => t.id !== trackId);
    projectStore.updateTracks(filtered);
  },

  toggleTrackLock: (trackId) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, locked: !t.locked } : t
    );
    projectStore.updateTracks(tracks);
  },

  toggleTrackMute: (trackId) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, muted: !t.muted } : t
    );
    projectStore.updateTracks(tracks);
  },

  toggleTrackHidden: (trackId) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, hidden: !t.hidden } : t
    );
    projectStore.updateTracks(tracks);
  },

  toggleTrackSolo: (trackId) => {
    const projectStore = useProjectStore.getState();
    const target = projectStore.currentProject.timeline.tracks.find((t) => t.id === trackId);
    if (!target) return;
    const nextSolo = !target.solo;
    const tracks = projectStore.currentProject.timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, solo: nextSolo } : t
    );
    projectStore.updateTracks(tracks);
  },

  renameTrack: (trackId, newName) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, name: newName } : t
    );
    projectStore.updateTracks(tracks);
  },

  addClipToTrack: (trackId, clip) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    // Default appearance & basic effects if missing
    const enrichedClip: Clip = {
      ...clip,
      trackId,
      transform: {
        positionX: clip.transform?.positionX ?? 0,
        positionY: clip.transform?.positionY ?? 0,
        scaleX: clip.transform?.scaleX ?? 1,
        scaleY: clip.transform?.scaleY ?? 1,
        rotation: clip.transform?.rotation ?? 0,
        opacity: clip.transform?.opacity ?? 1,
      },
      appearance: clip.appearance || {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        exposure: 0,
        temperature: 0,
        tint: 0,
      },
      basicEffects: clip.basicEffects || {
        blur: 0,
        sharpen: 0,
        vignette: 0,
        grayscale: 0,
        sepia: 0,
      },
      audio: clip.audio || {
        volume: 100,
        pan: 0,
        mute: false,
      },
    };

    const tracks = projectStore.currentProject.timeline.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, clips: [...t.clips, enrichedClip] };
      }
      return t;
    });

    projectStore.updateTracks(tracks);
    useSelectionStore.getState().selectClip(enrichedClip.id);
  },

  moveClip: (clipId, targetTrackId, newStartTime) => {
    const projectStore = useProjectStore.getState();
    const clampedStart = Math.max(0, newStartTime);

    let targetClip: Clip | null = null;
    const tracksWithoutClip = projectStore.currentProject.timeline.tracks.map((t) => {
      const found = t.clips.find((c) => c.id === clipId);
      if (found) targetClip = found;
      return {
        ...t,
        clips: t.clips.filter((c) => c.id !== clipId),
      };
    });

    if (!targetClip) return;

    const clipToMove: Clip = targetClip;
    const updatedClip: Clip = {
      ...clipToMove,
      trackId: targetTrackId,
      startTime: clampedStart,
      start: clampedStart,
    };

    const finalTracks = tracksWithoutClip.map((t) => {
      if (t.id === targetTrackId) {
        return {
          ...t,
          clips: [...t.clips, updatedClip].sort((a, b) => a.startTime - b.startTime),
        };
      }
      return t;
    });

    projectStore.updateTracks(finalTracks);
  },

  trimClipLeft: (clipId, deltaSeconds) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => {
      return {
        ...t,
        clips: t.clips.map((c) => {
          if (c.id !== clipId) return c;
          const minDuration = 0.2;
          const maxTrim = c.duration - minDuration;
          const validDelta = Math.max(-c.startTime, Math.min(deltaSeconds, maxTrim));

          const newStart = Math.max(0, c.startTime + validDelta);
          const newDuration = Math.max(minDuration, c.duration - validDelta);
          const newSourceStart = Math.max(0, (c.sourceStartTime || 0) + validDelta);

          return {
            ...c,
            startTime: newStart,
            start: newStart,
            duration: newDuration,
            sourceStartTime: newSourceStart,
            sourceStart: newSourceStart,
          };
        }),
      };
    });
    projectStore.updateTracks(tracks);
  },

  trimClipRight: (clipId, deltaSeconds) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => {
      return {
        ...t,
        clips: t.clips.map((c) => {
          if (c.id !== clipId) return c;
          const minDuration = 0.2;
          const newDuration = Math.max(minDuration, c.duration + deltaSeconds);
          return {
            ...c,
            duration: newDuration,
          };
        }),
      };
    });
    projectStore.updateTracks(tracks);
  },

  splitClipAtCurrentTime: (clipId) => {
    const projectStore = useProjectStore.getState();
    const splitTime = get().currentTime;

    projectStore.pushHistorySnapshot();

    const tracks = projectStore.currentProject.timeline.tracks.map((t) => {
      const clipIndex = t.clips.findIndex((c) => c.id === clipId);
      if (clipIndex === -1) return t;

      const clip = t.clips[clipIndex];
      // Only split if playhead is strictly within clip boundaries
      if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
        return t;
      }

      const durationFirstHalf = splitTime - clip.startTime;
      const durationSecondHalf = clip.duration - durationFirstHalf;

      const firstClip: Clip = {
        ...clip,
        duration: durationFirstHalf,
      };

      const secondClip: Clip = {
        ...clip,
        id: `clip-${clip.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        startTime: splitTime,
        start: splitTime,
        duration: durationSecondHalf,
        sourceStartTime: (clip.sourceStartTime || 0) + durationFirstHalf,
        sourceStart: (clip.sourceStartTime || 0) + durationFirstHalf,
      };

      const updatedClips = [...t.clips];
      updatedClips.splice(clipIndex, 1, firstClip, secondClip);

      return {
        ...t,
        clips: updatedClips,
      };
    });

    projectStore.updateTracks(tracks);
  },

  splitSelectedClipsAtPlayhead: () => {
    const selectedIds = useSelectionStore.getState().selectedClipIds;
    selectedIds.forEach((id) => {
      get().splitClipAtCurrentTime(id);
    });
  },

  removeClip: (clipId) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.filter((c) => c.id !== clipId),
    }));

    projectStore.updateTracks(tracks);
    useSelectionStore.getState().clearSelection();
  },

  removeMultipleClips: (clipIds) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const setIds = new Set(clipIds);

    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.filter((c) => !setIds.has(c.id)),
    }));

    projectStore.updateTracks(tracks);
    useSelectionStore.getState().clearSelection();
  },

  duplicateClip: (clipId) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    let newClipId: string | null = null;
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => {
      const found = t.clips.find((c) => c.id === clipId);
      if (!found) return t;

      newClipId = `clip-dup-${Date.now()}`;
      const duplicate: Clip = {
        ...JSON.parse(JSON.stringify(found)),
        id: newClipId,
        startTime: found.startTime + found.duration + 0.5,
        start: found.startTime + found.duration + 0.5,
        name: `${found.name} (Copy)`,
      };

      return {
        ...t,
        clips: [...t.clips, duplicate].sort((a, b) => a.startTime - b.startTime),
      };
    });

    projectStore.updateTracks(tracks);
    if (newClipId) {
      useSelectionStore.getState().selectClip(newClipId);
    }
  },

  duplicateMultipleClips: (clipIds) => {
    clipIds.forEach((id) => get().duplicateClip(id));
  },

  duplicateSelectedClips: () => {
    const selectedIds = useSelectionStore.getState().selectedClipIds;
    if (selectedIds.length === 0) return;
    get().duplicateMultipleClips(selectedIds);
  },

  deleteSelectedClips: () => {
    const selectedIds = useSelectionStore.getState().selectedClipIds;
    if (selectedIds.length === 0) return;
    get().removeMultipleClips(selectedIds);
  },

  copySelectedClips: () => {
    const selectedIds = useSelectionStore.getState().selectedClipIds;
    if (selectedIds.length === 0) return 0;
    const tracks = useProjectStore.getState().currentProject.timeline.tracks;
    const clipsToCopy: Clip[] = [];
    tracks.forEach((t) => {
      t.clips.forEach((c) => {
        if (selectedIds.includes(c.id)) {
          clipsToCopy.push(c);
        }
      });
    });
    useSelectionStore.getState().copyClips(clipsToCopy);
    return clipsToCopy.length;
  },

  pasteClipsAtPlayhead: () => {
    const clipboard = useSelectionStore.getState().clipboardClips;
    if (!clipboard || clipboard.length === 0) return false;

    const projectStore = useProjectStore.getState();
    const playheadTime = get().currentTime;
    projectStore.pushHistorySnapshot();

    const minStartTime = Math.min(...clipboard.map((c) => c.startTime));
    const newClips: Clip[] = [];

    const updatedTracks = projectStore.currentProject.timeline.tracks.map((track) => {
      const clipsToPaste = clipboard.filter((c) => c.trackId === track.id);
      if (clipsToPaste.length === 0) return track;

      const pastedClips = clipsToPaste.map((clip) => {
        const offset = clip.startTime - minStartTime;
        const newStart = Math.max(0, playheadTime + offset);
        const newId = `clip-${clip.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const cloned: Clip = {
          ...JSON.parse(JSON.stringify(clip)),
          id: newId,
          startTime: newStart,
          start: newStart,
          name: `${clip.name} (Paste)`,
        };
        newClips.push(cloned);
        return cloned;
      });

      return {
        ...track,
        clips: [...track.clips, ...pastedClips].sort((a, b) => a.startTime - b.startTime),
      };
    });

    if (newClips.length === 0) {
      const firstVideoTrack = updatedTracks.find((t) => t.type === 'video');
      const firstAudioTrack = updatedTracks.find((t) => t.type === 'audio');

      clipboard.forEach((clip, idx) => {
        const offset = clip.startTime - minStartTime;
        const newStart = Math.max(0, playheadTime + offset);
        const newId = `clip-${clip.type}-${Date.now()}-${idx}`;
        const targetTrack = (clip.type === 'audio' || clip.type === 'voice-recording')
          ? firstAudioTrack
          : firstVideoTrack;

        if (targetTrack) {
          const cloned: Clip = {
            ...JSON.parse(JSON.stringify(clip)),
            id: newId,
            trackId: targetTrack.id,
            startTime: newStart,
            start: newStart,
            name: `${clip.name} (Paste)`,
          };
          targetTrack.clips.push(cloned);
          targetTrack.clips.sort((a, b) => a.startTime - b.startTime);
          newClips.push(cloned);
        }
      });
    }

    projectStore.updateTracks(updatedTracks);
    if (newClips.length > 0) {
      useSelectionStore.getState().selectMultipleClips(newClips.map((c) => c.id));
      return true;
    }
    return false;
  },

  selectAllClips: () => {
    const tracks = useProjectStore.getState().currentProject.timeline.tracks;
    const allClipIds: string[] = [];
    tracks.forEach((t) => t.clips.forEach((c) => allClipIds.push(c.id)));
    useSelectionStore.getState().selectMultipleClips(allClipIds);
  },

  updateClip: (clipId, partial) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...partial } : c)),
    }));
    projectStore.updateTracks(tracks);
  },

  updateClipTransform: (clipId, transform) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const currentTransform = c.transform || {
          positionX: 0,
          positionY: 0,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          opacity: 1,
        };
        return {
          ...c,
          transform: {
            ...currentTransform,
            ...transform,
          },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  updateClipAppearance: (clipId, appearance) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const current = c.appearance || {
          brightness: 100,
          contrast: 100,
          saturation: 100,
          exposure: 0,
          temperature: 0,
          tint: 0,
        };
        return {
          ...c,
          appearance: { ...current, ...appearance },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  updateClipBasicEffects: (clipId, effects) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const current = c.basicEffects || {
          blur: 0,
          sharpen: 0,
          vignette: 0,
          grayscale: 0,
          sepia: 0,
        };
        return {
          ...c,
          basicEffects: { ...current, ...effects },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  updateClipAudio: (clipId, audio) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const current = c.audio || { volume: 100, pan: 0, mute: false };
        return {
          ...c,
          audio: { ...current, ...audio },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  updateClipText: (clipId, textProps) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const current = c.textProps || {
          text: 'Title Text',
          fontFamily: 'Inter',
          fontSize: 48,
          color: '#ffffff',
          alignment: 'center',
        };
        return {
          ...c,
          textProps: { ...current, ...textProps },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  resetClipProperties: (clipId) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        return {
          ...c,
          transform: {
            positionX: 0,
            positionY: 0,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            opacity: 1,
            flipHorizontal: false,
            flipVertical: false,
          },
          appearance: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            exposure: 0,
            temperature: 0,
            tint: 0,
          },
          basicEffects: {
            blur: 0,
            sharpen: 0,
            vignette: 0,
            grayscale: 0,
            sepia: 0,
          },
          audio: {
            volume: 100,
            pan: 0,
            gain: 0,
            mute: false,
            fadeIn: 0,
            fadeOut: 0,
          },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  addAudioKeyframe: (clipId, time, volume) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const currentAudio = c.audio || { volume: 100, pan: 0, mute: false };
        const keyframes = currentAudio.keyframes ? [...currentAudio.keyframes] : [];
        const newKf: AudioKeyframe = {
          id: `kf-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          time: Math.max(0, Math.min(time, c.duration)),
          volume: Math.max(0, Math.min(200, volume)),
        };
        const updated = [...keyframes, newKf].sort((a, b) => a.time - b.time);
        return {
          ...c,
          audio: { ...currentAudio, keyframes: updated },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  removeAudioKeyframe: (clipId, keyframeId) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId || !c.audio?.keyframes) return c;
        return {
          ...c,
          audio: {
            ...c.audio,
            keyframes: c.audio.keyframes.filter((k) => k.id !== keyframeId),
          },
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  /**
   * Audio Waveform Caching (Requirement 21)
   * Generates lightweight, deterministic normalized waveform bars once and caches them.
   */
  getAudioWaveform: (mediaKey, duration = 30) => {
    if (waveformCache.has(mediaKey)) {
      return waveformCache.get(mediaKey)!;
    }

    let hash = 0;
    for (let i = 0; i < mediaKey.length; i++) {
      hash = (hash << 5) - hash + mediaKey.charCodeAt(i);
      hash |= 0;
    }

    const pointsCount = Math.max(20, Math.min(120, Math.round(duration * 2)));
    const points: number[] = [];

    for (let i = 0; i < pointsCount; i++) {
      // Deterministic synthetic waveform
      const v = Math.abs(Math.sin(hash + i * 0.45) * 0.6 + Math.cos(hash + i * 1.2) * 0.4);
      points.push(Math.max(0.12, Math.min(1.0, v)));
    }

    waveformCache.set(mediaKey, points);
    return points;
  },
}));
