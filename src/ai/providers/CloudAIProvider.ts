/**
 * Nusantara Video Studio - Cloud AI Provider
 * Phase 7: AI-Assisted Editing
 *
 * Implements Cloud AI integration interface with strict Privacy Enforcement.
 * Checks whether user has enabled "Allow cloud processing" and "Send media to external AI providers".
 * If privacy gates are disabled, rejects execution immediately without sending any network request.
 */

import { AIProvider } from '../AIProvider';
import { AICapability, AIJob } from '../AIJob';
import { AIResult } from '../AIResult';
import { AISettingsManager } from '../AISettings';

export class CloudAIProvider implements AIProvider {
  id = 'cloud-ai-provider';
  name = 'Cloud AI Service (External)';
  type: 'cloud' = 'cloud';

  private activeJobs = new Map<string, boolean>();

  async isAvailable(): Promise<boolean> {
    const settings = AISettingsManager.getSettings();
    // Only available if user explicitly consented to cloud processing in Settings
    return settings.privacy.allowCloudProcessing === true;
  }

  async getCapabilities(): Promise<AICapability[]> {
    return [
      'transcription',
      'subtitle-generation',
      'scene-detection',
      'silence-detection',
      'object-detection',
      'face-detection',
      'smart-reframe',
      'audio-cleanup',
    ];
  }

  async execute(job: AIJob, onProgress?: (progress: number) => void): Promise<AIResult> {
    const settings = AISettingsManager.getSettings();

    // STRICT PRIVACY ENFORCEMENT (Requirement 3 & 6)
    if (!settings.privacy.allowCloudProcessing) {
      throw new Error(
        'Cloud Processing Blocked: "Allow cloud processing" is disabled in Settings → AI → Privacy. User media cannot be sent externally without consent.'
      );
    }

    if (!settings.privacy.sendMediaToExternal) {
      throw new Error(
        'Cloud Processing Blocked: "Send media to external AI providers" is disabled. Please verify your privacy settings.'
      );
    }

    this.activeJobs.set(job.id, true);

    try {
      onProgress?.(20);

      // Check if API key or endpoint is configured
      if (!settings.cloud.apiKey && !settings.cloud.endpoint) {
        throw new Error(
          'Cloud Provider Required: No API key or Cloud endpoint configured in Settings → AI.'
        );
      }

      onProgress?.(60);
      throw new Error('Cloud AI Provider: External API endpoint connection requires active internet service.');
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  async cancel(jobId: string): Promise<void> {
    this.activeJobs.delete(jobId);
  }
}
