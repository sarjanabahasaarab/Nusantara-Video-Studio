/**
 * Nusantara Video Studio - Professional Editing Workflow Types
 * Phase 8: Professional Editing Workflow
 */

import { FrameRate, AspectRatio, ResolutionPreset, ClipType } from './index';

// -------------------------------------------------------------
// 1. PROJECT METADATA & RECENT PROJECTS
// -------------------------------------------------------------

export interface ProjectMetadata {
  id: string;
  name: string;
  description?: string;
  author?: string;
  createdAt: string;
  modifiedAt: string;
  applicationVersion: string;
  schemaVersion: number;
  frameRate: number;
  width: number;
  height: number;
  aspectRatio: string;
  client?: string;
  production?: string;
  notes?: string;
  copyright?: string;
  keywords?: string[];
}

export interface RecentProjectItem {
  id: string;
  name: string;
  path: string;
  lastOpened: string; // ISO string
  sizeBytes: number;
  version: string;
  thumbnailUrl?: string;
  projectData?: any;
}

// -------------------------------------------------------------
// 2. PROJECT BINS & MEDIA ORGANIZATION
// -------------------------------------------------------------

export interface ProjectBin {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  mediaIds: string[];
  isOpen?: boolean;
  createdAt: string;
}

// -------------------------------------------------------------
// 3. PROXY MEDIA SYSTEM
// -------------------------------------------------------------

export type ProxyResolution = 'original' | 'half' | 'quarter' | '540p' | '720p';
export type ProxyFormat = 'mp4' | 'webm' | 'prores-proxy';
export type ProxyQuality = 'draft' | 'standard' | 'high';
export type ProxyStatus = 'ready' | 'generating' | 'missing' | 'disabled';

export interface ProxySettings {
  enabled: boolean;
  resolution: ProxyResolution;
  format: ProxyFormat;
  quality: ProxyQuality;
  location: 'project' | 'custom';
  customPath?: string;
  autoGenerateOnImport: boolean;
}

export interface ProxyMediaInfo {
  enabled: boolean;
  status: ProxyStatus;
  resolution: ProxyResolution;
  format: ProxyFormat;
  quality: ProxyQuality;
  proxyPath?: string;
  proxyBlobUrl?: string;
  generatedAt?: string;
  progress?: number;
  fileSize?: number;
}

// -------------------------------------------------------------
// 4. MEDIA REFERENCE & RELINK SYSTEM
// -------------------------------------------------------------

export type MediaStatus = 'online' | 'offline' | 'proxy-only';

export interface MediaReference {
  id: string;
  originalPath?: string;
  currentPath?: string;
  relativePath?: string;
  filename: string;
  size?: number;
  duration?: number;
  hash?: string;
  status: MediaStatus;
  proxy?: ProxyMediaInfo;
  binId?: string | null;
}

export type RelinkConfidence = 'Strong Match' | 'Possible Match' | 'No Match';

export interface RelinkCandidate {
  missingMediaId: string;
  missingFilename: string;
  originalPath?: string;
  matchedFilename: string;
  matchedPath: string;
  matchedSize: number;
  matchedDuration?: number;
  matchedBlobUrl?: string;
  confidence: RelinkConfidence;
  matchScore: number; // 0 - 100
  reasons: string[];
}

export interface RelinkFolderResult {
  totalMissing: number;
  filesScanned: number;
  strongMatchesCount: number;
  possibleMatchesCount: number;
  unmatchedCount: number;
  candidates: RelinkCandidate[];
}

// -------------------------------------------------------------
// 5. PROJECT ARCHIVE & PACKAGE
// -------------------------------------------------------------

export interface ArchiveOptions {
  includeProjectFile: boolean;
  includeUsedMedia: boolean;
  includeAudio: boolean;
  includeImages: boolean;
  includeGraphics: boolean;
  includeSubtitles: boolean;
  includeProxyFiles: boolean;
  includeCache: boolean;
  includeUnusedMedia: boolean;
  destinationFolder?: string;
}

export interface ArchiveValidation {
  usedMediaCount: number;
  missingMediaCount: number;
  unusedMediaCount: number;
  proxyFilesCount: number;
  totalEstimatedBytes: number;
  warnings: string[];
  canProceed: boolean;
}

export interface ProjectPackageManifest {
  manifestVersion: number;
  archiveName: string;
  createdAt: string;
  appVersion: string;
  schemaVersion: number;
  mediaCount: number;
  totalSizeBytes: number;
  hasProxy: boolean;
}

// -------------------------------------------------------------
// 6. AUTOSAVE, RECOVERY & BACKUP
// -------------------------------------------------------------

export interface AutosaveConfig {
  enabled: boolean;
  intervalMinutes: number; // default 5 min
  keepVersions: number; // default 20
  location: 'project' | 'custom';
  customPath?: string;
}

export interface RecoverySessionInfo {
  projectId: string;
  projectName: string;
  lastSavedAt: string;
  recoveredAt: string;
  recoveredProject: any;
}

export interface ProjectBackupItem {
  id: string;
  projectId: string;
  versionLabel: string;
  timestamp: string;
  sizeBytes: number;
  snapshot: any;
}

