/**
 * Nusantara Video Studio - Export Presets Manager
 * Phase 9: Professional Rendering & Export Engine (Requirements 35, 36, 37, 78)
 */

import { RenderPreset, RenderSettings } from '../types/render';
import { RenderCapabilitiesService } from './RenderCapabilities';

export const BUILT_IN_PRESETS: RenderPreset[] = [
  {
    id: 'preset-yt-1080p',
    name: 'YouTube 1080p',
    category: 'social',
    description: 'Format optimal untuk unggahan video YouTube Full HD (1920×1080) H.264 AAC.',
    isBuiltIn: true,
    settings: {
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      width: 1920,
      height: 1080,
      fps: 30,
      qualityPreset: 'high',
      bitrateMode: 'auto',
      targetBitrateMbps: 16,
      maxBitrateMbps: 22,
      audioSampleRate: 48000,
      audioChannels: 2,
      audioBitrateKbps: 256,
      audioNormalization: 'lufs_14',
    },
  },
  {
    id: 'preset-yt-4k',
    name: 'YouTube 4K',
    category: 'social',
    description: 'Resolusi 3840×2160 dengan bitrate tinggi untuk visual 4K tanpa blur kompresi.',
    isBuiltIn: true,
    settings: {
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      width: 3840,
      height: 2160,
      fps: 60,
      qualityPreset: 'very-high',
      bitrateMode: 'auto',
      targetBitrateMbps: 55,
      maxBitrateMbps: 70,
      audioSampleRate: 48000,
      audioChannels: 2,
      audioBitrateKbps: 320,
      audioNormalization: 'lufs_14',
    },
  },
  {
    id: 'preset-reels',
    name: 'Instagram Reels',
    category: 'social',
    description: 'Format vertikal 9:16 (1080×1920) H.264 30fps standar optimal platform Meta.',
    isBuiltIn: true,
    settings: {
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      width: 1080,
      height: 1920,
      fps: 30,
      qualityPreset: 'high',
      bitrateMode: 'auto',
      targetBitrateMbps: 12,
      maxBitrateMbps: 16,
      audioSampleRate: 48000,
      audioChannels: 2,
      audioBitrateKbps: 192,
      audioNormalization: 'lufs_14',
      smartReframeRatio: '9:16',
    },
  },
  {
    id: 'preset-tiktok',
    name: 'TikTok Vertical',
    category: 'social',
    description: 'Preset vertikal 1080×1920 dengan penyesuaian bitrate audio AAC dan normalisasi loudness.',
    isBuiltIn: true,
    settings: {
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      width: 1080,
      height: 1920,
      fps: 30,
      qualityPreset: 'high',
      bitrateMode: 'auto',
      targetBitrateMbps: 14,
      maxBitrateMbps: 18,
      audioSampleRate: 48000,
      audioChannels: 2,
      audioBitrateKbps: 192,
      audioNormalization: 'lufs_14',
      smartReframeRatio: '9:16',
    },
  },
  {
    id: 'preset-facebook',
    name: 'Facebook Video',
    category: 'social',
    description: 'Format standar 1080p H.264 untuk video feed dan halaman Facebook.',
    isBuiltIn: true,
    settings: {
      format: 'mp4',
      videoCodec: 'h264',
      audioCodec: 'aac',
      width: 1920,
      height: 1080,
      fps: 30,
      qualityPreset: 'standard',
      bitrateMode: 'auto',
      targetBitrateMbps: 10,
      audioSampleRate: 48000,
      audioChannels: 2,
      audioBitrateKbps: 192,
      audioNormalization: 'lufs_14',
    },
  },
  {
    id: 'preset-archive-master',
    name: 'Archive Master',
    category: 'archive',
    description: 'Kualitas master broadcast dengan kompresi visual lossless Apple ProRes atau H.264 CRF 12.',
    isBuiltIn: true,
    settings: {
      format: 'mov',
      videoCodec: 'prores',
      audioCodec: 'pcm',
      width: 1920,
      height: 1080,
      fps: 30,
      qualityPreset: 'master',
      bitrateMode: 'crf',
      crf: 12,
      audioSampleRate: 48000,
      audioChannels: 2,
      audioBitrateKbps: 320,
    },
  },
  {
    id: 'preset-web',
    name: 'Web',
    category: 'web',
    description: 'Video web modern HTML5 dengan efisiensi streaming tinggi dan audio Opus.',
    isBuiltIn: true,
    settings: {
      format: 'webm',
      videoCodec: 'vp9',
      audioCodec: 'opus',
      width: 1920,
      height: 1080,
      fps: 30,
      qualityPreset: 'high',
      bitrateMode: 'auto',
      targetBitrateMbps: 8,
      audioSampleRate: 48000,
      audioChannels: 2,
      audioBitrateKbps: 128,
    },
  },
];

