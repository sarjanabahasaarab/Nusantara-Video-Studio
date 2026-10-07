/**
 * Nusantara Video Studio - Unified Processing Graph & Hardware Acceleration
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements linear & branching processing graphs for video and audio pipelines,
 * plus device capability detection for WebGL / WebGPU / CPU fallback acceleration.
 */

import { ProcessingNode } from '../../types';

export interface DeviceCapabilities {
  webgl2: boolean;
  webgpu: boolean;
  hardwareAcceleration: boolean;
  maxTextureSize: number;
  cpuCores: number;
  sampleRate: number;
}

export class ProcessingGraph {
  /**
   * Builds the standard video processing graph sequence according to Requirement 39
   */
  static buildStandardVideoGraph(): ProcessingNode[] {
    return [
      { id: 'node-vid-src', type: 'source', enabled: true, parameters: {} },
      { id: 'node-vid-xfrm', type: 'transform', enabled: true, parameters: {} },
      { id: 'node-vid-cc', type: 'color-correction', enabled: true, parameters: {} },
      { id: 'node-vid-curves', type: 'curves', enabled: true, parameters: {} },
      { id: 'node-vid-lut', type: 'lut', enabled: true, parameters: {} },
      { id: 'node-vid-fx', type: 'effects', enabled: true, parameters: {} },
      { id: 'node-vid-mask', type: 'mask', enabled: true, parameters: {} },
      { id: 'node-vid-vignette', type: 'vignette', enabled: true, parameters: {} },
      { id: 'node-vid-out', type: 'output', enabled: true, parameters: {} },
    ];
  }

  /**
   * Builds the standard audio processing graph sequence according to Requirement 39
   */
  static buildStandardAudioGraph(): ProcessingNode[] {
    return [
      { id: 'node-aud-src', type: 'source', enabled: true, parameters: {} },
      { id: 'node-aud-gain', type: 'gain', enabled: true, parameters: {} },
      { id: 'node-aud-eq', type: 'eq', enabled: true, parameters: {} },
      { id: 'node-aud-comp', type: 'compressor', enabled: true, parameters: {} },
      { id: 'node-aud-nr', type: 'noise-reduction', enabled: false, parameters: {} },
      { id: 'node-aud-limiter', type: 'limiter', enabled: true, parameters: {} },
      { id: 'node-aud-master', type: 'master', enabled: true, parameters: {} },
    ];
  }

  /**
   * Detects device graphics & compute capabilities gracefully without throwing
   */
  static detectDeviceCapabilities(): DeviceCapabilities {
    let webgl2 = false;
    let maxTextureSize = 2048;

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      if (gl) {
        webgl2 = true;
        maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
      }
    } catch {
      webgl2 = false;
    }

    const webgpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    const cpuCores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;

    return {
      webgl2,
      webgpu,
      hardwareAcceleration: webgl2 || webgpu,
      maxTextureSize,
      cpuCores,
      sampleRate: 48000,
    };
  }
}
