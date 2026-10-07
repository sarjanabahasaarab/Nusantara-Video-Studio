/**
 * Nusantara Video Studio - Real-Time Video Scope Engine
 * Phase 6: Professional Color & Audio Studio
 *
 * Computes authentic signal scopes directly from preview pixel data:
 * - Real 256-bin Histogram (Luminance, Red, Green, Blue)
 * - Real Column Waveform (Luma & RGB waveform trace)
 * - Real Vectorscope (Cb / Cr chrominance scatter plot with I/Q skin-tone guide line)
 * - Optimized with configurable downsampling for smooth 60fps performance without UI blocking.
 */

export interface HistogramData {
  luma: Uint32Array; // 256 bins
  red: Uint32Array;
  green: Uint32Array;
  blue: Uint32Array;
  maxCount: number;
}

export interface WaveformData {
  width: number;
  height: number; // 256 intensity levels
  // 2D density grid: grid[column * 256 + value]
  lumaDensity: Uint16Array;
  redDensity: Uint16Array;
  greenDensity: Uint16Array;
  blueDensity: Uint16Array;
  maxDensity: number;
}

export interface VectorscopePoint {
  x: number; // -128 to 127
  y: number; // -128 to 127
  weight: number;
}

export interface VectorscopeData {
  scatterGrid: Uint16Array; // 256x256 grid
  maxIntensity: number;
}

export class ScopeEngine {
  /**
   * Computes accurate 256-bin Histogram from pixel buffer
   */
  static computeHistogram(imageData: ImageData, step = 2): HistogramData {
    const luma = new Uint32Array(256);
    const red = new Uint32Array(256);
    const green = new Uint32Array(256);
    const blue = new Uint32Array(256);
    const data = imageData.data;
    const len = data.length;

    let maxCount = 0;

    for (let i = 0; i < len; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // ITU-R BT.709 Luminance
      const y = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

      red[r]++;
      green[g]++;
      blue[b]++;
      luma[y]++;

      if (luma[y] > maxCount) maxCount = luma[y];
      if (red[r] > maxCount) maxCount = red[r];
      if (green[g] > maxCount) maxCount = green[g];
      if (blue[b] > maxCount) maxCount = blue[b];
    }

    return { luma, red, green, blue, maxCount: Math.max(1, maxCount) };
  }

  /**
   * Computes column-by-column Waveform monitor data
   */
  static computeWaveform(imageData: ImageData, targetWidth = 256): WaveformData {
    const width = targetWidth;
    const height = 256;
    const totalCells = width * height;

    const lumaDensity = new Uint16Array(totalCells);
    const redDensity = new Uint16Array(totalCells);
    const greenDensity = new Uint16Array(totalCells);
    const blueDensity = new Uint16Array(totalCells);

    const data = imageData.data;
    const imgW = imageData.width;
    const imgH = imageData.height;

    let maxDensity = 0;
    const scaleX = width / imgW;

    // Sample across grid
    const stepY = Math.max(1, Math.floor(imgH / 120));
    const stepX = Math.max(1, Math.floor(imgW / targetWidth));

    for (let py = 0; py < imgH; py += stepY) {
      for (let px = 0; px < imgW; px += stepX) {
        const i = (py * imgW + px) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const y = Math.max(0, Math.min(255, Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)));

        const col = Math.min(width - 1, Math.floor(px * scaleX));

        const yInverted = 255 - y;
        const rInverted = 255 - r;
        const gInverted = 255 - g;
        const bInverted = 255 - bVal(b);

        const idxY = col * height + yInverted;
        const idxR = col * height + rInverted;
        const idxG = col * height + gInverted;
        const idxB = col * height + bInverted;

        lumaDensity[idxY]++;
        redDensity[idxR]++;
        greenDensity[idxG]++;
        blueDensity[idxB]++;

        if (lumaDensity[idxY] > maxDensity) maxDensity = lumaDensity[idxY];
      }
    }

    function bVal(b: number) {
      return b;
    }

    return {
      width,
      height,
      lumaDensity,
      redDensity,
      greenDensity,
      blueDensity,
      maxDensity: Math.max(1, maxDensity),
    };
  }

  /**
   * Computes Cb / Cr Chrominance Vectorscope data
   * Center at (128, 128), X is Cb (B-Y), Y is Cr (R-Y)
   */
  static computeVectorscope(imageData: ImageData, step = 3): VectorscopeData {
    const scatterGrid = new Uint16Array(256 * 256);
    const data = imageData.data;
    const len = data.length;
    let maxIntensity = 0;

    for (let i = 0; i < len; i += 4 * step) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Convert RGB to YCbCr (ITU-R BT.601 / 709 normalized to 0-255)
      // Cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128
      // Cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128
      const cb = Math.max(0, Math.min(255, Math.round(-0.169 * r - 0.331 * g + 0.5 * b + 128)));
      const cr = Math.max(0, Math.min(255, Math.round(0.5 * r - 0.419 * g - 0.081 * b + 128)));

      // Invert Y so Cr (Red) is upwards
      const gridY = 255 - cr;
      const gridX = cb;

      const idx = gridY * 256 + gridX;
      scatterGrid[idx]++;

      if (scatterGrid[idx] > maxIntensity) {
        maxIntensity = scatterGrid[idx];
      }
    }

    return {
      scatterGrid,
      maxIntensity: Math.max(1, maxIntensity),
    };
  }
}
