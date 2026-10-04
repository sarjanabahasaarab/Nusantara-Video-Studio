/**
 * Nusantara Video Studio - Timeline Store
 * Manages timeline playhead, playback, tracks, zoom, and interactions.
 */

import { create } from 'zustand';
import { Clip, Track, TrackType } from '../types';
import { useProjectStore } from './projectStore';

interface TimelineState {
  currentTime: number; // in seconds
  isPlaying: boolean;
  zoom: number; // pixels per second (min: 5, max: 200, default: 40)
  scrollLeft: number;
  snapping: boolean;
  loop: boolean;
  previewVolume: number; // 0 to 100
  previewMuted: boolean;

  // Actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: (containerWidth: number) => void;
  setScrollLeft: (scroll: number) => void;
  setSnapping: (snapping: boolean) => void;
  setLoop: (loop: boolean) => void;
  setPreviewVolume: (vol: number) => void;
  setPreviewMuted: (muted: boolean) => void;
  
  // Track operations
  addTrack: (type: TrackType) => void;
  deleteTrack: (trackId: string) => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackHidden: (trackId: string) => void;
  renameTrack: (trackId: string, newName: string) => void;

  // Clip operations (Phase 1 base)
  addClipToTrack: (trackId: string, clip: Clip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, partial: Partial<Clip>) => void;
  splitClipAtCurrentTime: (clipId: string) => void;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  currentTime: 0,
  isPlaying: false,
  zoom: 40, // 40px = 1s
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

  setZoom: (zoom) => {
    const clamped = Math.max(10, Math.min(zoom, 250));
    set({ zoom: clamped });
  },

  zoomIn: () => {
    const { zoom } = get();
    get().setZoom(zoom * 1.25);
  },

  zoomOut: () => {
    const { zoom } = get();
    get().setZoom(zoom / 1.25);
  },

  zoomToFit: (containerWidth) => {
    const duration = useProjectStore.getState().currentProject.timeline.duration;
    if (duration > 0 && containerWidth > 0) {
      const calculated = Math.max(10, (containerWidth - 40) / duration);
      get().setZoom(calculated);
    }
  },

  setScrollLeft: (scrollLeft) => set({ scrollLeft }),
  setSnapping: (snapping) => set({ snapping }),
  setLoop: (loop) => set({ loop }),
  setPreviewVolume: (previewVolume) => set({ previewVolume }),
  setPreviewMuted: (previewMuted) => set({ previewMuted }),

  addTrack: (type) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const tracks = [...projectStore.currentProject.timeline.tracks];

    // Find next index
    const countOfType = tracks.filter((t) => t.type === type).length + 1;
    const prefix = type === 'video' ? `V${countOfType}` : `A${countOfType}`;
    const newTrack: Track = {
      id: `track-${type}-${Date.now()}`,
      name: `${prefix} (${type === 'video' ? 'Video Track' : 'Audio Track'})`,
      type,
      index: tracks.length,
      locked: false,
      muted: false,
      hidden: false,
      clips: [],
    };

    if (type === 'video') {
      // Put at top of video tracks
      tracks.unshift(newTrack);
    } else {
      // Put at bottom of audio tracks
      tracks.push(newTrack);
    }

    // Re-index
    tracks.forEach((t, i) => (t.index = i));
    projectStore.updateTracks(tracks);
  },

  deleteTrack: (trackId) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks;
    if (tracks.length <= 1) {
      return; // Keep at least one track
    }
    projectStore.pushHistorySnapshot();
    const newTracks = tracks.filter((t) => t.id !== trackId);
    newTracks.forEach((t, i) => (t.index = i));
    projectStore.updateTracks(newTracks);
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

  renameTrack: (trackId, newName) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, name: newName } : t
    );
    projectStore.updateTracks(tracks);
  },

  addClipToTrack: (trackId, clip) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
    );
    projectStore.updateTracks(tracks);
  },

  removeClip: (clipId) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.filter((c) => c.id !== clipId),
    }));
    projectStore.updateTracks(tracks);
  },

  updateClip: (clipId, partial) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => (c.id === clipId ? ({ ...c, ...partial } as Clip) : c)),
    }));
    projectStore.updateTracks(tracks);
  },

  splitClipAtCurrentTime: (clipId) => {
    const { currentTime } = get();
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks;
    
    // Find track and clip
    for (const track of tracks) {
      const clip = track.clips.find((c) => c.id === clipId);
      if (clip) {
        if (currentTime > clip.startTime && currentTime < clip.startTime + clip.duration) {
          projectStore.pushHistorySnapshot();
          const firstPartDuration = currentTime - clip.startTime;
          const secondPartDuration = clip.duration - firstPartDuration;

          const firstPart: Clip = {
            ...clip,
            duration: firstPartDuration,
            sourceDuration: firstPartDuration,
          };

          const secondPart: Clip = {
            ...clip,
            id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: `${clip.name} (Part 2)`,
            startTime: currentTime,
            duration: secondPartDuration,
            sourceStartTime: clip.sourceStartTime + firstPartDuration,
            sourceDuration: secondPartDuration,
          };

          const newClips = track.clips.flatMap((c) => (c.id === clipId ? [firstPart, secondPart] : [c]));
          const newTracks = tracks.map((t) => (t.id === track.id ? { ...t, clips: newClips } : t));
          projectStore.updateTracks(newTracks);
        }
        break;
      }
    }
  },
}));
