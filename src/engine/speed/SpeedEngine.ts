/**
 * Nusantara Video Studio - Speed & Speed Ramping Engine
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Handles constant playback rates (0.25x to 16x), non-destructive duration recalculation,
 * and piecewise speed ramping curve integration.
 */

import { SpeedPoint, SpeedRampCurve } from '../../types';

export class SpeedEngine {
  /**
   * Evaluates instantaneous speed at a given point in source time.
   */
  public static evaluateSpeedAtSourceTime(
    sourceTime: number,
    baseRate: number,
    ramp?: SpeedRampCurve
  ): number {
    if (!ramp || !ramp.enabled || !ramp.points || ramp.points.length === 0) {
      return Math.max(0.1, baseRate);
    }

    const sorted = [...ramp.points].sort((a, b) => a.time - b.time);

    if (sourceTime <= sorted[0].time) {
      return sorted[0].speed;
    }
    if (sourceTime >= sorted[sorted.length - 1].time) {
      return sorted[sorted.length - 1].speed;
    }

    for (let i = 0; i < sorted.length - 1; i++) {
      const p0 = sorted[i];
      const p1 = sorted[i + 1];

      if (sourceTime >= p0.time && sourceTime <= p1.time) {
        const segDur = p1.time - p0.time;
        if (segDur <= 0.0001) return p1.speed;

        const t = (sourceTime - p0.time) / segDur;

        // Quadratic interpolation
        if (p0.interpolation === 'ease-in') {
          return p0.speed + (p1.speed - p0.speed) * (t * t);
        } else if (p0.interpolation === 'ease-out') {
          return p0.speed + (p1.speed - p0.speed) * (t * (2 - t));
        } else if (p0.interpolation === 'ease-in-out') {
          const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          return p0.speed + (p1.speed - p0.speed) * eased;
        }

        // Linear default
        return p0.speed + (p1.speed - p0.speed) * t;
      }
    }

    return Math.max(0.1, baseRate);
  }

  /**
   * Calculates effective timeline duration from source duration and speed curve.
   * If speed is constant: duration = sourceDuration / speedRate.
   * If ramping is enabled: integrates dt / v(t) over small discrete intervals.
   */
  public static calculateEffectiveDuration(
    sourceDuration: number,
    baseRate: number,
    ramp?: SpeedRampCurve
  ): number {
    const validRate = Math.max(0.1, Math.min(16, baseRate || 1.0));

    if (!ramp || !ramp.enabled || !ramp.points || ramp.points.length < 2) {
      return Math.max(0.1, sourceDuration / validRate);
    }

    // Numerical integration over N slices
    const steps = 60;
    const dt = sourceDuration / steps;
    let timelineDuration = 0;

    for (let i = 0; i < steps; i++) {
      const tMid = (i + 0.5) * dt;
      const speedAtT = Math.max(0.1, this.evaluateSpeedAtSourceTime(tMid, validRate, ramp));
      timelineDuration += dt / speedAtT;
    }

    return Math.max(0.2, timelineDuration);
  }

  /**
   * Maps a timeline offset (seconds elapsed since clip start) to source media time.
   */
  public static mapTimelineToSourceTime(
    timelineOffset: number,
    sourceDuration: number,
    baseRate: number,
    ramp?: SpeedRampCurve
  ): number {
    const validRate = Math.max(0.1, baseRate || 1.0);

    if (!ramp || !ramp.enabled || !ramp.points || ramp.points.length < 2) {
      return Math.min(sourceDuration, timelineOffset * validRate);
    }

    // Step through source time integrating timeline dt until accumulated matches timelineOffset
    const steps = 120;
    const dt = sourceDuration / steps;
    let accumulatedTimeline = 0;
    let currentSource = 0;

    for (let i = 0; i < steps; i++) {
      const speed = Math.max(0.1, this.evaluateSpeedAtSourceTime(currentSource + dt * 0.5, validRate, ramp));
      const timelineStep = dt / speed;

      if (accumulatedTimeline + timelineStep >= timelineOffset) {
        const remaining = timelineOffset - accumulatedTimeline;
        return currentSource + remaining * speed;
      }

      accumulatedTimeline += timelineStep;
      currentSource += dt;
    }

    return Math.min(sourceDuration, currentSource);
  }

  /**
   * Generates a predefined speed ramp curve (Requirement 12).
   */
  public static createPresetRamp(
    preset: 'slow-motion' | 'fast-motion' | 'speed-up' | 'speed-down' | 'montage',
    sourceDuration: number
  ): SpeedRampCurve {
    const d = Math.max(1.0, sourceDuration);

    switch (preset) {
      case 'slow-motion':
        return {
          enabled: true,
          preset,
          points: [
            { id: 'sp-1', time: 0, speed: 1.0, interpolation: 'ease-in-out' },
            { id: 'sp-2', time: d * 0.25, speed: 0.35, interpolation: 'linear' },
            { id: 'sp-3', time: d * 0.75, speed: 0.35, interpolation: 'ease-in-out' },
            { id: 'sp-4', time: d, speed: 1.0, interpolation: 'linear' },
          ],
        };

      case 'fast-motion':
        return {
          enabled: true,
          preset,
          points: [
            { id: 'sp-1', time: 0, speed: 1.0, interpolation: 'ease-in-out' },
            { id: 'sp-2', time: d * 0.2, speed: 3.0, interpolation: 'linear' },
            { id: 'sp-3', time: d * 0.8, speed: 3.0, interpolation: 'ease-in-out' },
            { id: 'sp-4', time: d, speed: 1.0, interpolation: 'linear' },
          ],
        };

      case 'speed-up':
        return {
          enabled: true,
          preset,
          points: [
            { id: 'sp-1', time: 0, speed: 0.5, interpolation: 'ease-in' },
            { id: 'sp-2', time: d * 0.5, speed: 1.5, interpolation: 'ease-in' },
            { id: 'sp-3', time: d, speed: 3.5, interpolation: 'linear' },
          ],
        };

      case 'speed-down':
        return {
          enabled: true,
          preset,
          points: [
            { id: 'sp-1', time: 0, speed: 3.0, interpolation: 'ease-out' },
            { id: 'sp-2', time: d * 0.5, speed: 1.2, interpolation: 'ease-out' },
            { id: 'sp-3', time: d, speed: 0.35, interpolation: 'linear' },
          ],
        };

      case 'montage':
        return {
          enabled: true,
          preset,
          points: [
            { id: 'sp-1', time: 0, speed: 2.5, interpolation: 'ease-in-out' },
            { id: 'sp-2', time: d * 0.3, speed: 0.4, interpolation: 'ease-in-out' },
            { id: 'sp-3', time: d * 0.65, speed: 2.8, interpolation: 'ease-in-out' },
            { id: 'sp-4', time: d, speed: 0.8, interpolation: 'linear' },
          ],
        };
    }
  }
}
