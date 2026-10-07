/**
 * Nusantara Video Studio - Audio Processing Engine
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements professional Web Audio DSP pipeline:
 * - 5-Band Parametric Equalizer (Low Shelf, Low-Mid, Mid, High-Mid, High Shelf)
 * - Dynamics Compressor (Threshold, Ratio, Attack, Release, Knee, Makeup Gain)
 * - Anti-Clipping Master Limiter (Ceiling, Release)
 * - Decibel (dB) to Linear conversions & Metering
 * - Peak & Loudness Normalization
 * - Noise Reduction Profile filtering
 * - Track Routing (Clip -> Track EQ/FX -> Track Panner -> Master Limiter -> Master Output)
 */

import {
  CompressorSettings,
  EqualizerSettings,
  LimiterSettings,
  MasterAudioBus,
  NoiseReductionSettings,
  TrackMixerChannel,
} from '../../types/audio';

export class AudioProcessingEngine {
  private static audioCtx: AudioContext | null = null;

  /**
   * Lazily initialize or return Web AudioContext singleton
   */
  static getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Decibel to Linear Amplitude conversion
   * -Infinity dB => 0
   * 0 dB => 1.0
   * +6 dB => ~2.0
   * -6 dB => ~0.5
   */
  static dbToLinear(db: number): number {
    if (db <= -60 || !isFinite(db)) return 0;
    return Math.pow(10, db / 20);
  }

  /**
   * Linear Amplitude to Decibels conversion
   */
  static linearToDb(linear: number): number {
    if (linear <= 0.0001) return -60;
    return Math.max(-60, 20 * Math.log10(linear));
  }

  /**
   * Default 5-Band Parametric EQ Settings
   */
  static getDefaultEQ(): EqualizerSettings {
    return {
      enabled: true,
      bands: [
        { id: 'low', name: 'Low (80 Hz)', type: 'lowshelf', frequency: 80, gain: 0, q: 0.71, enabled: true },
        { id: 'low-mid', name: 'Low-Mid (250 Hz)', type: 'peaking', frequency: 250, gain: 0, q: 1.0, enabled: true },
        { id: 'mid', name: 'Mid (1 kHz)', type: 'peaking', frequency: 1000, gain: 0, q: 1.0, enabled: true },
        { id: 'high-mid', name: 'High-Mid (4 kHz)', type: 'peaking', frequency: 4000, gain: 0, q: 1.0, enabled: true },
        { id: 'high', name: 'High (12 kHz)', type: 'highshelf', frequency: 12000, gain: 0, q: 0.71, enabled: true },
      ],
    };
  }

  /**
   * Default Compressor Settings
   */
  static getDefaultCompressor(): CompressorSettings {
    return {
      enabled: false,
      threshold: -18,
      ratio: 3.5,
      attack: 0.02, // 20ms
      release: 0.15, // 150ms
      knee: 6,
      makeupGain: 2,
    };
  }

  /**
   * Default Master Limiter Settings
   */
  static getDefaultLimiter(): LimiterSettings {
    return {
      enabled: true,
      ceiling: -0.1, // -0.1 dB True Peak protection
      threshold: -1.0,
      release: 0.05,
    };
  }

  /**
   * Default Noise Reduction Settings
   */
  static getDefaultNoiseReduction(): NoiseReductionSettings {
    return {
      enabled: false,
      amount: 40,
      sensitivity: 50,
      smoothing: 60,
      hasProfile: false,
    };
  }

  /**
   * Default Track Mixer Channel definition
   */
  static getDefaultMixerChannel(trackId: string, name: string): TrackMixerChannel {
    return {
      trackId,
      name,
      volumeDb: 0, // 0 dB unity gain
      pan: 0, // Center
      mute: false,
      solo: false,
      eq: this.getDefaultEQ(),
      compressor: this.getDefaultCompressor(),
      limiter: this.getDefaultLimiter(),
      meterLevel: {
        left: 0,
        right: 0,
        peakLeft: -60,
        peakRight: -60,
        clipping: false,
      },
    };
  }

  /**
   * Default Master Audio Bus definition
   */
  static getDefaultMasterBus(): MasterAudioBus {
    return {
      volumeDb: 0,
      gainDb: 0,
      mute: false,
      limiter: this.getDefaultLimiter(),
      meterLevel: {
        left: 0,
        right: 0,
        peakLeft: -60,
        peakRight: -60,
        clipping: false,
      },
    };
  }

