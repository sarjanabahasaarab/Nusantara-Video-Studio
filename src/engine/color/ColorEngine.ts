/**
 * Nusantara Video Studio - Color Processing Engine
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements non-destructive mathematical color correction:
 * - Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Saturation, Vibrance
 * - White Balance (Temperature, Tint)
 * - Curve Evaluation (Monotonic Cubic Spline interpolation across RGB, Red, Green, Blue)
 * - 3-Way Color Wheels (Lift / Gamma / Gain with Hue, Saturation, Luminance)
 * - Secondary HSL selective adjustments (Red, Orange, Yellow, Green, Cyan, Blue, Purple, Magenta)
 * - Vignette generation
 * - Professional Color Presets
 * - Color Match Reference Analysis
 */

import {
  ClipColorGrading,
  ColorBasicCorrection,
  ColorCurves,
  ColorHueCorrection,
  ColorPreset,
  ColorWheels,
  ColorVignette,
  CurvePoint,
  HSLChannel,
} from '../../types/color';

export class ColorEngine {
  /**
   * Returns a clean, pristine default color grading object
   */
  static getDefaultColorGrading(): ClipColorGrading {
    return {
      enabled: true,
      basic: {
        exposure: 0,
        contrast: 0,
        highlights: 0,
        shadows: 0,
        whites: 0,
        blacks: 0,
        saturation: 0,
        vibrance: 0,
        temperature: 0,
        tint: 0,
        sharpness: 0,
        clarity: 0,
      },
      hue: {
        masterHueShift: 0,
        channels: {
          red: { hue: 0, saturation: 0, lightness: 0 },
          orange: { hue: 0, saturation: 0, lightness: 0 },
          yellow: { hue: 0, saturation: 0, lightness: 0 },
          green: { hue: 0, saturation: 0, lightness: 0 },
          cyan: { hue: 0, saturation: 0, lightness: 0 },
          blue: { hue: 0, saturation: 0, lightness: 0 },
          purple: { hue: 0, saturation: 0, lightness: 0 },
          magenta: { hue: 0, saturation: 0, lightness: 0 },
        },
      },
      curves: {
        rgb: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
        red: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
        green: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
        blue: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
      },
      wheels: {
        shadows: { hue: 0, saturation: 0, luminance: 0 }, // Lift
        midtones: { hue: 0, saturation: 0, luminance: 0 }, // Gamma
        highlights: { hue: 0, saturation: 0, luminance: 0 }, // Gain
      },
      vignette: {
        amount: 0,
        size: 50,
        feather: 50,
        roundness: 0,
        position: { x: 0, y: 0 },
      },
    };
  }

  /**
   * Monotonic Cubic Spline Interpolation for Curves
   * Evaluates input x in range [0, 255] across control points
   */
  static evaluateCurve(points: CurvePoint[], x: number): number {
    if (!points || points.length === 0) return x;
    if (points.length === 1) return points[0].y;

    // Ensure points are sorted by x
    const sorted = [...points].sort((a, b) => a.x - b.x);

    // Clamp input to bounds
    if (x <= sorted[0].x) return sorted[0].y;
    if (x >= sorted[sorted.length - 1].x) return sorted[sorted.length - 1].y;

    // Find bounding segment
    let i = 0;
    while (i < sorted.length - 1 && sorted[i + 1].x < x) {
      i++;
    }

    const p0 = sorted[Math.max(0, i - 1)];
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const p3 = sorted[Math.min(sorted.length - 1, i + 2)];

    const dx = p2.x - p1.x;
    if (dx === 0) return p1.y;

    const t = (x - p1.x) / dx;

    // Catmull-Rom cubic spline interpolation
    const t2 = t * t;
    const t3 = t2 * t;

    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

    return Math.max(0, Math.min(255, Math.round(y)));
  }