export class RenderPresetManager {
  private static STORAGE_KEY = 'nvs_custom_export_presets_v9';
  private static memoryCustomPresets: RenderPreset[] = [];

  public static getAllPresets(): RenderPreset[] {
    const custom = this.getCustomPresets();
    return [...BUILT_IN_PRESETS, ...custom];
  }

  public static getCustomPresets(): RenderPreset[] {
    if (typeof localStorage === 'undefined') return this.memoryCustomPresets;
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return this.memoryCustomPresets;
  }

  public static getPresets(): RenderPreset[] {
    return this.getAllPresets();
  }

  public static getPresetById(id: string): RenderPreset | undefined {
    return this.getAllPresets().find((p) => p.id === id);
  }

  public static saveCustomPreset(
    nameOrPreset: string | Omit<RenderPreset, 'id' | 'isBuiltIn'>,
    category?: 'social' | 'web' | 'broadcast' | 'archive' | 'custom',
    settings?: Partial<RenderSettings>
  ): RenderPreset {
    const id = `preset-custom-${Date.now()}`;
    let newPreset: RenderPreset;

    if (typeof nameOrPreset === 'string') {
      newPreset = {
        id,
        name: nameOrPreset,
        category: category || 'custom',
        settings: settings || {},
        isBuiltIn: false,
      };
    } else {
      newPreset = {
        ...nameOrPreset,
        id,
        isBuiltIn: false,
      };
    }

    const existing = this.getCustomPresets();
    const updated = [...existing, newPreset];
    this.saveList(updated);
    return newPreset;
  }

  public static updatePreset(id: string, updates: Partial<RenderPreset>): void {
    const existing = this.getCustomPresets();
    const updated = existing.map((p) => (p.id === id ? { ...p, ...updates } : p));
    this.saveList(updated);
  }

  public static deletePreset(id: string): void {
    const existing = this.getCustomPresets();
    const updated = existing.filter((p) => p.id !== id);
    this.saveList(updated);
  }

  public static deleteCustomPreset(id: string): void {
    this.deletePreset(id);
  }

  public static duplicatePreset(presetId: string): RenderPreset | null {
    const preset = this.getAllPresets().find((p) => p.id === presetId);
    if (!preset) return null;

    return this.saveCustomPreset({
      name: `${preset.name} (Salinan)`,
      category: 'custom',
      description: preset.description,
      settings: { ...preset.settings },
    });
  }

  public static exportPresetsJson(): string {
    return JSON.stringify(this.getCustomPresets(), null, 2);
  }

  public static importPresetsJson(jsonStr: string): { imported: number; error?: string } {
    try {
      const list = JSON.parse(jsonStr);
      if (!Array.isArray(list)) throw new Error('Format preset harus berupa array JSON.');

      const existing = this.getCustomPresets();
      const newItems: RenderPreset[] = [];

      for (const item of list) {
        if (item.name && item.settings) {
          newItems.push({
            id: `preset-imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: item.name,
            category: 'custom',
            description: item.description,
            settings: item.settings,
            isBuiltIn: false,
          });
        }
      }

      this.saveList([...existing, ...newItems]);
      return { imported: newItems.length };
    } catch (err: any) {
      return { imported: 0, error: err.message };
    }
  }

  /**
   * Validates if a preset is compatible with the detected system backend
   */
  public static async validatePresetCompatibility(preset: RenderPreset): Promise<{
    compatible: boolean;
    reason?: string;
  }> {
    const caps = await RenderCapabilitiesService.getInstance().getCapabilities();
    const s = preset.settings;

    if (s.format && !caps.containers.some((c) => c.format === s.format && c.available)) {
      return {
        compatible: false,
        reason: `Format container "${s.format}" tidak didukung oleh instalasi FFmpeg pada sistem ini.`,
      };
    }

    if (s.videoCodec && !caps.videoCodecs.some((v) => v.id === s.videoCodec && v.available)) {
      return {
        compatible: false,
        reason: `Encoder video "${s.videoCodec}" tidak tersedia di backend FFmpeg.`,
      };
    }

    if (s.audioCodec && !caps.audioCodecs.some((a) => a.id === s.audioCodec && a.available)) {
      return {
        compatible: false,
        reason: `Encoder audio "${s.audioCodec}" tidak tersedia.`,
      };
    }

    return { compatible: true };
  }

  private static saveList(list: RenderPreset[]): void {
    this.memoryCustomPresets = list;
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }
}
