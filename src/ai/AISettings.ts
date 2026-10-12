/**
 * Nusantara Video Studio - AI Settings
 * Phase 7: AI-Assisted Editing
 */

import { AISettings } from '../types/ai';

export const DEFAULT_AI_SETTINGS: AISettings = {
  preferredProvider: 'local',
  privacy: {
    allowCloudProcessing: false, // Default: Cloud processing = OFF
    sendMediaToExternal: false,
    autoProcessImported: false, // Default: Automatic AI processing = OFF
  },
  whisper: {
    modelSize: 'base',
    language: 'auto',
  },
  cloud: {
    providerName: 'Custom Cloud AI / Gemini',
  },
};

export class AISettingsManager {
  private static STORAGE_KEY = 'nvs_ai_settings_v7';

  static getSettings(): AISettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_AI_SETTINGS;
  }

  static saveSettings(settings: AISettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }
}
