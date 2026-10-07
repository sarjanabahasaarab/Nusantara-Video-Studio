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
  serializeProject(project: Project): string {
    const filePayload = {
      projectVersion: 4,
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: new Date().toISOString(),
      settings: project.settings,
      media: project.media,
      timeline: project.timeline,
      metadata: {
        appVersion: '0.6.0',
        appName: 'Nusantara Video Studio',
        lastSavedBy: 'Nusantara Video Studio v0.6.0',
      },
    };

    return JSON.stringify(filePayload, null, 2);
  }

  /**
   * Validates and parses a string as a valid .nvproj Project object (supports v1, v2, v3, and v4)
   */
  parseProject(jsonString: string): { valid: boolean; project?: Project; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);

      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'File format is not a valid JSON structure.' };
      }

      if (
        parsed.projectVersion !== 1 &&
        parsed.projectVersion !== 2 &&
        parsed.projectVersion !== 3 &&
        parsed.projectVersion !== 4
      ) {
        return {
          valid: false,
          error: `Unsupported project version: ${parsed.projectVersion}. Expected version 1, 2, 3, or 4.`,
        };
      }

      if (!parsed.name || !parsed.settings || !parsed.timeline) {
        return { valid: false, error: 'Invalid .nvproj file: missing required project fields.' };
      }

      return { valid: true, project: parsed as Project };
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
