/**
 * Nusantara Video Studio - Background Task Center & Resource Queue
 * Phase 8: Professional Editing Workflow
 *
 * Manages background concurrency with priority scheduling:
 * High (Export, Render) > Normal (Proxy, AI) > Low (Thumbnails, Waveform).
 */

import { BackgroundTask, TaskPriority, TaskStatus, TaskType } from '../../types';

export type TaskListener = (tasks: BackgroundTask[]) => void;

export class TaskManager {
  private static instance: TaskManager;
  private tasks: BackgroundTask[] = [];
  private listeners: Set<TaskListener> = new Set();
  private maxConcurrent = 2; // Keep UI thread responsive
  private isProcessing = false;

  private constructor() {}

  static getInstance(): TaskManager {
    if (!TaskManager.instance) {
      TaskManager.instance = new TaskManager();
    }
    return TaskManager.instance;
  }

  getTasks(): BackgroundTask[] {
    return [...this.tasks];
  }

  subscribe(listener: TaskListener): () => void {
    this.listeners.add(listener);
    listener(this.getTasks());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const list = this.getTasks();
    this.listeners.forEach((l) => l(list));
  }

  addTask(
    title: string,
    type: TaskType,
    priority: TaskPriority = 'normal',
    workFn?: (updateProgress: (p: number) => void) => Promise<void>
  ): BackgroundTask {
    const task: BackgroundTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      priority,
      status: 'queued',
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    this.tasks = [task, ...this.tasks];
    this.notify();

    // Start background processing loop
    this.schedule(task, workFn);
    return task;
  }

  private async schedule(
    task: BackgroundTask,
    workFn?: (updateProgress: (p: number) => void) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const runningCount = this.tasks.filter((t) => t.status === 'running').length;
      if (runningCount >= this.maxConcurrent) return;

      // Find highest priority queued task
      const priorityOrder: Record<TaskPriority, number> = { high: 3, normal: 2, low: 1 };
      const queued = this.tasks
        .filter((t) => t.status === 'queued')
        .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

      const next = queued[0];
      if (!next) return;

      next.status = 'running';
      next.startedAt = new Date().toISOString();
      this.notify();

      if (workFn) {
        try {
          await workFn((percent) => {
            next.progress = Math.min(100, Math.max(0, Math.round(percent)));
            this.notify();
          });
          next.status = 'completed';
          next.progress = 100;
        } catch (err) {
          next.status = 'failed';
          next.error = err instanceof Error ? err.message : String(err);
        } finally {
          next.completedAt = new Date().toISOString();
          this.notify();
        }
      } else {
        // Simulated execution for queue tests
        next.status = 'completed';
        next.progress = 100;
        next.completedAt = new Date().toISOString();
        this.notify();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  cancelTask(id: string): void {
    const task = this.tasks.find((t) => t.id === id);
    if (task && (task.status === 'running' || task.status === 'queued')) {
      task.status = 'cancelled';
      task.completedAt = new Date().toISOString();
      this.notify();
    }
  }

  clearCompleted(): void {
    this.tasks = this.tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
    this.notify();
  }
}
