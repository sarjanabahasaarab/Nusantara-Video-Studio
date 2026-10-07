/**
 * Nusantara Video Studio - Audio Types
 * Phase 6: Professional Color & Audio Studio
 */

export interface EqualizerBand {
  id: 'low' | 'low-mid' | 'mid' | 'high-mid' | 'high';
  name: string;
  type: 'lowshelf' | 'peaking' | 'highshelf';
  frequency: number; // in Hz (20 to 20000)
  gain: number; // in dB (-24 to +24)
  q: number; // quality factor / bandwidth (0.1 to 10)
  enabled: boolean;
}

export interface EqualizerSettings {
  enabled: boolean;
  preset?: string;
  bands: EqualizerBand[];
}

export interface CompressorSettings {
  enabled: boolean;
  threshold: number; // dB (-60 to 0)
  ratio: number; // 1 to 20
  attack: number; // seconds (0.001 to 0.5)
  release: number; // seconds (0.05 to 1.0)
  knee: number; // dB (0 to 40)
  makeupGain: number; // dB (0 to 24)
  preset?: string;
}

export interface LimiterSettings {
  enabled: boolean;
  ceiling: number; // dB (-12 to 0, default -0.1)
  threshold: number; // dB (-24 to 0, default 0)
  release: number; // seconds (0.01 to 0.5, default 0.1)
}

export interface NoiseReductionSettings {
  enabled: boolean;
  amount: number; // 0 to 100 %
  sensitivity: number; // 0 to 100 %
  smoothing: number; // 0 to 100 %
  hasProfile: boolean;
}

export interface AudioNormalizationSettings {
  enabled: boolean;
  mode: 'peak' | 'loudness';
  targetLevel: number; // e.g. -0.1 dB peak or -14 LUFS
  measuredLevel?: number;
  calculatedGainOffset: number; // dB
}

export type AudioEffectType = 'eq' | 'compressor' | 'limiter' | 'noise-reduction';

export interface AudioEffectItem {
  id: string;
  type: AudioEffectType;
  name: string;
  enabled: boolean;
}

export interface ClipAudioEffects {
  eq: EqualizerSettings;
  compressor: CompressorSettings;
  limiter: LimiterSettings;
  noiseReduction: NoiseReductionSettings;
  normalization: AudioNormalizationSettings;
  effectOrder: AudioEffectType[];
}

export interface TrackMixerChannel {
  trackId: string;
  name: string;
  volumeDb: number; // -60 to +6 dB (0 dB default, -Infinity for mute)
  pan: number; // -1.0 (Left) to +1.0 (Right), 0 (Center)
  mute: boolean;
  solo: boolean;
  eq: EqualizerSettings;
  compressor: CompressorSettings;
  limiter: LimiterSettings;
  meterLevel: {
    left: number; // 0 to 1 linear or dB
    right: number;
    peakLeft: number;
    peakRight: number;
    clipping: boolean;
  };
}

export interface MasterAudioBus {
  volumeDb: number; // -60 to +6 dB
  gainDb: number; // output gain
  mute: boolean;
  limiter: LimiterSettings;
  meterLevel: {
    left: number;
    right: number;
    peakLeft: number;
    peakRight: number;
    clipping: boolean;
  };
}

export interface AudioPreset {
  id: string;
  name: string;
  category: 'eq' | 'compressor' | 'voice' | 'master';
  eq?: Partial<EqualizerSettings>;
  compressor?: Partial<CompressorSettings>;
  limiter?: Partial<LimiterSettings>;
}
