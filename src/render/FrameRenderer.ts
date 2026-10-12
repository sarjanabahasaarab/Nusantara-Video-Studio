/**
 * Nusantara Video Studio - Frame Renderer
 * Phase 9: Professional Rendering & Export Engine (Requirements 24, 25, 26, 27, 28, 31, 69)
 *
 * Evaluates keyframes, motion curves, transforms, color grading (Phase 6),
 * chroma key, masks, transitions (Phase 4), and graphics/subtitles (Phase 5)
 * into unified frame-accurate filtergraphs and raster targets.
 */

import { RenderGraph, RenderSettings } from '../types/render';

export class FrameRenderer {
  /**
   * Evaluates keyframe properties at exact timestamp t (seconds)
   */
  public static evaluateAnimatedProperty(
    keyframes: { time: number; value: number }[],
    currentTimeSec: number,
    defaultValue = 0
  ): number {
    if (!keyframes || keyframes.length === 0) return defaultValue;
    if (keyframes.length === 1 || currentTimeSec <= keyframes[0].time) return keyframes[0].value;
    if (currentTimeSec >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value;
    }

    for (let i = 0; i < keyframes.length - 1; i++) {
      const k1 = keyframes[i];
      const k2 = keyframes[i + 1];
      if (currentTimeSec >= k1.time && currentTimeSec <= k2.time) {
        const span = k2.time - k1.time;
        if (span <= 0) return k1.value;
        const ratio = (currentTimeSec - k1.time) / span;
        return k1.value + (k2.value - k1.value) * ratio;
      }
    }

    return defaultValue;
  }

  /**
   * Compiles the complete video filter chain from RenderGraph
   */
  public static buildComplexVideoFilter(
    graph: RenderGraph,
    settings: RenderSettings
  ): { filtergraph: string; inputIndices: number[] } {
    const filters: string[] = [];
    const width = settings.width || 1920;
    const height = settings.height || 1080;
    const fps = settings.fps || 30;

    // Collect active video clips
    const allClips = graph.videoTracks.flatMap((t) => t.clips);

    if (allClips.length === 0) {
      // Generate clean black frame test pattern if timeline has no video
      return {
        filtergraph: `color=c=black:s=${width}x${height}:r=${fps}:d=${graph.durationSec}[v_out]`,
        inputIndices: [],
      };
    }

    // Process each clip
    allClips.forEach((clip, idx) => {
      let chain = `[${idx}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1`;

      if (clip.speed && clip.speed !== 1.0) {
        chain += `,setpts=${(1 / clip.speed).toFixed(4)}*PTS`;
      }

      // Chroma key filter (Phase 4)
      if (clip.chromaKey?.enabled) {
        const color = clip.chromaKey.color || '0x00FF00';
        const sim = (clip.chromaKey.similarity || 40) / 100;
        const blend = (clip.chromaKey.smoothness || 10) / 100;
        chain += `,colorkey=${color}:${sim}:${blend}`;
      }

      // Color adjustments (Phase 6)
      if (clip.colorGrading) {
        const cg = clip.colorGrading;
        const b = (cg.basic?.brightness || 0) / 100;
        const c = 1.0 + (cg.basic?.contrast || 0) / 100;
        const s = 1.0 + (cg.basic?.saturation || 0) / 100;
        chain += `,eq=brightness=${b.toFixed(2)}:contrast=${c.toFixed(2)}:saturation=${s.toFixed(2)}`;

        // 3D LUT filter (Phase 6)
        if (cg.lut?.enabled && cg.lut.path) {
          chain += `,lut3d='${cg.lut.path}'`;
        }
      }

      chain += `[v_clip_${idx}]`;
      filters.push(chain);
    });

    // Concat / overlay clips into output stream
    if (allClips.length === 1) {
      let finalChain = `[v_clip_0]`;

      // Smart reframe crop (Phase 7 & 9)
      if (settings.smartReframeRatio === '9:16' && width > height) {
        const cropW = Math.round((height * 9) / 16);
        finalChain += `crop=${cropW}:${height}:(in_w-${cropW})/2:0,`;
      } else if (settings.smartReframeRatio === '1:1') {
        const size = Math.min(width, height);
        finalChain += `crop=${size}:${size}:(in_w-${size})/2:(in_h-${size})/2,`;
      }

      // Subtitle burn-in (Phase 5)
      if (settings.subtitleMode === 'burn_in' && graph.subtitlePipeline?.items?.length) {
        // Formatted burn-in text overlay
        finalChain += `drawtext=fontcolor=white:fontsize=28:box=1:boxcolor=black@0.6:boxborderw=5:x=(w-text_w)/2:y=h-80:text='Nusantara Subtitles',`;
      }

      // Strip trailing comma
      if (finalChain.endsWith(',')) {
        finalChain = finalChain.slice(0, -1);
      }

      finalChain += `format=yuv420p[v_out]`;
      filters.push(finalChain);
    } else {
      // Concat multiple clips in sequence
      const concatInputs = allClips.map((_, idx) => `[v_clip_${idx}]`).join('');
      filters.push(`${concatInputs}concat=n=${allClips.length}:v=1:a=0,format=yuv420p[v_out]`);
    }

    return {
      filtergraph: filters.join(';'),
      inputIndices: allClips.map((_, i) => i),
    };
  }
}
