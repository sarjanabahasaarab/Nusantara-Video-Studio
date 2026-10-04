/**
 * Nusantara Video Studio - Media Store
 * Manages media library items and assets.
 */

import { create } from 'zustand';
import { MediaItem } from '../types';

interface MediaState {
  items: MediaItem[];
  selectedMediaId: string | null;
  searchQuery: string;
  filterType: 'all' | 'video' | 'audio' | 'image';
  
  // Actions
  addItem: (item: MediaItem) => void;
  removeItem: (id: string) => void;
  selectMedia: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setFilterType: (filter: 'all' | 'video' | 'audio' | 'image') => void;
  clearAll: () => void;
}

export const useMediaStore = create<MediaState>((set) => ({
  items: [],
  selectedMediaId: null,
  searchQuery: '',
  filterType: 'all',

  addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      selectedMediaId: state.selectedMediaId === id ? null : state.selectedMediaId,
    })),
  selectMedia: (id) => set({ selectedMediaId: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (filterType) => set({ filterType }),
  clearAll: () => set({ items: [], selectedMediaId: null }),
}));
