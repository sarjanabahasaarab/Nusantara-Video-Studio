/**
 * Nusantara Video Studio - AI Job Model
 * Phase 7: AI-Assisted Editing
 */

import { AICapability, AIJob, AIJobStatus, AIResult } from '../types/ai';

export class AIJobFactory {
  static createJob(
    type: AICapability,
    mediaIds: string[],
    params?: Record<string, unknown>,
    clipId?: string
  ): AIJob {
    return {
      id: `ai-job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      mediaIds,
      clipId,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
      params,
    };
  }

  static isFinished(status: AIJobStatus): boolean {
    return status === 'completed' || status === 'failed' || status === 'cancelled';
  }
}

export type { AICapability, AIJob, AIJobStatus, AIResult };
