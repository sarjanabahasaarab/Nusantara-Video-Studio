/**
 * Nusantara Video Studio - Color Store
 * Phase 6: Professional Color & Audio Studio
 *
 * Coordinates color workspace state, scope monitor settings,
 * user color presets, LUT library, and color matching references.
 */

import { create } from 'zustand';
import {
  ClipColorGrading,
  ColorPreset,
  LUTEffect,
  ScopeSettings,
  ScopeType,
  ColorMatchReference,
} from '../types/color';
import { ColorEngine } from '../engine/color/ColorEngine';
import { LUTParser } from '../engine/color/LUTParser';
import { useTimelineStore } from './timelineStore';
import { useProjectStore } from './projectStore';

const STORAGE_KEY_CUSTOM_PRESETS = 'nvs_color_custom_presets';

interface ColorState {
  selectedClipId: string | null;
  activeInspectorTab: 'basic' | 'curves' | 'wheels' | 'lut' | 'vignette' | 'presets' | 'match';
  scopes: ScopeSettings;
  builtinPresets: ColorPreset[];
  customPresets: ColorPreset[];
  importedLUTs: LUTEffect[];
  colorMatch: ColorMatchReference;

  // Actions
  setSelectedClipId: (clipId: string | null) => void;
  setActiveInspectorTab: (tab: 'basic' | 'curves' | 'wheels' | 'lut' | 'vignette' | 'presets' | 'match') => void;
  setScopeSettings: (settings: Partial<ScopeSettings>) => void;
  toggleScopes: () => void;
  setActiveScope: (scope: ScopeType) => void;

  // Presets
  applyPresetToClip: (preset: ColorPreset, clipId: string) => void;
  saveCustomPreset: (name: string, description: string, grading: Partial<ClipColorGrading>) => ColorPreset;
  deleteCustomPreset: (id: string) => void;

  // LUTs
  importLUTFromText: (filename: string, content: string) => { success: boolean; lut?: LUTEffect; error?: string };
  removeLUT: (id: string) => void;

  // Matching
  setMatchReference: (reference: Partial<ColorMatchReference>) => void;
}

export const useColorStore = create<ColorState>((set, get) => {
  let loadedCustomPresets: ColorPreset[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_PRESETS);
    if (raw) loadedCustomPresets = JSON.parse(raw);
  } catch {
    loadedCustomPresets = [];
  }

  return {
    selectedClipId: null,
    activeInspectorTab: 'basic',
    scopes: {
      visible: true,
      activeScope: 'waveform',
      histogramMode: 'rgb',
      waveformMode: 'luma',
      vectorscopeSkinLine: true,
      samplingRate: 2, // 2x downsampling for smooth real-time response
    },
    builtinPresets: ColorEngine.getBuiltinPresets(),
    customPresets: loadedCustomPresets,
    importedLUTs: [],
    colorMatch: {
      applied: false,
    },

    setSelectedClipId: (clipId) => set({ selectedClipId: clipId }),

    setActiveInspectorTab: (tab) => set({ activeInspectorTab: tab }),

    setScopeSettings: (settings) =>
      set((state) => ({ scopes: { ...state.scopes, ...settings } })),

    toggleScopes: () =>
      set((state) => ({
        scopes: { ...state.scopes, visible: !state.scopes.visible },
      })),

    setActiveScope: (scope) =>
      set((state) => ({
        scopes: { ...state.scopes, activeScope: scope },
      })),

    applyPresetToClip: (preset, clipId) => {
      const defaultGrading = ColorEngine.getDefaultColorGrading();
      const merged: ClipColorGrading = {
        ...defaultGrading,
        ...preset.settings,
        basic: { ...defaultGrading.basic, ...(preset.settings.basic || {}) },
        curves: preset.settings.curves || defaultGrading.curves,
        wheels: preset.settings.wheels || defaultGrading.wheels,
        vignette: preset.settings.vignette || defaultGrading.vignette,
        enabled: true,
      };

      useTimelineStore.getState().updateClipColorGrading(clipId, merged);
    },

    saveCustomPreset: (name, description, grading) => {
      const newPreset: ColorPreset = {
        id: `preset-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        description,
        category: 'Custom',
        settings: grading,
      };

      const updated = [...get().customPresets, newPreset];
      set({ customPresets: updated });

      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(updated));
      } catch {
        // storage disabled
      }

      return newPreset;
    },

    deleteCustomPreset: (id) => {
      const updated = get().customPresets.filter((p) => p.id !== id);
      set({ customPresets: updated });
      try {
        localStorage.setItem(STORAGE_KEY_CUSTOM_PRESETS, JSON.stringify(updated));
      } catch {}
    },

    importLUTFromText: (filename, content) => {
      const parseRes = LUTParser.parseCubeText(content, filename);
      if (!parseRes.valid || !parseRes.lut) {
        return { success: false, error: parseRes.error || 'Gagal memproses berkas .cube.' };
      }

      const lutEffect: LUTEffect = {
        id: `lut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: parseRes.lut.title || filename.replace(/\.cube$/i, ''),
        path: filename,
        intensity: 100,
        enabled: true,
        cubeData: parseRes.lut,
      };

      set((state) => ({
        importedLUTs: [...state.importedLUTs, lutEffect],
      }));

      return { success: true, lut: lutEffect };
    },

    removeLUT: (id) =>
      set((state) => ({
        importedLUTs: state.importedLUTs.filter((l) => l.id !== id),
      })),

    setMatchReference: (reference) =>
      set((state) => ({
        colorMatch: { ...state.colorMatch, ...reference },
      })),
  };
});
