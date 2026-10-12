/**
 * Nusantara Video Studio - Object Detection Capability
 * Phase 7: AI-Assisted Editing
 *
 * Provides typed interfaces, object labels, and capability availability detection.
 * In accordance with Principle 3: If no local weights or backend vision server is active,
 * reports "Provider Required" or "Not Installed" without inventing fictitious mock bounding boxes.
 */

import { DetectedObject } from '../../types/ai';

export class ObjectDetector {
  /**
   * Validates whether object detection model is initialized in the environment
   */
  static isModelLoaded(): boolean {
    // Check if browser/Tauri has loaded onnx / tensor model
    if (typeof window !== 'undefined' && (window as unknown as { __NVS_VISION_MODEL__?: unknown }).__NVS_VISION_MODEL__) {
      return true;
    }
    return false;
  }

  /**
   * Filters and formats raw detections
   */
  static filterByConfidence(objects: DetectedObject[], minConfidence = 0.6): DetectedObject[] {
    return objects.filter((obj) => obj.confidence >= minConfidence);
  }
}
