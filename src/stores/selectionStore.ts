/**
 * Nusantara Video Studio - Selection Store
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Manages active multi-clip selection, selected track, tool modes,
 * and multi-clip clipboard for Copy/Paste/Duplicate.
 */

import { create } from 'zustand';
import { Clip } from '../types';

export type EditorTool = 'select' | 'cut' | 'split' | 'hand' | 'zoom';

interface SelectionState {
  selectedClipIds: string[];
  selectedTrackId: string | null;
  activeTool: EditorTool;
  clipboardClips: Clip[];

  // Backward compatible getter
  selectedClipId: string | null;

  // Actions
  selectClip: (clipId: string | null, isMulti?: boolean, isRange?: boolean) => void;
  selectMultipleClips: (clipIds: string[]) => void;
  toggleClipSelection: (clipId: string) => void;
  selectTrack: (trackId: string | null) => void;
  clearSelection: () => void;
  setActiveTool: (tool: EditorTool) => void;
  copyClips: (clips: Clip[]) => void;
  copyClip: (clip: Clip) => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedClipIds: [],
  selectedTrackId: null,
  activeTool: 'select',
  clipboardClips: [],

  // Computed alias
  get selectedClipId() {
    const ids = get().selectedClipIds;
    return ids.length > 0 ? ids[ids.length - 1] : null;
  },

  selectClip: (clipId, isMulti = false, isRange = false) => {
    if (!clipId) {
      set({ selectedClipIds: [], selectedClipId: null });
      return;
    }

    if (isMulti) {
      const current = get().selectedClipIds;
      if (current.includes(clipId)) {
        const next = current.filter((id) => id !== clipId);
        set({ selectedClipIds: next, selectedClipId: next.length > 0 ? next[next.length - 1] : null });
      } else {
        const next = [...current, clipId];
        set({ selectedClipIds: next, selectedClipId: clipId });
      }
    } else {
      set({ selectedClipIds: [clipId], selectedClipId: clipId });
    }
  },

  selectMultipleClips: (clipIds) => {
    set({
      selectedClipIds: clipIds,
      selectedClipId: clipIds.length > 0 ? clipIds[clipIds.length - 1] : null,
    });
  },

  toggleClipSelection: (clipId) => {
    const current = get().selectedClipIds;
    if (current.includes(clipId)) {
      const next = current.filter((id) => id !== clipId);
      set({ selectedClipIds: next, selectedClipId: next.length > 0 ? next[next.length - 1] : null });
    } else {
      const next = [...current, clipId];
      set({ selectedClipIds: next, selectedClipId: clipId });
    }
  },

  selectTrack: (selectedTrackId) => set({ selectedTrackId }),

  clearSelection: () => set({ selectedClipIds: [], selectedClipId: null, selectedTrackId: null }),

  setActiveTool: (activeTool) => set({ activeTool }),

  copyClips: (clipboardClips) => set({ clipboardClips }),

  copyClip: (clip) => set({ clipboardClips: [clip] }),
}));
