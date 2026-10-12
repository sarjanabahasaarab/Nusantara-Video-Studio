/**
 * Nusantara Video Studio - Recent Projects Manager
 * Phase 8: Professional Editing Workflow
 *
 * Tracks user project history: file paths, timestamps, file sizes,
 * and app version metadata without mutating physical files.
 */

import { RecentProjectItem, Project } from '../../types';

export class RecentProjectsManager {
  private static STORAGE_KEY = 'nvs_recent_projects_v8';

  static getRecentProjects(): RecentProjectItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }

    // Default sample recents for immediate studio usability
    return [
      {
        id: 'recent-1',
        name: 'Demo Project - Nusantara Cinematic',
        path: '/projects/demo_nusantara_cinematic.nvproj',
        lastOpened: new Date(Date.now() - 3600 * 1000).toISOString(),
        sizeBytes: 1024 * 340,
        version: '0.8.0',
      },
      {
        id: 'recent-2',
        name: 'Dokumenter Tari Tradisional',
        path: 'D:/VideoProjects/Tari_Tradisional.nvproj',
        lastOpened: new Date(Date.now() - 86400 * 1000).toISOString(),
        sizeBytes: 1024 * 820,
        version: '0.7.0',
      },
    ];
  }

  static addProject(project: Project, filepath = ''): void {
    const list = this.getRecentProjects().filter((p) => p.id !== project.id);
    const item: RecentProjectItem = {
      id: project.id,
      name: project.name,
      path: filepath || `/projects/${project.name.toLowerCase().replace(/\s+/g, '_')}.nvproj`,
      lastOpened: new Date().toISOString(),
      sizeBytes: JSON.stringify(project).length,
      version: '0.8.0',
    };

    const updated = [item, ...list].slice(0, 15);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  static getById(id: string): RecentProjectItem | undefined {
    return this.getRecentProjects().find((p) => p.id === id);
  }

  static trackProjectOpen(nameOrProject: string | Project, filepath = '', sizeBytes = 0, projectData?: any): void {
    if (typeof nameOrProject === 'string') {
      const list = this.getRecentProjects().filter((p) => p.name !== nameOrProject);
      const item: RecentProjectItem = {
        id: 'proj-' + Date.now(),
        name: nameOrProject,
        path: filepath || `/projects/${nameOrProject.toLowerCase().replace(/\s+/g, '_')}.nvproj`,
        lastOpened: new Date().toISOString(),
        sizeBytes: sizeBytes || 1024 * 400,
        version: '0.8.0',
        projectData,
      };
      const updated = [item, ...list].slice(0, 15);
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      } catch {}
    } else {
      this.addProject(nameOrProject, filepath);
    }
  }

  static removeProject(projectId: string): RecentProjectItem[] {
    const list = this.getRecentProjects().filter((p) => p.id !== projectId);
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
    return list;
  }
}
