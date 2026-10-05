/**
 * Nusantara Video Studio - Subtitle Store
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Coordinates subtitle tracks, entries, timeline sync, timing adjustments,
 * validation, overlap warnings, search & replace, and SRT/VTT/ASS import/export.
 */

import { create } from 'zustand';
import { SubtitleItem, SubtitleTrack } from '../types';
import { SubtitleParser, SubtitleValidationResult } from '../engine/subtitles/SubtitleParser';
import { useProjectStore } from './projectStore';
import { useTimelineStore } from './timelineStore';

export interface SubtitleState {
  // Current active subtitle track
  activeTrackId: string | null;
  selectedSubtitleId: string | null;
  searchQuery: string;
  replaceText: string;
  validation: SubtitleValidationResult;

  // Track management
  getActiveTrack: () => SubtitleTrack | null;
  setActiveTrackId: (trackId: string) => void;
  createSubtitleTrack: (name?: string, language?: string) => SubtitleTrack;
  deleteSubtitleTrack: (trackId: string) => void;

  // Item operations
  selectSubtitle: (id: string | null) => void;
  addSubtitle: (startTime?: number, duration?: number, text?: string) => SubtitleItem;
  updateSubtitle: (id: string, partial: Partial<SubtitleItem>) => void;
  deleteSubtitle: (id: string) => void;
  duplicateSubtitle: (id: string) => void;
  splitSubtitle: (id: string, splitTime: number) => boolean;
  mergeSubtitleWithNext: (id: string) => boolean;

  // Search & Replace
  setSearchQuery: (q: string) => void;
  setReplaceText: (r: string) => void;
  performFindAndReplace: (matchCase?: boolean) => number;

  // Validation
  runValidation: () => SubtitleValidationResult;

  // Import / Export
  importSubtitlesFromText: (content: string, format?: 'srt' | 'vtt' | 'ass' | 'auto') => boolean;
  exportSubtitles: (format?: 'srt' | 'vtt' | 'ass') => string;
}

