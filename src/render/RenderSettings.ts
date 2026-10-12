/**
 * Nusantara Video Studio - Render Settings Manager
 * Phase 9: Professional Rendering & Export Engine (Requirements 7, 13, 14, 16, 17, 52, 55)
 */

import {
  RenderSettings,
  QualityPreset,
  VideoCodec,
  AudioCodec,
  RenderContainerFormat,
} from '../types/render';
import { Project } from '../types';

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  format: 'mp4',
  videoCodec: 'h264',
  audioCodec: 'aac',
  width: 1920,
  height: 1080,
  fps: 30,
  qualityPreset: 'standard',
  bitrateMode: 'auto',
  targetBitrateMbps: 12,
  maxBitrateMbps: 16,
  crf: 22,
  hardwareAcceleration: 'auto',
  audioSampleRate: 48000,
  audioChannels: 2,
  audioBitrateKbps: 256,
  audioNormalization: 'none',
  subtitleMode: 'none',
  exportAlpha: false,
  rangeType: 'entire',
  useProxyMedia: false,
  outputPath: '',
};

export class RenderSettingsManager {
  private static STORAGE_KEY = 'nvs_last_export_settings_v9';

  public static getLastSettings(project?: Project): RenderSettings {
    const fallback: RenderSettings = {
      ...DEFAULT_RENDER_SETTINGS,
      width: project?.settings?.width || 1920,
      height: project?.settings?.height || 1080,
      fps: project?.settings?.fps || 30,
    };

    if (typeof localStorage === 'undefined') return fallback;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...fallback,
          ...parsed,
          width: parsed.width || fallback.width,
          height: parsed.height || fallback.height,
          fps: parsed.fps || fallback.fps,
        };
      }
    } catch {
      // ignore
    }

    return fallback;
  }

  public static saveSettings(settings: RenderSettings): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  /**
   * Sanitizes Windows/POSIX illegal characters from file names
   * Illegal in Windows: \ / : * ? " < > |
   */
  public static sanitizeFilename(name: string): string {
    return name
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .trim();
  }

  /**
   * Generates formatted output filename based on template tags
   * {project}, {sequence}, {date}, {time}, {resolution}, {preset}
   */
  public static generateFilename(
    template: string,
    params: {
      projectName: string;
      sequenceName?: string;
      resolution: string;
      presetName: string;
      extension: string;
    }
  ): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;

    let result = template || '{project}_{resolution}_{date}';
    result = result.replace(/\{project\}/g, this.sanitizeFilename(params.projectName || 'Project'));
    result = result.replace(/\{sequence\}/g, this.sanitizeFilename(params.sequenceName || 'Main'));
    result = result.replace(/\{resolution\}/g, this.sanitizeFilename(params.resolution));
    result = result.replace(/\{preset\}/g, this.sanitizeFilename(params.presetName));
    result = result.replace(/\{date\}/g, dateStr);
    result = result.replace(/\{time\}/g, timeStr);

    result = this.sanitizeFilename(result);
    if (!result.endsWith(params.extension)) {
      result += params.extension;
    }

    return result;
  }

  /**
   * Adjusts bitrate / CRF parameters based on codec & quality preset
   */
  public static applyQualityPreset(
    settings: RenderSettings,
    preset: QualityPreset
  ): RenderSettings {
    const res = { ...settings, qualityPreset: preset };
    const is4K = res.width >= 3840 || res.height >= 2160;
    const is1440p = res.width >= 2560 && !is4K;

    let baseBitrate = 12; // 1080p standard
    if (is4K) baseBitrate = 45;
    else if (is1440p) baseBitrate = 24;
    else if (res.width <= 1280 && res.height <= 720) baseBitrate = 6;

    switch (preset) {
      case 'draft':
        res.targetBitrateMbps = Math.max(3, Math.round(baseBitrate * 0.4));
        res.maxBitrateMbps = Math.round(res.targetBitrateMbps * 1.3);
        res.crf = 28;
        res.audioBitrateKbps = 128;
        break;
      case 'standard':
        res.targetBitrateMbps = baseBitrate;
        res.maxBitrateMbps = Math.round(baseBitrate * 1.4);
        res.crf = 23;
        res.audioBitrateKbps = 192;
        break;
      case 'high':
        res.targetBitrateMbps = Math.round(baseBitrate * 1.6);
        res.maxBitrateMbps = Math.round(res.targetBitrateMbps * 1.4);
        res.crf = 19;
        res.audioBitrateKbps = 256;
        break;
      case 'very-high':
        res.targetBitrateMbps = Math.round(baseBitrate * 2.2);
        res.maxBitrateMbps = Math.round(res.targetBitrateMbps * 1.3);
        res.crf = 16;
        res.audioBitrateKbps = 320;
        break;
      case 'master':
        res.targetBitrateMbps = Math.round(baseBitrate * 4.0);
        res.maxBitrateMbps = Math.round(res.targetBitrateMbps * 1.2);
        res.crf = 12;
        res.audioBitrateKbps = 320;
        break;
      case 'custom':
        break;
    }

    return res;
  }
}
