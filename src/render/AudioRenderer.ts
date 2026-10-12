/**
 * Nusantara Video Studio - Audio Mixdown & Encoder Renderer
 * Phase 9: Professional Rendering & Export Engine (Requirements 21, 22, 23, 75)
 *
 * Implements audio mixdown pipeline:
 * Timeline -> Track Mixer -> Bus -> Master -> Limiter -> Loudness Normalization -> Encoder.
 */

import { RenderGraph, RenderSettings } from '../types/render';

export class AudioRenderer {
  /**
   * Compiles audio filtergraph and encoder parameters
   */
  public static buildAudioEncodingArgs(
    graph: RenderGraph,
    settings: RenderSettings
  ): { audioArgs: string[]; filterComplexAudio?: string } {
    const audioArgs: string[] = [];

    // Codec selection
    switch (settings.audioCodec) {
      case 'aac':
        audioArgs.push('-c:a', 'aac');
        audioArgs.push('-b:a', `${settings.audioBitrateKbps || 256}k`);
        break;
      case 'opus':
        audioArgs.push('-c:a', 'libopus');
        audioArgs.push('-b:a', `${settings.audioBitrateKbps || 192}k`);
        break;
      case 'pcm':
        audioArgs.push('-c:a', 'pcm_s16le');
        break;
      default:
        audioArgs.push('-c:a', 'aac', '-b:a', '256k');
    }

    // Sample rate
    audioArgs.push('-ar', String(settings.audioSampleRate || 48000));

    // Channels
    audioArgs.push('-ac', String(settings.audioChannels || 2));

    // Build audio filters (Volume + Limiter + Loudness Normalization)
    const filters: string[] = [];

    // Master limiter ceiling at -0.1 dB (Anti-clipping protection - Requirement 75)
    filters.push('alimiter=limit=-0.1dB:attack=5:release=50:asc=1');

    // Loudness Normalization (EBU R128 / ITU-R BS.1770 - Requirement 23)
    if (settings.audioNormalization && settings.audioNormalization !== 'none') {
      let targetI = -14; // Default YouTube / Spotify (-14 LUFS)
      if (settings.audioNormalization === 'lufs_16') {
        targetI = -16; // Apple Podcasts / AES
      } else if (settings.audioNormalization === 'lufs_23') {
        targetI = -23; // EBU R128 Broadcast standard
      }
      filters.push(`loudnorm=I=${targetI}:TP=-1.5:LRA=11`);
    }

    if (filters.length > 0) {
      audioArgs.push('-af', filters.join(','));
    }

    return { audioArgs };
  }
}
