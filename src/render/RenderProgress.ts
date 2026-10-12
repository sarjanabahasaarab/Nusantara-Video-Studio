/**
 * Nusantara Video Studio - Render Progress & Speed Calculator
 * Phase 9: Professional Rendering & Export Engine (Requirements 41, 42, 43)
 */

import { RenderProgress } from '../types/render';

export class RenderProgressCalculator {
  /**
   * Formats duration in seconds into HH:MM:SS
   */
  public static formatSecondsToHms(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  /**
   * Calculates realistic render speed (e.g. 1.8x realtime)
   */
  public static calculateRenderSpeed(
    renderedFrames: number,
    fps: number,
    elapsedSec: number
  ): number {
    if (elapsedSec <= 0 || fps <= 0) return 1.0;
    const mediaTimeRendered = renderedFrames / fps;
    const speed = mediaTimeRendered / elapsedSec;
    return Math.round(speed * 10) / 10;
  }

  /**
   * Calculates estimated remaining time in seconds
   */
  public static calculateRemainingSeconds(
    percentage: number,
    elapsedSec: number
  ): number {
    if (percentage <= 0) return 0;
    if (percentage >= 100) return 0;
    const totalEstSec = (elapsedSec / percentage) * 100;
    return Math.max(0, Math.round(totalEstSec - elapsedSec));
  }

  /**
   * Generates formatted human-readable summary string
   */
  public static getProgressSummary(progress: RenderProgress): string {
    const pct = `${Math.round(progress.percentage)}%`;
    const frame = `Frame ${progress.currentFrame} / ${progress.totalFrames}`;
    const speed = progress.renderSpeedRealtime > 0 ? `${progress.renderSpeedRealtime.toFixed(1)}x speed` : '';
    const eta = progress.remainingSeconds > 0
      ? `Sisa ${this.formatSecondsToHms(progress.remainingSeconds)}`
      : 'Selesai';

    return [pct, frame, speed, eta].filter(Boolean).join(' • ');
  }
}
