/**
 * Nusantara Video Studio - Professional Rendering & Export Engine Types
 * Phase 9: Professional Rendering & Export Engine
 */

import { FrameRate } from './index';

export type RenderContainerFormat = 'mp4' | 'mov' | 'webm';

export type VideoCodec = 'h264' | 'h265' | 'av1' | 'prores' | 'vp9';

export type AudioCodec = 'aac' | 'opus' | 'pcm';

export type HardwareEncoderType =
  | 'auto'
  | 'nvenc'
  | 'amf'
  | 'qsv'
  | 'videotoolbox'
  | 'cpu';

export type BitrateMode = 'auto' | 'cbr' | 'vbr' | 'crf';

export type QualityPreset =
  | 'draft'
  | 'standard'
  | 'high'
  | 'very-high'
  | 'master'
  | 'custom';

export type RenderRangeType = 'entire' | 'in_out' | 'selected_clip';

export type SubtitleExportMode =
  | 'none'
  | 'burn_in'
  | 'separate_srt'
  | 'separate_vtt';

export type AudioNormalizationMode =
  | 'none'
  | 'lufs_14'
  | 'lufs_16'
  | 'lufs_23';

export interface CodecInfo {
  id: VideoCodec | AudioCodec;
  name: string;
  available: boolean;
  encoderName?: string;
  hardwareAccelerated?: boolean;
  supportedContainers: RenderContainerFormat[];
  notes?: string;
}

export interface ContainerInfo {
  format: RenderContainerFormat;
  name: string;
  extension: string;
  available: boolean;
  supportedVideoCodecs: VideoCodec[];
  supportedAudioCodecs: AudioCodec[];
  supportsAlpha: boolean;
}

export interface RenderCapabilities {
  ffmpegAvailable: boolean;
  ffmpegVersion?: string;
  ffprobeAvailable: boolean;
  ffprobeVersion?: string;
  containers: ContainerInfo[];
  videoCodecs: CodecInfo[];
  audioCodecs: CodecInfo[];
  hardwareEncoders: {
    nvenc: boolean;
    amf: boolean;
    qsv: boolean;
    videotoolbox: boolean;
    vaapi: boolean;
  };
  supportedFilters: string[];
}

export interface RenderSettings {
  format: RenderContainerFormat;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  width: number;
  height: number;
  fps: number;
  qualityPreset: QualityPreset;
  bitrateMode: BitrateMode;
  targetBitrateMbps?: number;
  maxBitrateMbps?: number;
  crf?: number;
  hardwareAcceleration: HardwareEncoderType;
  audioSampleRate: 44100 | 48000;
  audioChannels: 1 | 2; // Mono | Stereo
  audioBitrateKbps: 128 | 192 | 256 | 320;
  audioNormalization: AudioNormalizationMode;
  subtitleMode: SubtitleExportMode;
  selectedSubtitleTrackId?: string;
  exportAlpha: boolean;
  rangeType: RenderRangeType;
  rangeInSec?: number;
  rangeOutSec?: number;
  selectedClipId?: string;
  useProxyMedia: boolean;
  smartReframeRatio?: '16:9' | '9:16' | '1:1';
  outputPath: string;
}

export interface RenderPreset {
  id: string;
  name: string;
  category: 'social' | 'web' | 'broadcast' | 'archive' | 'custom';
  description?: string;
  settings: Partial<RenderSettings>;
  isBuiltIn: boolean;
}

export interface RenderError {
  code: string;
  message: string;
  details?: string;
  stage?: 'preflight' | 'prepare' | 'encode' | 'mux' | 'validate';
  timestamp: string;
  recoverable?: boolean;
}

export interface RenderProgress {
  jobId: string;
  percentage: number; // 0 - 100
  currentFrame: number;
  totalFrames: number;
  fps: number;
  renderSpeedRealtime: number; // e.g. 1.8x
  elapsedSeconds: number;
  remainingSeconds: number;
  currentBitrateKbps?: number;
  currentStage: string;
  previewFrameUrl?: string;
}

export interface RenderJob {
  id: string;
  projectId: string;
  projectName: string;
  sequenceId: string;
  status:
    | 'queued'
    | 'preparing'
    | 'rendering'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  progress: number;
  progressDetails?: RenderProgress;
  outputPath: string;
  settings: RenderSettings;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: RenderError;
  outputSizeReport?: OutputValidationReport;
  logLines: string[];
}

export interface VideoRenderTrack {
  id: string;
  name: string;
  index: number;
  clips: {
    id: string;
    mediaId?: string;
    sourcePath: string;
    timelineStart: number;
    duration: number;
    sourceStart: number;
    speed: number;
    opacity: number;
    transform: {
      positionX: number;
      positionY: number;
      scaleX: number;
      scaleY: number;
      rotation: number;
    };
    effects: any[];
    colorGrading?: any;
    chromaKey?: any;
    masks?: any[];
    keyframes?: any[];
  }[];
}

export interface AudioRenderTrack {
  id: string;
  name: string;
  index: number;
  volume: number; // linear
  pan: number;
  muted: boolean;
  solo: boolean;
  clips: {
    id: string;
    mediaId?: string;
    sourcePath: string;
    timelineStart: number;
    duration: number;
    sourceStart: number;
    volume: number;
    speed: number;
  }[];
  audioEffects?: any;
}

export interface RenderOverlay {
  id: string;
  type: 'text' | 'shape' | 'logo' | 'subtitle';
  timelineStart: number;
  duration: number;
  content: string;
  props: Record<string, any>;
}

export interface ColorPipelineConfig {
  enabled: boolean;
  lutPath?: string;
  curves?: any;
  wheels?: any;
  vignette?: any;
}

export interface SubtitlePipelineConfig {
  mode: SubtitleExportMode;
  items: {
    startSec: number;
    endSec: number;
    text: string;
    style?: any;
  }[];
}

export interface RenderGraph {
  durationSec: number;
  fps: number;
  width: number;
  height: number;
  videoTracks: VideoRenderTrack[];
  audioTracks: AudioRenderTrack[];
  effects: any[];
  transitions: any[];
  overlays: RenderOverlay[];
  colorPipeline?: ColorPipelineConfig;
  subtitlePipeline?: SubtitlePipelineConfig;
  inPointSec: number;
  outPointSec: number;
}

export interface PreflightIssue {
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  fixAction?: 'relink' | 'settings' | 'proxy' | 'ignore';
}

export interface RenderPreflightResult {
  ready: boolean;
  canProceed: boolean;
  issues: PreflightIssue[];
  diskSpace: {
    requiredBytes: number;
    availableBytes?: number;
    status: 'ok' | 'warning' | 'unknown';
  };
  totalEstimatedFrames: number;
  totalDurationSec: number;
}

export interface OutputValidationReport {
  isValid: boolean;
  filePath: string;
  fileSizeBytes: number;
  durationSec: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  bitrateKbps: number;
  hasVideoStream: boolean;
  hasAudioStream: boolean;
  validationWarnings: string[];
  inspectedAt: string;
}

export interface ExportHistoryItem {
  id: string;
  jobId: string;
  date: string;
  projectName: string;
  presetName: string;
  format: RenderContainerFormat;
  resolution: string;
  duration: string;
  outputPath: string;
  fileSizeBytes: number;
  status: 'completed' | 'failed' | 'cancelled';
  details?: OutputValidationReport;
}
