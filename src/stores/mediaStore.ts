/**
 * Nusantara Video Studio - Media Store
 * Phase 2: Media Library & Media Import
 *
 * Full-featured media state management supporting reactive filtering,
 * real-time searching, sorting, grid/list view mode, metadata inspector,
 * preview playback modal, and offline relinking.
 */

import { create } from 'zustand';
import {
  MediaFilterType,
  MediaItem,
  MediaSortField,
  MediaSortOrder,
  MediaViewMode,
  ImportProgress,
} from '../types';
import { mediaRepository } from '../services/mediaRepository';
import { mediaService } from '../services/mediaService';

interface MediaState {
  items: MediaItem[];
  selectedMediaId: string | null;
  searchQuery: string;
  filterType: MediaFilterType;
  sortField: MediaSortField;
  sortOrder: MediaSortOrder;
  viewMode: MediaViewMode;

  // Modals & Inspection State
  previewMediaItem: MediaItem | null;
  propertiesMediaItem: MediaItem | null;
  relinkTargetItem: MediaItem | null;
  importProgress: ImportProgress;

  // Actions
  loadStoredMedia: () => Promise<void>;
  getMedia: () => MediaItem[];
  getMediaById: (id: string) => MediaItem | undefined;
  addMedia: (item: MediaItem) => Promise<void>;
  addMultipleMedia: (newItems: MediaItem[]) => Promise<void>;
  removeMedia: (id: string) => Promise<void>;
  selectMedia: (id: string | null) => void;
  renameMedia: (id: string, newName: string) => Promise<void>;
  relinkMedia: (id: string, newFile: File) => Promise<MediaItem | null>;
  searchMedia: (query: string) => void;
  filterMedia: (filter: MediaFilterType) => void;
  sortMedia: (field: MediaSortField) => void;
  setViewMode: (mode: MediaViewMode) => void;
  setPreviewMedia: (item: MediaItem | null) => void;
  setPropertiesMedia: (item: MediaItem | null) => void;
  setRelinkTarget: (item: MediaItem | null) => void;
  setImportProgress: (progress: ImportProgress) => void;
  clearAll: () => Promise<void>;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  items: [],
  selectedMediaId: null,
  searchQuery: '',
  filterType: 'all',
  sortField: 'createdAt',
  sortOrder: 'desc',
  viewMode: 'grid',

  previewMediaItem: null,
  propertiesMediaItem: null,
  relinkTargetItem: null,
  importProgress: { active: false },

  loadStoredMedia: async () => {
    try {
      const stored = await mediaRepository.getAll();
      if (stored && stored.length > 0) {
        set({ items: stored });
      }
    } catch (err) {
      console.error('[MediaStore] Failed to load stored media:', err);
    }
  },

  getMedia: () => {
    const { items, searchQuery, filterType, sortField, sortOrder } = get();

    // 1. Filter by category
    let result = items.filter((item) => {
      if (filterType === 'all') return true;
      return item.type === filterType;
    });

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.extension.toLowerCase().includes(q) ||
          (item.codec && item.codec.toLowerCase().includes(q))
      );
    }

    // 3. Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  },

  getMediaById: (id: string) => {
    return get().items.find((item) => item.id === id);
  },

  addMedia: async (item: MediaItem) => {
    set((state) => ({ items: [item, ...state.items] }));
    await mediaRepository.save(item);
  },

  addMultipleMedia: async (newItems: MediaItem[]) => {
    set((state) => ({ items: [...newItems, ...state.items] }));
    await mediaRepository.saveAll(newItems);
  },

  removeMedia: async (id: string) => {
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      selectedMediaId: state.selectedMediaId === id ? null : state.selectedMediaId,
      previewMediaItem: state.previewMediaItem?.id === id ? null : state.previewMediaItem,
      propertiesMediaItem: state.propertiesMediaItem?.id === id ? null : state.propertiesMediaItem,
    }));
    await mediaRepository.delete(id);
  },

  selectMedia: (id: string | null) => set({ selectedMediaId: id }),

  renameMedia: async (id: string, newName: string) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;

    const updated = { ...item, name: newName, updatedAt: new Date().toISOString() };
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? updated : i)),
      propertiesMediaItem:
        state.propertiesMediaItem?.id === id ? updated : state.propertiesMediaItem,
    }));
    await mediaRepository.save(updated);
  },

  relinkMedia: async (id: string, newFile: File): Promise<MediaItem | null> => {
    const existing = get().items.find((i) => i.id === id);
    if (!existing) return null;

    try {
      const updated = await mediaService.relinkMediaItem(existing, newFile);
      set((state) => ({
        items: state.items.map((i) => (i.id === id ? updated : i)),
        relinkTargetItem: null,
        propertiesMediaItem:
          state.propertiesMediaItem?.id === id ? updated : state.propertiesMediaItem,
      }));
      return updated;
    } catch (err) {
      console.error('[MediaStore] Relink error:', err);
      return null;
    }
  },

  searchMedia: (query: string) => set({ searchQuery: query }),

  filterMedia: (filter: MediaFilterType) => set({ filterType: filter }),

  sortMedia: (field: MediaSortField) =>
    set((state) => ({
      sortField: field,
      sortOrder: state.sortField === field && state.sortOrder === 'asc' ? 'desc' : 'asc',
    })),

  setViewMode: (mode: MediaViewMode) => set({ viewMode: mode }),

  setPreviewMedia: (item: MediaItem | null) => set({ previewMediaItem: item }),

  setPropertiesMedia: (item: MediaItem | null) => set({ propertiesMediaItem: item }),

  setRelinkTarget: (item: MediaItem | null) => set({ relinkTargetItem: item }),

  setImportProgress: (progress: ImportProgress) => set({ importProgress: progress }),

  clearAll: async () => {
    set({ items: [], selectedMediaId: null });
    await mediaRepository.clear();
  },
}));
