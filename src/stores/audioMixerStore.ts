/**
 * Nusantara Video Studio - Audio Mixer Store
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements professional audio mixer state:
 * - Decibel volume faders (-60 to +6 dB, -Infinity mute)
 * - Stereo Panning (-1.0 Left to +1.0 Right)
 * - Track Solo, Mute, EQ, Compressor & Limiter routing
 * - Master output bus with anti-clipping limiter
 * - Peak & Clipping metering with peak reset
 * - Unified single source of truth synced with timeline clips
 */

import { create } from 'zustand';
import { MasterAudioBus, TrackMixerChannel } from '../types/audio';
import { AudioProcessingEngine } from '../engine/audio/AudioProcessingEngine';
import { useProjectStore } from './projectStore';

interface AudioMixerState {
  tracks: Record<string, TrackMixerChannel>;
  masterBus: MasterAudioBus;
  selectedTrackId: string | null;

  // Actions
  initializeTracks: (trackList: { id: string; name: string }[]) => void;
  setTrackVolumeDb: (trackId: string, volumeDb: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackSolo: (trackId: string) => void;
  updateTrackEQ: (trackId: string, partialEQ: any) => void;
  updateTrackCompressor: (trackId: string, partialComp: any) => void;
  updateTrackLimiter: (trackId: string, partialLimiter: any) => void;

  // Master Actions
  setMasterVolumeDb: (volumeDb: number) => void;
  setMasterGainDb: (gainDb: number) => void;
  toggleMasterMute: () => void;
  updateMasterLimiter: (partialLimiter: any) => void;

  // Meters
  updateTrackMeter: (trackId: string, left: number, right: number) => void;
  updateMasterMeter: (left: number, right: number) => void;
  resetClipping: (trackId?: string) => void;
  setSelectedTrackId: (trackId: string | null) => void;
}

export const useAudioMixerStore = create<AudioMixerState>((set, get) => ({
  tracks: {
    'track-a1': AudioProcessingEngine.getDefaultMixerChannel('track-a1', 'A1 - Dialogue'),
    'track-a2': AudioProcessingEngine.getDefaultMixerChannel('track-a2', 'A2 - Sound FX'),
    'track-a3': AudioProcessingEngine.getDefaultMixerChannel('track-a3', 'A3 - Music Score'),
  },
  masterBus: AudioProcessingEngine.getDefaultMasterBus(),
  selectedTrackId: 'track-a1',

  initializeTracks: (trackList) => {
    const current = get().tracks;
    const next: Record<string, TrackMixerChannel> = { ...current };

    trackList.forEach((t) => {
      if (!next[t.id]) {
        next[t.id] = AudioProcessingEngine.getDefaultMixerChannel(t.id, t.name);
      }
    });

    set({ tracks: next });
  },

  setTrackVolumeDb: (trackId, volumeDb) => {
    const channel = get().tracks[trackId] || AudioProcessingEngine.getDefaultMixerChannel(trackId, trackId);
    const updatedChannel = {
      ...channel,
      volumeDb: Math.max(-60, Math.min(6, volumeDb)),
    };

    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: updatedChannel,
      },
    }));

