/**
 * Nusantara Video Studio - Database Service Abstraction
 * Designed for SQLite integration via Tauri in Phase 2,
 * with fallback storage for web preview environment.
 */

import { AppSettings, MediaItem, Project } from '../types';

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface IProjectRepository {
  getById(id: string): Promise<DatabaseResult<Project>>;
  getAll(): Promise<DatabaseResult<Project[]>>;
  save(project: Project): Promise<DatabaseResult<boolean>>;
  delete(id: string): Promise<DatabaseResult<boolean>>;
}

export interface IMediaCacheRepository {
  cacheItem(item: MediaItem): Promise<DatabaseResult<boolean>>;
  getAll(): Promise<DatabaseResult<MediaItem[]>>;
  remove(id: string): Promise<DatabaseResult<boolean>>;
  clear(): Promise<DatabaseResult<boolean>>;
}

export interface ISettingsRepository {
  get(): Promise<DatabaseResult<AppSettings | null>>;
  save(settings: AppSettings): Promise<DatabaseResult<boolean>>;
}

class ProjectRepository implements IProjectRepository {
  private storageKey = 'nvs_projects_v1';

  async getById(id: string): Promise<DatabaseResult<Project>> {
    try {
      const all = await this.getAll();
      if (!all.success || !all.data) {
        return { success: false, error: 'Project not found' };
      }
      const found = all.data.find((p) => p.id === id);
      return found ? { success: true, data: found } : { success: false, error: 'Project not found' };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async getAll(): Promise<DatabaseResult<Project[]>> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const data: Project[] = raw ? JSON.parse(raw) : [];
      return { success: true, data };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async save(project: Project): Promise<DatabaseResult<boolean>> {
    try {
      const allRes = await this.getAll();
      const list = allRes.data || [];
      const index = list.findIndex((p) => p.id === project.id);
      if (index >= 0) {
        list[index] = project;
      } else {
        list.push(project);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async delete(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const allRes = await this.getAll();
      const list = (allRes.data || []).filter((p) => p.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
}

class MediaCacheRepository implements IMediaCacheRepository {
  private storageKey = 'nvs_media_cache_v1';

  async cacheItem(item: MediaItem): Promise<DatabaseResult<boolean>> {
    try {
      const all = await this.getAll();
      const list = all.data || [];
      const idx = list.findIndex((m) => m.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.push(item);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(list));
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async getAll(): Promise<DatabaseResult<MediaItem[]>> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return { success: true, data: raw ? JSON.parse(raw) : [] };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async remove(id: string): Promise<DatabaseResult<boolean>> {
    try {
      const all = await this.getAll();
      const filtered = (all.data || []).filter((m) => m.id !== id);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async clear(): Promise<DatabaseResult<boolean>> {
    try {
      localStorage.removeItem(this.storageKey);
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
}

class SettingsRepository implements ISettingsRepository {
  private storageKey = 'nvs_settings_v1';

  async get(): Promise<DatabaseResult<AppSettings | null>> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return { success: true, data: raw ? JSON.parse(raw) : null };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  async save(settings: AppSettings): Promise<DatabaseResult<boolean>> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(settings));
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }
}

export class DatabaseService {
  public projects: IProjectRepository;
  public mediaCache: IMediaCacheRepository;
  public settings: ISettingsRepository;
  private isInitialized = false;

  constructor() {
    this.projects = new ProjectRepository();
    this.mediaCache = new MediaCacheRepository();
    this.settings = new SettingsRepository();
  }

  /**
   * Initializes the database connection.
   * In Tauri Desktop mode (Phase 2), this will establish the SQLite connection via plugin-sql.
   */
  async initialize(): Promise<DatabaseResult<boolean>> {
    try {
      // Check if running inside Tauri environment
      const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
      if (isTauri) {
        console.log('[DatabaseService] Tauri runtime detected. SQLite layer ready for Phase 2.');
      } else {
        console.log('[DatabaseService] Web runtime detected. Using web storage layer.');
      }
      this.isInitialized = true;
      return { success: true, data: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      engine: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window ? 'SQLite (Tauri)' : 'Web Storage (Hybrid)',
    };
  }
}

export const databaseService = new DatabaseService();
