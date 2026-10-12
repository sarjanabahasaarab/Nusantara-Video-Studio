/**
 * Nusantara Video Studio - File Service
 * Handles reading and writing native .nvproj project files
 */

import { Project } from '../types';

export class FileService {
  /**
   * Serializes project to formatted JSON string (.nvproj format)
   * Phase 6: Full serialization of color grading (basic, curves, wheels, HSL, LUT, vignette),
   * audio mixer channels, master bus, 5-band EQ, compressor, limiter, and audio keyframes.
   */
  /**
   * Serializes project to formatted JSON string (.nvproj format)
   * Phase 10: Production Release v1.0.0 (Schema Version 7)
   */
  serializeProject(project: Project): string {
    const filePayload = {
      projectVersion: project.projectVersion || 7,
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: new Date().toISOString(),
      settings: project.settings,
      media: project.media,
      timeline: project.timeline,
      aiMetadata: project.aiMetadata,
      bins: project.bins,
      multicamGroups: project.multicamGroups,
      proxySettings: project.proxySettings,
      projectMetadata: project.projectMetadata,
      renderSettings: project.renderSettings,
      exportHistory: project.exportHistory,
      migrationHistory: project.migrationHistory || [],
      metadata: {
        appVersion: '1.0.0',
        appName: 'Nusantara Video Studio',
        lastSavedBy: 'Nusantara Video Studio v1.0.0',
      },
    };

    return JSON.stringify(filePayload, null, 2);
  }

  /**
   * Validates project object against schema specifications (v1 to v7)
   */
  validateProjectSchema(projectObj: any): boolean {
    if (!projectObj || typeof projectObj !== 'object') return false;
    if (![1, 2, 3, 4, 5, 6, 7].includes(projectObj.projectVersion)) return false;
    if (!projectObj.name || !projectObj.settings || !projectObj.timeline) return false;
    return true;
  }

  /**
   * Automatically migrates legacy projects (v1 - v6) to the v7 production schema
   */
  migrateProject(legacy: any): Project {
    const originalVersion = legacy.projectVersion || 1;
    const history = Array.isArray(legacy.migrationHistory) ? [...legacy.migrationHistory] : [];

    if (originalVersion < 7) {
      history.push({
        fromVersion: originalVersion,
        toVersion: 7,
        date: new Date().toISOString(),
      });
    }

    const migrated: Project = {
      ...legacy,
      projectVersion: 7,
      bins: legacy.bins || [],
      multicamGroups: legacy.multicamGroups || [],
      proxySettings: legacy.proxySettings || {
        enabled: false,
        resolution: '540p',
        codec: 'h264',
        autoGenerateOnImport: false,
      },
      projectMetadata: legacy.projectMetadata || {
        schemaVersion: 7,
        frameRate: legacy.settings?.fps || 30,
        width: legacy.settings?.width || 1920,
        height: legacy.settings?.height || 1080,
        aspectRatio: legacy.settings?.aspectRatio || '16:9',
        createdAt: legacy.createdAt || new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      migrationHistory: history,
      metadata: {
        appVersion: '1.0.0',
        appName: 'Nusantara Video Studio',
        lastSavedBy: `Migrated from v${originalVersion} to v1.0.0`,
      },
    };

    return migrated;
  }

  /**
   * Validates, migrates, and parses a string as a valid .nvproj Project object (supports v1 to v7)
   */
  parseProject(jsonString: string, autoMigrate = false): { valid: boolean; project?: Project; error?: string; migrated?: boolean } {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'File format is not a valid JSON structure.' };
      }

      if (parsed.projectVersion > 7) {
        return {
          valid: false,
          error: `Project dibuat oleh versi Nusantara Video Studio yang lebih baru (Schema v${parsed.projectVersion}). Silakan perbarui aplikasi ke versi terbaru.`,
        };
      }

      if (![1, 2, 3, 4, 5, 6, 7].includes(parsed.projectVersion)) {
        return {
          valid: false,
          error: `Versi skema project tidak didukung: ${parsed.projectVersion}. Versi yang diharapkan: 1 sampai 7.`,
        };
      }

      if (!parsed.name || !parsed.settings || !parsed.timeline) {
        return { valid: false, error: 'File .nvproj tidak valid: bidang wajib project tidak lengkap.' };
      }

      const wasMigrated = autoMigrate && parsed.projectVersion < 7;
      const project = wasMigrated ? this.migrateProject(parsed) : (parsed as Project);

      return { valid: true, project, migrated: wasMigrated };
    } catch (err) {
      return { valid: false, error: `JSON Parse error: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  /**
   * Prompts user to download/save the .nvproj file
   */
  saveProjectToFile(project: Project, filename?: string): void {
    const content = this.serializeProject(project);
    const safeName = (filename || project.name || 'Untitled')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const finalFilename = safeName.endsWith('.nvproj') ? safeName : `${safeName}.nvproj`;

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = finalFilename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  /**
   * Opens file selector for .nvproj files and returns parsed Project
   */
  openProjectFromFile(): Promise<{ project?: Project; error?: string }> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.nvproj,application/json';

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({ error: 'No file selected' });
          return;
        }

        try {
          const text = await file.text();
          const result = this.parseProject(text);
          if (result.valid && result.project) {
            resolve({ project: result.project });
          } else {
            resolve({ error: result.error || 'Failed to parse project file.' });
          }
        } catch (err) {
          resolve({ error: `File read error: ${err instanceof Error ? err.message : String(err)}` });
        }
      };

      input.click();
    });
  }
}

export const fileService = new FileService();
