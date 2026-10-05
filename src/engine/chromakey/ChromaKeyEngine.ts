/**
 * Nusantara Video Studio - Chroma Key Engine
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Provides real-time green/blue screen segmentation, color tolerance thresholding,
 * spill suppression matrix computation, and non-destructive project persistence.
 */

import { ChromaKeySettings } from '../../types';

export class ChromaKeyEngine {
  public static getDefaultSettings(preset: 'green' | 'blue' | 'custom' = 'green'): ChromaKeySettings {
    const color = preset === 'green' ? '#00ff00' : preset === 'blue' ? '#0000ff' : '#00b140';
    return {
      enabled: false,
      color,
      tolerance: 45,
      similarity: 40,
      smoothness: 15,
      spillSuppression: 50,
      edgeFeather: 5,
      opacity: 100,
      preset,
    };
  }

  /**
   * Converts Hex string (e.g. #00ff00) to RGB components.
   */
  public static hexToRgb(hex: string): { r: number; g: number; b: number } {
    let clean = hex.replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  /**
   * Generates SVG FeColorMatrix values for live CSS preview transparency approximation.
   */
  public static getFeColorMatrix(settings: ChromaKeySettings): string {
    const { r, g, b } = this.hexToRgb(settings.color);
    const tol = Math.max(0.05, settings.tolerance / 100);

    // Normalize color channels
    const nr = r / 255;
    const ng = g / 255;
    const nb = b / 255;

    // Weight coefficients to isolate keying color
    return `
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      ${(-nr * tol).toFixed(2)} ${(-ng * tol).toFixed(2)} ${(-nb * tol).toFixed(2)} 1 0
    `.trim();
  }

  /**
   * Processes a video/image canvas frame with pixel-level Chroma Keying.
   * Runs in real-time on preview canvas or offline during export.
   */
  public static processImageData(
    imgData: ImageData,
    settings: ChromaKeySettings
  ): void {
    if (!settings.enabled) return;

    const data = imgData.data;
    const { r: kr, g: kg, b: kb } = this.hexToRgb(settings.color);
    const tolDist = (settings.tolerance / 100) * 255;
    const smoothDist = (settings.smoothness / 100) * 100;
    const spillFactor = settings.spillSuppression / 100;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Euclidean distance in RGB color space
      const dr = r - kr;
      const dg = g - kg;
      const db = b - kb;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);

      if (dist < tolDist) {
        // Full transparent key
        data[i + 3] = 0;
      } else if (dist < tolDist + smoothDist) {
        // Soft edge feathering transition
        const alphaFraction = (dist - tolDist) / Math.max(1, smoothDist);
        data[i + 3] = Math.round(data[i + 3] * alphaFraction);
      } else if (spillFactor > 0) {
        // Spill suppression: desaturate key color cast in semi-reflective foreground
        if (kg > kr && kg > kb) {
          // Green spill suppression: clamp green channel to max of red and blue
          const maxRB = Math.max(r, b);
          if (g > maxRB) {
            data[i + 1] = Math.round(g * (1 - spillFactor) + maxRB * spillFactor);
          }
        } else if (kb > kr && kb > kg) {
          // Blue spill suppression
          const maxRG = Math.max(r, g);
          if (b > maxRG) {
            data[i + 2] = Math.round(b * (1 - spillFactor) + maxRG * spillFactor);
          }
        }
      }
    }
  }
}
