/**
 * Nusantara Video Studio - AI Provider Registry
 * Phase 7: AI-Assisted Editing
 */

import { AIProvider } from '../AIProvider';
import { LocalAIProvider } from './LocalAIProvider';
import { CloudAIProvider } from './CloudAIProvider';
import { AISettingsManager } from '../AISettings';

export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers = new Map<string, AIProvider>();

  private constructor() {
    this.register(new LocalAIProvider());
    this.register(new CloudAIProvider());
  }

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  register(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Retrieves current active provider based on user settings
   */
  getActiveProvider(): AIProvider {
    const settings = AISettingsManager.getSettings();
    if (settings.preferredProvider === 'cloud') {
      const cloud = this.providers.get('cloud-ai-provider');
      if (cloud) return cloud;
    }
    return this.providers.get('local-ai-provider') || new LocalAIProvider();
  }
}
