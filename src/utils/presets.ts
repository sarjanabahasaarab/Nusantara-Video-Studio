/**
 * Preset resolution configurations and aspect ratio utilities
 */
import { AspectRatio, FrameRate, ResolutionPreset } from '../types';

export interface ResolutionConfig {
  preset: ResolutionPreset;
  label: string;
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: ResolutionConfig[] = [
  { preset: '1280x720', label: 'HD 720p (1280x720)', width: 1280, height: 720 },
  { preset: '1920x1080', label: 'Full HD 1080p (1920x1080)', width: 1920, height: 1080 },
  { preset: '2560x1440', label: '2K QHD (2560x1440)', width: 2560, height: 1440 },
  { preset: '3840x2160', label: '4K UHD (3840x2160)', width: 3840, height: 2160 },
];

export const FRAME_RATES: { value: FrameRate; label: string }[] = [
  { value: 24, label: '24 fps (Cinema)' },
  { value: 25, label: '25 fps (PAL)' },
  { value: 30, label: '30 fps (Standard NTSC / Web)' },
  { value: 50, label: '50 fps (Smooth PAL)' },
  { value: 60, label: '60 fps (Smooth / High Frame Rate)' },
];

export const ASPECT_RATIOS: { value: AspectRatio; label: string; ratio: number }[] = [
  { value: '16:9', label: '16:9 (Widescreen Landscape)', ratio: 16 / 9 },
  { value: '9:16', label: '9:16 (Vertical / Reels / TikTok)', ratio: 9 / 16 },
  { value: '1:1', label: '1:1 (Square / Feed)', ratio: 1 / 1 },
  { value: '4:3', label: '4:3 (Classic Television)', ratio: 4 / 3 },
];

export function getResolutionFromPreset(preset: ResolutionPreset): { width: number; height: number } {
  const found = RESOLUTION_PRESETS.find((r) => r.preset === preset);
  return found ? { width: found.width, height: found.height } : { width: 1920, height: 1080 };
}