// -------------------------------------------------------------
// 7. PROFESSIONAL MARKER SYSTEM
// -------------------------------------------------------------

export type MarkerType =
  | 'general'
  | 'chapter'
  | 'edit'
  | 'review'
  | 'scene'
  | 'ai'
  | 'audio'
  | 'color'
  | 'export';

export interface Marker {
  id: string;
  timelineId: string;
  time: number; // in seconds
  duration?: number; // for range markers
  name: string;
  description?: string;
  color?: string;
  type: MarkerType;
  trackId?: string;
}

// -------------------------------------------------------------
// 8. MULTICAM PREPARATION
// -------------------------------------------------------------

export type MulticamSyncMethod = 'timecode' | 'audio' | 'manual';

export interface MulticamAngle {
  id: string;
  name: string; // e.g. "Camera A", "Camera B"
  mediaId: string;
  timeOffsetSec: number;
}

export interface MulticamGroup {
  id: string;
  name: string;
  clips: string[]; // media IDs
  syncMethod: MulticamSyncMethod;
  angles: MulticamAngle[];
  audioSourceMediaId?: string;
  createdAt: string;
}

// -------------------------------------------------------------
// 9. KEYBOARD SHORTCUTS & COMMAND PALETTE
// -------------------------------------------------------------

export type ShortcutCategory =
  | 'General'
  | 'Timeline'
  | 'Media'
  | 'Playback'
  | 'Markers'
  | 'AI'
  | 'Color'
  | 'Audio'
  | 'Text'
  | 'Export'
  | 'Navigation';

export interface CommandShortcut {
  id: string;
  command: string;
  description: string;
  category: ShortcutCategory;
  defaultKey: string;
  customKey?: string;
}

export type ShortcutPreset =
  | 'Nusantara Default'
  | 'Premiere-style'
  | 'Final Cut-style'
  | 'Custom'
  | 'default'
  | 'premiere'
  | 'final-cut'
  | 'custom';

export interface CommandPaletteAction {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  keywords?: string[];
  execute: () => void;
}

// -------------------------------------------------------------
// 10. WORKSPACES & LAYOUT
// -------------------------------------------------------------

export type StudioWorkspaceId =
  | 'edit'
  | 'color'
  | 'audio'
  | 'ai'
  | 'graphics'
  | 'media';

export interface CustomWorkspace {
  id: string;
  name: string;
  sidebarWidth: number;
  propertiesWidth: number;
  timelineHeight: number;
  sidebarTab: string;
  visiblePanels: string[];
  previewQuality: string;
  createdAt: string;
}

export interface DisplayInfo {
  id: string;
  name: string;
  isPrimary: boolean;
  width: number;
  height: number;
}

// -------------------------------------------------------------
// 11. PERFORMANCE, CACHE & BACKGROUND TASKS
// -------------------------------------------------------------

export interface SystemPerformanceMetrics {
  cpuUsagePercent?: number; // or undefined if unavailable
  ramUsedMb?: number;
  ramTotalMb?: number;
  fps: number;
  droppedFrames: number;
  timelineClipCount: number;
  mediaItemCount: number;
  activeBackgroundTasks: number;
  playbackQuality: 'full' | 'half' | 'quarter' | 'draft';
}

export interface MediaCacheStats {
  waveformsBytes: number;
  thumbnailsBytes: number;
  proxyBytes: number;
  aiMetadataBytes: number;
  previewCacheBytes: number;
  totalBytes: number;
  maxBytes: number;
}

export type TaskType =
  | 'proxy'
  | 'media_analysis'
  | 'ai_transcription'
  | 'scene_detection'
  | 'waveform'
  | 'thumbnail'
  | 'archive'
  | 'render'
  | 'ai'
  | 'relink';

export type TaskPriority = 'high' | 'normal' | 'low';
export type TaskStatus =
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  title: string;
  name?: string; // alias for title
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0 - 100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

// -------------------------------------------------------------
// 12. PROJECT HEALTH CHECK & DIAGNOSTICS
// -------------------------------------------------------------

export interface HealthIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category:
    | 'media'
    | 'proxy'
    | 'effects'
    | 'fonts'
    | 'lut'
    | 'subtitles'
    | 'ai'
    | 'cache';
  title: string;
  description: string;
  message?: string;
  suggestion?: string;
  fixable: boolean;
  fixAction?: string;
}

export interface ProjectHealthReport {
  status: 'Healthy' | 'Warnings' | 'Critical';
  healthyScore: number; // 0 - 100
  healthScore?: number; // alias
  errorsCount: number;
  warningsCount: number;
  issues: HealthIssue[];
  scannedAt: string;
  totalMediaCount?: number;
  timelineClipsCount?: number;
  missingFilesCount?: number;
  unusedMediaIds?: string[];
  timelineGapsCount?: number;
  unproxiedVideosCount?: number;
}

export interface AppDiagnosticInfo {
  appVersion: string;
  os: string;
  tauriVersion: string;
  ffmpegStatus: string;
  gpuRenderer: string;
  cpuCores: number;
  schemaVersion: number;
  activeProvider: string;
  lastTask?: string;
  lastError?: string;
  uptimeSec: number;
  memoryUsageMb?: number;
}
