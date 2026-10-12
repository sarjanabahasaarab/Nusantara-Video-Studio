/**
 * Nusantara Video Studio - Project Archive & Package Engine
 * Phase 8: Professional Editing Workflow
 *
 * Prepares standalone project packages (.nvsarchive / zip packages),
 * analyzes media dependencies, validates completeness, and restores projects.
 */

import {
  Project,
  MediaItem,
  ArchiveOptions,
  ArchiveValidation,
  ProjectPackageManifest,
} from '../../types';

export const DEFAULT_ARCHIVE_OPTIONS: ArchiveOptions = {
  includeProjectFile: true,
  includeUsedMedia: true,
  includeAudio: true,
  includeImages: true,
  includeGraphics: true,
  includeSubtitles: true,
  includeProxyFiles: false,
  includeCache: false,
  includeUnusedMedia: false,
};

export class ProjectArchiveManager {
  /**
   * Analyzes project before archiving and validates offline/used/unused media
   */
  static analyzeProject(project: Project, options: ArchiveOptions = DEFAULT_ARCHIVE_OPTIONS): ArchiveValidation {
    const allClips = project.timeline.tracks.flatMap((t) => t.clips);
    const usedMediaIds = new Set(allClips.map((c) => c.mediaId).filter(Boolean));

    let usedCount = 0;
    let unusedCount = 0;
    let missingCount = 0;
    let proxyCount = 0;
    let totalBytes = 0;
    const warnings: string[] = [];

    project.media.forEach((m) => {
      const isUsed = usedMediaIds.has(m.id);
      if (isUsed) {
        usedCount++;
        if (m.isOffline) {
          missingCount++;
        }
        totalBytes += m.size || 10 * 1024 * 1024;
      } else {
        unusedCount++;
        if (options.includeUnusedMedia) {
          totalBytes += m.size || 10 * 1024 * 1024;
        }
      }

      if (m.proxy?.status === 'ready') {
        proxyCount++;
        if (options.includeProxyFiles) {
          totalBytes += m.proxy.fileSize || 2 * 1024 * 1024;
        }
      }
    });

    if (missingCount > 0) {
      warnings.push(`Perhatian: ${missingCount} berkas media dalam kondisi offline/tidak ditemukan.`);
    }

    // Include estimated size for project JSON & subtitle assets
    totalBytes += 100 * 1024; // ~100 KB project file

    return {
      usedMediaCount: usedCount,
      missingMediaCount: missingCount,
      unusedMediaCount: unusedCount,
      proxyFilesCount: proxyCount,
      totalEstimatedBytes: totalBytes,
      warnings,
      canProceed: true,
    };
  }

  /**
   * Generates archive manifest
   */
  static createManifest(project: Project, options: ArchiveOptions): ProjectPackageManifest {
    const analysis = this.analyzeProject(project, options);

    return {
      manifestVersion: 1,
      archiveName: `${project.name}_Archive`,
      createdAt: new Date().toISOString(),
      appVersion: '0.8.0',
      schemaVersion: 6,
      mediaCount: analysis.usedMediaCount + (options.includeUnusedMedia ? analysis.unusedMediaCount : 0),
      totalSizeBytes: analysis.totalEstimatedBytes,
      hasProxy: options.includeProxyFiles,
    };
  }

  /**
   * Bundles project into an archive package JSON container
   */
  static exportArchivePackage(project: Project, options: ArchiveOptions): { filename: string; payload: string } {
    const manifest = this.createManifest(project, options);
    const analysis = this.analyzeProject(project, options);

    const archivePackage = {
      manifest,
      projectFile: project,
      metadata: {
        createdWith: 'Nusantara Video Studio v0.8.0',
        packagedAt: new Date().toISOString(),
      },
      validation: analysis,
    };

    const safeName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
    return {
      filename: `${safeName}_archive.nvsarchive`,
      payload: JSON.stringify(archivePackage, null, 2),
    };
  }

  /**
   * Validates and restores an archive package
   */
  static restoreArchivePackage(archiveJson: string): { valid: boolean; project?: Project; error?: string } {
    try {
      const data = JSON.parse(archiveJson);
      if (!data || !data.projectFile) {
        return { valid: false, error: 'File bukan paket arsip Nusantara Video Studio yang valid.' };
      }

      const proj = data.projectFile as Project;
      return { valid: true, project: proj };
    } catch (err) {
      return { valid: false, error: `Gagal membaca arsip: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  /**
   * Alias for analyzeProject
   */
  static validateArchive(project: Project, options: ArchiveOptions = DEFAULT_ARCHIVE_OPTIONS): ArchiveValidation {
    return this.analyzeProject(project, options);
  }

  /**
   * Async helper that generates project archive with manifest and downloadable blobUrl
   */
  static async createProjectArchive(
    project: Project,
    options: ArchiveOptions = DEFAULT_ARCHIVE_OPTIONS
  ): Promise<{ manifest: ProjectPackageManifest; blobUrl: string }> {
    const manifest = this.createManifest(project, options);
    const { payload } = this.exportArchivePackage(project, options);
    const blob = new Blob([payload], { type: 'application/json' });
    const blobUrl = URL.createObjectURL(blob);
    return { manifest, blobUrl };
  }
}
