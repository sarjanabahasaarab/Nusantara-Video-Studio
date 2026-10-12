/**
 * Nusantara Video Studio - H.265 / HEVC Video Encoder Adapter
 * Phase 9: Professional Rendering & Export Engine (Requirement 9)
 */

import { RenderSettings } from '../../types/render';
import { HardwareEncoderProfile } from '../HardwareAcceleration';

export class H265Adapter {
  public static buildEncodingArgs(
    settings: RenderSettings,
    profile: HardwareEncoderProfile
  ): string[] {
    const args: string[] = ['-c:v', profile.ffmpegEncoderName];

    if (profile.isFallbackCpu) {
      args.push('-preset', 'medium');
      if (settings.bitrateMode === 'crf') {
        const crf = settings.crf || 24;
        args.push('-crf', String(crf));
      } else {
        const target = `${settings.targetBitrateMbps || 8}M`;
        const max = `${settings.maxBitrateMbps || 12}M`;
        args.push('-b:v', target, '-maxrate', max, '-bufsize', `${(settings.maxBitrateMbps || 12) * 1.5}M`);
      }
    } else {
      args.push('-preset', profile.presetParam);
      args.push('-b:v', `${settings.targetBitrateMbps || 8}M`);
    }

    // Set tag to hvc1 for native QuickTime / iOS playback compatibility
    args.push('-tag:v', 'hvc1');
    args.push('-pix_fmt', 'yuv420p');

    if (settings.format === 'mp4') {
      args.push('-movflags', '+faststart');
    }

    return args;
  }
}