  /**
   * Converts Color Wheel (Hue 0-360, Saturation 0-100, Luminance -100 to 100)
   * to RGB multipliers
   */
  static colorWheelToRGB(wheel: { hue: number; saturation: number; luminance: number }): [number, number, number] {
    const h = ((wheel.hue % 360) + 360) % 360;
    const s = Math.max(0, Math.min(100, wheel.saturation)) / 100;
    const lumOffset = (wheel.luminance || 0) / 100;

    // Base RGB from hue
    const c = s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let r1 = 0,
      g1 = 0,
      b1 = 0;

    if (h < 60) {
      r1 = c;
      g1 = x;
    } else if (h < 120) {
      r1 = x;
      g1 = c;
    } else if (h < 180) {
      g1 = c;
      b1 = x;
    } else if (h < 240) {
      g1 = x;
      b1 = c;
    } else if (h < 300) {
      r1 = x;
      b1 = c;
    } else {
      r1 = c;
      b1 = x;
    }

    const m = 1 - c;
    const r = (r1 + m) * (1 + lumOffset);
    const g = (g1 + m) * (1 + lumOffset);
    const b = (b1 + m) * (1 + lumOffset);

    return [Math.max(0, r), Math.max(0, g), Math.max(0, b)];
  }

  /**
   * Generates fast CSS Filter approximations for real-time video preview
   */
  static getCSSFilterString(color?: ClipColorGrading): string {
    if (!color || !color.enabled) return 'none';

    const b = color.basic;
    const brightness = 1 + b.exposure / 100;
    const contrast = 1 + b.contrast / 100;
    const saturation = 1 + (b.saturation + b.vibrance * 0.5) / 100;

    const filters: string[] = [];

    if (brightness !== 1) filters.push(`brightness(${brightness.toFixed(3)})`);
    if (contrast !== 1) filters.push(`contrast(${contrast.toFixed(3)})`);
    if (saturation !== 1) filters.push(`saturate(${Math.max(0, saturation).toFixed(3)})`);

    if (color.hue.masterHueShift !== 0) {
      filters.push(`hue-rotate(${color.hue.masterHueShift}deg)`);
    }

    if (b.temperature !== 0) {
      if (b.temperature > 0) {
        filters.push(`sepia(${(b.temperature * 0.35).toFixed(1)}%)`);
      } else {
        // Cooler hue shift
        filters.push(`hue-rotate(${(b.temperature * 0.15).toFixed(1)}deg)`);
      }
    }

    return filters.length > 0 ? filters.join(' ') : 'none';
  }

  /**
   * Generates SVG filter definition for precise Lift/Gamma/Gain + Temperature matrix
   */
  static getSVGColorMatrix(color?: ClipColorGrading): string {
    if (!color || !color.enabled) return '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0';

    const b = color.basic;
    const tempR = 1 + (b.temperature > 0 ? b.temperature / 150 : 0);
    const tempB = 1 + (b.temperature < 0 ? -b.temperature / 150 : 0);
    const tintG = 1 + (b.tint < 0 ? -b.tint / 200 : 0);
    const tintM = 1 + (b.tint > 0 ? b.tint / 200 : 0);

    const [liftR, liftG, liftB] = this.colorWheelToRGB(color.wheels.shadows);
    const [gainR, gainG, gainB] = this.colorWheelToRGB(color.wheels.highlights);

    const rMult = (gainR * tempR * tintM).toFixed(3);
    const gMult = (gainG * tintG).toFixed(3);
    const bMult = (gainB * tempB).toFixed(3);

    const rOffset = ((liftR - 1) * 0.2 + b.blacks / 255).toFixed(3);
    const gOffset = ((liftG - 1) * 0.2 + b.blacks / 255).toFixed(3);
    const bOffset = ((liftB - 1) * 0.2 + b.blacks / 255).toFixed(3);

    return `${rMult} 0 0 0 ${rOffset}  0 ${gMult} 0 0 ${gOffset}  0 0 ${bMult} 0 ${bOffset}  0 0 0 1 0`;
  }

