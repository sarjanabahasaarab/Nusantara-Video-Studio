/**
 * Nusantara Video Studio - Keyboard Shortcut & Command Manager
 * Phase 8: Professional Editing Workflow
 *
 * Implements customizable shortcuts, conflict detection, preset maps
 * (Nusantara Default, Premiere-style, Final Cut-style), and Command Palette registry.
 */

import { CommandShortcut, ShortcutPreset, ShortcutCategory } from '../../types';

export const DEFAULT_SHORTCUTS: CommandShortcut[] = [
  // General
  { id: 'cmd-new-proj', command: 'New Project', description: 'Buat proyek baru', category: 'General', defaultKey: 'Ctrl+N' },
  { id: 'cmd-open-proj', command: 'Open Project', description: 'Buka proyek .nvproj', category: 'General', defaultKey: 'Ctrl+O' },
  { id: 'cmd-save-proj', command: 'Save Project', description: 'Simpan proyek aktif', category: 'General', defaultKey: 'Ctrl+S' },
  { id: 'cmd-save-as', command: 'Save As', description: 'Simpan proyek sebagai nama baru', category: 'General', defaultKey: 'Ctrl+Shift+S' },
  { id: 'cmd-undo', command: 'Undo', description: 'Batalkan tindakan terakhir', category: 'General', defaultKey: 'Ctrl+Z' },
  { id: 'cmd-redo', command: 'Redo', description: 'Ulangi tindakan terakhir', category: 'General', defaultKey: 'Ctrl+Shift+Z' },
  { id: 'cmd-palette', command: 'Command Palette', description: 'Buka Command Palette pencarian instan', category: 'General', defaultKey: 'Ctrl+Shift+P' },

  // Timeline
  { id: 'cmd-split-clip', command: 'Split Clip', description: 'Potong klip pada playhead', category: 'Timeline', defaultKey: 'Ctrl+K' },
  { id: 'cmd-delete-clip', command: 'Delete Clip', description: 'Hapus klip terpilih', category: 'Timeline', defaultKey: 'Delete' },
  { id: 'cmd-duplicate', command: 'Duplicate Clip', description: 'Duplikasi klip terpilih', category: 'Timeline', defaultKey: 'Ctrl+D' },
  { id: 'cmd-zoom-in', command: 'Zoom In', description: 'Perbesar skala timeline', category: 'Timeline', defaultKey: 'Ctrl+=' },
  { id: 'cmd-zoom-out', command: 'Zoom Out', description: 'Perkecil skala timeline', category: 'Timeline', defaultKey: 'Ctrl+-' },
  { id: 'cmd-zoom-fit', command: 'Zoom to Fit', description: 'Sesuaikan timeline ke lebar layar', category: 'Timeline', defaultKey: 'Shift+Z' },
  { id: 'cmd-toggle-proxy', command: 'Toggle Proxy', description: 'Beralih antara Proxy dan Original', category: 'Timeline', defaultKey: 'P' },

  // Playback
  { id: 'cmd-play-pause', command: 'Play / Pause', description: 'Mulai atau hentikan playback', category: 'Playback', defaultKey: 'Space' },
  { id: 'cmd-stop', command: 'Stop', description: 'Hentikan playback dan kembali ke in-point', category: 'Playback', defaultKey: 'K' },
  { id: 'cmd-fullscreen', command: 'Full Screen Preview', description: 'Tampilan preview layar penuh', category: 'Playback', defaultKey: 'F11' },

  // Markers
  { id: 'cmd-add-marker', command: 'Add Marker', description: 'Tambahkan marker pada posisi playhead', category: 'Markers', defaultKey: 'M' },
  { id: 'cmd-show-markers', command: 'Show Markers Panel', description: 'Buka panel pengelola marker', category: 'Markers', defaultKey: 'Ctrl+M' },

  // Workspaces
  { id: 'cmd-ws-edit', command: 'Workspace: Editing', description: 'Beralih ke workspace Editing', category: 'Navigation', defaultKey: 'Alt+1' },
  { id: 'cmd-ws-color', command: 'Workspace: Color', description: 'Beralih ke workspace Color Studio', category: 'Navigation', defaultKey: 'Alt+2' },
  { id: 'cmd-ws-audio', command: 'Workspace: Audio', description: 'Beralih ke workspace Audio Studio', category: 'Navigation', defaultKey: 'Alt+3' },
  { id: 'cmd-ws-ai', command: 'Workspace: AI', description: 'Beralih ke workspace AI-Assisted Editing', category: 'Navigation', defaultKey: 'Alt+4' },

  // AI & Workflow
  { id: 'cmd-relink-media', command: 'Relink Media', description: 'Buka panel relink media offline', category: 'Media', defaultKey: 'Ctrl+R' },
  { id: 'cmd-project-archive', command: 'Project Archive', description: 'Buka dialog arsip proyek mandiri', category: 'General', defaultKey: 'Ctrl+Shift+A' },
  { id: 'cmd-health-check', command: 'Project Health Check', description: 'Jalankan audit kesehatan proyek', category: 'General', defaultKey: 'Ctrl+H' },
];

