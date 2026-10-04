/**
 * Nusantara Video Studio - Settings Store
 * Stores application preferences, project defaults, and autosave configurations.
 */

import { create } from 'zustand';
import { AppSettings, AspectRatio, FrameRate, ResolutionPreset } from '../types';

interface SettingsState {
  settings: AppSettings;
  
  // Actions
  updateGeneralSettings: (partial: Partial<AppSettings['general']>) => void;
  updateProjectDefaults: (partial: Partial<AppSettings['project']>) => void;
  updatePerformanceSettings: (partial: Partial<AppSettings['performance']>) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    language: 'id',
    theme: 'dark-studio',
    autoSaveEnabled: true,
    autoSaveIntervalMinutes: 5,
  },
  project: {
    defaultResolution: '1920x1080',
    defaultFps: 30,
    defaultAspectRatio: '16:9',
  },
  performance: {
    previewQuality: 'full',
    cacheLocation: 'Default (App Data / Cache)',
    gpuAcceleration: true,
  },
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,

  updateGeneralSettings: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        general: { ...state.settings.general, ...partial },
      },
    })),

  updateProjectDefaults: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        project: { ...state.settings.project, ...partial },
      },
    })),

  updatePerformanceSettings: (partial) =>
    set((state) => ({
      settings: {
        ...state.settings,
        performance: { ...state.settings.performance, ...partial },
      },
    })),

  resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
}));
