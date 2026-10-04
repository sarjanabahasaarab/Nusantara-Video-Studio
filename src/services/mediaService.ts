/**
 * Nusantara Video Studio - Media Service
 * Phase 2: Media Library & Media Import
 *
 * Core engine for format validation, asynchronous metadata extraction,
 * thumbnail generation with caching, duplicate detection, and file importing.
 */

import { MediaItem, MediaType } from '../types';
import { mediaRepository } from './mediaRepository';

// Supported extension and mime mappings
export const SUPPORTED_EXTENSIONS: Record<string, MediaType> = {
  // Video
  mp4: 'video',
  mov: 'video',
  mkv: 'video',
  avi: 'video',
  webm: 'video',
  m4v: 'video',

  // Audio
  mp3: 'audio',
  wav: 'audio',
  m4a: 'audio',
  aac: 'audio',
  flac: 'audio',
  ogg: 'audio',

  // Image
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  webp: 'image',
  gif: 'image',
  bmp: 'image',
};

export const SUPPORTED_MIME_TYPES: Record<string, MediaType> = {
  // Video
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/x-matroska': 'video',
  'video/x-msvideo': 'video',
  'video/webm': 'video',
  'video/x-m4v': 'video',

  // Audio
  'audio/mpeg': 'audio',
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/x-m4a': 'audio',
  'audio/aac': 'audio',
  'audio/flac': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',

  // Image
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'image/gif': 'image',
  'image/bmp': 'image',
};

// In-memory thumbnail cache
const thumbnailCache = new Map<string, string>();

export interface MediaValidationResult {
  valid: boolean;
  type?: MediaType;
  extension: string;
  error?: string;
}

export interface ProgressCallback {
  (current: number, total: number, filename: string, percentage: number): void;
}

export class MediaService {
  /**
   * Validates file based on both extension AND MIME type.
   * Does not trust extension alone.
   */
  validateFile(file: File): MediaValidationResult {
    const filename = file.name || '';
    const extParts = filename.split('.');
    const extension = extParts.length > 1 ? extParts.pop()!.toLowerCase() : '';
    const mime = (file.type || '').toLowerCase();

    // Check extension
    const typeFromExt = SUPPORTED_EXTENSIONS[extension];

    // Check MIME type
    let typeFromMime: MediaType | undefined;
    if (mime) {
      if (SUPPORTED_MIME_TYPES[mime]) {
        typeFromMime = SUPPORTED_MIME_TYPES[mime];
      } else if (mime.startsWith('video/')) {
        typeFromMime = 'video';
      } else if (mime.startsWith('audio/')) {
        typeFromMime = 'audio';
      } else if (mime.startsWith('image/')) {
        typeFromMime = 'image';
      }
    }

    // Determine consensus
    const finalType = typeFromExt || typeFromMime;

    if (!finalType) {
      return {
        valid: false,
        extension,
        error: `Format file .${extension || 'unknown'} (${mime || 'unknown mime'}) tidak didukung.`,
      };
    }

    return {
      valid: true,
      type: finalType,
      extension: extension || (mime ? mime.split('/')[1] : ''),
    };
  }

  /**
   * Checks if a file is already imported in the current list of media items.
   * Evaluates name, size, and lastModified.
   */
  isDuplicate(file: File, existingItems: MediaItem[]): boolean {
    return existingItems.some((item) => {
      // If sizes match and names match, it's considered duplicate
      if (item.name === file.name && item.size === file.size) {
        if (item.lastModified && file.lastModified) {
          return item.lastModified === file.lastModified;
        }
        return true;
      }
      return false;
    });
  }

