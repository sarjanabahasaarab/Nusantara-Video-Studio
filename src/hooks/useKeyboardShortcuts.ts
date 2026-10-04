/**
 * Nusantara Video Studio - Keyboard Shortcuts Hook
 * Handles application-level hotkeys:
 * Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Z, Ctrl+Shift+Z, Ctrl+X, Ctrl+C, Ctrl+V, Delete, Space
 */

import { useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useSelectionStore } from '../stores/selectionStore';
import { useUIStore } from '../stores/uiStore';
import { fileService } from '../services/fileService';

export function useKeyboardShortcuts() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const markSaved = useProjectStore((s) => s.markSaved);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const removeClip = useTimelineStore((s) => s.removeClip);
  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const openDialog = useUIStore((s) => s.openDialog);
  const notify = useUIStore((s) => s.notify);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Space -> Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      // Ctrl + N -> New Project
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        openDialog('newProject');
        return;
      }

      // Ctrl + O -> Open Project
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        fileService.openProjectFromFile().then((res) => {
          if (res.project) {
            useProjectStore.getState().loadProject(res.project);
            notify('Buka Proyek', `Proyek "${res.project.name}" berhasil dimuat.`, 'success');
          } else if (res.error && res.error !== 'No file selected') {
            notify('Gagal Membuka', res.error, 'error');
          }
        });
        return;
      }

      // Ctrl + S -> Save
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        fileService.saveProjectToFile(currentProject);
        markSaved();
        notify('Simpan Proyek', `File "${currentProject.name}.nvproj" berhasil disimpan.`, 'success');
        return;
      }

      // Ctrl + Shift + Z -> Redo
      if (isCtrlOrCmd && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (redo()) {
          notify('Redo', 'Perubahan berhasil diterapkan kembali.', 'info', 1500);
        }
        return;
      }

      // Ctrl + Z -> Undo
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (undo()) {
          notify('Undo', 'Langkah sebelumnya dibatalkan.', 'info', 1500);
        }
        return;
      }

      // Delete / Backspace -> Delete selected clip
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          removeClip(selectedClipId);
          clearSelection();
          notify('Clip Dihapus', 'Clip terpilih telah dihapus dari timeline.', 'info', 2000);
          return;
        }
      }

      // Ctrl + X -> Cut
      if (isCtrlOrCmd && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        if (selectedClipId) {
          notify('Cut Clip', 'Cut clip akan aktif penuh pada Phase 3 & 4.', 'info');
        } else {
          notify('Cut', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
        }
        return;
      }

      // Ctrl + C -> Copy
      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        if (selectedClipId) {
          notify('Copy Clip', 'Clip disalin ke clipboard Nusantara Studio.', 'info');
        } else {
          notify('Copy', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
        }
        return;
      }

      // Ctrl + V -> Paste
      if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        notify('Paste Clip', 'Paste clip pada playhead akan aktif pada Phase 3.', 'info');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, markSaved, notify, openDialog, redo, removeClip, selectedClipId, clearSelection, togglePlay, undo]);
}
