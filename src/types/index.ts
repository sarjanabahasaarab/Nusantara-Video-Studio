/**
 * Nusantara Video Studio - Core Type Definitions
 * Phase 6: Professional Color & Audio Studio
 */

import { ClipColorGrading } from './color';
import { ClipAudioEffects, TrackMixerChannel, MasterAudioBus } from './audio';

export * from './color';
export * from './audio';

export interface ProcessingNode {
  id: string;
  type: string;
  enabled: boolean;
  parameters: Record<string, unknown>;
}

export type ResolutionPreset = '1280x720' | '1920x1080' | '2560x1440' | '3840x2160';
export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export type FrameRate = 24 | 25 | 30 | 50 | 60;
export type TrackType = 'video' | 'audio' | 'subtitle';

export type ClipType =
  | 'video'
  | 'audio'
  | 'image'
  | 'text'
  | 'shape'
  | 'logo'
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

export interface TextAnimationSettings {
  preset:
    | 'none'
    | 'fade-in'
    | 'slide-in'
    | 'zoom-in'
    | 'typewriter'
    | 'pop-in'
    | 'fade-out'
    | 'slide-out'
    | 'zoom-out'
    | 'floating'
    | 'pulse'
    | 'gentle-zoom';
  duration: number; // in seconds
  delay?: number; // delay in seconds
  direction?: 'left' | 'right' | 'top' | 'bottom';
  intensity?: number; // 0 to 100
}

export interface ClipTextProperties {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: string | number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  textDirection?: 'ltr' | 'rtl';
  alignment: 'left' | 'center' | 'right' | 'justify';
  color: string;
  backgroundColor?: string;
  backgroundOpacity?: number; // 0 to 1
  outlineColor?: string;
  outlineWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  boxWidth?: number; // in px
  boxHeight?: number; // in px
  padding?: number; // in px
  margin?: number; // in px
  textPreset?: string;
  animation?: TextAnimationSettings;
}

export type ShapeType =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'triangle';

export interface ShapeProperties {
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number; // 0 to 1
  width: number;
  height: number;
  cornerRadius?: number;
  arrowDirection?: 'left' | 'right' | 'up' | 'down';
}

export interface LogoOverlayProperties {
  mediaId?: string;
  logoUrl?: string;
  presetPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
  scale: number;
  rotation: number;
  opacity: number; // 0 to 1
  cropLeft?: number;
  cropRight?: number;
  cropTop?: number;
  cropBottom?: number;
  borderWidth?: number;
  borderColor?: string;
  shadowBlur?: number;
  shadowColor?: string;
}

export type GraphicLayerType =
  | 'text'
  | 'shape'
  | 'image'
  | 'logo'
  | 'subtitle'
  | 'caption';

export interface GraphicLayer {
  id: string;
  type: GraphicLayerType;
  name: string;
  start: number;
  duration: number;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  properties: Record<string, any>;
}

export interface SubtitleItem {
  id: string;
  index: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
  style?: Partial<ClipTextProperties>;
}

export interface SubtitleTrack {
  id: string;
  name: string;
  language: string;
  visible: boolean;
  locked: boolean;
  items: SubtitleItem[];
  defaultStyle?: Partial<ClipTextProperties>;
}

export interface SafeAreaSettings {
  showSafeArea: boolean;
  showTitleSafe: boolean; // 80% boundary
  showActionSafe: boolean; // 90% boundary
  showCenterGuide: boolean; // crosshair
  showGrid: boolean; // 3x3 rule of thirds
}

export type KeyframeInterpolation = 'linear' | 'hold' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface Keyframe {
  id: string;
  time: number; // in seconds relative to clip start
  value: number;
  interpolation: KeyframeInterpolation;
}

export interface AnimatedProperty {
  property: string; // e.g. 'positionX' | 'positionY' | 'scaleX' | 'scaleY' | 'rotation' | 'opacity' | 'volume' | 'blur' | 'brightness' | 'contrast' | 'saturation'
  keyframes: Keyframe[];
}

export type AnimationPresetType =
  | 'fade-in'
  | 'slide-in-left'
  | 'slide-in-right'
  | 'slide-in-up'
  | 'slide-in-down'
  | 'zoom-in'
  | 'pop-in'
  | 'fade-out'
  | 'slide-out-left'
  | 'slide-out-right'
  | 'slide-out-up'
  | 'slide-out-down'
  | 'zoom-out'
  | 'slow-zoom'
  | 'pan-left'
  | 'pan-right'
  | 'pan-up'
  | 'pan-down'
  | 'rotate'
  | 'ken-burns';

export interface AppliedAnimationPreset {
  id: string;
  type: AnimationPresetType;
  category: 'entrance' | 'exit' | 'motion';
  duration: number; // in seconds
  appliedAt: number;
}

export interface ChromaKeySettings {
  enabled: boolean;
  color: string; // e.g. '#00ff00'
  tolerance: number; // 0 to 100
  similarity: number; // 0 to 100
  smoothness: number; // 0 to 100
  spillSuppression: number; // 0 to 100
  edgeFeather: number; // 0 to 100
  opacity: number; // 0 to 100
  preset?: 'green' | 'blue' | 'custom';
}

