/**
 * Nusantara Video Studio - AI Job Queue
 * Phase 7: AI-Assisted Editing
 *
 * Background asynchronous queue. Manages job lifecycle:
 * queue -> running -> completed / failed / cancelled.
 * Concurrency limited to ensure UI never freezes.
 */

import { AIJob } from './AIJob';
import { ProviderRegistry } from './providers/ProviderRegistry';

export type JobQueueListener = (jobs: AIJob[]) => void;

export class AIJobQueue {
  private static instance: AIJobQueue;
  private jobs: AIJob[] = [];
  private listeners: Set<JobQueueListener> = new Set();
  private maxConcurrent = 1;
  private isProcessing = false;
  private cancellationMap = new Map<string, boolean>();

  private constructor() {}

  static getInstance(): AIJobQueue {
    if (!AIJobQueue.instance) {
      AIJobQueue.instance = new AIJobQueue();
    }
    return AIJobQueue.instance;
  }

  getJobs(): AIJob[] {
    return [...this.jobs];
  }

  getJob(id: string): AIJob | undefined {
    return this.jobs.find((j) => j.id === id);
  }

  subscribe(listener: JobQueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getJobs());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const copy = this.getJobs();
    this.listeners.forEach((l) => l(copy));
  }

  enqueue(job: AIJob): AIJob {
    this.jobs = [job, ...this.jobs];
    this.notify();
    this.processQueue();
    return job;
  }

  cancel(jobId: string): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return;

    if (job.status === 'running' || job.status === 'queued') {
      this.cancellationMap.set(jobId, true);
      job.status = 'cancelled';
      job.completedAt = new Date().toISOString();

      if (job.providerId) {
        const provider = ProviderRegistry.getInstance().getProvider(job.providerId);
        provider?.cancel(jobId).catch(() => {});
      }

      this.notify();
    }
  }

  retry(jobId: string): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return;

    if (job.status === 'failed' || job.status === 'cancelled') {
      job.status = 'queued';
      job.progress = 0;
      job.error = undefined;
      job.startedAt = undefined;
      job.completedAt = undefined;
      this.cancellationMap.delete(jobId);
      this.notify();
      this.processQueue();
    }
  }

  remove(jobId: string): void {
    this.cancel(jobId);
    this.jobs = this.jobs.filter((j) => j.id !== jobId);
    this.notify();
  }

  clearCompleted(): void {
    this.jobs = this.jobs.filter((j) => j.status !== 'completed' && j.status !== 'cancelled');
    this.notify();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (true) {
        const runningCount = this.jobs.filter((j) => j.status === 'running').length;
        if (runningCount >= this.maxConcurrent) break;

        const nextJob = this.jobs.find((j) => j.status === 'queued');
        if (!nextJob) break;

        // Start job execution asynchronously
        this.runJob(nextJob);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async runJob(job: AIJob): Promise<void> {
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    job.progress = 5;

    const provider = ProviderRegistry.getInstance().getActiveProvider();
    job.providerId = provider.id;
    this.notify();

    try {
      // Progress updater callback
      const onProgress = (p: number) => {
        if (this.cancellationMap.get(job.id)) return;
        job.progress = Math.min(99, Math.max(job.progress, Math.round(p)));
        this.notify();
      };

      const result = await provider.execute(job, onProgress);

      if (this.cancellationMap.get(job.id)) {
        job.status = 'cancelled';
      } else {
        job.status = 'completed';
        job.progress = 100;
        job.result = result;
      }
    } catch (err) {
      if (this.cancellationMap.get(job.id)) {
        job.status = 'cancelled';
      } else {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : String(err);
      }
    } finally {
      job.completedAt = new Date().toISOString();
      this.cancellationMap.delete(job.id);
      this.notify();
      // Continue next job in queue
      this.processQueue();
    }
  }
}