  /**
   * Built-in Parametric EQ Presets
   */
  static getEQPresets(): { id: string; name: string; description: string; bands: { id: string; gain: number; freq?: number }[] }[] {
    return [
      {
        id: 'flat',
        name: 'Flat (Reset)',
        description: 'Respons frekuensi datar netral tanpa boost/cut.',
        bands: [
          { id: 'low', gain: 0 },
          { id: 'low-mid', gain: 0 },
          { id: 'mid', gain: 0 },
          { id: 'high-mid', gain: 0 },
          { id: 'high', gain: 0 },
        ],
      },
      {
        id: 'voice',
        name: 'Voice / Vocal Presence',
        description: 'Cut low rumble, boost kejelasan artikulasi vokal (3-4 kHz).',
        bands: [
          { id: 'low', gain: -4 },
          { id: 'low-mid', gain: -1 },
          { id: 'mid', gain: 2 },
          { id: 'high-mid', gain: 3.5 },
          { id: 'high', gain: 1.5 },
        ],
      },
      {
        id: 'podcast',
        name: 'Podcast Host Clarity',
        description: 'Optimasi vokal podcast: hangat dan sangat jelas terdengar di ponsel.',
        bands: [
          { id: 'low', gain: -6 },
          { id: 'low-mid', gain: 1 },
          { id: 'mid', gain: 0 },
          { id: 'high-mid', gain: 4 },
          { id: 'high', gain: 2 },
        ],
      },
      {
        id: 'music',
        name: 'Music BGM Balance',
        description: 'V-curve seimbang untuk musik latar gamelan/orkestra.',
        bands: [
          { id: 'low', gain: 3 },
          { id: 'low-mid', gain: 1 },
          { id: 'mid', gain: -2 },
          { id: 'high-mid', gain: 1.5 },
          { id: 'high', gain: 3 },
        ],
      },
      {
        id: 'bass-boost',
        name: 'Bass Boost',
        description: 'Mempertebal suara bass dan instrumen frekuensi rendah.',
        bands: [
          { id: 'low', gain: 6 },
          { id: 'low-mid', gain: 3 },
          { id: 'mid', gain: 0 },
          { id: 'high-mid', gain: 0 },
          { id: 'high', gain: 0 },
        ],
      },
      {
        id: 'treble-boost',
        name: 'Treble Boost (Air)',
        description: 'Kilau frekuensi tinggi pada perkusi dan desah udara.',
        bands: [
          { id: 'low', gain: 0 },
          { id: 'low-mid', gain: 0 },
          { id: 'mid', gain: 0 },
          { id: 'high-mid', gain: 3 },
          { id: 'high', gain: 6 },
        ],
      },
      {
        id: 'reduce-mud',
        name: 'Reduce Mud (250-400 Hz Cut)',
        description: 'Membersihkan suara keruh dan menggema di ruang tertutup.',
        bands: [
          { id: 'low', gain: -2 },
          { id: 'low-mid', gain: -5 },
          { id: 'mid', gain: -1 },
          { id: 'high-mid', gain: 1 },
          { id: 'high', gain: 1 },
        ],
      },
      {
        id: 'speech-clarity',
        name: 'Speech Clarity',
        description: 'Fokus penuh pada pemahaman tutur kata Bahasa Indonesia.',
        bands: [
          { id: 'low', gain: -5 },
          { id: 'low-mid', gain: -2 },
          { id: 'mid', gain: 1 },
          { id: 'high-mid', gain: 5 },
          { id: 'high', gain: 2 },
        ],
      },
    ];
  }

  /**
   * Built-in Compressor Presets
   */
  static getCompressorPresets(): { id: string; name: string; settings: Partial<CompressorSettings> }[] {
    return [
      {
        id: 'voice',
        name: 'Voice Dynamics',
        settings: {
          enabled: true,
          threshold: -18,
          ratio: 3.5,
          attack: 0.015,
          release: 0.12,
          knee: 5,
          makeupGain: 2.5,
        },
      },
      {
        id: 'podcast',
        name: 'Broadcast Podcast',
        settings: {
          enabled: true,
          threshold: -16,
          ratio: 4.0,
          attack: 0.01,
          release: 0.1,
          knee: 6,
          makeupGain: 3.0,
        },
      },
      {
        id: 'music',
        name: 'Music Leveler',
        settings: {
          enabled: true,
          threshold: -14,
          ratio: 2.5,
          attack: 0.04,
          release: 0.25,
          knee: 10,
          makeupGain: 1.5,
        },
      },
      {
        id: 'light',
        name: 'Light Transparent Compression',
        settings: {
          enabled: true,
          threshold: -10,
          ratio: 2.0,
          attack: 0.05,
          release: 0.2,
          knee: 8,
          makeupGain: 1.0,
        },
      },
    ];
  }

  /**
   * Calculates normalization gain needed to hit target dB peak
   */
  static calculatePeakNormalization(currentPeakDb: number, targetPeakDb = -0.1): number {
    if (currentPeakDb <= -60) return 0;
    return targetPeakDb - currentPeakDb;
  }
}