export type MaskShapeType = 'rectangle' | 'ellipse' | 'linear' | 'polygon';

export interface MaskPoint {
  x: number; // 0 to 100%
  y: number;
}

export interface ClipMask {
  id: string;
  name: string;
  enabled: boolean;
  type: MaskShapeType;
  inverted: boolean;
  feather: number; // in px
  expand: number; // in % (-50 to 50)
  opacity: number; // 0 to 1
  positionX: number; // offset
  positionY: number;
  scale: number; // 0.1 to 3
  rotation: number; // in deg
  points?: MaskPoint[]; // polygon points
}

export interface TrackingPoint {
  time: number; // relative to clip
  x: number; // normalized 0 to 1
  y: number;
  width?: number;
  height?: number;
  confidence: number;
}

export interface MotionTrackingData {
  id: string;
  name: string;
  status: 'idle' | 'tracking' | 'completed' | 'failed';
  trackingArea: { x: number; y: number; width: number; height: number }; // normalized 0 to 1
  targetObjectId?: string; // Clip ID or text layer ID to attach to
  points: TrackingPoint[];
  method: 'optical-flow' | 'centroid' | 'native-backend';
}

export type SpeedInterpolation = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

export interface SpeedPoint {
  id: string;
  time: number; // in seconds inside source clip
  speed: number; // 0.1x to 16x
  interpolation: SpeedInterpolation;
}

export interface SpeedRampCurve {
  enabled: boolean;
  preset?: 'slow-motion' | 'fast-motion' | 'speed-up' | 'speed-down' | 'montage' | 'custom';
  points: SpeedPoint[];
}

export interface PictureInPictureSettings {
  enabled: boolean;
  presetPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom';
  presetSize?: 'small' | 'medium' | 'large' | 'custom';
  borderWidth: number; // in px
  borderColor: string;
  borderRadius: number; // in px
  shadowColor: string;
  shadowBlur: number;
  cropLeft?: number;
  cropRight?: number;
  cropTop?: number;
  cropBottom?: number;
}

export type TransitionType =
  | 'cross-dissolve'
  | 'fade'
  | 'dip-to-black'
  | 'dip-to-white'
  | 'wipe-left'
  | 'wipe-right'
  | 'wipe-up'
  | 'wipe-down'
  | 'zoom'
  | 'push'
  | 'slide';

export interface TimelineTransition {
  id: string;
  type: TransitionType;
  name: string;
  fromClipId: string;
  toClipId: string;
  trackId: string;
  duration: number; // in seconds
  start: number; // timeline start time
  parameters: Record<string, number | string | boolean>;
}

export interface ClipEffect {
  id: string;
  type: string;
  name: string;
  category: 'color' | 'blur' | 'stylize' | 'distortion' | 'transform';
  enabled: boolean;
  order: number;
  parameters: Record<string, number | string | boolean>;
}

export interface RenderEffect {
  type: string;
  parameters: Record<string, unknown>;
}

export interface RenderClip {
  clipId: string;
  sourcePath: string;
  timelineStart: number;
  duration: number;
  sourceStart: number;
  speed: number;
  effects: RenderEffect[];
  keyframes: AnimatedProperty[];
}

export interface RenderJobProgress {
  stage: string;
  percentage: number;
  currentTime: number;
  totalTime: number;
}

/**
 * Standard Clip definition compatible with Phase 1 & 2 & 3
 * while offering full Phase 4 Advanced Effects & Motion capabilities.
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
  speed: ClipSpeed & { maintainPitch?: boolean; ramp?: SpeedRampCurve };
  visible?: boolean;
  selected?: boolean;
  textProps?: ClipTextProperties;

  // Phase 4 Advanced Engines
  animatedProperties?: AnimatedProperty[];
  animationPresets?: AppliedAnimationPreset[];
  chromaKey?: ChromaKeySettings;
  masks?: ClipMask[];
  motionTracking?: MotionTrackingData;
  pip?: PictureInPictureSettings;
  effects?: ClipEffect[];

  // Phase 5 Professional Text, Subtitle & Graphics Studio
  shapeProps?: ShapeProperties;
  logoProps?: LogoOverlayProperties;
  graphicLayers?: GraphicLayer[];
  subtitleItem?: SubtitleItem;

  // Phase 6 Professional Color & Audio Studio
  colorGrading?: ClipColorGrading;
  audioEffects?: ClipAudioEffects;

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

export interface ShapeClip extends BaseClip {
  type: 'shape';
  shapeProps: ShapeProperties;
}

export interface LogoClip extends BaseClip {
  type: 'logo';
  logoProps: LogoOverlayProperties;
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
  audioSettings?: TrackMixerChannel;
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
  transitions?: TimelineTransition[];
  subtitleTracks?: SubtitleTrack[];
  masterBus?: MasterAudioBus;
  snapping: boolean;
  loop: boolean;
}

export interface Project {
  projectVersion: 1 | 2 | 3 | 4;
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
    transitions?: TimelineTransition[];
    subtitleTracks?: SubtitleTrack[];
    safeArea?: SafeAreaSettings;
    masterBus?: MasterAudioBus;
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
