/**
 * Nusantara Video Studio - Timecode & Formatting Utilities
 * Standard NLE SMPTE Timecode: HH:MM:SS:FF
 */

import { FrameRate } from '../types';

/**
 * Converts seconds to SMPTE Timecode HH:MM:SS:FF
 */
export function secondsToTimecode(totalSeconds: number, fps: FrameRate = 30): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) {
    totalSeconds = 0;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds % 1) * fps);

  const pad = (num: number, size = 2) => String(num).padStart(size, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}:${pad(frames)}`;
}

/**
 * Converts SMPTE Timecode HH:MM:SS:FF back to seconds
 */
export function timecodeToSeconds(timecode: string, fps: FrameRate = 30): number {
  const parts = timecode.split(':').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p))) {
    return 0;
  }
  const [h, m, s, f] = parts;
  return h * 3600 + m * 60 + s + f / fps;
}

/**
 * Formats seconds into a human-readable duration e.g. "01:24" or "01:24:12"
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (num: number) => String(num).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats file size in bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
