/**
 * Nusantara Video Studio - Command History Engine
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Implements standard NLE command pattern with full undo/redo stacks.
 */

import { EditCommand } from '../../types';

export class CommandHistory {
  private undoStack: EditCommand[] = [];
  private redoStack: EditCommand[] = [];
  private maxDepth: number = 50;
  private listeners: Set<() => void> = new Set();

  /**
   * Executes a command and pushes it onto the undo stack, clearing redo.
   */
  execute(command: EditCommand): void {
    try {
      command.execute();
      this.undoStack.push(command);
      if (this.undoStack.length > this.maxDepth) {
        this.undoStack.shift();
      }
      this.redoStack = [];
      this.notify();
    } catch (err) {
      console.error('[CommandHistory] Command execution failure:', err);
    }
  }

  /**
   * Undoes the most recent command.
   */
  undo(): boolean {
    const cmd = this.undoStack.pop();
    if (!cmd) return false;

    try {
      cmd.undo();
      this.redoStack.push(cmd);
      this.notify();
      return true;
    } catch (err) {
      console.error('[CommandHistory] Undo failure:', err);
      return false;
    }
  }

  /**
   * Redoes the most recently undone command.
   */
  redo(): boolean {
    const cmd = this.redoStack.pop();
    if (!cmd) return false;

    try {
      cmd.execute();
      this.undoStack.push(cmd);
      this.notify();
      return true;
    } catch (err) {
      console.error('[CommandHistory] Redo failure:', err);
      return false;
    }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getUndoDescription(): string | null {
    const last = this.undoStack[this.undoStack.length - 1];
    return last ? last.description : null;
  }

  getRedoDescription(): string | null {
    const next = this.redoStack[this.redoStack.length - 1];
    return next ? next.description : null;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const commandHistory = new CommandHistory();
