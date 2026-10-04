/**
 * Nusantara Video Studio - Core Type Definitions
 * Phase 1: Foundation
 */

export type ResolutionPreset = '1280x720' | '1920x1080' | '2560x1440' | '3840x2160';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export type FrameRate = 24 | 25 | 30 | 50 | 60;
export type TrackType = 'video' | 'audio';
export type ClipType = 'video' | 'audio' | 'image' | 'text';

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
  codec?: string;
  thumbnailUrl?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  path: string;
  type: ClipType;
  size: number;
  createdAt: string;
  metadata: MediaMetadata;
}

export interface ClipTransform {
  positionX: number; // offset in px or %
  positionY: number;
  scale: number; // 1.0 = 100%
  rotation: number; // in degrees
  opacity: number; // 0.0 to 1.0
}

export interface ClipAudio {
  volume: number; // 0 to 100
  pan: number; // -100 (left) to 100 (right)
  mute: boolean;
}

export interface ClipSpeed {
  rate: number; // 0.25x to 8x
  reverse: boolean;
}

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
  audio?: ClipAudio;
  speed: ClipSpeed;
}

export interface VideoClip extends BaseClip {
  type: 'video' | 'image';
}

export interface AudioClip extends BaseClip {
  type: 'audio';
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

export type Clip = VideoClip | AudioClip | TextClip;

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  index: number;
  locked: boolean;
  muted: boolean;
  hidden: boolean;
  clips: Clip[];
}

export interface TimelineData {
  zoom: number; // pixels per second
  currentTime: number; // current playhead in seconds
  scrollLeft: number;
  tracks: Track[];
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
