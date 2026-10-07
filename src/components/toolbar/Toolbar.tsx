/**
 * Nusantara Video Studio - Main Toolbar
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Controls: New, Open, Save, Undo, Redo, Import, Split, Text, Voice,
 * Screen Capture, Camera, Play, Stop, Zoom.
 */

import React from 'react';
import {
  FilePlus,
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Upload,
  Scissors,
  Type,
  Mic,
  Monitor,
  Camera,
  Play,
  Pause,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
import { useMediaStore } from '../../stores/mediaStore';
import { useCaptureStore } from '../../stores/captureStore';
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
      className={`group relative flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all duration-150 ${
        disabled
          ? 'opacity-30 cursor-not-allowed text-slate-500'
          : active
          ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40 shadow-sm'
          : highlight
          ? 'bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm'
          : 'text-slate-300 hover:text-white hover:bg-[#202531]'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[11px] font-medium hidden md:inline">{label}</span>
    </button>
  );
};

export const Toolbar: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.past.length > 0);
  const canRedo = useProjectStore((s) => s.future.length > 0);
  const markSaved = useProjectStore((s) => s.markSaved);

  const selectedClipIds = useSelectionStore((s) => s.selectedClipIds);
  const splitSelectedClipsAtPlayhead = useTimelineStore((s) => s.splitSelectedClipsAtPlayhead);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const stop = useTimelineStore((s) => s.stop);
  const zoomIn = useTimelineStore((s) => s.zoomIn);
  const zoomOut = useTimelineStore((s) => s.zoomOut);
  const zoomToFit = useTimelineStore((s) => s.zoomToFit);

  const openDialog = useUIStore((s) => s.openDialog);
  const setActiveSidebarTab = useUIStore((s) => s.setActiveSidebarTab);
  const notify = useUIStore((s) => s.notify);

  const openCaptureModal = useCaptureStore((s) => s.openModal);

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

  const handleSplit = () => {
    if (selectedClipIds.length > 0) {
      splitSelectedClipsAtPlayhead();
      notify('Split Clip', 'Clip terpilih berhasil dipotong pada playhead.', 'success');
    } else {
      notify('Split Clip', 'Pilih clip pada timeline untuk dipotong.', 'warning');
    }
  };

  return (
    <div className="h-10 bg-[#141720] border-b border-[#212632] px-3 flex items-center justify-between gap-1 overflow-x-auto select-none">
      {/* Group 1: Project Operations (New, Open, Save) */}
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
          tooltip="Save Project (Ctrl+S)"
          onClick={() => {
            fileService.saveProjectToFile(currentProject);
            markSaved();
            notify('Simpan Proyek', `File "${currentProject.name}.nvproj" berhasil disimpan.`, 'success');
          }}
        />

        <div className="h-4 w-px bg-[#262c3a] mx-0.5" />

        {/* Group 2: History (Undo, Redo) */}
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

        <div className="h-4 w-px bg-[#262c3a] mx-0.5" />

        {/* Group 3: Ingestion & Editing (Import, Split) */}
        <ToolbarButton
          icon={<Upload className="w-3.5 h-3.5 text-blue-400" />}
          label="Import"
          tooltip="Import Media (Ctrl+I)"
          highlight={true}
          onClick={handleImportMedia}
        />
        <ToolbarButton
          icon={<Scissors className="w-3.5 h-3.5 text-blue-400" />}
          label="Split"
          tooltip="Split at Playhead (Ctrl+K)"
          onClick={handleSplit}
        />

        <div className="h-4 w-px bg-[#262c3a] mx-0.5" />

        {/* Group 4: Capture & Content Creation (Text, Voice, Screen Capture, Camera) */}
        <ToolbarButton
          icon={<Type className="w-3.5 h-3.5 text-amber-400" />}
          label="Text"
          tooltip="Titles & Subtitles (Tools → Text)"
          onClick={() => openDialog('textGenerator')}
        />
        <ToolbarButton
          icon={<Mic className="w-3.5 h-3.5 text-emerald-400" />}
          label="Voice"
          tooltip="Record Voice / Microphone"
          onClick={() => openCaptureModal('voice')}
        />
        <ToolbarButton
          icon={<Monitor className="w-3.5 h-3.5 text-cyan-400" />}
          label="Screen"
          tooltip="Screen Capture"
          onClick={() => openCaptureModal('screen')}
        />
        <ToolbarButton
          icon={<Camera className="w-3.5 h-3.5 text-rose-400" />}
          label="Camera"
          tooltip="Camera / Webcam Recording"
          onClick={() => openCaptureModal('camera')}
        />

        <div className="h-4 w-px bg-[#262c3a] mx-0.5" />

        {/* Group 5: Playback Controls (Play, Stop) */}
        <ToolbarButton
          icon={
            isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current text-white" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current text-white" />
            )
          }
          label={isPlaying ? 'Pause' : 'Play'}
          tooltip="Play / Pause (Space)"
          highlight={isPlaying}
          onClick={togglePlay}
        />
        <ToolbarButton
          icon={<Square className="w-3.5 h-3.5 fill-current" />}
          label="Stop"
          tooltip="Stop"
          onClick={stop}
        />

        <div className="h-4 w-px bg-[#262c3a] mx-0.5" />

        {/* Group 6: Zoom Controls */}
        <ToolbarButton
          icon={<ZoomOut className="w-3.5 h-3.5" />}
          label=""
          tooltip="Zoom Out (Ctrl+-)"
          onClick={zoomOut}
        />
        <ToolbarButton
          icon={<ZoomIn className="w-3.5 h-3.5" />}
          label=""
          tooltip="Zoom In (Ctrl+=)"
          onClick={zoomIn}
        />
        <ToolbarButton
          icon={<Maximize2 className="w-3.5 h-3.5" />}
          label="Fit"
          tooltip="Fit Timeline to Window"
          onClick={() => zoomToFit(1000)}
        />
      </div>
    </div>
  );
};
