/**
 * Nusantara Video Studio - Autosave & Crash Recovery Engine
 * Phase 8: Professional Editing Workflow
 *
 * Implements automated atomic snapshotting, rolling version history,
 * crash detection flags, and recovery workflows.
 */

import { Project, AutosaveConfig, RecoverySessionInfo, ProjectBackupItem } from '../../types';

export const DEFAULT_AUTOSAVE_CONFIG: AutosaveConfig = {
  enabled: true,
  intervalMinutes: 5,
  keepVersions: 20,
  location: 'project',
};

export class AutosaveRecoveryManager {
  private static STORAGE_PREFIX = 'nvs_autosave_';
  private static SESSION_ACTIVE_KEY = 'nvs_active_session_flag';
  private static BACKUPS_KEY = 'nvs_backups_list_v8';
  private static memoryStore = new Map<string, string>();

  private static getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {
        return this.memoryStore.get(key) || null;
      }
    }
    return this.memoryStore.get(key) || null;
  }

  private static setItem(key: string, val: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, val);
      } catch {
        // Fallback
      }
    }
    this.memoryStore.set(key, val);
  }

  private static removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {
        // Fallback
      }
    }
    this.memoryStore.delete(key);
  }

  /**
   * Marks that an active editing session is currently running
   */
  static markSessionActive(projectId: string, projectName: string): void {
    try {
      this.setItem(
        this.SESSION_ACTIVE_KEY,
        JSON.stringify({
          projectId,
          projectName,
          startedAt: new Date().toISOString(),
          cleanExit: false,
        })
      );
    } catch {
      // Ignore
    }
  }

  /**
   * Marks that the session exited cleanly (e.g. user closed project or saved)
   */
  static markSessionCleanExit(): void {
    try {
      this.removeItem(this.SESSION_ACTIVE_KEY);
    } catch {
      // Ignore
    }
  }

  /**
   * Checks if an unexpected crash or unclean exit occurred
   */
  static checkForCrashRecovery(currentProjectId?: string): RecoverySessionInfo | null {
    try {
      const activeRaw = this.getItem(this.SESSION_ACTIVE_KEY);
      if (!activeRaw) return null;

      const activeInfo = JSON.parse(activeRaw);
      if (activeInfo.cleanExit) return null;

      // Look up latest autosave snapshot for this project
      const autosaveKey = `${this.STORAGE_PREFIX}${activeInfo.projectId}`;
      const savedData = this.getItem(autosaveKey);

      if (savedData) {
        const parsed = JSON.parse(savedData);
        return {
          projectId: activeInfo.projectId,
          projectName: activeInfo.projectName || parsed.project?.name || 'Untitled',
          lastSavedAt: parsed.timestamp || activeInfo.startedAt,
          recoveredAt: new Date().toISOString(),
          recoveredProject: parsed.project,
        };
      }
    } catch {
      // Ignore
    }
    return null;
  }

  /**
   * Saves an atomic rolling autosave snapshot
   */
  static saveAutosaveSnapshot(project: Project, keepVersions = 20): void {
    try {
      const key = `${this.STORAGE_PREFIX}${project.id}`;
      const payload = {
        projectId: project.id,
        timestamp: new Date().toISOString(),
        project,
      };

      // Atomic write to storage
      this.setItem(key, JSON.stringify(payload));

      // Append to rolling version history
      this.recordVersionBackup(project, 'Autosave Version', keepVersions);
    } catch (err) {
      console.warn('[Autosave] Failed to write snapshot:', err);
    }
  }

  /**
   * Creates an explicit user backup (.nvbackup snapshot)
   */
  static recordVersionBackup(project: Project, label = 'User Backup', maxKeep = 20): ProjectBackupItem {
    const list = this.getVersionHistory(project.id);
    const newItem: ProjectBackupItem = {
      id: `backup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      projectId: project.id,
      versionLabel: `v${list.length + 1} • ${label}`,
      timestamp: new Date().toISOString(),
      sizeBytes: JSON.stringify(project).length,
      snapshot: project,
    };

    const updated = [newItem, ...list].slice(0, maxKeep);
    try {
      this.setItem(`${this.BACKUPS_KEY}_${project.id}`, JSON.stringify(updated));
    } catch {
      // Ignore
    }

    return newItem;
  }

  /**
   * Retrieves all backup versions for a project
   */
  static getVersionHistory(projectId: string): ProjectBackupItem[] {
    try {
      const raw = this.getItem(`${this.BACKUPS_KEY}_${projectId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
    return [];
  }

  /**
   * Removes a backup version by ID
   */
  static deleteBackupVersion(projectId: string, backupId: string): void {
    const list = this.getVersionHistory(projectId).filter((b) => b.id !== backupId);
    try {
      this.setItem(`${this.BACKUPS_KEY}_${projectId}`, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }

  /**
   * Clears crash recovery for a project
   */
  static discardRecovery(projectId: string): void {
    try {
      this.removeItem(`${this.STORAGE_PREFIX}${projectId}`);
      this.markSessionCleanExit();
    } catch {
      // Ignore
    }
  }

  /**
   * Convenience helpers
   */
  static createBackup(project: Project, label = 'User Backup'): ProjectBackupItem {
    return this.recordVersionBackup(project, label);
  }

  static getBackups(projectId: string): ProjectBackupItem[] {
    return this.getVersionHistory(projectId);
  }

  static deleteBackup(backupId: string, projectId?: string): void {
    if (projectId) {
      this.deleteBackupVersion(projectId, backupId);
    }
  }

  static saveCrashRecoverySession(project: Project): void {
    this.markSessionActive(project.id, project.name);
    this.saveAutosaveSnapshot(project);
  }

  static getPendingRecovery(): RecoverySessionInfo | null {
    return this.checkForCrashRecovery();
  }

  static clearCrashRecoverySession(): void {
    this.markSessionCleanExit();
  }
}
