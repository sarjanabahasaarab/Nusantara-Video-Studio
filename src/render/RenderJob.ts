/**
 * Nusantara Video Studio - Render Job Instance
 * Phase 9: Professional Rendering & Export Engine (Requirement 6)
 */

import {
  RenderJob,
  RenderSettings,
  RenderError,
  RenderProgress,
  OutputValidationReport,
} from '../types/render';

export class RenderJobInstance implements RenderJob {
  public id: string;
  public projectId: string;
  public projectName: string;
  public sequenceId: string;
  public status:
    | 'queued'
    | 'preparing'
    | 'rendering'
    | 'paused'
    | 'completed'
    | 'failed'
    | 'cancelled';
  public progress: number;
  public progressDetails?: RenderProgress;
  public outputPath: string;
  public settings: RenderSettings;
  public createdAt: string;
  public startedAt?: string;
  public completedAt?: string;
  public error?: RenderError;
  public outputSizeReport?: OutputValidationReport;
  public logLines: string[];

  constructor(
    projectId: string,
    projectName: string,
    settings: RenderSettings,
    sequenceId = 'seq-main'
  ) {
    this.id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.projectId = projectId;
    this.projectName = projectName;
    this.sequenceId = sequenceId;
    this.status = 'queued';
    this.progress = 0;
    this.outputPath = settings.outputPath || '';
    this.settings = { ...settings };
    this.createdAt = new Date().toISOString();
    this.logLines = [];
  }

  public setStatus(newStatus: RenderJob['status']): void {
    this.status = newStatus;
    if (newStatus === 'rendering' && !this.startedAt) {
      this.startedAt = new Date().toISOString();
    } else if (newStatus === 'completed' || newStatus === 'failed' || newStatus === 'cancelled') {
      this.completedAt = new Date().toISOString();
    }
  }

  public updateProgress(progress: RenderProgress): void {
    this.progress = progress.percentage;
    this.progressDetails = progress;
  }
}
