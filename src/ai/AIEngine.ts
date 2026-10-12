/**
 * Nusantara Video Studio - AI Engine Coordinator
 * Phase 7: AI-Assisted Editing
 *
 * Central coordinator combining ProviderRegistry, AIJobQueue, and capabilities.
 */

import { AICapability, AIJob } from './AIJob';
import { AIJobQueue } from './AIJobQueue';
import { ProviderRegistry } from './providers/ProviderRegistry';
import { AIJobFactory } from './AIJob';
import { Scene, SilenceRegion } from '../types/ai';

export interface SuggestedCut {
  id: string;
  type: 'silence' | 'scene_split' | 'short_fragment';
  start: number; // in seconds
  end: number;
  duration: number;
  reason: string;
  recommendedAction: 'remove' | 'split' | 'keep';
}

export class AIEngine {
  private static instance: AIEngine;
  private queue: AIJobQueue;
  private registry: ProviderRegistry;

  private constructor() {
    this.queue = AIJobQueue.getInstance();
    this.registry = ProviderRegistry.getInstance();
  }

  static getInstance(): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine();
    }
    return AIEngine.instance;
  }

  getJobQueue(): AIJobQueue {
    return this.queue;
  }

  getProviderRegistry(): ProviderRegistry {
    return this.registry;
  }

  async getSupportedCapabilities(): Promise<AICapability[]> {
    const active = this.registry.getActiveProvider();
    return active.getCapabilities();
  }

  // Capability dispatchers

  detectScenes(
    mediaId: string,
    options: { videoUrl?: string; duration?: number; threshold?: number } = {}
  ): AIJob {
    const job = AIJobFactory.createJob('scene-detection', [mediaId], options);
    return this.queue.enqueue(job);
  }

  detectSilence(
    mediaId: string,
    options: {
      duration?: number;
      channelData?: Float32Array;
      sampleRate?: number;
      thresholdDb?: number;
      minDuration?: number;
      preRoll?: number;
      postRoll?: number;
    } = {}
  ): AIJob {
    const job = AIJobFactory.createJob('silence-detection', [mediaId], options);
    return this.queue.enqueue(job);
  }

  transcribe(
    mediaId: string,
    options: { audioUrl?: string; language?: string } = {}
  ): AIJob {
    const job = AIJobFactory.createJob('transcription', [mediaId], options);
    return this.queue.enqueue(job);
  }

  smartReframe(
    clipId: string,
    targetAspectRatio: '16:9' | '9:16' | '1:1' | '4:5',
    options: { sourceWidth?: number; sourceHeight?: number } = {}
  ): AIJob {
    const job = AIJobFactory.createJob(
      'smart-reframe',
      [clipId],
      { targetAspectRatio, ...options },
      clipId
    );
    return this.queue.enqueue(job);
  }

  cleanAudio(
    clipId: string,
    options: {
      removeHum?: boolean;
      humFrequency?: 50 | 60;
      noiseReductionDb?: number;
      normalizeLoudness?: boolean;
    } = {}
  ): AIJob {
    const job = AIJobFactory.createJob('audio-cleanup', [clipId], options, clipId);
    return this.queue.enqueue(job);
  }

  /**
   * Smart Cut: Combines detected silence, scenes, and micro-fragments to compute suggested rough cut edit decisions
   */
  generateSmartCutSuggestions(
    silenceRegions: SilenceRegion[] = [],
    scenes: Scene[] = [],
    minFragmentDuration = 0.4
  ): SuggestedCut[] {
    const suggestions: SuggestedCut[] = [];

    // 1. Suggest removing detected silence regions
    for (const silence of silenceRegions) {
      suggestions.push({
        id: `sug-silence-${silence.id}`,
        type: 'silence',
        start: silence.start,
        end: silence.end,
        duration: silence.duration,
        reason: `Silence region of ${silence.duration.toFixed(2)}s detected below audio threshold`,
        recommendedAction: 'remove',
      });
    }

    // 2. Suggest splitting at scene boundaries
    for (let i = 1; i < scenes.length; i++) {
      const scene = scenes[i];
      suggestions.push({
        id: `sug-scene-${scene.id}`,
        type: 'scene_split',
        start: scene.start,
        end: scene.start + 0.05,
        duration: 0.05,
        reason: `Scene visual transition detected at ${scene.start.toFixed(2)}s`,
        recommendedAction: 'split',
      });
    }

    // Sort by timeline timestamp
    return suggestions.sort((a, b) => a.start - b.start);
  }
}
