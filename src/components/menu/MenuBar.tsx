/**
 * Nusantara Video Studio - Menu Bar
 * Complete desktop NLE menu system with full Phase 1 hierarchy
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore, SidebarTab } from '../../stores/uiStore';
import { useMediaStore } from '../../stores/mediaStore';
import { useCaptureStore } from '../../stores/captureStore';
import { fileService } from '../../services/fileService';
import { mediaService } from '../../services/mediaService';

interface MenuItem {
  label: string;
  shortcut?: string;
  action: () => void;
  divider?: boolean;
  disabled?: boolean;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

export const MenuBar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentProject = useProjectStore((s) => s.currentProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.canUndo());
  const canRedo = useProjectStore((s) => s.canRedo());
  const markSaved = useProjectStore((s) => s.markSaved);

  const zoomIn = useTimelineStore((s) => s.zoomIn);
  const zoomOut = useTimelineStore((s) => s.zoomOut);
  const zoomToFit = useTimelineStore((s) => s.zoomToFit);
  const addTrack = useTimelineStore((s) => s.addTrack);
  const splitClipAtCurrentTime = useTimelineStore((s) => s.splitClipAtCurrentTime);
  const removeClip = useTimelineStore((s) => s.removeClip);
  const resetClipProperties = useTimelineStore((s) => s.resetClipProperties);

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const selectedClipIds = useSelectionStore((s) => s.selectedClipIds);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  const copySelectedClips = useTimelineStore((s) => s.copySelectedClips);
  const pasteClipsAtPlayhead = useTimelineStore((s) => s.pasteClipsAtPlayhead);
  const duplicateSelectedClips = useTimelineStore((s) => s.duplicateSelectedClips);
  const deleteSelectedClips = useTimelineStore((s) => s.deleteSelectedClips);
  const selectAllClips = useTimelineStore((s) => s.selectAllClips);
  const splitSelectedClipsAtPlayhead = useTimelineStore((s) => s.splitSelectedClipsAtPlayhead);

  const openCaptureModal = useCaptureStore((s) => s.openModal);
  const openDialog = useUIStore((s) => s.openDialog);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const notify = useUIStore((s) => s.notify);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImportMedia = async () => {
    setActiveSidebarTab('media');
    const files = await mediaService.openFileDialog();
    if (files.length === 0) return;

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
  };

  const comingSoon = (featureName: string, phase = 'Phase 3') => {
    notify(
      featureName,
      `Fitur "${featureName}" akan tersedia secara penuh pada ${phase}.`,
      'info',
      3000
    );
  };

  const menus: MenuCategory[] = [
    {
      title: 'File',
      items: [
        {
          label: 'New Project',
          shortcut: 'Ctrl+N',
          action: () => openDialog('newProject'),
        },
        {
          label: 'Open Project...',
          shortcut: 'Ctrl+O',
          action: async () => {
            const res = await fileService.openProjectFromFile();
            if (res.project) {
              useProjectStore.getState().loadProject(res.project);
              notify('Buka Proyek', `Proyek "${res.project.name}" berhasil dimuat.`, 'success');
            } else if (res.error && res.error !== 'No file selected') {
              notify('Gagal Membuka', res.error, 'error');
            }
          },
        },
        {
          label: 'Save Project',
          shortcut: 'Ctrl+S',
          action: () => {
            fileService.saveProjectToFile(currentProject);
            markSaved();
            notify('Simpan Proyek', `File "${currentProject.name}.nvproj" berhasil disimpan.`, 'success');
          },
        },
        {
          label: 'Save Project As...',
          action: () => {
            const customName = prompt('Nama file proyek:', currentProject.name);
            if (customName) {
              fileService.saveProjectToFile(currentProject, customName);
              markSaved();
              notify('Simpan Proyek Sebagai', `Proyek berhasil disimpan sebagai "${customName}.nvproj".`, 'success');
            }
          },
          divider: true,
        },
        {
          label: 'Import Media...',
          shortcut: 'Ctrl+I',
          action: handleImportMedia,
          divider: true,
        },
        {
          label: 'Project Settings...',
          action: () => openDialog('projectSettings'),
          divider: true,
        },
        {
          label: 'Exit',
          action: () => {
            if (confirm('Keluar dari Nusantara Video Studio?')) {
              notify('Keluar', 'Aplikasi siap ditutup.', 'info');
            }
          },
        },
      ],
    },
    {
      title: 'Edit',
      items: [
        {
          label: 'Undo',
          shortcut: 'Ctrl+Z',
          disabled: !canUndo,
          action: () => {
            if (undo()) notify('Undo', 'Langkah dibatalkan.', 'info', 1500);
          },
        },
        {
          label: 'Redo',
          shortcut: 'Ctrl+Shift+Z',
          disabled: !canRedo,
          action: () => {
            if (redo()) notify('Redo', 'Perubahan diterapkan kembali.', 'info', 1500);
          },
          divider: true,
        },
        {
          label: 'Split at Playhead',
          shortcut: 'Ctrl+K',
          action: () => {
            if (selectedClipIds.length > 0) {
              splitSelectedClipsAtPlayhead();
              notify('Split Clip', 'Clip berhasil dipotong pada playhead.', 'success');
            } else {
              notify('Split', 'Pilih clip pada timeline untuk dipotong.', 'warning');
            }
          },
          divider: true,
        },
        {
          label: 'Cut',
          shortcut: 'Ctrl+X',
          action: () => {
            const count = copySelectedClips();
            if (count > 0) {
              deleteSelectedClips();
              notify('Cut Clip', `${count} clip dipotong ke clipboard.`, 'info');
            } else {
              notify('Cut', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
            }
          },
        },
        {
          label: 'Copy',
          shortcut: 'Ctrl+C',
          action: () => {
            const count = copySelectedClips();
            if (count > 0) {
              notify('Copy Clip', `${count} clip disalin ke clipboard.`, 'info');
            } else {
              notify('Copy', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
            }
          },
        },
        {
          label: 'Paste',
          shortcut: 'Ctrl+V',
          action: () => {
            const success = pasteClipsAtPlayhead();
            if (success) {
              notify('Paste Clip', 'Clip ditempatkan pada playhead timeline.', 'success');
            } else {
              notify('Paste', 'Clipboard kosong. Salin clip terlebih dahulu.', 'warning');
            }
          },
        },
        {
          label: 'Duplicate',
          shortcut: 'Ctrl+D',
          action: () => {
            if (selectedClipIds.length > 0) {
              duplicateSelectedClips();
              notify('Duplicate', 'Clip berhasil diduplikasi.', 'success');
            } else {
              notify('Duplicate', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
            }
          },
          divider: true,
        },
        {
          label: 'Delete',
          shortcut: 'Del',
          action: () => {
            if (selectedClipIds.length > 0) {
              deleteSelectedClips();
              notify('Delete', 'Clip terpilih dihapus.', 'info');
            } else {
              notify('Delete', 'Pilih item pada timeline untuk dihapus.', 'warning');
            }
          },
        },
        {
          label: 'Select All',
          shortcut: 'Ctrl+A',
          action: () => {
            selectAllClips();
            notify('Select All', 'Semua clip pada timeline dipilih.', 'info');
          },
        },
      ],
    },
    {
      title: 'View',
      items: [
        {
          label: 'Media Tab',
          action: () => setActiveSidebarTab('media'),
        },
        {
          label: 'Audio Tab',
          action: () => setActiveSidebarTab('audio'),
        },
        {
          label: 'Properties Panel',
          action: () => notify('Properties Panel', 'Panel properti berada di sisi kanan editor.', 'info'),
        },
        {
          label: 'Timeline Panel',
          action: () => notify('Timeline Panel', 'Panel multi-track timeline berada di bagian bawah.', 'info'),
          divider: true,
        },
        {
          label: 'Full Screen',
          shortcut: 'F11',
          action: () => toggleFullscreen(),
        },
      ],
    },
    {
      title: 'Clip',
      items: [
        {
          label: 'Split Clip',
          shortcut: 'Ctrl+K',
          action: () => {
            if (selectedClipIds.length > 0) {
              splitSelectedClipsAtPlayhead();
              notify('Split Clip', 'Clip berhasil dipotong pada playhead.', 'success');
            } else {
              notify('Split', 'Pilih clip terlebih dahulu untuk dipotong.', 'warning');
            }
          },
        },
        {
          label: 'Duplicate',
          shortcut: 'Ctrl+D',
          action: () => {
            if (selectedClipIds.length > 0) {
              duplicateSelectedClips();
              notify('Duplicate', 'Clip berhasil diduplikasi.', 'success');
            } else {
              notify('Duplicate', 'Pilih clip terlebih dahulu untuk diduplikasi.', 'warning');
            }
          },
        },
        {
          label: 'Reset Properties',
          action: () => {
            if (selectedClipId) {
              resetClipProperties(selectedClipId);
              notify('Reset', 'Transform dan efek clip direset ke default.', 'info');
            } else {
              notify('Reset', 'Pilih clip terlebih dahulu.', 'warning');
            }
          },
          divider: true,
        },
        {
          label: 'Delete Clip',
          shortcut: 'Del',
          action: () => {
            if (selectedClipIds.length > 0) {
              deleteSelectedClips();
              notify('Delete', 'Clip dihapus.', 'info');
            } else {
              notify('Delete', 'Pilih clip terlebih dahulu.', 'warning');
            }
          },
        },
      ],
    },
    {
      title: 'Effects',
      items: [
        {
          label: 'Effect Library (Color, Blur, Stylize)...',
          action: () => {
            setActiveSidebarTab('effects');
            notify('Effect Library', 'Membuka panel 20+ efek visual.', 'info', 1500);
          },
        },
        {
          label: 'Transitions Library...',
          action: () => {
            setActiveSidebarTab('transition');
            notify('Transitions', 'Membuka Transition Library.', 'info', 1500);
          },
          divider: true,
        },
        {
          label: 'Animation Presets...',
          action: () => {
            setActiveSidebarTab('effects');
            notify('Animation', 'Pilih preset Entrance, Exit, atau Motion.', 'info', 2000);
          },
        },
        {
          label: 'Chroma Key (Green/Blue Screen)...',
          action: () => {
            setActiveSidebarTab('effects');
            notify('Chroma Key', 'Pilih preset Green Screen atau Blue Screen.', 'info', 2000);
          },
        },
        {
          label: 'Vector Masking...',
          action: () => {
            setActiveSidebarTab('effects');
            notify('Masking', 'Tambahkan Rectangle, Ellipse, Linear, atau Polygon mask.', 'info', 2000);
          },
        },
        {
          label: 'Motion Tracking...',
          action: () => {
            setActiveSidebarTab('effects');
            notify('Motion Tracking', 'Membuka panel Point Motion Tracking.', 'info', 2000);
          },
        },
        {
          label: 'Speed & Speed Ramp...',
          action: () => {
            setActiveSidebarTab('effects');
            notify('Speed', 'Atur playback rate 0.25x - 4x atau kurva Speed Ramp.', 'info', 2000);
          },
        },
        {
          label: 'Picture-in-Picture (PiP)...',
          action: () => {
            setActiveSidebarTab('effects');
            notify('PiP', 'Atur layout overlay Picture-in-Picture.', 'info', 2000);
          },
        },
      ],
    },
    {
      title: 'Timeline',
      items: [
        {
          label: 'Zoom In',
          shortcut: 'Ctrl+=',
          action: () => zoomIn(),
        },
        {
          label: 'Zoom Out',
          shortcut: 'Ctrl+-',
          action: () => zoomOut(),
        },
        {
          label: 'Zoom to Fit',
          action: () => zoomToFit(800),
          divider: true,
        },
        {
          label: 'Add Video Track',
          action: () => {
            addTrack('video');
            notify('Timeline', 'Video Track baru ditambahkan.', 'success');
          },
        },
        {
          label: 'Add Audio Track',
          action: () => {
            addTrack('audio');
            notify('Timeline', 'Audio Track baru ditambahkan.', 'success');
          },
        },
      ],
    },
    {
      title: 'Tools',
      items: [
        {
          label: 'Text, Subtitles & Graphics Studio...',
          action: () => {
            setActiveSidebarTab('text');
            notify('Text & Graphics Studio', 'Membuka panel Text, Subtitles, Titles, Shapes & Templates.', 'info', 1500);
          },
        },
        {
          label: 'Subtitle Track Studio (SRT / VTT)...',
          action: () => openDialog('subtitleStudio'),
        },
        {
          label: 'Quick Text Generator...',
          action: () => openDialog('textGenerator'),
          divider: true,
        },
        {
          label: 'Voice Recording...',
          action: () => openCaptureModal('voice'),
        },
        {
          label: 'Screen Capture...',
          action: () => openCaptureModal('screen'),
        },
        {
          label: 'Camera Recording...',
          action: () => openCaptureModal('camera'),
          divider: true,
        },
        {
          label: 'Media Manager',
          action: () => {
            setActiveSidebarTab('media');
            notify('Media Manager', 'Membuka panel Media Library.', 'info', 1500);
          },
        },
        {
          label: 'Settings',
          action: () => openDialog('settings'),
        },
        {
          label: 'Keyboard Shortcuts',
          action: () => openDialog('shortcuts'),
        },
      ],
    },
    {
      title: 'Export',
      items: [
        {
          label: 'Export Subtitles (SRT / VTT)...',
          action: () => openDialog('subtitleStudio'),
        },
        {
          label: 'Export Video (MP4 / WebM / Pro)...',
          action: () => comingSoon('Video Rendering & 4K Export Engine', 'Phase 9'),
        },
        {
          label: 'Export Audio (WAV / MP3)...',
          action: () => comingSoon('Audio Studio & Export', 'Phase 8 & 9'),
          divider: true,
        },
        {
          label: 'Render Queue',
          action: () => comingSoon('Background Render Queue', 'Phase 9'),
        },
      ],
    },
    {
      title: 'Help',
      items: [
        {
          label: 'Documentation',
          action: () => comingSoon('Dokumentasi Nusantara Video Studio', 'Phase 3'),
        },
        {
          label: 'Keyboard Shortcuts',
          action: () => openDialog('shortcuts'),
        },
        {
          label: 'Phase 5 Automated Test Suite...',
          action: () => openDialog('phase5Test'),
        },
        {
          label: 'Media Library Test Suite...',
          action: () => openDialog('mediaTest'),
          divider: true,
        },
        {
          label: 'About Nusantara Video Studio',
          action: () => openDialog('about'),
        },
      ],
    },
  ];

  return (
    <nav ref={menuRef} className="h-7 bg-[#12141a] border-b border-[#212632] flex items-center px-2 select-none relative z-30">
      <div className="flex items-center gap-1">
        {menus.map((menu) => (
          <div key={menu.title} className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === menu.title ? null : menu.title)}
              onMouseEnter={() => {
                if (activeMenu) setActiveMenu(menu.title);
              }}
              className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                activeMenu === menu.title
                  ? 'bg-[#252c3c] text-blue-400'
                  : 'text-slate-300 hover:text-slate-100 hover:bg-[#1a1e27]'
              }`}
            >
              {menu.title}
            </button>

            {activeMenu === menu.title && (
              <div className="absolute left-0 top-full mt-0.5 min-w-[210px] bg-[#161922] border border-[#272e3d] rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                {menu.items.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <button
                      disabled={item.disabled}
                      onClick={() => {
                        item.action();
                        setActiveMenu(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-left transition-colors ${
                        item.disabled
                          ? 'opacity-40 cursor-not-allowed text-slate-500'
                          : 'text-slate-200 hover:bg-blue-600/20 hover:text-blue-400'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] text-slate-500 font-mono ml-4">
                          {item.shortcut}
                        </span>
                      )}
                    </button>
                    {item.divider && <div className="my-1 border-t border-[#232936]" />}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};
