/**
 * Nusantara Video Studio - FFmpeg Command & Pipeline Adapter
 * Phase 9: Professional Rendering & Export Engine (Requirements 63, 64)
 *
 * Constructs injection-safe argument arrays, avoids string concatenation risks,
 * and coordinates video/audio/subtitle filtergraphs into single unified executions.
 */

import { RenderGraph, RenderSettings } from '../../types/render';
import { HardwareAccelerationManager } from '../HardwareAcceleration';
import { H264Adapter } from './H264Adapter';
import { H265Adapter } from './H265Adapter';
import { AV1Adapter } from './AV1Adapter';
import { ProResAdapter } from './ProResAdapter';
import { FrameRenderer } from '../FrameRenderer';
import { AudioRenderer } from '../AudioRenderer';

export class FFmpegAdapter {
  /**
   * Generates sanitized arguments array for FFmpeg process execution
   */
  public static async buildExecutionArgs(
    graph: RenderGraph,
    settings: RenderSettings
  ): Promise<{
    args: string[];
    profileName: string;
    isCpuFallback: boolean;
  }> {
    const args: string[] = ['-y']; // overwrite flag

    // Collect all input files
    const allClips = graph.videoTracks.flatMap((t) => t.clips);
    const audioClips = graph.audioTracks.flatMap((t) => t.clips);

    if (allClips.length === 0) {
      // Synthetic color test input
      args.push(
        '-f', 'lavfi',
        '-i', `color=c=black:s=${settings.width}x${settings.height}:r=${settings.fps}:d=${graph.durationSec}`,
        '-f', 'lavfi',
        '-i', `anullsrc=channel_layout=stereo:sample_rate=${settings.audioSampleRate || 48000}:d=${graph.durationSec}`
      );
    } else {
      for (const clip of allClips) {
        if (clip.sourceStart > 0) {
          args.push('-ss', clip.sourceStart.toFixed(3));
        }
        if (clip.duration > 0) {
          args.push('-t', clip.duration.toFixed(3));
        }
        args.push('-i', clip.sourcePath);
      }

      // Add extra audio inputs if distinct from video
      for (const aClip of audioClips) {
        if (!allClips.some((c) => c.sourcePath === aClip.sourcePath)) {
          if (aClip.sourceStart > 0) {
            args.push('-ss', aClip.sourceStart.toFixed(3));
          }
          args.push('-t', aClip.duration.toFixed(3));
          args.push('-i', aClip.sourcePath);
        }
      }
    }

    // Resolve hardware acceleration profile
    const profile = await HardwareAccelerationManager.resolveEncoderProfile(
      settings.hardwareAcceleration,
      settings.videoCodec
    );

    // Build video filtergraph if multiple inputs or effects exist
    if (allClips.length > 0) {
      const { filtergraph } = FrameRenderer.buildComplexVideoFilter(graph, settings);
      args.push('-filter_complex', filtergraph, '-map', '[v_out]');

      // Map audio from first input or dummy
      args.push('-map', '0:a?');
    }

    // Build video codec arguments
    let videoCodecArgs: string[] = [];
    switch (settings.videoCodec) {
      case 'h264':
        videoCodecArgs = H264Adapter.buildEncodingArgs(settings, profile);
        break;
      case 'h265':
        videoCodecArgs = H265Adapter.buildEncodingArgs(settings, profile);
        break;
      case 'av1':
        videoCodecArgs = AV1Adapter.buildEncodingArgs(settings, profile);
        break;
      case 'prores':
        videoCodecArgs = ProResAdapter.buildEncodingArgs(settings, profile);
        break;
      case 'vp9':
        videoCodecArgs = ['-c:v', 'libvpx-vp9', '-b:v', `${settings.targetBitrateMbps || 8}M`];
        if (settings.exportAlpha) {
          videoCodecArgs.push('-pix_fmt', 'yuva420p');
        }
        break;
      default:
        videoCodecArgs = H264Adapter.buildEncodingArgs(settings, profile);
    }
    args.push(...videoCodecArgs);

    // Build audio arguments
    const { audioArgs } = AudioRenderer.buildAudioEncodingArgs(graph, settings);
    args.push(...audioArgs);

    // Output duration restriction if In/Out range is set (Requirement 33)
    if (settings.rangeType === 'in_out' && settings.rangeOutSec !== undefined && settings.rangeInSec !== undefined) {
      const span = Math.max(0.1, settings.rangeOutSec - settings.rangeInSec);
      args.push('-t', span.toFixed(3));
    }

    // Destination placeholder
    args.push(settings.outputPath || 'output.mp4');

    return {
      args,
      profileName: profile.ffmpegEncoderName,
      isCpuFallback: profile.isFallbackCpu,
    };
  }

  /**
   * Generates FFmetadata formatted string for chapter markers (Requirement 65)
   */
  public static generateChapterMetadata(
    markers: Array<{ time: number; label: string; duration?: number }>,
    totalDurationSec = 10
  ): string {
    if (!markers || markers.length === 0) return '';
    const sorted = [...markers].sort((a, b) => a.time - b.time);
    const totalMs = Math.floor(totalDurationSec * 1000);

    let output = ';FFMETADATA1\n';
    for (let i = 0; i < sorted.length; i++) {
      const m = sorted[i];
      const startMs = Math.floor(m.time * 1000);
      let endMs = totalMs;
      if (m.duration && m.duration > 0) {
        endMs = Math.floor((m.time + m.duration) * 1000);
      } else if (i < sorted.length - 1) {
        endMs = Math.floor(sorted[i + 1].time * 1000);
      }
      output += `\n[CHAPTER]\nTIMEBASE=1/1000\nSTART=${startMs}\nEND=${endMs}\ntitle=${m.label || `Chapter ${i + 1}`}\n`;
    }
    return output;
  }
}
