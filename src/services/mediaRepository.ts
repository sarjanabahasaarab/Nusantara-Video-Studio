/**
 * Nusantara Video Studio - Media Repository
 * Phase 2: Media Library & Media Import
 *
 * Repository abstraction for storing and querying MediaItems persistently.
 * Ready for SQLite (Tauri) with hybrid web fallback.
 */

import { MediaItem } from '../types';
import { databaseService } from './databaseService';

export interface IMediaRepository {
  getAll(): Promise<MediaItem[]>;
  getById(id: string): Promise<MediaItem | null>;
  save(item: MediaItem): Promise<boolean>;
  saveAll(items: MediaItem[]): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  deleteMultiple(ids: string[]): Promise<boolean>;
  clear(): Promise<boolean>;
  exists(id: string): Promise<boolean>;
}

export class MediaRepository implements IMediaRepository {
  private storageKey = 'nvs_media_items_v2';

  async getAll(): Promise<MediaItem[]> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const items: MediaItem[] = JSON.parse(raw);
      return Array.isArray(items) ? items : [];
    } catch (err) {
      console.error('[MediaRepository] Failed to read media items:', err);
      return [];
    }
  }

  async getById(id: string): Promise<MediaItem | null> {
    const items = await this.getAll();
    return items.find((item) => item.id === id) || null;
  }

  async save(item: MediaItem): Promise<boolean> {
    try {
      const items = await this.getAll();
      const index = items.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        items[index] = item;
      } else {
        items.unshift(item);
      }
      this.writeStorage(items);
      // Also cache in databaseService for cross-subsystem consistency
      await databaseService.mediaCache.cacheItem(item);
      return true;
    } catch (err) {
      console.error('[MediaRepository] Failed to save item:', err);
      return false;
    }
  }

  async saveAll(items: MediaItem[]): Promise<boolean> {
    try {
      const current = await this.getAll();
      const map = new Map<string, MediaItem>();
      current.forEach((item) => map.set(item.id, item));
      items.forEach((item) => map.set(item.id, item));
      const combined = Array.from(map.values());
      this.writeStorage(combined);
      return true;
    } catch (err) {
      console.error('[MediaRepository] Failed to save all items:', err);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const items = await this.getAll();
      const filtered = items.filter((i) => i.id !== id);
      this.writeStorage(filtered);
      await databaseService.mediaCache.remove(id);
      return true;
    } catch (err) {
      console.error('[MediaRepository] Failed to delete item:', err);
      return false;
    }
  }

  async deleteMultiple(ids: string[]): Promise<boolean> {
    try {
      const idSet = new Set(ids);
      const items = await this.getAll();
      const filtered = items.filter((i) => !idSet.has(i.id));
      this.writeStorage(filtered);
      for (const id of ids) {
        await databaseService.mediaCache.remove(id);
      }
      return true;
    } catch (err) {
      console.error('[MediaRepository] Failed to delete multiple items:', err);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      localStorage.removeItem(this.storageKey);
      await databaseService.mediaCache.clear();
      return true;
    } catch (err) {
      console.error('[MediaRepository] Failed to clear media:', err);
      return false;
    }
  }

  async exists(id: string): Promise<boolean> {
    const item = await this.getById(id);
    return item !== null;
  }

  private writeStorage(items: MediaItem[]): void {
    // Sanitize in-memory blob URLs when saving to persistent storage
    const sanitized = items.map((item) => {
      const copy = { ...item };
      // Blob URLs expire across sessions, so keep original path and metadata
      delete copy.blobUrl;
      return copy;
    });
    localStorage.setItem(this.storageKey, JSON.stringify(sanitized));
  }
}

export const mediaRepository = new MediaRepository();
