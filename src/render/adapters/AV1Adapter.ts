/**
 * Nusantara Video Studio - AV1 Video Encoder Adapter
 * Phase 9: Professional Rendering & Export Engine (Requirement 9, 11)
 */

import { RenderSettings } from '../../types/render';
import { HardwareEncoderProfile } from '../HardwareAcceleration';

export class AV1Adapter {
  public static buildEncodingArgs(
    settings: RenderSettings,
    profile: HardwareEncoderProfile
  ): string[] {
    const args: string[] = ['-c:v', profile.ffmpegEncoderName];

    // Speed / quality trade-off for libaom-av1 (cpu-used 4-8 is practical)
    args.push('-cpu-used', '6');

    if (settings.bitrateMode === 'crf') {
      const crf = settings.crf || 28;
      args.push('-crf', String(crf), '-b:v', '0');
    } else {
      const target = `${settings.targetBitrateMbps || 6}M`;
      args.push('-b:v', target);
    }

    args.push('-pix_fmt', 'yuv420p');

    if (settings.format === 'mp4') {
      args.push('-movflags', '+faststart');
    }

    return args;
  }
}
