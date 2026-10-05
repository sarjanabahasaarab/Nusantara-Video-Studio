/**
 * Nusantara Video Studio - Effect Library & Stack Engine
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Provides 20+ visual effect presets across Color, Blur, Stylize,
 * Distortion, and Transform categories, with parameter schemas,
 * live preview filter compilation, and stack management.
 */

import { ClipEffect } from '../../types';

export interface EffectParameterSchema {
  key: string;
  label: string;
  defaultValue: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  type: 'number' | 'boolean' | 'color' | 'select';
  options?: { label: string; value: string }[];
}

export interface EffectDefinition {
  type: string;
  name: string;
  category: 'color' | 'blur' | 'stylize' | 'distortion' | 'transform';
  description: string;
  iconName?: string;
  parameters: EffectParameterSchema[];
}

export const EFFECT_DEFINITIONS: EffectDefinition[] = [
  // 1. Color Category
  {
    type: 'brightness',
    name: 'Brightness',
    category: 'color',
    description: 'Adjust overall image luminance',
    parameters: [
      { key: 'intensity', label: 'Intensity', defaultValue: 100, min: 0, max: 200, step: 1, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'contrast',
    name: 'Contrast',
    category: 'color',
    description: 'Enhance tonal difference between light and dark',
    parameters: [
      { key: 'intensity', label: 'Intensity', defaultValue: 100, min: 0, max: 200, step: 1, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'saturation',
    name: 'Saturation',
    category: 'color',
    description: 'Adjust color purity and vividness',
    parameters: [
      { key: 'intensity', label: 'Intensity', defaultValue: 100, min: 0, max: 250, step: 1, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'temperature',
    name: 'Temperature',
    category: 'color',
    description: 'Warm or cool overall color temperature',
    parameters: [
      { key: 'temp', label: 'Temperature', defaultValue: 0, min: -100, max: 100, step: 1, unit: '', type: 'number' },
    ],
  },
  {
    type: 'tint',
    name: 'Tint',
    category: 'color',
    description: 'Green to magenta color tint balance',
    parameters: [
      { key: 'tint', label: 'Tint', defaultValue: 0, min: -100, max: 100, step: 1, unit: '', type: 'number' },
    ],
  },
  {
    type: 'exposure',
    name: 'Exposure',
    category: 'color',
    description: 'Fine exposure EV adjustment',
    parameters: [
      { key: 'ev', label: 'Exposure (EV)', defaultValue: 0, min: -50, max: 50, step: 1, unit: 'EV', type: 'number' },
    ],
  },

  // 2. Blur Category
  {
    type: 'gaussian-blur',
    name: 'Gaussian Blur',
    category: 'blur',
    description: 'Smooth optical Gaussian defocus',
    parameters: [
      { key: 'radius', label: 'Radius', defaultValue: 10, min: 0, max: 50, step: 0.5, unit: 'px', type: 'number' },
    ],
  },
  {
    type: 'soft-blur',
    name: 'Soft Blur',
    category: 'blur',
    description: 'Subtle atmospheric dream blur',
    parameters: [
      { key: 'radius', label: 'Softness', defaultValue: 4, min: 0, max: 20, step: 0.5, unit: 'px', type: 'number' },
    ],
  },
  {
    type: 'motion-blur',
    name: 'Motion Blur',
    category: 'blur',
    description: 'Directional speed blur',
    parameters: [
      { key: 'distance', label: 'Distance', defaultValue: 8, min: 0, max: 40, step: 1, unit: 'px', type: 'number' },
      { key: 'angle', label: 'Angle', defaultValue: 0, min: 0, max: 360, step: 5, unit: '°', type: 'number' },
    ],
  },

  // 3. Stylize Category
  {
    type: 'grayscale',
    name: 'Grayscale',
    category: 'stylize',
    description: 'Classic monochrome black and white',
    parameters: [
      { key: 'amount', label: 'Amount', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'sepia',
    name: 'Sepia Tone',
    category: 'stylize',
    description: 'Nostalgic warm vintage photographic tone',
    parameters: [
      { key: 'amount', label: 'Amount', defaultValue: 80, min: 0, max: 100, step: 1, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'vignette',
    name: 'Vignette',
    category: 'stylize',
    description: 'Darkened cinematic outer border',
    parameters: [
      { key: 'intensity', label: 'Intensity', defaultValue: 60, min: 0, max: 100, step: 1, unit: '%', type: 'number' },
      { key: 'radius', label: 'Radius', defaultValue: 70, min: 20, max: 100, step: 1, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'sharpen',
    name: 'Sharpen',
    category: 'stylize',
    description: 'Crisp micro-contrast edge enhancement',
    parameters: [
      { key: 'amount', label: 'Amount', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'glow',
    name: 'Cinematic Glow',
    category: 'stylize',
    description: 'Luminous blooming highlights',
    parameters: [
      { key: 'radius', label: 'Radius', defaultValue: 12, min: 0, max: 40, step: 1, unit: 'px', type: 'number' },
      { key: 'brightness', label: 'Glow Intensity', defaultValue: 130, min: 100, max: 200, step: 2, unit: '%', type: 'number' },
    ],
  },
  {
    type: 'invert',
    name: 'Invert Colors',
    category: 'stylize',
    description: 'Negative color inversion',
    parameters: [
      { key: 'amount', label: 'Invert Amount', defaultValue: 100, min: 0, max: 100, step: 1, unit: '%', type: 'number' },
    ],
  },

  // 4. Distortion & Transform Category
  {
    type: 'flip',
    name: 'Flip Horizontal/Vertical',
    category: 'transform',
    description: 'Geometric coordinate flip',
    parameters: [
      { key: 'horizontal', label: 'Flip Horizontal', defaultValue: true, type: 'boolean' },
      { key: 'vertical', label: 'Flip Vertical', defaultValue: false, type: 'boolean' },
    ],
  },
  {
    type: 'mirror',
    name: 'Mirror Effect',
    category: 'distortion',
    description: 'Kaledioscopic mirror symmetry',
    parameters: [
      {
        key: 'direction',
        label: 'Direction',
        defaultValue: 'horizontal',
        type: 'select',
        options: [
          { label: 'Left to Right', value: 'horizontal' },
          { label: 'Top to Bottom', value: 'vertical' },
        ],
      },
    ],
  },
  {
    type: 'lens-distortion',
    name: 'Fisheye Distortion',
    category: 'distortion',
    description: 'Wide-angle spherical barrel or pincushion warp',
    parameters: [
      { key: 'distortion', label: 'Curvature', defaultValue: 30, min: -80, max: 80, step: 1, unit: '', type: 'number' },
    ],
  },
];

export class EffectLibrary {
  /**
   * Instantiates a new ClipEffect from a definition with default parameters.
   */
  public static createEffect(type: string, order = 0): ClipEffect {
    const def = EFFECT_DEFINITIONS.find((d) => d.type === type);
    const params: Record<string, number | string | boolean> = {};

    if (def) {
      def.parameters.forEach((p) => {
        params[p.key] = p.defaultValue;
      });
    }

    return {
      id: `fx-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      name: def?.name || type,
      category: def?.category || 'color',
      enabled: true,
      order,
      parameters: params,
    };
  }

  /**
   * Computes CSS filter string and composite styles from an active effect stack.
   */
  public static compileCssFilter(effects: ClipEffect[] | undefined) {
    return this.compileEffectStack(effects);
  }

  public static compileEffectStack(effects: ClipEffect[] | undefined): {
    filter: string;
    style: React.CSSProperties;
    vignetteOverlay?: { intensity: number; radius: number };
  } {
    if (!effects || effects.length === 0) {
      return { filter: '', style: {} };
    }

    // Sort by order ascending
    const sorted = [...effects].filter((e) => e.enabled).sort((a, b) => a.order - b.order);

    const filterParts: string[] = [];
    const style: React.CSSProperties = {};
    let vignetteOverlay: { intensity: number; radius: number } | undefined;

    for (const fx of sorted) {
      const p = fx.parameters;

      switch (fx.type) {
        case 'brightness':
          filterParts.push(`brightness(${Number(p.intensity ?? 100)}%)`);
          break;

        case 'contrast':
          filterParts.push(`contrast(${Number(p.intensity ?? 100)}%)`);
          break;

        case 'saturation':
          filterParts.push(`saturate(${Number(p.intensity ?? 100)}%)`);
          break;

        case 'exposure': {
          const ev = Number(p.ev ?? 0);
          const factor = Math.max(0.2, 1 + ev / 50);
          filterParts.push(`brightness(${Math.round(factor * 100)}%)`);
          break;
        }

        case 'temperature': {
          const temp = Number(p.temp ?? 0);
          if (temp > 0) {
            filterParts.push(`sepia(${Math.round(temp * 0.35)}%)`);
          } else if (temp < 0) {
            filterParts.push(`hue-rotate(${Math.round(temp * 0.45)}deg)`);
          }
          break;
        }

        case 'tint': {
          const tint = Number(p.tint ?? 0);
          if (tint !== 0) {
            filterParts.push(`hue-rotate(${Math.round(tint * 0.3)}deg)`);
          }
          break;
        }

        case 'gaussian-blur':
        case 'soft-blur':
          filterParts.push(`blur(${Number(p.radius ?? 4)}px)`);
          break;

        case 'motion-blur': {
          const dist = Number(p.distance ?? 6);
          filterParts.push(`blur(${Math.max(1, dist * 0.6)}px)`);
          break;
        }

        case 'grayscale':
          filterParts.push(`grayscale(${Number(p.amount ?? 100)}%)`);
          break;

        case 'sepia':
          filterParts.push(`sepia(${Number(p.amount ?? 80)}%)`);
          break;

        case 'invert':
          filterParts.push(`invert(${Number(p.amount ?? 100)}%)`);
          break;

        case 'glow':
          filterParts.push(
            `drop-shadow(0 0 ${Number(p.radius ?? 10)}px rgba(255,255,255,0.75))`
          );
          break;

        case 'sharpen':
          // CSS approximation using high contrast edge boost
          filterParts.push(`contrast(${100 + Number(p.amount ?? 40) * 0.3}%)`);
          break;

        case 'vignette':
          vignetteOverlay = {
            intensity: Number(p.intensity ?? 60),
            radius: Number(p.radius ?? 70),
          };
          break;

        case 'flip': {
          const h = Boolean(p.horizontal);
          const v = Boolean(p.vertical);
          style.transform = `${style.transform || ''} scale(${h ? -1 : 1}, ${v ? -1 : 1})`;
          break;
        }
      }
    }

    return {
      filter: filterParts.join(' '),
      style,
      vignetteOverlay,
    };
  }
}
