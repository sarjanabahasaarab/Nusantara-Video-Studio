/**
 * Nusantara Video Studio - Core Type Definitions
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Comprehensive types for multi-track timeline, direct preview manipulation,
 * audio waveforms and keyframes, screen/camera/voice capture, and project serialization.
 */

export type ResolutionPreset = '1280x720' | '1920x1080' | '2560x1440' | '3840x2160';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export type FrameRate = 24 | 25 | 30 | 50 | 60;
export type TrackType = 'video' | 'audio';

export type ClipType =
  | 'video'
  | 'audio'
  | 'image'
  | 'text'
  | 'screen-recording'
  | 'camera-recording'
  | 'voice-recording';

export type MediaType = 'video' | 'audio' | 'image';
export type MediaFilterType = 'all' | 'video' | 'audio' | 'image';
export type MediaSortField = 'name' | 'createdAt' | 'duration' | 'size' | 'type';
export type MediaSortOrder = 'asc' | 'desc';
export type MediaViewMode = 'grid' | 'list';

export interface ImportProgress {
  active: boolean;
  current?: number;
  total?: number;
  filename?: string;
  percentage?: number;
}

export interface ProjectSettings {
  name: string;
  width: number;
  height: number;
  fps: FrameRate;
  aspectRatio: AspectRatio;
  duration: number; // in seconds
  sampleRate: number; // 44100 or 48000
}

export interface MediaMetadata {
  duration: number; // in seconds
  width?: number;
  height?: number;
  fps?: number;
  bitrate?: number;
  channels?: number;
  sampleRate?: number;
  codec?: string;
  thumbnailUrl?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  path: string;
  type: ClipType;
  extension: string;
  mimeType?: string;
  size: number;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  codec?: string;
  sampleRate?: number;
  channels?: number;
  thumbnail?: string;
  isOffline?: boolean;
  blobUrl?: string;
  lastModified?: number;
  createdAt: string;
  updatedAt?: string;
  metadata?: MediaMetadata;
}

export interface ClipTransform {
  positionX: number; // offset in px or %
  positionY: number;
  scaleX?: number; // 1.0 = 100%
  scaleY?: number;
  scale?: number; // legacy shorthand
  rotation: number; // in degrees
  opacity: number; // 0.0 to 1.0
  width?: number;
  height?: number;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

export interface ClipAppearance {
  brightness: number; // default 100%
  contrast: number; // default 100%
  saturation: number; // default 100%
  exposure: number; // default 0 (-100 to 100)
  temperature: number; // default 0 (-100 to 100)
  tint: number; // default 0 (-100 to 100)
}

export interface ClipBasicEffects {
  blur: number; // in px (0 to 50)
  sharpen: number; // 0 to 100
  vignette: number; // 0 to 100
  grayscale: number; // 0 to 100
  sepia: number; // 0 to 100
}

export interface AudioKeyframe {
  id: string;
  time: number; // relative to clip start in seconds
  volume: number; // 0 to 200%
}

export interface ClipAudio {
  volume: number; // 0 to 200 (default 100)
  pan: number; // -100 (left) to 100 (right)
  gain?: number; // -24 to +24 dB
  mute: boolean;
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  keyframes?: AudioKeyframe[];
  waveform?: number[];
}

export interface ClipSpeed {
  rate: number; // 0.25x to 8x
  reverse: boolean;
}

export interface ClipTextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  color: string;
  backgroundColor?: string;
  alignment: 'left' | 'center' | 'right';
  lineSpacing?: number;
  letterSpacing?: number;
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  textPreset?: 'title' | 'subtitle' | 'caption' | 'lower-third';
}

/**
 * Standard Clip definition compatible with Phase 1 & 2
 * while offering full Phase 3 TimelineClip capabilities.
 */
export interface BaseClip {
  id: string;
  trackId: string;
  name: string;
  type: ClipType;
  startTime: number; // timeline start time in seconds
  duration: number; // duration in seconds
  sourceStartTime: number; // in-point in original media (seconds)
  sourceDuration: number;
  mediaId?: string;
  color?: string;
  transform: ClipTransform;
  appearance?: ClipAppearance;
  basicEffects?: ClipBasicEffects;
  audio?: ClipAudio;
  speed: ClipSpeed;
  visible?: boolean;
  selected?: boolean;
  textProps?: ClipTextProperties;

  // Phase 3 convenience aliases
  start?: number;
  sourceStart?: number;
  position?: { x: number; y: number };
  scale?: { x: number; y: number };
  rotation?: number;
  opacity?: number;
  volume?: number;
  muted?: boolean;
}

export interface VideoClip extends BaseClip {
  type: 'video' | 'image' | 'screen-recording' | 'camera-recording';
}

export interface AudioClip extends BaseClip {
  type: 'audio' | 'voice-recording';
  waveform?: number[];
}

export interface TextClip extends BaseClip {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  backgroundColor?: string;
  alignment: 'left' | 'center' | 'right';
}

export type Clip = BaseClip;

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  index: number;
  locked: boolean;
  muted: boolean;
  hidden: boolean;
  solo?: boolean;
  clips: Clip[];
}

export interface TimelineMarker {
  id: string;
  time: number; // in seconds
  name: string;
  color?: string;
}

export interface TimelineData {
  zoom: number; // pixels per second
  currentTime: number; // current playhead in seconds
  scrollLeft: number;
  tracks: Track[];
  markers?: TimelineMarker[];
  snapping: boolean;
  loop: boolean;
}

export interface Project {
  projectVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  media: MediaItem[];
  timeline: {
    tracks: Track[];
    duration: number;
    markers?: TimelineMarker[];
  };
  metadata: {
    appVersion: string;
    appName: string;
    lastSavedBy?: string;
  };
}

export interface Transition {
  id: string;
  name: string;
  type: 'fade' | 'dissolve' | 'wipe' | 'slide' | 'zoom';
  duration: number;
  thumbnailUrl?: string;
}

export interface Effect {
  id: string;
  name: string;
  category: string;
  parameters: Record<string, unknown>;
  thumbnailUrl?: string;
}

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
}

export interface AppSettings {
  general: {
    language: 'id' | 'en';
    theme: 'dark-studio' | 'dark-slate' | 'oled';
    autoSaveEnabled: boolean;
    autoSaveIntervalMinutes: number;
  };
  project: {
    defaultResolution: ResolutionPreset;
    defaultFps: FrameRate;
    defaultAspectRatio: AspectRatio;
  };
  performance: {
    previewQuality: 'full' | 'half' | 'quarter';
    cacheLocation: string;
    gpuAcceleration: boolean;
  };
}

/**
 * Undo / Redo Command Pattern (Requirement 37)
 */
export interface EditCommand {
  id: string;
  description: string;
  execute: () => void;
  undo: () => void;
  timestamp: number;
}

/**
 * Capture Configuration (Requirement 24, 25, 28)
 */
export type CaptureMode = 'screen' | 'camera' | 'voice';
export type ScreenAreaMode = 'fullscreen' | 'window' | 'selected';

export interface CaptureConfig {
  mode: CaptureMode;
  screenAreaMode?: ScreenAreaMode;
  includeSystemAudio: boolean;
  includeMicrophone: boolean;
  resolution: { width: number; height: number };
  fps: number;
  audioDeviceId?: string;
  videoDeviceId?: string;
}
