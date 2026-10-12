/**
 * Nusantara Video Studio - AI Engine Types
 * Phase 7: AI-Assisted Editing
 */

export type AICapability =
  | 'transcription'
  | 'subtitle-generation'
  | 'scene-detection'
  | 'silence-detection'
  | 'object-detection'
  | 'face-detection'
  | 'smart-reframe'
  | 'audio-cleanup';

export type AIJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AIJob {
  id: string;
  type: AICapability;
  mediaIds: string[];
  clipId?: string;
  status: AIJobStatus;
  progress: number; // 0 - 100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  providerId?: string;
  params?: Record<string, unknown>;
  result?: AIResult;
}

export interface WordTimestamp {
  id: string;
  word: string;
  start: number; // in seconds
  end: number;
  confidence?: number;
}

export interface TranscriptSegment {
  id: string;
  start: number; // in seconds
  end: number;
  text: string;
  confidence?: number;
  speaker?: string; // e.g. "Speaker 1", "Speaker 2"
  words?: WordTimestamp[];
}

export interface TranscriptData {
  language: string;
  duration: number;
  segments: TranscriptSegment[];
  speakers?: string[];
  confidence?: number;
}

export interface Scene {
  id: string;
  start: number; // in seconds
  end: number;
  confidence?: number;
  thumbnail?: string; // data URL or path
  keyframeTime?: number;
}

export interface SilenceRegion {
  id: string;
  start: number; // in seconds
  end: number;
  duration: number;
}

export interface DetectedObject {
  id: string;
  label: string;
  confidence: number;
  start: number;
  end: number;
  boundingBox?: {
    x: number; // normalized 0..1
    y: number;
    width: number;
    height: number;
  };
}

export interface DetectedFace {
  id: string;
  label: string; // e.g. "Face 1"
  confidence: number;
  start: number;
  end: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface SmartReframeResult {
  sourceAspectRatio: string;
  targetAspectRatio: string; // '16:9' | '9:16' | '1:1' | '4:5'
  recommendedScale: number;
  cropPanX: number; // -100 to 100%
  cropPanY: number;
  keyframes?: {
    time: number;
    panX: number;
    panY: number;
    scale: number;
  }[];
}

export interface AudioCleanupResult {
  appliedFilters: string[];
  highPassCutoffHz: number;
  notchCutoffHz?: number;
  noiseReductionDb: number;
  targetLufs?: number;
  peakDbGain: number;
}

export interface SubtitleGenerationResult {
  trackName: string;
  language: string;
  itemsCount: number;
}

export type AIResult =
  | { type: 'transcription'; data: TranscriptData }
  | { type: 'scene-detection'; data: { scenes: Scene[]; method: 'visual-difference' | 'ml' } }
  | { type: 'silence-detection'; data: { regions: SilenceRegion[]; thresholdDb: number; minDuration: number } }
  | { type: 'object-detection'; data: { objects: DetectedObject[] } }
  | { type: 'face-detection'; data: { faces: DetectedFace[] } }
  | { type: 'smart-reframe'; data: SmartReframeResult }
  | { type: 'audio-cleanup'; data: AudioCleanupResult }
  | { type: 'subtitle-generation'; data: SubtitleGenerationResult };

export interface AISettings {
  preferredProvider: 'local' | 'cloud';
  privacy: {
    allowCloudProcessing: boolean;
    sendMediaToExternal: boolean;
    autoProcessImported: boolean;
  };
  whisper: {
    modelSize: 'tiny' | 'base' | 'small' | 'medium';
    customEndpoint?: string;
    language: string; // 'auto' | 'id' | 'en'
  };
  cloud: {
    providerName: string;
    endpoint?: string;
    apiKey?: string;
  };
}

export interface ProjectAIMetadata {
  transcripts?: Record<string, TranscriptData>;
  scenes?: Record<string, Scene[]>;
  silenceRegions?: Record<string, SilenceRegion[]>;
  reframeSettings?: Record<string, SmartReframeResult>;
  cleanupSettings?: Record<string, AudioCleanupResult>;
}

export interface ClipAIMetadata {
  transcriptId?: string;
  detectedScenes?: Scene[];
  silenceRegions?: SilenceRegion[];
  smartReframe?: SmartReframeResult;
  audioCleanup?: AudioCleanupResult;
}
