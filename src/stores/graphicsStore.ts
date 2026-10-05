/**
 * Nusantara Video Studio - Graphics & Safe Area Store
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Manages Title Safe Area guides (80% title safe, 90% action safe, center crosshair, 3x3 grid),
 * multi-element graphic layers, and custom template library state.
 */

import { create } from 'zustand';
import { GraphicLayer, GraphicLayerType, SafeAreaSettings } from '../types';
import { TemplateLibrary, TextTemplate } from '../engine/templates/TemplateLibrary';
import { useProjectStore } from './projectStore';

export interface GraphicsState {
  // Safe Area Guides
  safeArea: SafeAreaSettings;
  toggleSafeArea: () => void;
  setSafeAreaSetting: (key: keyof SafeAreaSettings, value: boolean) => void;

  // Selected Graphic Layer in multi-layer elements (e.g. Lower Third builder)
  selectedLayerId: string | null;
  selectLayer: (layerId: string | null) => void;

  // Layer Operations for compound graphic clips
  addGraphicLayer: (clipId: string, layer: Omit<GraphicLayer, 'id'>) => GraphicLayer;
  updateGraphicLayer: (clipId: string, layerId: string, partial: Partial<GraphicLayer>) => void;
  removeGraphicLayer: (clipId: string, layerId: string) => void;
  reorderGraphicLayers: (clipId: string, newLayers: GraphicLayer[]) => void;

  // Templates
  customTemplates: TextTemplate[];
  refreshCustomTemplates: () => void;
  saveTemplate: (name: string, category: any, description: string, clip: any) => TextTemplate | null;
  deleteTemplate: (id: string) => boolean;
}

export const useGraphicsStore = create<GraphicsState>((set, get) => ({
  safeArea: {
    showSafeArea: false,
    showTitleSafe: true, // 80%
    showActionSafe: true, // 90%
    showCenterGuide: true, // center crosshair
    showGrid: false, // 3x3 grid
  },

  selectedLayerId: null,
  selectLayer: (selectedLayerId) => set({ selectedLayerId }),

  toggleSafeArea: () =>
    set((state) => ({
      safeArea: { ...state.safeArea, showSafeArea: !state.safeArea.showSafeArea },
    })),

  setSafeAreaSetting: (key, value) =>
    set((state) => ({
      safeArea: { ...state.safeArea, [key]: value },
    })),

  addGraphicLayer: (clipId, layer) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const newLayer: GraphicLayer = {
      ...layer,
      id: `layer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const currentLayers = c.graphicLayers || [];
        return {
          ...c,
          graphicLayers: [...currentLayers, newLayer].sort((a, b) => a.zIndex - b.zIndex),
        };
      }),
    }));

    projectStore.updateTracks(tracks);
    set({ selectedLayerId: newLayer.id });
    return newLayer;
  },

  updateGraphicLayer: (clipId, layerId, partial) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        const currentLayers = c.graphicLayers || [];
        return {
          ...c,
          graphicLayers: currentLayers.map((l) => (l.id === layerId ? { ...l, ...partial } : l)),
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  removeGraphicLayer: (clipId, layerId) => {
    const projectStore = useProjectStore.getState();
    projectStore.pushHistorySnapshot();

    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        return {
          ...c,
          graphicLayers: (c.graphicLayers || []).filter((l) => l.id !== layerId),
        };
      }),
    }));

    projectStore.updateTracks(tracks);
    if (get().selectedLayerId === layerId) {
      set({ selectedLayerId: null });
    }
  },

  reorderGraphicLayers: (clipId, newLayers) => {
    const projectStore = useProjectStore.getState();
    const tracks = projectStore.currentProject.timeline.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => {
        if (c.id !== clipId) return c;
        return {
          ...c,
          graphicLayers: newLayers.map((l, idx) => ({ ...l, zIndex: idx })),
        };
      }),
    }));
    projectStore.updateTracks(tracks);
  },

  customTemplates: TemplateLibrary.getUserTemplates(),

  refreshCustomTemplates: () => {
    set({ customTemplates: TemplateLibrary.getUserTemplates() });
  },

  saveTemplate: (name, category, description, clip) => {
    const created = TemplateLibrary.createTemplateFromClip(clip, name);
    if (created) {
      get().refreshCustomTemplates();
    }
    return created;
  },

  deleteTemplate: (id) => {
    const ok = TemplateLibrary.deleteUserTemplate(id);
    if (ok) {
      get().refreshCustomTemplates();
    }
    return ok;
  },
}));
