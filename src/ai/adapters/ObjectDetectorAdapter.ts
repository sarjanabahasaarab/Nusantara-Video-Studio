/**
 * Nusantara Video Studio - Object & Face Detector Adapter
 * Phase 7: AI-Assisted Editing
 *
 * Checks system presence of vision backends (YOLO, MediaPipe, OpenCV, Tauri sidecar).
 * Adheres strictly to Principle 3: If weights/backend are absent, reports "Provider Required".
 */

import { DetectedObject, DetectedFace } from '../../types/ai';

export interface VisionAdapterStatus {
  available: boolean;
  modelName: string;
  provider: 'local' | 'cloud' | 'none';
  statusText: 'Ready' | 'Not Installed' | 'Provider Required';
  setupInstructions?: string;
}

export class ObjectDetectorAdapter {
  static async checkVisionStatus(): Promise<VisionAdapterStatus> {
    // 1. Check if Tauri native vision backend is mounted
    if (typeof window !== 'undefined' && (window as unknown as { __NVS_VISION_MODEL__?: unknown }).__NVS_VISION_MODEL__) {
      return {
        available: true,
        modelName: 'YOLOv8 Mobile / MediaPipe Native',
        provider: 'local',
        statusText: 'Ready',
      };
    }

    // 2. Otherwise report honest status
    return {
      available: false,
      modelName: 'None',
      provider: 'none',
      statusText: 'Provider Required',
      setupInstructions:
        'Object & Face detection models require local ONNX/MediaPipe weights or Cloud Vision API keys. Please enable Cloud AI in Settings → AI or configure the desktop model path.',
    };
  }

  static async detectObjects(): Promise<DetectedObject[]> {
    const status = await this.checkVisionStatus();
    if (!status.available) {
      throw new Error('Object Detection Provider Required: No local model weights installed.');
    }
    return [];
  }

  static async detectFaces(): Promise<DetectedFace[]> {
    const status = await this.checkVisionStatus();
    if (!status.available) {
      throw new Error('Face Detection Provider Required: No local model weights installed.');
    }
    return [];
  }
}
