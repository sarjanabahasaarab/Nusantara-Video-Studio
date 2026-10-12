/**
 * Nusantara Video Studio - H.264 Video Encoder Adapter
 * Phase 9: Professional Rendering & Export Engine (Requirement 9)
 */

import { RenderSettings } from '../../types/render';
import { HardwareEncoderProfile } from '../HardwareAcceleration';

export class H264Adapter {
  public static buildEncodingArgs(
    settings: RenderSettings,
    profile: HardwareEncoderProfile
  ): string[] {
    const args: string[] = ['-c:v', profile.ffmpegEncoderName];

    // Hardware vs Software preset
    if (profile.isFallbackCpu) {
      args.push('-preset', 'medium');
      args.push('-profile:v', 'high');
      args.push('-level:v', '4.2');

      if (settings.bitrateMode === 'crf') {
        const crf = settings.crf || 22;
        args.push('-crf', String(crf));
      } else if (settings.bitrateMode === 'cbr') {
        const br = `${settings.targetBitrateMbps || 12}M`;
        args.push('-b:v', br, '-minrate', br, '-maxrate', br, '-bufsize', `${(settings.targetBitrateMbps || 12) * 2}M`);
      } else {
        // VBR / Auto
        const target = `${settings.targetBitrateMbps || 12}M`;
        const max = `${settings.maxBitrateMbps || 16}M`;
        args.push('-b:v', target, '-maxrate', max, '-bufsize', `${(settings.maxBitrateMbps || 16) * 1.5}M`);
      }
    } else {
      // GPU Encoder (NVENC, QSV, AMF)
      args.push('-preset', profile.presetParam);
      if (profile.ffmpegEncoderName.includes('nvenc')) {
        args.push('-rc', 'vbr', '-cq', String(settings.crf || 22));
      } else {
        args.push('-b:v', `${settings.targetBitrateMbps || 12}M`);
      }
    }

    // Always standard pixel format for wide playback support
    args.push('-pix_fmt', 'yuv420p');

    // MP4 faststart for web streaming
    if (settings.format === 'mp4') {
      args.push('-movflags', '+faststart');
    }

    return args;
  }
}
