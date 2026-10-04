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
import { useMediaStore } from '../stores/mediaStore';
import { fileService } from '../services/fileService';
import { mediaService } from '../services/mediaService';

export function useKeyboardShortcuts() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const markSaved = useProjectStore((s) => s.markSaved);

  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const previousFrame = useTimelineStore((s) => s.previousFrame);
  const nextFrame = useTimelineStore((s) => s.nextFrame);
  const splitSelectedClipsAtPlayhead = useTimelineStore((s) => s.splitSelectedClipsAtPlayhead);
  const duplicateSelectedClips = useTimelineStore((s) => s.duplicateSelectedClips);
  const deleteSelectedClips = useTimelineStore((s) => s.deleteSelectedClips);
  const copySelectedClips = useTimelineStore((s) => s.copySelectedClips);
  const pasteClipsAtPlayhead = useTimelineStore((s) => s.pasteClipsAtPlayhead);
  const selectAllClips = useTimelineStore((s) => s.selectAllClips);

  const selectedClipIds = useSelectionStore((s) => s.selectedClipIds);
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

      // Arrow Left -> Previous Frame (Requirement 8)
      if (e.key === 'ArrowLeft' && !isCtrlOrCmd) {
        e.preventDefault();
        previousFrame();
        return;
      }

      // Arrow Right -> Next Frame (Requirement 8)
      if (e.key === 'ArrowRight' && !isCtrlOrCmd) {
        e.preventDefault();
        nextFrame();
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

      // Ctrl + I -> Import Media
      if (isCtrlOrCmd && !e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        useUIStore.getState().setActiveSidebarTab('media');
        mediaService.openFileDialog().then(async (files) => {
          if (!files || files.length === 0) return;
          const mediaStore = useMediaStore.getState();
          mediaStore.setImportProgress({
            active: true,
            current: 0,
            total: files.length,
            filename: files[0]?.name || '',
            percentage: 0,
          });
          try {
            const res = await mediaService.processFiles(
              files,
              mediaStore.items,
              (current, total, filename, percentage) => {
                mediaStore.setImportProgress({ active: true, current, total, filename, percentage });
              }
            );
            if (res.imported.length > 0) {
              await mediaStore.addMultipleMedia(res.imported);
              notify('Media Diimport', `✓ ${res.imported.length} media berhasil diimport.`, 'success', 3000);
            }
            if (res.duplicates.length > 0) {
              notify('Duplikat Ditemukan', `⚠ ${res.duplicates.length} berkas sudah ada di project.`, 'warning', 3500);
            }
            if (res.errors.length > 0) {
              notify('Format Ditolak', `✕ ${res.errors[0].name}: ${res.errors[0].reason}`, 'error', 4000);
            }
          } catch (err) {
            notify('Gagal Import', String(err), 'error');
          } finally {
            mediaStore.setImportProgress({ active: false });
          }
        });
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

      // Ctrl + K -> Split at Playhead (Requirement 11)
      if (isCtrlOrCmd && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (selectedClipIds.length > 0) {
          splitSelectedClipsAtPlayhead();
          notify('Split Clip', 'Clip terpilih berhasil dipotong pada playhead.', 'success', 2000);
        } else {
          notify('Split', 'Pilih clip pada timeline untuk dipotong.', 'warning');
        }
        return;
      }

      // Ctrl + D -> Duplicate (Requirement 11)
      if (isCtrlOrCmd && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        if (selectedClipIds.length > 0) {
          duplicateSelectedClips();
          notify('Duplicate', 'Clip berhasil diduplikasi.', 'success', 2000);
        } else {
          notify('Duplicate', 'Pilih clip pada timeline untuk diduplikasi.', 'warning');
        }
        return;
      }

      // Ctrl + A -> Select All (Requirement 14)
      if (isCtrlOrCmd && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        selectAllClips();
        notify('Select All', 'Semua clip pada timeline dipilih.', 'info', 1500);
        return;
      }

      // Delete / Backspace -> Delete selected clip(s) (Requirement 11, 14)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipIds.length > 0) {
          e.preventDefault();
          deleteSelectedClips();
          notify('Clip Dihapus', `${selectedClipIds.length} clip telah dihapus dari timeline.`, 'info', 2000);
          return;
        }
      }

      // Ctrl + X -> Cut
      if (isCtrlOrCmd && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        const count = copySelectedClips();
        if (count > 0) {
          deleteSelectedClips();
          notify('Cut Clip', `${count} clip dipotong ke clipboard.`, 'info', 2000);
        } else {
          notify('Cut', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
        }
        return;
      }

      // Ctrl + C -> Copy (Requirement 11, 14)
      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        const count = copySelectedClips();
        if (count > 0) {
          notify('Copy Clip', `${count} clip disalin ke clipboard Nusantara Studio.`, 'info', 2000);
        } else {
          notify('Copy', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
        }
        return;
      }

      // Ctrl + V -> Paste (Requirement 11, 14)
      if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        const success = pasteClipsAtPlayhead();
        if (success) {
          notify('Paste Clip', 'Clip ditempatkan pada posisi playhead.', 'success', 2000);
        } else {
          notify('Paste', 'Clipboard kosong. Salin clip terlebih dahulu.', 'warning');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    currentProject,
    markSaved,
    notify,
    openDialog,
    redo,
    undo,
    togglePlay,
    previousFrame,
    nextFrame,
    splitSelectedClipsAtPlayhead,
    duplicateSelectedClips,
    deleteSelectedClips,
    copySelectedClips,
    pasteClipsAtPlayhead,
    selectAllClips,
    selectedClipIds,
  ]);
}