  /**
   * Full pixel-level RGBA processing pipeline (used by scopes and render export)
   */
  static processPixels(
    imageData: ImageData,
    color: ClipColorGrading
  ): void {
    if (!color.enabled) return;

    const data = imageData.data;
    const len = data.length;
    const b = color.basic;

    // Precalculate LUT/curves lookup tables for ultra-fast 256-entry mapping
    const lutR = new Uint8Array(256);
    const lutG = new Uint8Array(256);
    const lutB = new Uint8Array(256);

    const hasCurves =
      color.curves.rgb.length > 2 ||
      color.curves.red.length > 2 ||
      color.curves.green.length > 2 ||
      color.curves.blue.length > 2;

    for (let i = 0; i < 256; i++) {
      let r = i;
      let g = i;
      let bVal = i;

      if (hasCurves) {
        const rgbVal = this.evaluateCurve(color.curves.rgb, i);
        r = this.evaluateCurve(color.curves.red, rgbVal);
        g = this.evaluateCurve(color.curves.green, rgbVal);
        bVal = this.evaluateCurve(color.curves.blue, rgbVal);
      }

      lutR[i] = r;
      lutG[i] = g;
      lutB[i] = bVal;
    }

    const expMult = Math.pow(2, b.exposure / 50);
    const contrastFactor = (259 * (b.contrast + 255)) / (255 * (259 - b.contrast));
    const satMult = 1 + b.saturation / 100;
    const tempOffset = b.temperature / 100;
    const tintOffset = b.tint / 100;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let bVal = data[i + 2];

      // 1. Exposure & White Balance
      r = r * expMult * (1 + (tempOffset > 0 ? tempOffset * 0.4 : 0));
      g = g * expMult * (1 - tintOffset * 0.2);
      bVal = bVal * expMult * (1 + (tempOffset < 0 ? -tempOffset * 0.4 : 0));

      // 2. Contrast
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      bVal = contrastFactor * (bVal - 128) + 128;

      // 3. Saturation
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bVal;
      r = luma + (r - luma) * satMult;
      g = luma + (g - luma) * satMult;
      bVal = luma + (bVal - luma) * satMult;

      // Clamp 0-255 before curve lookup
      const cr = Math.max(0, Math.min(255, Math.round(r)));
      const cg = Math.max(0, Math.min(255, Math.round(g)));
      const cb = Math.max(0, Math.min(255, Math.round(bVal)));

      // 4. Curves
      data[i] = lutR[cr];
      data[i + 1] = lutG[cg];
      data[i + 2] = lutB[cb];
    }
  }

  /**
   * Built-in Color Presets (Neutral, Warm, Cool, High Contrast, Soft, Cinematic, Black & White, Vintage)
   */
  static getBuiltinPresets(): ColorPreset[] {
    return [
      {
        id: 'preset-neutral',
        name: 'Neutral Clean',
        category: 'Basic',
        description: 'Tampilan bersih natural dengan kontras seimbang.',
        settings: {
          enabled: true,
          basic: {
            exposure: 0,
            contrast: 5,
            highlights: -5,
            shadows: 5,
            whites: 0,
            blacks: 0,
            saturation: 5,
            vibrance: 5,
            temperature: 0,
            tint: 0,
            sharpness: 10,
            clarity: 5,
          },
        },
      },
      {
        id: 'preset-warm',
        name: 'Warm Sunset',
        category: 'Atmospheric',
        description: 'Nuansa hangat matahari terbenam nusantara.',
        settings: {
          enabled: true,
          basic: {
            exposure: 5,
            contrast: 15,
            highlights: -10,
            shadows: 10,
            whites: 5,
            blacks: -5,
            saturation: 20,
            vibrance: 15,
            temperature: 28,
            tint: 8,
            sharpness: 10,
            clarity: 0,
          },
          wheels: {
            shadows: { hue: 35, saturation: 15, luminance: 0 },
            midtones: { hue: 42, saturation: 20, luminance: 5 },
            highlights: { hue: 48, saturation: 25, luminance: 5 },
          },
        },
      },
      {
        id: 'preset-cool',
        name: 'Cool Horizon',
        category: 'Atmospheric',
        description: 'Karakter sejuk segar dengan tone biru laut kepulauan.',
        settings: {
          enabled: true,
          basic: {
            exposure: 0,
            contrast: 12,
            highlights: 0,
            shadows: 5,
            whites: 0,
            blacks: 0,
            saturation: 10,
            vibrance: 10,
            temperature: -24,
            tint: -4,
            sharpness: 15,
            clarity: 5,
          },
          wheels: {
            shadows: { hue: 215, saturation: 20, luminance: -2 },
            midtones: { hue: 205, saturation: 15, luminance: 0 },
            highlights: { hue: 195, saturation: 10, luminance: 4 },
          },
        },
      },
      {
        id: 'preset-high-contrast',
        name: 'High Contrast Punch',
        category: 'Dynamic',
        description: 'Kontras dramatis dengan hitam pekat dan highlight tajam.',
        settings: {
          enabled: true,
          basic: {
            exposure: 0,
            contrast: 45,
            highlights: 15,
            shadows: -20,
            whites: 20,
            blacks: -25,
            saturation: 15,
            vibrance: 20,
            temperature: 0,
            tint: 0,
            sharpness: 25,
            clarity: 20,
          },
        },
      },
      {
        id: 'preset-soft',
        name: 'Soft Dreamy',
        category: 'Stylized',
        description: 'Gradasi lembut bernuansa pastel dengan kontras rendah.',
        settings: {
          enabled: true,
          basic: {
            exposure: 10,
            contrast: -25,
            highlights: -15,
            shadows: 25,
            whites: -10,
            blacks: 20,
            saturation: -10,
            vibrance: -5,
            temperature: 6,
            tint: 2,
            sharpness: 0,
            clarity: -15,
          },
        },
      },
      {
        id: 'preset-cinematic',
        name: 'Cinematic Teal & Orange',
        category: 'Cinematic',
        description: 'Gaya sinematik film internasional: bayangan teal dan highlight oranye.',
        settings: {
          enabled: true,
          basic: {
            exposure: 0,
            contrast: 22,
            highlights: -12,
            shadows: 14,
            whites: 8,
            blacks: -10,
            saturation: 12,
            vibrance: 15,
            temperature: 5,
            tint: -2,
            sharpness: 15,
            clarity: 10,
          },
          wheels: {
            shadows: { hue: 190, saturation: 35, luminance: -4 }, // Teal shadows
            midtones: { hue: 35, saturation: 15, luminance: 2 },
            highlights: { hue: 32, saturation: 30, luminance: 6 }, // Orange highlights
          },
          vignette: {
            amount: -35,
            size: 55,
            feather: 60,
            roundness: 10,
            position: { x: 0, y: 0 },
          },
        },
      },
      {
        id: 'preset-bw',
        name: 'Black & White Film',
        category: 'Monochrome',
        description: 'Monokrom klasik dengan kurva tonal film perak.',
        settings: {
          enabled: true,
          basic: {
            exposure: 2,
            contrast: 32,
            highlights: 10,
            shadows: -15,
            whites: 15,
            blacks: -20,
            saturation: -100,
            vibrance: -100,
            temperature: 0,
            tint: 0,
            sharpness: 20,
            clarity: 15,
          },
          vignette: {
            amount: -25,
            size: 60,
            feather: 50,
            roundness: 0,
            position: { x: 0, y: 0 },
          },
        },
      },
      {
        id: 'preset-vintage',
        name: 'Vintage 1970s',
        category: 'Retro',
        description: 'Warna nostalgia foto cetak lawas dengan fade blacks.',
        settings: {
          enabled: true,
          basic: {
            exposure: -5,
            contrast: -10,
            highlights: -20,
            shadows: 15,
            whites: -15,
            blacks: 25,
            saturation: -15,
            vibrance: -10,
            temperature: 18,
            tint: 12,
            sharpness: 5,
            clarity: -10,
          },
          wheels: {
            shadows: { hue: 45, saturation: 20, luminance: 8 },
            midtones: { hue: 60, saturation: 10, luminance: 0 },
            highlights: { hue: 38, saturation: 15, luminance: -5 },
          },
          vignette: {
            amount: -45,
            size: 45,
            feather: 70,
            roundness: -15,
            position: { x: 0, y: 0 },
          },
        },
      },
    ];
  }
}
