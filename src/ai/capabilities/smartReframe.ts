/**
 * Nusantara Video Studio - Smart Reframe Capability
 * Phase 7: AI-Assisted Editing
 *
 * Implements intelligent aspect ratio conversion (16:9, 9:16, 1:1, 4:5).
 * Computes non-destructive scale magnification and crop pan offsets (X/Y)
 * to keep primary subjects (or rule-of-thirds visual weight) centered.
 */

import { SmartReframeResult, DetectedFace } from '../../types/ai';

export type AspectRatioPreset = '16:9' | '9:16' | '1:1' | '4:5';

export interface SmartReframeOptions {
  sourceWidth?: number; // default 1920
  sourceHeight?: number; // default 1080
  targetAspectRatio: AspectRatioPreset;
  detectedFaces?: DetectedFace[];
}

export class SmartReframeEngine {
  /**
   * Returns numeric aspect ratio value (width / height)
   */
  static getAspectRatioValue(preset: AspectRatioPreset): number {
    switch (preset) {
      case '16:9':
        return 16 / 9; // ~1.777
      case '9:16':
        return 9 / 16; // 0.5625
      case '1:1':
        return 1.0;
      case '4:5':
        return 4 / 5; // 0.8
    }
  }

  /**
   * Calculates crop parameters and pan offset
   */
  static calculateReframe(options: SmartReframeOptions): SmartReframeResult {
    const sourceW = options.sourceWidth || 1920;
    const sourceH = options.sourceHeight || 1080;
    const sourceRatio = sourceW / sourceH;

    const targetRatio = this.getAspectRatioValue(options.targetAspectRatio);

    let recommendedScale = 1.0;
    let cropPanX = 0; // -100% to +100%
    const cropPanY = 0;

    if (targetRatio < sourceRatio) {
      // Landscape to portrait or square: need to scale up to fill target height without black bars
      recommendedScale = Math.round((sourceRatio / targetRatio) * 100) / 100;
    } else if (targetRatio > sourceRatio) {
      // Portrait to landscape: scale up to fill target width
      recommendedScale = Math.round((targetRatio / sourceRatio) * 100) / 100;
    }

    // If face detection coordinates are available, shift cropPanX towards face centroid
    if (options.detectedFaces && options.detectedFaces.length > 0) {
      const primaryFace = options.detectedFaces[0];
      if (primaryFace.boundingBox) {
        const faceCenterX = primaryFace.boundingBox.x + primaryFace.boundingBox.width / 2;
        // faceCenterX is 0..1 (0.5 is dead center).
        // Convert to percentage offset: (faceCenterX - 0.5) * 100
        cropPanX = Math.round((faceCenterX - 0.5) * 100);
      }
    }

    return {
      sourceAspectRatio: `${sourceW}:${sourceH}`,
      targetAspectRatio: options.targetAspectRatio,
      recommendedScale,
      cropPanX,
      cropPanY,
    };
  }
}
