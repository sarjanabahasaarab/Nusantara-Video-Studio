/**
 * Nusantara Video Studio - Main Toolbar
 * Fast-access tools with tooltips and responsive styling
 */

import React from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  MousePointer,
  Scissors,
  SplitSquareVertical,
  Trash2,
  Type,
  Music,
  Layers,
  Sparkles,
  Download,
  Upload,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore, EditorTool } from '../../stores/selectionStore';
import { useUIStore, SidebarTab } from '../../stores/uiStore';
import { useMediaStore } from '../../stores/mediaStore';
import { fileService } from '../../services/fileService';
import { mediaService } from '../../services/mediaService';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  highlight?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon,
  label,
  tooltip,
  onClick,
  disabled,
  active,
  highlight,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all duration-150 ${
        disabled
          ? 'opacity-30 cursor-not-allowed text-slate-500'
          : active
          ? 'bg-blue-600/25 text-blue-400 border border-blue-500/40 shadow-sm'
          : highlight
          ? 'bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm'
          : 'text-slate-300 hover:text-white hover:bg-[#202531]'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[11px] font-medium hidden sm:inline">{label}</span>
    </button>
  );
};

export const Toolbar: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.canUndo());
  const canRedo = useProjectStore((s) => s.canRedo());
  const markSaved = useProjectStore((s) => s.markSaved);

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const activeTool = useSelectionStore((s) => s.activeTool);
  const setActiveTool = useSelectionStore((s) => s.setActiveTool);
  const clearSelection = useSelectionStore((s) => s.clearSelection);

  const removeClip = useTimelineStore((s) => s.removeClip);
  const splitClipAtCurrentTime = useTimelineStore((s) => s.splitClipAtCurrentTime);

  const openDialog = useUIStore((s) => s.openDialog);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const notify = useUIStore((s) => s.notify);

  const handleToolSelect = (tool: EditorTool) => {
    setActiveTool(tool);
    notify('Tool Dipilih', `Mode: ${tool.toUpperCase()}`, 'info', 1000);
  };

  const handleSidebarTabSwitch = (tab: SidebarTab, label: string) => {
    setActiveSidebarTab(tab);
    notify(label, `Membuka tab ${label} di sidebar.`, 'info', 1200);
  };

  const handleImportMedia = async () => {
    setActiveSidebarTab('media');
    const files = await mediaService.openFileDialog();
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
  };

  return (
    <div className="h-10 bg-[#141720] border-b border-[#212632] px-3 flex items-center justify-between gap-2 overflow-x-auto select-none">
      {/* Group 1: Project Operations */}
      <div className="flex items-center gap-1 shrink-0">
        <ToolbarButton
          icon={<FilePlus className="w-3.5 h-3.5" />}
          label="New"
          tooltip="New Project (Ctrl+N)"
          onClick={() => openDialog('newProject')}
        />
        <ToolbarButton
          icon={<FolderOpen className="w-3.5 h-3.5" />}
          label="Open"
          tooltip="Open .nvproj Project (Ctrl+O)"
          onClick={async () => {
            const res = await fileService.openProjectFromFile();
            if (res.project) {
              useProjectStore.getState().loadProject(res.project);
              notify('Buka Proyek', `Proyek "${res.project.name}" berhasil dimuat.`, 'success');
            } else if (res.error && res.error !== 'No file selected') {
              notify('Gagal Membuka', res.error, 'error');
            }
          }}
        />
        <ToolbarButton
          icon={<Save className="w-3.5 h-3.5" />}
          label="Save"
          tooltip="Save Project to .nvproj (Ctrl+S)"
          onClick={() => {
            fileService.saveProjectToFile(currentProject);
            markSaved();
            notify('Simpan Proyek', `File "${currentProject.name}.nvproj" berhasil disimpan.`, 'success');
          }}
        />
        <ToolbarButton
          icon={<Upload className="w-3.5 h-3.5 text-blue-400" />}
          label="Import"
          tooltip="Import Media (Ctrl+I)"
          highlight={true}
          onClick={handleImportMedia}
        />

        <div className="h-4 w-px bg-[#262c3a] mx-1" />

        {/* Group 2: History */}
        <ToolbarButton
          icon={<Undo2 className="w-3.5 h-3.5" />}
          label="Undo"
          tooltip="Undo (Ctrl+Z)"
          disabled={!canUndo}
          onClick={() => {
            if (undo()) notify('Undo', 'Langkah dibatalkan.', 'info', 1500);
          }}
        />
        <ToolbarButton
          icon={<Redo2 className="w-3.5 h-3.5" />}
          label="Redo"
          tooltip="Redo (Ctrl+Shift+Z)"
          disabled={!canRedo}
          onClick={() => {
            if (redo()) notify('Redo', 'Perubahan diterapkan kembali.', 'info', 1500);
          }}
        />
      </div>

      {/* Group 3: Timeline & Editing Tools */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="h-4 w-px bg-[#262c3a] mx-1" />

        <ToolbarButton
          icon={<MousePointer className="w-3.5 h-3.5" />}
          label="Select"
          tooltip="Select Tool (V)"
          active={activeTool === 'select'}
          onClick={() => handleToolSelect('select')}
        />
        <ToolbarButton
          icon={<Scissors className="w-3.5 h-3.5" />}
          label="Cut"
          tooltip="Razor / Cut Clip Tool (C)"
          active={activeTool === 'cut'}
          onClick={() => handleToolSelect('cut')}
        />
        <ToolbarButton
          icon={<SplitSquareVertical className="w-3.5 h-3.5" />}
          label="Split"
          tooltip="Split Clip at Playhead (Ctrl+B)"
          onClick={() => {
            if (selectedClipId) {
              splitClipAtCurrentTime(selectedClipId);
              notify('Split Clip', 'Clip berhasil dipotong pada playhead.', 'success');
            } else {
              notify('Split', 'Pilih clip pada timeline untuk memotong pada playhead.', 'warning');
            }
          }}
        />
        <ToolbarButton
          icon={<Trash2 className="w-3.5 h-3.5" />}
          label="Delete"
          tooltip="Delete Selected Clip (Del)"
          disabled={!selectedClipId}
          onClick={() => {
            if (selectedClipId) {
              removeClip(selectedClipId);
              clearSelection();
              notify('Hapus', 'Clip dihapus dari timeline.', 'info');
            }
          }}
        />

        <div className="h-4 w-px bg-[#262c3a] mx-1" />

        {/* Group 4: Quick Asset Creators */}
        <ToolbarButton
          icon={<Type className="w-3.5 h-3.5" />}
          label="Text"
          tooltip="Titles & Subtitles (Phase 5)"
          onClick={() => handleSidebarTabSwitch('text', 'Teks & Judul')}
        />
        <ToolbarButton
          icon={<Music className="w-3.5 h-3.5" />}
          label="Audio"
          tooltip="Audio Library & BGM (Phase 8)"
          onClick={() => handleSidebarTabSwitch('audio', 'Audio Library')}
        />
        <ToolbarButton
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Transition"
          tooltip="Transitions Library (Phase 6)"
          onClick={() => handleSidebarTabSwitch('transition', 'Transitions')}
        />
        <ToolbarButton
          icon={<Sparkles className="w-3.5 h-3.5" />}
          label="Effect"
          tooltip="Visual Effects & Filters (Phase 6)"
          onClick={() => handleSidebarTabSwitch('effects', 'Visual Effects')}
        />
      </div>

      {/* Group 5: Export Action */}
      <div className="flex items-center gap-1 shrink-0">
        <ToolbarButton
          icon={<Download className="w-3.5 h-3.5" />}
          label="Export"
          tooltip="Export Video (Phase 9 Rendering)"
          highlight
          onClick={() => {
            notify(
              'Export Video',
              'Sistem rendering & 4K hardware-accelerated export engine akan hadir pada Phase 9.',
              'info',
              4000
            );
          }}
        />
      </div>
    </div>
  );
};