    // Sync to projectStore tracks
    const projStore = useProjectStore.getState();
    const tracks = projStore.currentProject.timeline.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, audioSettings: updatedChannel };
      }
      return t;
    });
    projStore.updateTracks(tracks);
  },

  setTrackPan: (trackId, pan) => {
    const channel = get().tracks[trackId] || AudioProcessingEngine.getDefaultMixerChannel(trackId, trackId);
    const clampedPan = Math.max(-1.0, Math.min(1.0, pan));
    const updatedChannel = {
      ...channel,
      pan: clampedPan,
    };

    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: updatedChannel,
      },
    }));

    const projStore = useProjectStore.getState();
    const tracks = projStore.currentProject.timeline.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, audioSettings: updatedChannel };
      }
      return t;
    });
    projStore.updateTracks(tracks);
  },

  toggleTrackMute: (trackId) => {
    const channel = get().tracks[trackId];
    if (!channel) return;
    const isMuted = !channel.mute;

    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: { ...channel, mute: isMuted },
      },
    }));

    // Reflect to timeline mute
    const projStore = useProjectStore.getState();
    const tracks = projStore.currentProject.timeline.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, muted: isMuted };
      }
      return t;
    });
    projStore.updateTracks(tracks);
  },

  toggleTrackSolo: (trackId) => {
    const channel = get().tracks[trackId];
    if (!channel) return;
    const isSolo = !channel.solo;

    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: { ...channel, solo: isSolo },
      },
    }));

    const projStore = useProjectStore.getState();
    const tracks = projStore.currentProject.timeline.tracks.map((t) => {
      if (t.id === trackId) {
        return { ...t, solo: isSolo };
      }
      return t;
    });
    projStore.updateTracks(tracks);
  },

  updateTrackEQ: (trackId, partialEQ) => {
    const channel = get().tracks[trackId] || AudioProcessingEngine.getDefaultMixerChannel(trackId, trackId);
    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: {
          ...channel,
          eq: { ...channel.eq, ...partialEQ },
        },
      },
    }));
  },

  updateTrackCompressor: (trackId, partialComp) => {
    const channel = get().tracks[trackId] || AudioProcessingEngine.getDefaultMixerChannel(trackId, trackId);
    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: {
          ...channel,
          compressor: { ...channel.compressor, ...partialComp },
        },
      },
    }));
  },

  updateTrackLimiter: (trackId, partialLimiter) => {
    const channel = get().tracks[trackId] || AudioProcessingEngine.getDefaultMixerChannel(trackId, trackId);
    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: {
          ...channel,
          limiter: { ...channel.limiter, ...partialLimiter },
        },
      },
    }));
  },

  setMasterVolumeDb: (volumeDb) =>
    set((state) => ({
      masterBus: {
        ...state.masterBus,
        volumeDb: Math.max(-60, Math.min(6, volumeDb)),
      },
    })),

  setMasterGainDb: (gainDb) =>
    set((state) => ({
      masterBus: {
        ...state.masterBus,
        gainDb,
      },
    })),

  toggleMasterMute: () =>
    set((state) => ({
      masterBus: {
        ...state.masterBus,
        mute: !state.masterBus.mute,
      },
    })),

  updateMasterLimiter: (partialLimiter) =>
    set((state) => ({
      masterBus: {
        ...state.masterBus,
        limiter: {
          ...state.masterBus.limiter,
          ...partialLimiter,
        },
      },
    })),

  updateTrackMeter: (trackId, left, right) => {
    const channel = get().tracks[trackId];
    if (!channel) return;

    const dbLeft = AudioProcessingEngine.linearToDb(left);
    const dbRight = AudioProcessingEngine.linearToDb(right);
    const isClipping = dbLeft >= 0 || dbRight >= 0;

    set((state) => ({
      tracks: {
        ...state.tracks,
        [trackId]: {
          ...channel,
          meterLevel: {
            left,
            right,
            peakLeft: Math.max(channel.meterLevel.peakLeft, dbLeft),
            peakRight: Math.max(channel.meterLevel.peakRight, dbRight),
            clipping: channel.meterLevel.clipping || isClipping,
          },
        },
      },
    }));
  },

  updateMasterMeter: (left, right) => {
    const master = get().masterBus;
    const dbLeft = AudioProcessingEngine.linearToDb(left);
    const dbRight = AudioProcessingEngine.linearToDb(right);
    const isClipping = dbLeft >= 0 || dbRight >= 0;

    set((state) => ({
      masterBus: {
        ...master,
        meterLevel: {
          left,
          right,
          peakLeft: Math.max(master.meterLevel.peakLeft, dbLeft),
          peakRight: Math.max(master.meterLevel.peakRight, dbRight),
          clipping: master.meterLevel.clipping || isClipping,
        },
      },
    }));
  },

  resetClipping: (trackId) => {
    if (trackId) {
      const channel = get().tracks[trackId];
      if (channel) {
        set((state) => ({
          tracks: {
            ...state.tracks,
            [trackId]: {
              ...channel,
              meterLevel: { ...channel.meterLevel, clipping: false, peakLeft: -60, peakRight: -60 },
            },
          },
        }));
      }
    } else {
      // Reset master
      const master = get().masterBus;
      set((state) => ({
        masterBus: {
          ...master,
          meterLevel: { ...master.meterLevel, clipping: false, peakLeft: -60, peakRight: -60 },
        },
      }));
    }
  },

  setSelectedTrackId: (trackId) => set({ selectedTrackId: trackId }),
}));
