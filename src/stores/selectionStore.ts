/**
 * Nusantara Video Studio - Selection Store
 * Manages active selected items (clips, tracks), active editor tool, and clipboard.
 */

import { create } from 'zustand';
import { Clip } from '../types';

export type EditorTool = 'select' | 'cut' | 'split' | 'hand' | 'zoom';

interface SelectionState {
  selectedClipId: string | null;
  selectedTrackId: string | null;
  activeTool: EditorTool;
  clipboardClip: Clip | null;

  // Actions
  selectClip: (clipId: string | null, trackId?: string | null) => void;
  selectTrack: (trackId: string | null) => void;
  clearSelection: () => void;
  setActiveTool: (tool: EditorTool) => void;
  copyClip: (clip: Clip) => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedClipId: null,
  selectedTrackId: null,
  activeTool: 'select',
  clipboardClip: null,

  selectClip: (clipId, trackId = null) =>
    set({
      selectedClipId: clipId,
      selectedTrackId: trackId,
    }),

  selectTrack: (trackId) =>
    set({
      selectedTrackId: trackId,
    }),

  clearSelection: () =>
    set({
      selectedClipId: null,
      selectedTrackId: null,
    }),

  setActiveTool: (activeTool) => set({ activeTool }),

  copyClip: (clipboardClip) => set({ clipboardClip }),
}));
