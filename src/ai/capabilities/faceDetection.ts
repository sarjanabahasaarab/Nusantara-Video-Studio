/**
 * Nusantara Video Studio - Face Detection Capability
 * Phase 7: AI-Assisted Editing
 *
 * Implements face bounding box representation and capability checking.
 * Used for smart reframe centering, face tracking, and subject focusing.
 */

import { DetectedFace } from '../../types/ai';

export class FaceDetector {
  /**
   * Validates whether face detection backend is loaded
   */
  static isModelLoaded(): boolean {
    if (typeof window !== 'undefined' && (window as unknown as { __NVS_FACE_MODEL__?: unknown }).__NVS_FACE_MODEL__) {
      return true;
    }
    return false;
  }

  /**
   * Sorts faces by bounding box area (primary foreground subject first)
   */
  static sortByProminence(faces: DetectedFace[]): DetectedFace[] {
    return [...faces].sort((a, b) => {
      const areaA = (a.boundingBox?.width || 0) * (a.boundingBox?.height || 0);
      const areaB = (b.boundingBox?.width || 0) * (b.boundingBox?.height || 0);
      return areaB - areaA;
    });
  }
}
