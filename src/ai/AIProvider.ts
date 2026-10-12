/**
 * Nusantara Video Studio - AI Provider Interface
 * Phase 7: AI-Assisted Editing
 */

import { AICapability, AIJob } from './AIJob';
import { AIResult } from './AIResult';

export interface AIProvider {
  id: string;
  name: string;
  type: 'local' | 'cloud';

  /**
   * Checks whether the provider backend or model weights are actually installed and operational
   */
  isAvailable(): Promise<boolean>;

  /**
   * Returns list of capabilities natively supported by this provider
   */
  getCapabilities(): Promise<AICapability[]>;

  /**
   * Executes an asynchronous AI job with progress reporting
   */
  execute(job: AIJob, onProgress?: (progress: number) => void): Promise<AIResult>;

  /**
   * Cancels a running job by ID
   */
  cancel(jobId: string): Promise<void>;
}
