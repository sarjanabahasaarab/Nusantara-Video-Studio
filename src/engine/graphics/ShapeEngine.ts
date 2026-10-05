/**
 * Nusantara Video Studio - Shape Graphics Engine
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Vector generation and SVG path math for:
 * Rectangle, Rounded Rectangle, Circle, Ellipse, Line, Arrow, and Triangle.
 */

import { ShapeProperties } from '../../types';

export class ShapeEngine {
  /**
   * Generates default properties for a given shape type
   */
  static getDefaultShapeProperties(shapeType: ShapeProperties['shapeType']): ShapeProperties {
    switch (shapeType) {
      case 'rectangle':
        return {
          shapeType: 'rectangle',
          fillColor: '#3b82f6',
          strokeColor: '#60a5fa',
          strokeWidth: 2,
          opacity: 1,
          width: 320,
          height: 180,
          cornerRadius: 0,
        };
      case 'rounded-rectangle':
        return {
          shapeType: 'rounded-rectangle',
          fillColor: '#6366f1',
          strokeColor: '#818cf8',
          strokeWidth: 2,
          opacity: 1,
          width: 320,
          height: 180,
          cornerRadius: 24,
        };
      case 'circle':
        return {
          shapeType: 'circle',
          fillColor: '#ec4899',
          strokeColor: '#f472b6',
          strokeWidth: 2,
          opacity: 1,
          width: 200,
          height: 200,
        };
      case 'ellipse':
        return {
          shapeType: 'ellipse',
          fillColor: '#8b5cf6',
          strokeColor: '#a78bfa',
          strokeWidth: 2,
          opacity: 1,
          width: 300,
          height: 160,
        };
      case 'line':
        return {
          shapeType: 'line',
          fillColor: 'transparent',
          strokeColor: '#facc15',
          strokeWidth: 4,
          opacity: 1,
          width: 300,
          height: 20,
        };
      case 'arrow':
        return {
          shapeType: 'arrow',
          fillColor: '#f59e0b',
          strokeColor: '#fbbf24',
          strokeWidth: 2,
          opacity: 1,
          width: 240,
          height: 80,
          arrowDirection: 'right',
        };
      case 'triangle':
        return {
          shapeType: 'triangle',
          fillColor: '#10b981',
          strokeColor: '#34d399',
          strokeWidth: 2,
          opacity: 1,
          width: 220,
          height: 200,
        };
    }
  }

  /**
   * Generates SVG path string for arrow
   */
  static getArrowPath(width: number, height: number, direction: 'left' | 'right' | 'up' | 'down' = 'right'): string {
    const w = width;
    const h = height;
    const headRatio = 0.4;
    const stemRatio = 0.35;

    if (direction === 'right') {
      const stemH = h * stemRatio;
      const stemTop = (h - stemH) / 2;
      const stemBottom = stemTop + stemH;
      const headX = w * (1 - headRatio);

      return `M 0 ${stemTop} L ${headX} ${stemTop} L ${headX} 0 L ${w} ${h / 2} L ${headX} ${h} L ${headX} ${stemBottom} L 0 ${stemBottom} Z`;
    } else if (direction === 'left') {
      const stemH = h * stemRatio;
      const stemTop = (h - stemH) / 2;
      const stemBottom = stemTop + stemH;
      const headX = w * headRatio;

      return `M ${w} ${stemTop} L ${headX} ${stemTop} L ${headX} 0 L 0 ${h / 2} L ${headX} ${h} L ${headX} ${stemBottom} L ${w} ${stemBottom} Z`;
    } else if (direction === 'down') {
      const stemW = w * stemRatio;
      const stemLeft = (w - stemW) / 2;
      const stemRight = stemLeft + stemW;
      const headY = h * (1 - headRatio);

      return `M ${stemLeft} 0 L ${stemRight} 0 L ${stemRight} ${headY} L ${w} ${headY} L ${w / 2} ${h} L 0 ${headY} L ${stemLeft} ${headY} Z`;
    } else {
      // up
      const stemW = w * stemRatio;
      const stemLeft = (w - stemW) / 2;
      const stemRight = stemLeft + stemW;
      const headY = h * headRatio;

      return `M ${stemLeft} ${h} L ${stemRight} ${h} L ${stemRight} ${headY} L ${w} ${headY} L ${w / 2} 0 L 0 ${headY} L ${stemLeft} ${headY} Z`;
    }
  }

  /**
   * Generates SVG path string for triangle (points up by default)
   */
  static getTrianglePath(width: number, height: number): string {
    return `M ${width / 2} 0 L ${width} ${height} L 0 ${height} Z`;
  }
}
