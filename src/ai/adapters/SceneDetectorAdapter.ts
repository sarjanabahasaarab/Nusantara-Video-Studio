/**
 * Nusantara Video Studio - Scene Detector Adapter
 * Phase 7: AI-Assisted Editing
 *
 * Implements real frame-difference visual sampling using HTMLVideoElement and Canvas 2D.
 * Seeks through video intervals, computes luminance deltas, captures actual scene thumbnails,
 * and outputs precise cut boundaries.
 */

import { Scene } from '../../types/ai';
import { SceneDetector, SceneDetectionOptions } from '../capabilities/sceneDetection';

export class SceneDetectorAdapter {
  private options: SceneDetectionOptions;

  constructor(options: SceneDetectionOptions = {}) {
    this.options = options;
  }

  /**
   * Analyzes an HTMLVideoElement or media source URL to extract scenes
   */
  async detectScenesFromVideoUrl(
    videoUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<Scene[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;

      const canvas = document.createElement('canvas');
      canvas.width = 160; // downsample for high performance
      canvas.height = 90;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });

      if (!ctx) {
        reject(new Error('Failed to create canvas 2D rendering context for scene detection.'));
        return;
      }

      video.onloadedmetadata = async () => {
        try {
          const duration = video.duration || 10;
          const interval = this.options.sampleInterval ?? 0.5;
          const totalSteps = Math.max(2, Math.floor(duration / interval));
          const samples: { time: number; pixels: Uint8ClampedArray; thumbnail?: string }[] = [];

          for (let step = 0; step < totalSteps; step++) {
            const time = Math.min(step * interval, duration - 0.05);

            // Seek to timestamp
            await new Promise<void>((seekResolve) => {
              const handleSeeked = () => {
                video.removeEventListener('seeked', handleSeeked);
                seekResolve();
              };
              video.addEventListener('seeked', handleSeeked);
              video.currentTime = time;
            });

            // Draw frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Copy pixel data
            const pixelCopy = new Uint8ClampedArray(imgData.data);
            const thumbnail = canvas.toDataURL('image/jpeg', 0.5);

            samples.push({
              time,
              pixels: pixelCopy,
              thumbnail,
            });

            if (onProgress) {
              const p = Math.round(((step + 1) / totalSteps) * 95);
              onProgress(p);
            }
          }

          const scenes = SceneDetector.detectScenesFromDeltas(samples, duration, this.options);
          onProgress?.(100);
          resolve(scenes);
        } catch (err) {
          reject(err);
        } finally {
          video.src = '';
          video.remove();
        }
      };

      video.onerror = () => {
        // Fallback for mock/test media items without actual video stream
        reject(new Error(`Unable to load video element from URL: ${videoUrl}`));
      };
    });
  }
}
