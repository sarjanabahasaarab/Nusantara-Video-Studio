/**
 * Nusantara Video Studio - Hardware Acceleration Manager
 * Phase 9: Professional Rendering & Export Engine (Requirements 18, 19, 20)
 *
 * Handles detection, parameter selection, and graceful CPU fallback for
 * hardware acceleration (NVENC, AMF, QSV, Apple VideoToolbox).
 */

import { HardwareEncoderType, VideoCodec } from '../types/render';
import { RenderCapabilitiesService } from './RenderCapabilities';

export interface HardwareEncoderProfile {
  ffmpegEncoderName: string;
  presetParam: string;
  hardwareDeviceParam?: string[];
  isFallbackCpu: boolean;
  notes: string;
}

export class HardwareAccelerationManager {
  /**
   * Resolves appropriate FFmpeg encoder string and optimization arguments
   */
  public static async resolveEncoderProfile(
    requested: HardwareEncoderType,
    codec: VideoCodec
  ): Promise<HardwareEncoderProfile> {
    const caps = await RenderCapabilitiesService.getInstance().getCapabilities();
    const hw = caps.hardwareEncoders;

    // Default CPU fallbacks
    const cpuFallback = this.getCpuProfile(codec);

    if (requested === 'cpu') {
      return cpuFallback;
    }

    if (codec === 'h264') {
      if ((requested === 'auto' || requested === 'nvenc') && hw.nvenc) {
        return {
          ffmpegEncoderName: 'h264_nvenc',
          presetParam: 'p4', // medium NVENC preset
          isFallbackCpu: false,
          notes: 'NVIDIA NVENC Hardware Encoder aktif',
        };
      }
      if ((requested === 'auto' || requested === 'qsv') && hw.qsv) {
        return {
          ffmpegEncoderName: 'h264_qsv',
          presetParam: 'medium',
          isFallbackCpu: false,
          notes: 'Intel Quick Sync Video (QSV) aktif',
        };
      }
      if ((requested === 'auto' || requested === 'amf') && hw.amf) {
        return {
          ffmpegEncoderName: 'h264_amf',
          presetParam: 'balanced',
          isFallbackCpu: false,
          notes: 'AMD AMF Hardware Encoder aktif',
        };
      }
      if ((requested === 'auto' || requested === 'videotoolbox') && hw.videotoolbox) {
        return {
          ffmpegEncoderName: 'h264_videotoolbox',
          presetParam: 'auto',
          isFallbackCpu: false,
          notes: 'Apple VideoToolbox Hardware Encoder aktif',
        };
      }
    } else if (codec === 'h265') {
      if ((requested === 'auto' || requested === 'nvenc') && hw.nvenc) {
        return {
          ffmpegEncoderName: 'hevc_nvenc',
          presetParam: 'p4',
          isFallbackCpu: false,
          notes: 'NVIDIA HEVC NVENC aktif',
        };
      }
      if ((requested === 'auto' || requested === 'qsv') && hw.qsv) {
        return {
          ffmpegEncoderName: 'hevc_qsv',
          presetParam: 'medium',
          isFallbackCpu: false,
          notes: 'Intel QSV HEVC aktif',
        };
      }
      if ((requested === 'auto' || requested === 'amf') && hw.amf) {
        return {
          ffmpegEncoderName: 'hevc_amf',
          presetParam: 'balanced',
          isFallbackCpu: false,
          notes: 'AMD AMF HEVC aktif',
        };
      }
    }

    // Fallback to CPU when GPU encoder is unavailable
    return {
      ...cpuFallback,
      isFallbackCpu: true,
      notes: requested !== 'auto'
        ? `Hardware encoder ${requested.toUpperCase()} tidak tersedia. Beralih ke CPU software encoding.`
        : 'CPU software encoding aktif.',
    };
  }

  private static getCpuProfile(codec: VideoCodec): HardwareEncoderProfile {
    switch (codec) {
      case 'h264':
        return {
          ffmpegEncoderName: 'libx264',
          presetParam: 'medium',
          isFallbackCpu: true,
          notes: 'Software encoding libx264 (CPU)',
        };
      case 'h265':
        return {
          ffmpegEncoderName: 'libx265',
          presetParam: 'medium',
          isFallbackCpu: true,
          notes: 'Software encoding libx265 (CPU)',
        };
      case 'av1':
        return {
          ffmpegEncoderName: 'libaom-av1',
          presetParam: '6',
          isFallbackCpu: true,
          notes: 'Software encoding libaom-av1 (CPU)',
        };
      case 'prores':
        return {
          ffmpegEncoderName: 'prores_ks',
          presetParam: 'standard',
          isFallbackCpu: true,
          notes: 'Apple ProRes Software Encoder (CPU)',
        };
      case 'vp9':
        return {
          ffmpegEncoderName: 'libvpx-vp9',
          presetParam: 'good',
          isFallbackCpu: true,
          notes: 'Software encoding libvpx-vp9 (CPU)',
        };
      default:
        return {
          ffmpegEncoderName: 'libx264',
          presetParam: 'medium',
          isFallbackCpu: true,
          notes: 'Default libx264 (CPU)',
        };
    }
  }
}
