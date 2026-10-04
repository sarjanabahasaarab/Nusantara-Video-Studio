/**
 * Nusantara Video Studio - Menu Bar
 * Complete desktop NLE menu system with full Phase 1 hierarchy
 */

import React, { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore, SidebarTab } from '../../stores/uiStore';
import { fileService } from '../../services/fileService';

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

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

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

  const comingSoon = (featureName: string, phase = 'Phase 2') => {
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
          label: 'Cut',
          shortcut: 'Ctrl+X',
          action: () => comingSoon('Cut Clip', 'Phase 3 & 4'),
        },
        {
          label: 'Copy',
          shortcut: 'Ctrl+C',
          action: () => comingSoon('Copy Clip', 'Phase 3 & 4'),
        },
        {
          label: 'Paste',
          shortcut: 'Ctrl+V',
          action: () => comingSoon('Paste Clip', 'Phase 3 & 4'),
          divider: true,
        },
        {
          label: 'Delete',
          shortcut: 'Del',
          action: () => {
            if (selectedClipId) {
              removeClip(selectedClipId);
              clearSelection();
              notify('Delete', 'Clip terpilih dihapus.', 'info');
            } else {
              notify('Delete', 'Pilih item pada timeline untuk dihapus.', 'warning');
            }
          },
        },
        {
          label: 'Select All',
          shortcut: 'Ctrl+A',
          action: () => comingSoon('Select All', 'Phase 3'),
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
          shortcut: 'Ctrl+B',
          action: () => {
            if (selectedClipId) {
              splitClipAtCurrentTime(selectedClipId);
              notify('Split Clip', 'Clip berhasil dipotong pada playhead.', 'success');
            } else {
              notify('Split', 'Pilih clip terlebih dahulu untuk dipotong.', 'warning');
            }
          },
        },
        {
          label: 'Trim Start / End',
          action: () => comingSoon('Trim Tool', 'Phase 3 & 4'),
        },
        {
          label: 'Duplicate',
          shortcut: 'Ctrl+D',
          action: () => comingSoon('Duplicate Clip', 'Phase 3'),
          divider: true,
        },
        {
          label: 'Delete Clip',
          shortcut: 'Del',
          action: () => {
            if (selectedClipId) {
              removeClip(selectedClipId);
              clearSelection();
              notify('Delete', 'Clip dihapus.', 'info');
            }
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
          label: 'Settings',
          action: () => openDialog('settings'),
        },
        {
          label: 'Keyboard Shortcuts',
          action: () => openDialog('shortcuts'),
          divider: true,
        },
        {
          label: 'Media Manager',
          action: () => comingSoon('Media Manager', 'Phase 2'),
        },
      ],
    },
    {
      title: 'Export',
      items: [
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
          action: () => comingSoon('Dokumentasi Nusantara Video Studio', 'Phase 2'),
        },
        {
          label: 'Keyboard Shortcuts',
          action: () => openDialog('shortcuts'),
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