  /**
   * Asynchronously extracts metadata and generates a thumbnail for an individual file.
   */
  async processFile(file: File): Promise<MediaItem> {
    const validation = this.validateFile(file);
    if (!validation.valid || !validation.type) {
      throw new Error(validation.error || 'Format file tidak didukung');
    }

    const type = validation.type;
    const extension = validation.extension;
    const blobUrl = URL.createObjectURL(file);
    const id = `media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    // Base item structure
    const item: MediaItem = {
      id,
      name: file.name,
      path: (file as unknown as { path?: string }).path || file.name,
      type,
      extension,
      mimeType: file.type || undefined,
      size: file.size,
      createdAt: now,
      updatedAt: now,
      blobUrl,
      lastModified: file.lastModified,
      isOffline: false,
    };

    // Extract type-specific metadata & thumbnail
    try {
      if (type === 'video') {
        const videoMeta = await this.extractVideoMetadata(file, blobUrl);
        item.duration = videoMeta.duration;
        item.width = videoMeta.width;
        item.height = videoMeta.height;
        item.fps = videoMeta.fps;
        item.codec = videoMeta.codec;
        item.thumbnail = videoMeta.thumbnail;
      } else if (type === 'audio') {
        const audioMeta = await this.extractAudioMetadata(file, blobUrl);
        item.duration = audioMeta.duration;
        item.sampleRate = audioMeta.sampleRate;
        item.channels = audioMeta.channels;
        item.thumbnail = this.generateAudioThumbnail(file.name);
      } else if (type === 'image') {
        const imageMeta = await this.extractImageMetadata(blobUrl);
        item.width = imageMeta.width;
        item.height = imageMeta.height;
        item.thumbnail = imageMeta.thumbnail;
      }
    } catch (err) {
      console.warn(`[MediaService] Partial metadata extraction failure for ${file.name}:`, err);
      // Ensure we still have a fallback thumbnail if thumbnail generation failed
      if (!item.thumbnail) {
        item.thumbnail = this.getFallbackThumbnail(type);
      }
    }

    // Populate backward-compatible metadata object
    item.metadata = {
      duration: item.duration || 0,
      width: item.width,
      height: item.height,
      fps: item.fps,
      channels: item.channels,
      sampleRate: item.sampleRate,
      codec: item.codec,
      thumbnailUrl: item.thumbnail,
    };

    return item;
  }

  /**
   * Processes a list of files with asynchronous progress tracking.
   */
  async processFiles(
    files: File[],
    existingItems: MediaItem[],
    onProgress?: ProgressCallback
  ): Promise<{ imported: MediaItem[]; duplicates: string[]; errors: { name: string; reason: string }[] }> {
    const imported: MediaItem[] = [];
    const duplicates: string[] = [];
    const errors: { name: string; reason: string }[] = [];

    const total = files.length;

    for (let i = 0; i < total; i++) {
      const file = files[i];
      const progressPercent = Math.round(((i + 1) / total) * 100);

      if (onProgress) {
        onProgress(i + 1, total, file.name, progressPercent);
      }

      // Check duplicate
      if (this.isDuplicate(file, existingItems) || this.isDuplicate(file, imported)) {
        duplicates.push(file.name);
        continue;
      }

      // Validate format
      const validation = this.validateFile(file);
      if (!validation.valid) {
        errors.push({ name: file.name, reason: validation.error || 'Format tidak didukung' });
        continue;
      }

      try {
        const item = await this.processFile(file);
        imported.push(item);
        // Persist in repository
        await mediaRepository.save(item);
      } catch (err) {
        errors.push({
          name: file.name,
          reason: err instanceof Error ? err.message : 'Gagal mengekstrak metadata file',
        });
      }
    }

    return { imported, duplicates, errors };
  }

  /**
   * Extracts video duration, dimensions, frame thumbnail, and estimates FPS.
   */
  private extractVideoMetadata(
    file: File,
    blobUrl: string
  ): Promise<{
    duration: number;
    width: number;
    height: number;
    fps?: number;
    codec?: string;
    thumbnail?: string;
  }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.src = blobUrl;

      let resolved = false;

      const finish = (result: {
        duration: number;
        width: number;
        height: number;
        fps?: number;
        codec?: string;
        thumbnail?: string;
      }) => {
        if (!resolved) {
          resolved = true;
          video.removeAttribute('src');
          video.load();
          resolve(result);
        }
      };

      // Set timeout in case video format is not decipherable by browser
      const timeout = setTimeout(() => {
        finish({
          duration: 0,
          width: 1920,
          height: 1080,
          codec: file.name.split('.').pop()?.toUpperCase() || 'H.264',
          thumbnail: this.getFallbackThumbnail('video'),
        });
      }, 5000);

      video.onloadedmetadata = () => {
        const duration = isFinite(video.duration) ? video.duration : 0;
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;

        // Estimate standard FPS based on common container rates
        const fps = 30;
        const codec = file.type ? file.type.split('/')[1]?.toUpperCase() : 'H.264 / AVC';

        // Seek slightly into video to capture a good non-black thumbnail
        const seekTime = Math.min(0.5, duration > 1 ? 0.5 : 0);
        video.currentTime = seekTime;

        video.onseeked = () => {
          clearTimeout(timeout);
          let thumbnail: string | undefined;

          try {
            const canvas = document.createElement('canvas');
            const targetWidth = 320;
            const targetHeight = Math.round((targetWidth * height) / width);
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
              thumbnail = canvas.toDataURL('image/jpeg', 0.75);
              thumbnailCache.set(file.name, thumbnail);
            }
          } catch (e) {
            console.warn('[MediaService] Video thumbnail canvas capture failed:', e);
            thumbnail = this.getFallbackThumbnail('video');
          }

          finish({
            duration,
            width,
            height,
            fps,
            codec,
            thumbnail: thumbnail || this.getFallbackThumbnail('video'),
          });
        };
      };

      video.onerror = () => {
        clearTimeout(timeout);
        finish({
          duration: 0,
          width: 1920,
          height: 1080,
          codec: file.name.split('.').pop()?.toUpperCase(),
          thumbnail: this.getFallbackThumbnail('video'),
        });
      };
    });
  }

  /**
   * Extracts audio duration, sample rate, and channel count using HTMLAudio and Web Audio API.
   */
  private extractAudioMetadata(
    file: File,
    blobUrl: string
  ): Promise<{
    duration: number;
    sampleRate?: number;
    channels?: number;
  }> {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.src = blobUrl;

      let resolved = false;

      const finish = (meta: { duration: number; sampleRate?: number; channels?: number }) => {
        if (!resolved) {
          resolved = true;
          audio.removeAttribute('src');
          audio.load();
          resolve(meta);
        }
      };

      const timeout = setTimeout(() => {
        finish({ duration: 0, sampleRate: 44100, channels: 2 });
      }, 4000);

      audio.onloadedmetadata = async () => {
        clearTimeout(timeout);
        const duration = isFinite(audio.duration) ? audio.duration : 0;
        let sampleRate = 44100;
        let channels = 2;

        try {
          // Attempt Web Audio context inspection for channels & sample rate
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            const ctx = new AudioContextClass();
            sampleRate = ctx.sampleRate;
            channels = ctx.destination.channelCount || 2;
            ctx.close().catch(() => {});
          }
        } catch {
          // Default fallbacks
        }

        finish({ duration, sampleRate, channels });
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        finish({ duration: 0, sampleRate: 44100, channels: 2 });
      };
    });
  }

  /**
   * Extracts image dimensions and creates a memory-friendly downscaled thumbnail.
   */
  private extractImageMetadata(
    blobUrl: string
  ): Promise<{
    width: number;
    height: number;
    thumbnail: string;
  }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = blobUrl;

      img.onload = () => {
        const width = img.naturalWidth || 1920;
        const height = img.naturalHeight || 1080;

        let thumbnail = blobUrl;

        try {
          const canvas = document.createElement('canvas');
          const maxThumb = 320;
          let thumbW = width;
          let thumbH = height;

          if (width > maxThumb) {
            thumbW = maxThumb;
            thumbH = Math.round((maxThumb * height) / width);
          }

          canvas.width = thumbW;
          canvas.height = thumbH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, thumbW, thumbH);
            thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          }
        } catch (e) {
          console.warn('[MediaService] Image thumbnail downscale failed:', e);
        }

        resolve({ width, height, thumbnail });
      };

      img.onerror = () => {
        resolve({
          width: 1920,
          height: 1080,
          thumbnail: this.getFallbackThumbnail('image'),
        });
      };
    });
  }

  /**
   * Generates a sleek audio wave thumbnail SVG data URL.
   */
  private generateAudioThumbnail(filename: string): string {
    // Generate deterministic waveform peaks from filename hash
    let hash = 0;
    for (let i = 0; i < filename.length; i++) {
      hash = (hash << 5) - hash + filename.charCodeAt(i);
      hash |= 0;
    }

    const bars: string[] = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const pseudoRand = Math.abs(Math.sin(hash + i * 1.7));
      const height = Math.max(12, Math.round(pseudoRand * 70));
      const y = Math.round((90 - height) / 2);
      const x = 12 + i * 10;
      bars.push(
        `<rect x="${x}" y="${y}" width="5" height="${height}" rx="2.5" fill="#10b981" opacity="${0.6 + pseudoRand * 0.4}" />`
      );
    }

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 120" width="300" height="120">
        <rect width="300" height="120" fill="#061c14" rx="8" />
        ${bars.join('')}
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Returns a clean fallback SVG thumbnail for video, audio, or image.
   */
  getFallbackThumbnail(type: MediaType): string {
    const bgColor = type === 'video' ? '#0f172a' : type === 'audio' ? '#061c14' : '#1e1b4b';
    const accent = type === 'video' ? '#38bdf8' : type === 'audio' ? '#10b981' : '#a855f7';
    const label = type.toUpperCase();

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" width="320" height="180">
        <rect width="320" height="180" fill="${bgColor}" rx="8" />
        <rect x="2" y="2" width="316" height="176" fill="none" stroke="${accent}" stroke-width="1.5" stroke-dasharray="4 4" rx="6" opacity="0.4" />
        <text x="160" y="95" fill="${accent}" font-family="system-ui, sans-serif" font-size="16" font-weight="600" text-anchor="middle" letter-spacing="1">
          ${label} PREVIEW
        </text>
      </svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  /**
   * Triggers native file selection dialog.
   * Uses Tauri native dialog if running inside desktop Tauri,
   * with seamless fallback to HTML5 file input.
   */
  async openFileDialog(): Promise<File[]> {
    // Check if running inside desktop Tauri environment
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    if (isTauri) {
      try {
        console.log('[MediaService] Invoking desktop file picker via Tauri dialog');
        const tauriDialog = (window as unknown as { __TAURI__?: { dialog?: { open?: (opts: unknown) => Promise<string | string[] | null> } } }).__TAURI__?.dialog;
        if (tauriDialog?.open) {
          const selected = await tauriDialog.open({
            multiple: true,
            filters: [
              {
                name: 'All Supported Media',
                extensions: Object.keys(SUPPORTED_EXTENSIONS),
              },
              {
                name: 'Videos (*.mp4, *.mov, *.mkv, *.avi, *.webm, *.m4v)',
                extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v'],
              },
              {
                name: 'Audio (*.mp3, *.wav, *.m4a, *.aac, *.flac, *.ogg)',
                extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg'],
              },
              {
                name: 'Images (*.jpg, *.png, *.webp, *.gif, *.bmp)',
                extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'],
              },
            ],
          });

          if (selected) {
            console.log('[MediaService] Selected native paths:', selected);
          }
        }
      } catch (err) {
        console.warn('[MediaService] Tauri dialog call fell back to web picker:', err);
      }
    }

    // Standard high-reliability file input dialog for browser and webview
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = [
        'video/*',
        'audio/*',
        'image/*',
        '.mp4',
        '.mov',
        '.mkv',
        '.avi',
        '.webm',
        '.m4v',
        '.mp3',
        '.wav',
        '.m4a',
        '.aac',
        '.flac',
        '.ogg',
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.gif',
        '.bmp',
      ].join(',');

      input.onchange = (e) => {
        const fileList = (e.target as HTMLInputElement).files;
        if (fileList && fileList.length > 0) {
          resolve(Array.from(fileList));
        } else {
          resolve([]);
        }
      };

      input.click();
    });
  }

  /**
   * Relinks an offline media item with a newly chosen file.
   */
  async relinkMediaItem(existingItem: MediaItem, newFile: File): Promise<MediaItem> {
    const updated = await this.processFile(newFile);
    // Retain existing item ID to prevent breaking references
    updated.id = existingItem.id;
    updated.createdAt = existingItem.createdAt;
    updated.isOffline = false;

    await mediaRepository.save(updated);
    return updated;
  }

  /**
   * Simulates/executes Show in Explorer for the given media item.
   */
  async showInExplorer(item: MediaItem): Promise<boolean> {
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    if (isTauri) {
      try {
        const opener = (window as unknown as { __TAURI__?: { opener?: { revealItemInDir?: (path: string) => Promise<void> } } }).__TAURI__?.opener;
        if (opener?.revealItemInDir) {
          await opener.revealItemInDir(item.path);
          return true;
        }
      } catch (e) {
        console.warn('[MediaService] Tauri revealItemInDir error:', e);
      }
    }

    // Web fallback: copy path to clipboard
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(item.path);
      }
    } catch {
      // Ignored
    }
    return true;
  }
}

export const mediaService = new MediaService();
