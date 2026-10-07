/**
 * Nusantara Video Studio - .cube LUT Parser & 3D Table Engine
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements standard Adobe .cube 1D and 3D Lookup Table parsing,
 * strict format validation, trilinear RGB interpolation, and intensity blending.
 */

import { LUTEffect, ParsedCubeLUT } from '../../types/color';

export interface LUTParseResult {
  valid: boolean;
  lut?: ParsedCubeLUT;
  error?: string;
}

export class LUTParser {
  /**
   * Parse raw .cube file text
   */
  static parseCubeText(text: string, titleHint = 'Imported LUT'): LUTParseResult {
    if (!text || text.trim().length === 0) {
      return { valid: false, error: 'File LUT kosong atau tidak memiliki data.' };
    }

    const lines = text.split(/\r?\n/);
    let title = titleHint;
    let size = 0;
    let dimension: 1 | 3 = 3;
    let domainMin: [number, number, number] = [0.0, 0.0, 0.0];
    let domainMax: [number, number, number] = [1.0, 1.0, 1.0];
    const dataValues: number[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;

      const upper = line.toUpperCase();

      if (upper.startsWith('TITLE')) {
        const match = line.match(/TITLE\s+"?([^"]+)"?/i);
        if (match && match[1]) title = match[1].trim();
        continue;
      }

      if (upper.startsWith('LUT_3D_SIZE')) {
        dimension = 3;
        const val = parseInt(line.split(/\s+/)[1], 10);
        if (isNaN(val) || val < 2 || val > 128) {
          return { valid: false, error: `Ukuran LUT_3D_SIZE tidak valid: ${val}. Harus antara 2 dan 128.` };
        }
        size = val;
        continue;
      }

      if (upper.startsWith('LUT_1D_SIZE')) {
        dimension = 1;
        const val = parseInt(line.split(/\s+/)[1], 10);
        if (isNaN(val) || val < 2) {
          return { valid: false, error: `Ukuran LUT_1D_SIZE tidak valid: ${val}.` };
        }
        size = val;
        continue;
      }

      if (upper.startsWith('DOMAIN_MIN')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          domainMin = [parts[0], parts[1], parts[2]];
        }
        continue;
      }

      if (upper.startsWith('DOMAIN_MAX')) {
        const parts = line.split(/\s+/).slice(1).map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          domainMax = [parts[0], parts[1], parts[2]];
        }
        continue;
      }

      // Numerical data line
      const parts = line.split(/\s+/).map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        dataValues.push(parts[0], parts[1], parts[2]);
      }
    }

    if (size === 0) {
      return {
        valid: false,
        error: 'File .cube tidak memiliki deklarasi LUT_3D_SIZE atau LUT_1D_SIZE yang valid.',
      };
    }

    const expectedPoints = dimension === 3 ? size * size * size : size;
    const actualPoints = dataValues.length / 3;

    if (actualPoints < expectedPoints) {
      return {
        valid: false,
        error: `Data .cube tidak lengkap. Ditemukan ${actualPoints} titik warna, dibutuhkan ${expectedPoints} titik.`,
      };
    }

    const floatData = new Float32Array(dataValues.slice(0, expectedPoints * 3));

    return {
      valid: true,
      lut: {
        title,
        size,
        dimension,
        domainMin,
        domainMax,
        data: floatData,
      },
    };
  }

  /**
   * Applies 3D LUT to an RGB color with trilinear interpolation and intensity blend
   */
  static apply3DLUT(
    r: number, // 0 to 1
    g: number, // 0 to 1
    b: number, // 0 to 1
    lut: ParsedCubeLUT,
    intensity = 1.0 // 0 to 1
  ): [number, number, number] {
    if (lut.dimension !== 3) {
      return [r, g, b];
    }

    const size = lut.size;
    const data = lut.data;

    // Rescale input from domain to [0, size - 1]
    const dMin = lut.domainMin;
    const dMax = lut.domainMax;

    const normR = Math.max(0, Math.min(1, (r - dMin[0]) / (dMax[0] - dMin[0] || 1)));
    const normG = Math.max(0, Math.min(1, (g - dMin[1]) / (dMax[1] - dMin[1] || 1)));
    const normB = Math.max(0, Math.min(1, (b - dMin[2]) / (dMax[2] - dMin[2] || 1)));

    const scaledR = normR * (size - 1);
    const scaledG = normG * (size - 1);
    const scaledB = normB * (size - 1);

    const r0 = Math.floor(scaledR);
    const g0 = Math.floor(scaledG);
    const b0 = Math.floor(scaledB);

    const r1 = Math.min(size - 1, r0 + 1);
    const g1 = Math.min(size - 1, g0 + 1);
    const b1 = Math.min(size - 1, b0 + 1);

    const fr = scaledR - r0;
    const fg = scaledG - g0;
    const fb = scaledB - b0;

    const getIdx = (ir: number, ig: number, ib: number) => (ib * size * size + ig * size + ir) * 3;

    const c000 = getIdx(r0, g0, b0);
    const c100 = getIdx(r1, g0, b0);
    const c010 = getIdx(r0, g1, b0);
    const c110 = getIdx(r1, g1, b0);
    const c001 = getIdx(r0, g0, b1);
    const c101 = getIdx(r1, g0, b1);
    const c011 = getIdx(r0, g1, b1);
    const c111 = getIdx(r1, g1, b1);

    let lutR = 0,
      lutG = 0,
      lutB = 0;

    for (let c = 0; c < 3; c++) {
      const v00 = data[c000 + c] * (1 - fr) + data[c100 + c] * fr;
      const v10 = data[c010 + c] * (1 - fr) + data[c110 + c] * fr;
      const v01 = data[c001 + c] * (1 - fr) + data[c101 + c] * fr;
      const v11 = data[c011 + c] * (1 - fr) + data[c111 + c] * fr;

      const v0 = v00 * (1 - fg) + v10 * fg;
      const v1 = v01 * (1 - fg) + v11 * fg;

      const val = v0 * (1 - fb) + v1 * fb;

      if (c === 0) lutR = val;
      else if (c === 1) lutG = val;
      else lutB = val;
    }

    // Blend with original using intensity
    const finalR = r * (1 - intensity) + lutR * intensity;
    const finalG = g * (1 - intensity) + lutG * intensity;
    const finalB = b * (1 - intensity) + lutB * intensity;

    return [Math.max(0, Math.min(1, finalR)), Math.max(0, Math.min(1, finalG)), Math.max(0, Math.min(1, finalB))];
  }

  /**
   * Applies LUT to entire ImageData buffer in-place
   */
  static applyLUTToImageData(imageData: ImageData, lut: ParsedCubeLUT, intensity = 1.0): void {
    const data = imageData.data;
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;

      const [outR, outG, outB] = this.apply3DLUT(r, g, b, lut, intensity);

      data[i] = Math.round(outR * 255);
      data[i + 1] = Math.round(outG * 255);
      data[i + 2] = Math.round(outB * 255);
    }
  }
}
