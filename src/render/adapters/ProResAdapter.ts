/**
 * Nusantara Video Studio - Apple ProRes Video Encoder Adapter
 * Phase 9: Professional Rendering & Export Engine (Requirement 10, 32)
 */

import { RenderSettings } from '../../types/render';
import { HardwareEncoderProfile } from '../HardwareAcceleration';

export class ProResAdapter {
  public static buildEncodingArgs(
    settings: RenderSettings,
    profile: HardwareEncoderProfile
  ): string[] {
    const args: string[] = ['-c:v', profile.ffmpegEncoderName];

    // ProRes Profiles:
    // 0: Proxy
    // 1: LT
    // 2: Standard 422
    // 3: HQ
    // 4: 4444 (Supports 12-bit alpha channel)
    // 5: 4444 XQ
    let proresProfile = '3'; // Default ProRes HQ
    if (settings.exportAlpha) {
      proresProfile = '4'; // ProRes 4444 with Alpha channel
    } else if (settings.qualityPreset === 'draft') {
      proresProfile = '0'; // Proxy
    } else if (settings.qualityPreset === 'standard') {
      proresProfile = '2'; // 422
    }

    args.push('-profile:v', proresProfile);

    if (settings.exportAlpha) {
      args.push('-pix_fmt', 'yuva444p10le');
    } else {
      args.push('-pix_fmt', 'yuv422p10le');
    }

    return args;
  }
}
