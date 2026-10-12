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

const STORAGE_KEY = 'nvs_app_preferences_v10';

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    language: 'id',
    theme: 'dark-studio',
    autoSaveEnabled: true,
    autoSaveIntervalMinutes: 5,
    projectsDirectory: 'Documents/NusantaraProjects',
    firstRunCompleted: false,
    releaseChannel: 'stable',
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
    hardwareEncoderPreference: 'auto',
    maxBackgroundThreads: 2,
  },
};

const loadInitialSettings = (): AppSettings => {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        general: { ...DEFAULT_SETTINGS.general, ...parsed.general },
        project: { ...DEFAULT_SETTINGS.project, ...parsed.project },
        performance: { ...DEFAULT_SETTINGS.performance, ...parsed.performance },
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
};

const saveSettingsToStorage = (settings: AppSettings) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // fallback
  }
};

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: loadInitialSettings(),

  updateGeneralSettings: (partial) =>
    set((state) => {
      const nextSettings = {
        ...state.settings,
        general: { ...state.settings.general, ...partial },
      };
      saveSettingsToStorage(nextSettings);
      return { settings: nextSettings };
    }),

  updateProjectDefaults: (partial) =>
    set((state) => {
      const nextSettings = {
        ...state.settings,
        project: { ...state.settings.project, ...partial },
      };
      saveSettingsToStorage(nextSettings);
      return { settings: nextSettings };
    }),

  updatePerformanceSettings: (partial) =>
    set((state) => {
      const nextSettings = {
        ...state.settings,
        performance: { ...state.settings.performance, ...partial },
      };
      saveSettingsToStorage(nextSettings);
      return { settings: nextSettings };
    }),

  resetToDefaults: () => {
    saveSettingsToStorage(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },
}));
