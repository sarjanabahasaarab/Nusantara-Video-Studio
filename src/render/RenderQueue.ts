/**
 * Nusantara Video Studio - Render Queue Manager
 * Phase 9: Professional Rendering & Export Engine (Requirements 38, 39, 40, 45, 46)
 */

import { RenderJob, RenderProgress } from '../types/render';
import { RenderJobInstance } from './RenderJob';

export class RenderQueueManager {
  private static instance: RenderQueueManager;
  private jobs: RenderJobInstance[] = [];
  private maxParallelJobs = 1; // Default 1 active render (Requirement 40)
  private subscribers: Array<(jobs: RenderJob[]) => void> = [];
  private pollingIntervals = new Map<string, any>();

  private constructor() {}

  public static getInstance(): RenderQueueManager {
    if (!this.instance) {
      this.instance = new RenderQueueManager();
    }
    return this.instance;
  }

  public subscribe(cb: (jobs: RenderJob[]) => void): () => void {
    this.subscribers.push(cb);
    cb(this.getJobs());
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notify(): void {
    const list = this.getJobs();
    for (const sub of this.subscribers) {
      sub(list);
    }
  }

  public getJobs(): RenderJob[] {
    return [...this.jobs];
  }

  public getJob(id: string): RenderJobInstance | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  public setMaxParallel(limit: number): void {
    this.maxParallelJobs = Math.max(1, Math.min(4, limit));
  }

  public getMaxParallel(): number {
    return this.maxParallelJobs;
  }

  public addJob(job: RenderJobInstance): void {
    this.jobs.push(job);
    this.notify();
    this.processNext();
  }

  public moveUp(id: string): void {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx > 0) {
      const temp = this.jobs[idx];
      this.jobs[idx] = this.jobs[idx - 1];
      this.jobs[idx - 1] = temp;
      this.notify();
    }
  }

  public moveDown(id: string): void {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx !== -1 && idx < this.jobs.length - 1) {
      const temp = this.jobs[idx];
      this.jobs[idx] = this.jobs[idx + 1];
      this.jobs[idx + 1] = temp;
      this.notify();
    }
  }

  public duplicateJob(id: string): RenderJobInstance | null {
    const job = this.getJob(id);
    if (!job) return null;

    const dup = new RenderJobInstance(
      job.projectId,
      `${job.projectName} (Duplikat)`,
      job.settings,
      job.sequenceId
    );
    this.jobs.push(dup);
    this.notify();
    return dup;
  }

  public removeJob(id: string): void {
    this.cancelJob(id);
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.notify();
  }

  public clearCompleted(): void {
    this.jobs = this.jobs.filter(
      (j) => j.status !== 'completed' && j.status !== 'cancelled' && j.status !== 'failed'
    );
    this.notify();
  }

  public async pauseJob(id: string): Promise<boolean> {
    const job = this.getJob(id);
    if (!job || job.status !== 'rendering') return false;

    try {
      const res = await fetch('/api/render/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      });
      if (res.ok) {
        job.setStatus('paused');
        this.notify();
        return true;
      }
    } catch {
      // offline
    }

    job.setStatus('paused');
    this.notify();
    return true;
  }

  public async resumeJob(id: string): Promise<boolean> {
    const job = this.getJob(id);
    if (!job || job.status !== 'paused') return false;

    try {
      const res = await fetch('/api/render/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      });
      if (res.ok) {
        job.setStatus('rendering');
        this.notify();
        return true;
      }
    } catch {
      // offline
    }

    job.setStatus('rendering');
    this.notify();
    return true;
  }

  public async cancelJob(id: string): Promise<void> {
    const job = this.getJob(id);
    if (!job) return;

    if (this.pollingIntervals.has(id)) {
      clearInterval(this.pollingIntervals.get(id));
      this.pollingIntervals.delete(id);
    }

    try {
      await fetch('/api/render/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: id }),
      });
    } catch {
      // offline
    }

    job.setStatus('cancelled');
    this.notify();
    this.processNext();
  }

  public retryJob(id: string): void {
    const job = this.getJob(id);
    if (!job) return;
    job.setStatus('queued');
    job.progress = 0;
    job.error = undefined;
    this.notify();
    this.processNext();
  }

  /**
   * Tracks active job execution and starts queued jobs up to parallel limit
   */
  public processNext(): void {
    const active = this.jobs.filter((j) => j.status === 'rendering' || j.status === 'preparing');
    if (active.length >= this.maxParallelJobs) {
      return;
    }

    const next = this.jobs.find((j) => j.status === 'queued');
    if (next) {
      this.startJobExecution(next);
    }
  }

  private startJobExecution(job: RenderJobInstance): void {
    job.setStatus('rendering');
    this.notify();

    // Start progress polling loop
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/render/progress?jobId=${job.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            job.updateProgress({
              jobId: job.id,
              percentage: data.progress.percentage,
              currentFrame: data.progress.currentFrame,
              totalFrames: data.progress.totalFrames,
              fps: data.progress.fps,
              renderSpeedRealtime: data.progress.renderSpeedRealtime,
              elapsedSeconds: data.progress.elapsedSeconds,
              remainingSeconds: data.progress.remainingSeconds,
              currentBitrateKbps: data.progress.currentBitrateKbps,
              currentStage: data.progress.currentStage,
            });
          }

          if (data.status === 'completed') {
            job.setStatus('completed');
            job.outputPath = data.outputPath || job.outputPath;
            clearInterval(timer);
            this.pollingIntervals.delete(job.id);
            this.notify();
            this.processNext();
          } else if (data.status === 'failed') {
            job.setStatus('failed');
            job.error = {
              code: 'ERR_ENCODE_FAILED',
              message: data.error || 'Proses FFmpeg gagal.',
              timestamp: new Date().toISOString(),
            };
            clearInterval(timer);
            this.pollingIntervals.delete(job.id);
            this.notify();
            this.processNext();
          } else if (data.status === 'cancelled') {
            job.setStatus('cancelled');
            clearInterval(timer);
            this.pollingIntervals.delete(job.id);
            this.notify();
            this.processNext();
          } else {
            this.notify();
          }
        }
      } catch {
        // network issue
      }
    }, 400);

    this.pollingIntervals.set(job.id, timer);
  }
}
