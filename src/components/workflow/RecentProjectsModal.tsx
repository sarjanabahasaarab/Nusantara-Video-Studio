/**
 * Nusantara Video Studio - Recent Projects Modal
 * Phase 8: Professional Editing Workflow (Requirement 5)
 *
 * Displays recently opened projects with metadata (Location, Last Opened,
 * Size, Version) and provides Open, Remove from Recent, and Copy Path actions.
 */

import React, { useEffect } from 'react';
import {
  FolderOpen,
  Clock,
  HardDrive,
  Trash2,
  Copy,
  ExternalLink,
  Plus,
  FileVideo,
  X,
  CheckCircle,
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { RecentProjectsManager } from '../../engine/workflow/RecentProjectsManager';
import { formatBytes } from '../../utils/timecode';

interface RecentProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecentProjectsModal: React.FC<RecentProjectsModalProps> = ({ isOpen, onClose }) => {
  const recentProjects = useWorkflowStore((s) => s.recentProjects);
  const refreshRecentProjects = useWorkflowStore((s) => s.refreshRecentProjects);
  const removeRecentProject = useWorkflowStore((s) => s.removeRecentProject);
  const notify = useUIStore((s) => s.notify);
  const openDialog = useUIStore((s) => s.openDialog);
  const loadProject = useProjectStore((s) => s.loadProject);

  useEffect(() => {
    if (isOpen) {
      refreshRecentProjects();
    }
  }, [isOpen, refreshRecentProjects]);

  if (!isOpen) return null;

  const handleOpenProject = async (id: string, name: string) => {
    const item = RecentProjectsManager.getById(id);
    if (item && item.projectData) {
      loadProject(item.projectData);
      RecentProjectsManager.trackProjectOpen(name, item.path, item.sizeBytes, item.projectData);
      refreshRecentProjects();
      notify('Proyek Dibuka', `Proyek "${name}" berhasil dimuat.`, 'success', 2000);
      onClose();
    } else {
      notify('Proyek Dimuat', `Memuat proyek dari riwayat: ${name}`, 'info', 2000);
      onClose();
    }
  };

  const handleRemove = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    removeRecentProject(id);
    notify('Dihapus dari Riwayat', `Proyek "${name}" dihapus dari daftar Recent Projects.`, 'info', 2000);
  };

  const handleCopyPath = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    notify('Path Tersalin', `Lokasi proyek disalin ke clipboard: ${path}`, 'success', 1500);
  };

  const formatLastOpened = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const diffMin = Math.round(diffMs / 60000);
      if (diffMin < 2) return 'Baru saja';
      if (diffMin < 60) return `${diffMin} menit yang lalu`;
      const diffHours = Math.round(diffMin / 60);
      if (diffHours < 24) return `${diffHours} jam yang lalu`;
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <FolderOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Recent Projects</h2>
              <p className="text-xs text-slate-400">Pilih proyek yang baru saja dibuka untuk melanjutkan sesi editing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {recentProjects.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FolderOpen size={44} className="mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">Belum ada proyek terbaru</p>
              <p className="text-xs text-slate-500 mt-1">Buat proyek baru atau buka file .nvproj untuk memulai</p>
            </div>
          ) : (
            recentProjects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleOpenProject(proj.id, proj.name)}
                className="group relative flex items-center justify-between p-4 rounded-lg bg-[#181d28]/70 hover:bg-[#1f2535] border border-slate-800/70 hover:border-blue-500/40 cursor-pointer transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-lg bg-slate-800/60 text-slate-300 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors shrink-0">
                    <FileVideo size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-slate-200 group-hover:text-white truncate">
                        {proj.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        v{proj.version || '0.8.0'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate mt-0.5 max-w-md">
                      {proj.path}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatLastOpened(proj.lastOpened)}
                      </span>
                      <span className="flex items-center gap-1">
                        <HardDrive size={12} />
                        {formatBytes(proj.sizeBytes || 1024 * 100)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleCopyPath(e, proj.path)}
                    title="Salin Path Lokasi"
                    className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 transition"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={(e) => handleRemove(e, proj.id, proj.name)}
                    title="Hapus dari Recent (Tidak menghapus file)"
                    className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              openDialog('newProject');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-lg shadow-blue-500/20"
          >
            <Plus size={14} />
            Buat Proyek Baru
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
