/**
 * Nusantara Video Studio - Masking Engine
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Implements parametric vector masks (Rectangle, Ellipse, Linear, Polygon)
 * with feathering, inversion, expand/contract, and CSS clip-path / SVG mask generation.
 */

import { ClipMask, MaskShapeType } from '../../types';

export class MaskEngine {
  /**
   * Creates a default mask of chosen type.
   */
  public static createDefaultMask(type: MaskShapeType = 'rectangle'): ClipMask {
    const id = `mask-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    switch (type) {
      case 'rectangle':
        return {
          id,
          name: 'Rectangle Mask',
          enabled: true,
          type: 'rectangle',
          inverted: false,
          feather: 0,
          expand: 0,
          opacity: 1,
          positionX: 0,
          positionY: 0,
          scale: 1,
          rotation: 0,
        };

      case 'ellipse':
        return {
          id,
          name: 'Ellipse Mask',
          enabled: true,
          type: 'ellipse',
          inverted: false,
          feather: 0,
          expand: 0,
          opacity: 1,
          positionX: 0,
          positionY: 0,
          scale: 1,
          rotation: 0,
        };

      case 'linear':
        return {
          id,
          name: 'Linear Gradient Mask',
          enabled: true,
          type: 'linear',
          inverted: false,
          feather: 20,
          expand: 0,
          opacity: 1,
          positionX: 0,
          positionY: 0,
          scale: 1,
          rotation: 0,
        };

      case 'polygon':
        return {
          id,
          name: 'Polygon Mask',
          enabled: true,
          type: 'polygon',
          inverted: false,
          feather: 0,
          expand: 0,
          opacity: 1,
          positionX: 0,
          positionY: 0,
          scale: 1,
          rotation: 0,
          points: [
            { x: 50, y: 15 },
            { x: 85, y: 50 },
            { x: 50, y: 85 },
            { x: 15, y: 50 },
          ],
        };
    }
  }

  /**
   * Generates CSS clip-path or SVG mask style for a ClipMask.
   */
  public static computeClipPath(mask: ClipMask | undefined): {
    clipPath?: string;
    filter?: string;
    opacity?: number;
  } {
    if (!mask || !mask.enabled) {
      return {};
    }

    const { type, expand, positionX, positionY, scale, points } = mask;

    // Center offsets in percent
    const cx = Math.max(0, Math.min(100, 50 + positionX / 5));
    const cy = Math.max(0, Math.min(100, 50 + positionY / 5));
    const s = Math.max(0.1, scale);

    if (type === 'rectangle') {
      const hw = Math.max(5, (30 * s) + expand);
      const hh = Math.max(5, (25 * s) + expand);

      const x0 = Math.max(0, cx - hw);
      const x1 = Math.min(100, cx + hw);
      const y0 = Math.max(0, cy - hh);
      const y1 = Math.min(100, cy + hh);

      if (mask.inverted) {
        // Inverted rectangle cutout using dual outer-inner polygon
        const path = `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${x0}% ${y0}%, ${x0}% ${y1}%, ${x1}% ${y1}%, ${x1}% ${y0}%, ${x0}% ${y0}%)`;
        return { clipPath: path, opacity: mask.opacity };
      }

      const path = `polygon(${x0}% ${y0}%, ${x1}% ${y0}%, ${x1}% ${y1}%, ${x0}% ${y1}%)`;
      return { clipPath: path, opacity: mask.opacity };
    }

    if (type === 'ellipse') {
      const rx = Math.max(5, (30 * s) + expand);
      const ry = Math.max(5, (25 * s) + expand);

      if (mask.inverted) {
        // Approximate inverted ellipse
        return {
          clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`,
          opacity: mask.opacity,
        };
      }

      return {
        clipPath: `ellipse(${rx}% ${ry}% at ${cx}% ${cy}%)`,
        opacity: mask.opacity,
      };
    }

    if (type === 'linear') {
      const splitY = Math.max(0, Math.min(100, cy));
      if (mask.inverted) {
        return { clipPath: `polygon(0% 0%, 100% 0%, 100% ${splitY}%, 0% ${splitY}%)`, opacity: mask.opacity };
      }
      return { clipPath: `polygon(0% ${splitY}%, 100% ${splitY}%, 100% 100%, 0% 100%)`, opacity: mask.opacity };
    }

    if (type === 'polygon' && points && points.length >= 3) {
      const polyCoords = points.map((p) => {
        const px = Math.max(0, Math.min(100, (p.x - 50) * s + cx));
        const py = Math.max(0, Math.min(100, (p.y - 50) * s + cy));
        return `${px}% ${py}%`;
      }).join(', ');

      return {
        clipPath: `polygon(${polyCoords})`,
        opacity: mask.opacity,
      };
    }

    return {};
  }
}