export const useSubtitleStore = create<SubtitleState>((set, get) => ({
  activeTrackId: 'sub-track-1',
  selectedSubtitleId: null,
  searchQuery: '',
  replaceText: '',
  validation: { valid: true, errors: [], warnings: [], overlaps: [] },

  getActiveTrack: () => {
    const project = useProjectStore.getState().currentProject;
    const tracks = project.timeline.subtitleTracks || [];
    if (tracks.length === 0) return null;
    return tracks.find((t) => t.id === get().activeTrackId) || tracks[0];
  },

  setActiveTrackId: (activeTrackId) => set({ activeTrackId }),

  createSubtitleTrack: (name = 'Subtitles (Bahasa Indonesia)', language = 'id') => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const currentTracks = projectStore.currentProject.timeline.subtitleTracks || [];
    const newTrack: SubtitleTrack = {
      id: `sub-track-${Date.now()}`,
      name,
      language,
      visible: true,
      locked: false,
      items: [],
      defaultStyle: {
        fontFamily: 'Inter',
        fontSize: 32,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        alignment: 'center',
        outlineWidth: 2,
        outlineColor: '#000000',
        shadowBlur: 8,
        shadowColor: '#000000',
      },
    };

    const updated = [...currentTracks, newTrack];
    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: updated },
      },
      isDirty: true,
    }));

    set({ activeTrackId: newTrack.id });
    return newTrack;
  },

  deleteSubtitleTrack: (trackId) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const currentTracks = projectStore.currentProject.timeline.subtitleTracks || [];
    const updated = currentTracks.filter((t) => t.id !== trackId);

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: updated },
      },
      isDirty: true,
    }));

    set({
      activeTrackId: updated.length > 0 ? updated[0].id : null,
      selectedSubtitleId: null,
    });
  },

  selectSubtitle: (selectedSubtitleId) => set({ selectedSubtitleId }),

  addSubtitle: (startTime, duration = 3, text = 'Teks Subtitle Baru') => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    let track = get().getActiveTrack();
    if (!track) {
      track = get().createSubtitleTrack();
    }

    const playhead = useTimelineStore.getState().currentTime;
    const start = startTime !== undefined ? startTime : Math.max(0, parseFloat(playhead.toFixed(2)));
    const end = parseFloat((start + duration).toFixed(2));

    const newItem: SubtitleItem = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      index: track.items.length + 1,
      startTime: start,
      endTime: end,
      text,
    };

    const updatedItems = [...track.items, newItem].sort((a, b) => a.startTime - b.startTime);
    // Reindex
    updatedItems.forEach((it, idx) => (it.index = idx + 1));

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track!.id ? { ...t, items: updatedItems } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    set({ selectedSubtitleId: newItem.id });
    get().runValidation();
    return newItem;
  },

  updateSubtitle: (id, partial) => {
    const track = get().getActiveTrack();
    if (!track) return;

    const projectStore = useProjectStore.getState();
    const updatedItems = track.items.map((item) => (item.id === id ? { ...item, ...partial } : item));
    updatedItems.sort((a, b) => a.startTime - b.startTime);
    updatedItems.forEach((it, idx) => (it.index = idx + 1));

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track.id ? { ...t, items: updatedItems } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    get().runValidation();
  },

  deleteSubtitle: (id) => {
    const track = get().getActiveTrack();
    if (!track) return;

    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const updatedItems = track.items.filter((item) => item.id !== id);
    updatedItems.forEach((it, idx) => (it.index = idx + 1));

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track.id ? { ...t, items: updatedItems } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    if (get().selectedSubtitleId === id) {
      set({ selectedSubtitleId: null });
    }
    get().runValidation();
  },

  duplicateSubtitle: (id) => {
    const track = get().getActiveTrack();
    if (!track) return;

    const target = track.items.find((item) => item.id === id);
    if (!target) return;

    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const dur = target.endTime - target.startTime;
    const newStart = target.endTime + 0.2;
    const newEnd = newStart + dur;

    const duplicated: SubtitleItem = {
      ...JSON.parse(JSON.stringify(target)),
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      startTime: newStart,
      endTime: newEnd,
      text: `${target.text} (Copy)`,
    };

    const updatedItems = [...track.items, duplicated].sort((a, b) => a.startTime - b.startTime);
    updatedItems.forEach((it, idx) => (it.index = idx + 1));

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track.id ? { ...t, items: updatedItems } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    set({ selectedSubtitleId: duplicated.id });
    get().runValidation();
  },

  splitSubtitle: (id, splitTime) => {
    const track = get().getActiveTrack();
    if (!track) return false;

    const target = track.items.find((item) => item.id === id);
    if (!target) return false;

    const parts = SubtitleParser.splitSubtitle(target, splitTime);
    if (!parts) return false;

    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const updatedItems = track.items
      .filter((it) => it.id !== id)
      .concat(parts)
      .sort((a, b) => a.startTime - b.startTime);
    updatedItems.forEach((it, idx) => (it.index = idx + 1));

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track.id ? { ...t, items: updatedItems } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    set({ selectedSubtitleId: parts[1].id });
    get().runValidation();
    return true;
  },

  mergeSubtitleWithNext: (id) => {
    const track = get().getActiveTrack();
    if (!track) return false;

    const idx = track.items.findIndex((item) => item.id === id);
    if (idx === -1 || idx >= track.items.length - 1) return false;

    const first = track.items[idx];
    const second = track.items[idx + 1];
    const merged = SubtitleParser.mergeSubtitles(first, second);

    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const updatedItems = track.items
      .filter((it) => it.id !== first.id && it.id !== second.id)
      .concat(merged)
      .sort((a, b) => a.startTime - b.startTime);
    updatedItems.forEach((it, i) => (it.index = i + 1));

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track.id ? { ...t, items: updatedItems } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    set({ selectedSubtitleId: merged.id });
    get().runValidation();
    return true;
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setReplaceText: (replaceText) => set({ replaceText }),

  performFindAndReplace: (matchCase = false) => {
    const track = get().getActiveTrack();
    if (!track || !get().searchQuery) return 0;

    const res = SubtitleParser.findAndReplace(track.items, get().searchQuery, get().replaceText, matchCase);
    if (res.matchCount === 0) return 0;

    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track.id ? { ...t, items: res.items } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    return res.matchCount;
  },

  runValidation: () => {
    const track = get().getActiveTrack();
    if (!track) {
      const emptyVal = { valid: true, errors: [], warnings: [], overlaps: [] };
      set({ validation: emptyVal });
      return emptyVal;
    }
    const val = SubtitleParser.validateSubtitles(track.items);
    set({ validation: val });
    return val;
  },

  importSubtitlesFromText: (content, format = 'auto') => {
    if (!content) return false;

    let items: SubtitleItem[] = [];
    const fmt = format.toLowerCase();

    if (fmt === 'vtt' || (fmt === 'auto' && content.trim().startsWith('WEBVTT'))) {
      items = SubtitleParser.parseVTT(content);
    } else if (fmt === 'ass' || (fmt === 'auto' && content.toLowerCase().includes('[events]'))) {
      items = SubtitleParser.parseASS(content);
    } else {
      items = SubtitleParser.parseSRT(content);
    }

    if (items.length === 0) return false;

    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    let track = get().getActiveTrack();
    if (!track) {
      track = get().createSubtitleTrack();
    }

    const allTracks = (projectStore.currentProject.timeline.subtitleTracks || []).map((t) =>
      t.id === track!.id ? { ...t, items } : t
    );

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, subtitleTracks: allTracks },
      },
      isDirty: true,
    }));

    get().runValidation();
    return true;
  },

  exportSubtitles: (format = 'srt') => {
    const track = get().getActiveTrack();
    if (!track || track.items.length === 0) return '';

    if (format === 'vtt') {
      return SubtitleParser.exportToVTT(track.items);
    } else if (format === 'ass') {
      return SubtitleParser.exportToASS(track.items, track.name);
    }
    return SubtitleParser.exportToSRT(track.items);
  },
}));
