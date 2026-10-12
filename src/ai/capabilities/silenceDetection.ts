/**
 * Nusantara Video Studio - Silence Detection Capability
 * Phase 7: AI-Assisted Editing
 *
 * Implements real audio Root Mean Square (RMS) decibel analysis.
 * Detects silent intervals across audio PCM frames with configurable threshold,
 * minimum silence duration, pre-roll buffer, and post-roll buffer.
 */

import { SilenceRegion } from '../../types/ai';

export interface SilenceDetectionOptions {
  thresholdDb?: number; // e.g. -35 dB (typically -50 to -20 dB)
  minDuration?: number; // minimum silence length in seconds (default 0.5s)
  preRoll?: number; // seconds of cushion to keep before speech resumes (default 0.08s)
  postRoll?: number; // seconds of cushion to keep after speech pauses (default 0.08s)
}

export class SilenceDetector {
  /**
   * Calculates Root Mean Square (RMS) and decibels for an array of PCM samples (-1.0 .. 1.0)
   */
  static calculateRmsDb(samples: Float32Array): number {
    if (samples.length === 0) return -100;

    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);
    if (rms < 1e-6) return -100;

    return 20 * Math.log10(rms);
  }

  /**
   * Analyzes an audio buffer or windowed RMS series to extract SilenceRegions
   */
  static detectSilenceFromPcm(
    channelData: Float32Array,
    sampleRate: number,
    options: SilenceDetectionOptions = {}
  ): SilenceRegion[] {
    const thresholdDb = options.thresholdDb ?? -35;
    const minDuration = options.minDuration ?? 0.5;
    const preRoll = options.preRoll ?? 0.08;
    const postRoll = options.postRoll ?? 0.08;

    const windowSize = Math.floor(sampleRate * 0.04); // 40ms analysis window
    if (windowSize <= 0) return [];

    const totalWindows = Math.floor(channelData.length / windowSize);
    const windowIsSilent: boolean[] = new Array(totalWindows);

    for (let w = 0; w < totalWindows; w++) {
      const startIdx = w * windowSize;
      const sub = channelData.subarray(startIdx, startIdx + windowSize);
      const db = this.calculateRmsDb(sub);
      windowIsSilent[w] = db < thresholdDb;
    }

    const windowDuration = windowSize / sampleRate;
    const rawRegions: { start: number; end: number }[] = [];
    let inSilence = false;
    let silenceStartSec = 0;

    for (let w = 0; w < totalWindows; w++) {
      const isSilent = windowIsSilent[w];
      const currentTime = w * windowDuration;

      if (isSilent && !inSilence) {
        inSilence = true;
        silenceStartSec = currentTime;
      } else if (!isSilent && inSilence) {
        inSilence = false;
        const silenceEndSec = currentTime;
        if (silenceEndSec - silenceStartSec >= minDuration) {
          rawRegions.push({ start: silenceStartSec, end: silenceEndSec });
        }
      }
    }

    // Check if trailing silence ends at buffer finish
    if (inSilence) {
      const totalDuration = channelData.length / sampleRate;
      if (totalDuration - silenceStartSec >= minDuration) {
        rawRegions.push({ start: silenceStartSec, end: totalDuration });
      }
    }

    // Apply pre-roll and post-roll cushions without inverting or creating negative durations
    const result: SilenceRegion[] = [];
    for (let i = 0; i < rawRegions.length; i++) {
      const r = rawRegions[i];
      // Post-roll keeps speech tail, so silence starts later
      const adjustedStart = Math.min(r.end, r.start + postRoll);
      // Pre-roll keeps speech start, so silence ends earlier
      const adjustedEnd = Math.max(adjustedStart, r.end - preRoll);
      const duration = adjustedEnd - adjustedStart;

      if (duration >= Math.max(0.1, minDuration - (preRoll + postRoll))) {
        result.push({
          id: `silence-${i + 1}`,
          start: Math.round(adjustedStart * 1000) / 1000,
          end: Math.round(adjustedEnd * 1000) / 1000,
          duration: Math.round(duration * 1000) / 1000,
        });
      }
    }

    return result;
  }
}
