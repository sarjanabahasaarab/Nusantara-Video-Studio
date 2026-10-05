/**
 * Nusantara Video Studio - Motion Tracking Engine
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Implements bounding box tracking, luminance centroid tracking across video frames,
 * trajectory coordinate caching, and attachment to text/overlay targets.
 */

import { MotionTrackingData, TrackingPoint } from '../../types';

export class MotionTrackingEngine {
  public static createTrackingSession(
    clipId: string,
    initialArea = { x: 0.4, y: 0.4, width: 0.2, height: 0.2 }
  ): MotionTrackingData {
    return {
      id: `track-${clipId}-${Date.now()}`,
      name: 'Point Tracker 1',
      status: 'idle',
      trackingArea: initialArea,
      points: [],
      method: 'centroid',
    };
  }

  /**
   * Tracks target center between two consecutive video frames using normalized luminance centroiding.
   */
  public static trackFrame(
    prevData: ImageData,
    currData: ImageData,
    currentArea: { x: number; y: number; width: number; height: number },
    time: number
  ): TrackingPoint {
    const w = currData.width;
    const h = currData.height;

    // Search window centered on current area
    const minX = Math.max(0, Math.floor((currentArea.x - 0.05) * w));
    const maxX = Math.min(w, Math.floor((currentArea.x + currentArea.width + 0.05) * w));
    const minY = Math.max(0, Math.floor((currentArea.y - 0.05) * h));
    const maxY = Math.min(h, Math.floor((currentArea.y + currentArea.height + 0.05) * h));

    let sumDiffX = 0;
    let sumDiffY = 0;
    let totalWeight = 0;

    const prev = prevData.data;
    const curr = currData.data;

    for (let y = minY; y < maxY; y += 2) {
      for (let x = minX; x < maxX; x += 2) {
        const idx = (y * w + x) * 4;
        const lumPrev = (prev[idx] + prev[idx + 1] + prev[idx + 2]) / 3;
        const lumCurr = (curr[idx] + curr[idx + 1] + curr[idx + 2]) / 3;
        const diff = Math.abs(lumCurr - lumPrev);

        if (diff > 12) {
          sumDiffX += x * diff;
          sumDiffY += y * diff;
          totalWeight += diff;
        }
      }
    }

    if (totalWeight > 50) {
      const centerX = (sumDiffX / totalWeight) / w;
      const centerY = (sumDiffY / totalWeight) / h;
      return {
        time,
        x: Math.max(0, Math.min(1, centerX)),
        y: Math.max(0, Math.min(1, centerY)),
        width: currentArea.width,
        height: currentArea.height,
        confidence: Math.min(1.0, totalWeight / 1500),
      };
    }

    // Steady state: maintain previous position
    return {
      time,
      x: currentArea.x + currentArea.width / 2,
      y: currentArea.y + currentArea.height / 2,
      width: currentArea.width,
      height: currentArea.height,
      confidence: 0.6,
    };
  }

  /**
   * Evaluates tracked coordinate at any given clip time using linear interpolation.
   */
  public static evaluateTrackingAtTime(
    trackingData: MotionTrackingData | undefined,
    time: number
  ): { x: number; y: number } | null {
    if (!trackingData || !trackingData.points || trackingData.points.length === 0) {
      return null;
    }

    const pts = trackingData.points;
    if (time <= pts[0].time) {
      return { x: pts[0].x, y: pts[0].y };
    }
    if (time >= pts[pts.length - 1].time) {
      const last = pts[pts.length - 1];
      return { x: last.x, y: last.y };
    }

    for (let i = 0; i < pts.length - 1; i++) {
      if (time >= pts[i].time && time <= pts[i + 1].time) {
        const t = (time - pts[i].time) / Math.max(0.001, pts[i + 1].time - pts[i].time);
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * t,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * t,
        };
      }
    }

    return null;
  }
}