export class ShortcutManager {
  private static STORAGE_KEY = 'nvs_custom_shortcuts_v8';
  private static PRESET_KEY = 'nvs_active_shortcut_preset_v8';
  private static memoryStore = new Map<string, string>();

  private static getItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      try {
        return localStorage.getItem(key);
      } catch {}
    }
    return this.memoryStore.get(key) || null;
  }

  private static setItem(key: string, val: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(key, val);
      } catch {}
    }
    this.memoryStore.set(key, val);
  }

  private static removeItem(key: string): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(key);
      } catch {}
    }
    this.memoryStore.delete(key);
  }

  /**
   * Retrieves active shortcuts list
   */
  static getShortcuts(): CommandShortcut[] {
    try {
      const stored = this.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return [...DEFAULT_SHORTCUTS];
  }

  static saveShortcuts(shortcuts: CommandShortcut[]): void {
    try {
      this.setItem(this.STORAGE_KEY, JSON.stringify(shortcuts));
    } catch {
      // Ignore
    }
  }

  static getActivePreset(): ShortcutPreset {
    try {
      const preset = this.getItem(this.PRESET_KEY) as ShortcutPreset;
      if (preset) return preset;
    } catch {
      // Fallback
    }
    return 'Nusantara Default';
  }

  static setActivePreset(preset: ShortcutPreset): CommandShortcut[] {
    try {
      this.setItem(this.PRESET_KEY, preset);
    } catch {
      // Ignore
    }

    if (preset === 'Nusantara Default' || preset === 'default') {
      this.saveShortcuts(DEFAULT_SHORTCUTS);
      return [...DEFAULT_SHORTCUTS];
    }

    if (preset === 'Premiere-style' || preset === 'premiere') {
      const mapped = DEFAULT_SHORTCUTS.map((s) => {
        if (s.id === 'cmd-split-clip') return { ...s, customKey: 'Ctrl+K' };
        if (s.id === 'cmd-add-marker') return { ...s, customKey: 'M' };
        if (s.id === 'cmd-zoom-in') return { ...s, customKey: '=' };
        if (s.id === 'cmd-zoom-out') return { ...s, customKey: '-' };
        return s;
      });
      this.saveShortcuts(mapped);
      return mapped;
    }

    if (preset === 'Final Cut-style' || preset === 'final-cut') {
      const mapped = DEFAULT_SHORTCUTS.map((s) => {
        if (s.id === 'cmd-split-clip') return { ...s, customKey: 'Ctrl+B' };
        if (s.id === 'cmd-zoom-fit') return { ...s, customKey: 'Shift+Z' };
        return s;
      });
      this.saveShortcuts(mapped);
      return mapped;
    }

    return this.getShortcuts();
  }

  /**
   * Checks whether a shortcut string is already assigned to another command
   */
  static checkConflict(
    commandId: string,
    keyCombo: string,
    shortcuts = this.getShortcuts()
  ): CommandShortcut | null {
    const normalized = keyCombo.toLowerCase().replace(/\s+/g, '');
    for (const sc of shortcuts) {
      if (sc.id === commandId) continue;
      const currentKey = (sc.customKey || sc.defaultKey).toLowerCase().replace(/\s+/g, '');
      if (currentKey === normalized) {
        return sc;
      }
    }
    return null;
  }

  /**
   * Assigns new key to a command, optionally unassigning conflict
   */
  static assignShortcut(
    commandId: string,
    newKey: string,
    replaceConflict = false
  ): { success: boolean; conflictCommand?: string } {
    const list = this.getShortcuts();
    const conflict = this.checkConflict(commandId, newKey, list);

    if (conflict && !replaceConflict) {
      return { success: false, conflictCommand: conflict.command };
    }

    const updated = list.map((s) => {
      if (conflict && replaceConflict && s.id === conflict.id) {
        return { ...s, customKey: '' };
      }
      if (s.id === commandId) {
        return { ...s, customKey: newKey };
      }
      return s;
    });

    this.saveShortcuts(updated);
    return { success: true };
  }

  /**
   * Helper alias for conflict detection
   */
  static findConflict(
    commandId: string,
    keyCombo: string,
    shortcuts = this.getShortcuts()
  ): CommandShortcut | null {
    return this.checkConflict(commandId, keyCombo, shortcuts);
  }

  static updateShortcut(id: string, newKey: string): CommandShortcut[] {
    const list = this.getShortcuts();
    const updated = list.map((s) => (s.id === id ? { ...s, customKey: newKey } : s));
    this.saveShortcuts(updated);
    return updated;
  }

  static resetToDefaults(): CommandShortcut[] {
    this.saveShortcuts(DEFAULT_SHORTCUTS);
    return [...DEFAULT_SHORTCUTS];
  }

  static applyPreset(preset: any): CommandShortcut[] {
    if (preset === 'premiere') return this.setActivePreset('Premiere-style');
    if (preset === 'final-cut') return this.setActivePreset('Final Cut-style');
    return this.setActivePreset('Nusantara Default');
  }
}
