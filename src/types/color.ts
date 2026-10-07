/**
 * Nusantara Video Studio - Color Types
 * Phase 6: Professional Color & Audio Studio
 */

export interface ColorBasicCorrection {
  exposure: number; // -100 to 100 (0 default)
  contrast: number; // -100 to 100 (0 default)
  highlights: number; // -100 to 100 (0 default)
  shadows: number; // -100 to 100 (0 default)
  whites: number; // -100 to 100 (0 default)
  blacks: number; // -100 to 100 (0 default)
  saturation: number; // -100 to 100 (0 default)
  vibrance: number; // -100 to 100 (0 default)
  temperature: number; // -100 to 100 (warm/cool, 0 default)
  tint: number; // -100 to 100 (green/magenta, 0 default)
  sharpness: number; // 0 to 100 (0 default)
  clarity: number; // 0 to 100 (0 default)
}

export type HSLChannel = 'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'purple' | 'magenta';

export interface HSLChannelAdjustment {
  hue: number; // -180 to 180
  saturation: number; // -100 to 100
  lightness: number; // -100 to 100
}

export interface ColorHueCorrection {
  masterHueShift: number; // -180 to 180
  channels: Record<HSLChannel, HSLChannelAdjustment>;
}

export interface CurvePoint {
  x: number; // 0 to 255
  y: number; // 0 to 255
}

export interface ColorCurves {
  rgb: CurvePoint[];
  red: CurvePoint[];
  green: CurvePoint[];
  blue: CurvePoint[];
}

export interface ColorWheelSetting {
  hue: number; // 0 to 360 degrees
  saturation: number; // 0 to 100 %
  luminance: number; // -100 to 100 (Lift/Gamma/Gain luminance offset)
}

export interface ColorWheels {
  shadows: ColorWheelSetting; // Lift
  midtones: ColorWheelSetting; // Gamma
  highlights: ColorWheelSetting; // Gain
}

export interface LUTEffect {
  id: string;
  name: string;
  path: string;
  intensity: number; // 0 to 100 %
  enabled: boolean;
  cubeData?: ParsedCubeLUT;
}

export interface ParsedCubeLUT {
  title?: string;
  size: number; // e.g. 17, 33, 64
  dimension: 1 | 3;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  data: Float32Array; // RGB triplets flattened
}

export interface ColorVignette {
  amount: number; // -100 (darken) to 100 (brighten), 0 default
  size: number; // 0 to 100, default 50
  feather: number; // 0 to 100, default 50
  roundness: number; // -100 to 100, default 0
  position: { x: number; y: number }; // -50 to 50 center offset
}

export interface ColorMatchReference {
  referenceClipId?: string;
  targetClipId?: string;
  analyzedAt?: string;
  referenceAverages?: {
    luma: number;
    r: number;
    g: number;
    b: number;
  };
  applied: boolean;
}

export interface ClipColorGrading {
  enabled: boolean;
  basic: ColorBasicCorrection;
  hue: ColorHueCorrection;
  curves: ColorCurves;
  wheels: ColorWheels;
  lut?: LUTEffect;
  vignette: ColorVignette;
  match?: ColorMatchReference;
}

export type ScopeType = 'histogram' | 'waveform' | 'vectorscope' | 'parade';

export interface ScopeSettings {
  visible: boolean;
  activeScope: ScopeType;
  histogramMode: 'luma' | 'rgb' | 'separate';
  waveformMode: 'luma' | 'rgb';
  vectorscopeSkinLine: boolean;
  samplingRate: number; // 1 = full, 2 = half, 4 = quarter (for performance)
}

export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  settings: Partial<ClipColorGrading>;
}
