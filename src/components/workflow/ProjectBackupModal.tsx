/**
 * Nusantara Video Studio - Project Backup & Autosave Modal
 * Phase 8: Professional Editing Workflow
 *
 * Implements backup snapshot browser, restore version, manual snapshot generation,
 * and autosave management.
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  Plus,
  Clock,
  HardDrive,
  Trash2,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { AutosaveRecoveryManager } from '../../engine/workflow/AutosaveRecoveryManager';
import { ProjectBackupItem } from '../../types/workflow';
import { formatBytes } from '../../utils/timecode';

interface ProjectBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectBackupModal: React.FC<ProjectBackupModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const notify = useUIStore((s) => s.notify);

  const [backups, setBackups] = useState<ProjectBackupItem[]>([]);
  const [labelInput, setLabelInput] = useState('');

  const refreshBackups = () => {
    const list = AutosaveRecoveryManager.getBackups(currentProject.id);
    setBackups(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshBackups();
    }
  }, [isOpen, currentProject.id]);

  if (!isOpen) return null;

  const handleCreateManualBackup = () => {
    const label = labelInput.trim() || 'Manual Snapshot';
    AutosaveRecoveryManager.createBackup(currentProject, label);
    setLabelInput('');
    refreshBackups();
    notify('Backup Berhasil', `Snapshot "${label}" berhasil disimpan secara lokal.`, 'success', 2000);
  };

  const handleRestore = (item: ProjectBackupItem) => {
    if (confirm(`Pulihkan proyek ke versi "${item.versionLabel}" (${new Date(item.timestamp).toLocaleTimeString()})? Perubahan yang belum disimpan akan digantikan.`)) {
      loadProject(item.snapshot);
      notify('Proyek Dipulihkan', `Proyek dipulihkan dari snapshot: ${item.versionLabel}`, 'success', 3000);
      onClose();
    }
  };

  const handleDelete = (id: string) => {
    AutosaveRecoveryManager.deleteBackup(id);
    refreshBackups();
    notify('Backup Dihapus', 'Snapshot backup dihapus.', 'info', 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Project Backup & Recovery</h2>
              <p className="text-xs text-slate-400">Kelola riwayat backup otomatis dan snapshot keamanan proyek</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* New Snapshot Creator */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-[#181d28] border border-slate-800">
            <input
              type="text"
              placeholder="Label versi backup (misal: Sebelum potong adegan 3)..."
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateManualBackup()}
              className="flex-1 px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleCreateManualBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shrink-0"
            >
              <Plus size={14} />
              Simpan Snapshot
            </button>
          </div>

          {/* Backup List */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Daftar Backup ({backups.length})
            </h3>

            {backups.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <FileCheck size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs text-slate-400">Belum ada snapshot backup tersimpan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Autosave otomatis membuat backup setiap 5 menit</p>
              </div>
            ) : (
              backups.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-[#181d28]/70 hover:bg-[#1f2535] border border-slate-800/80 transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-200 truncate">{item.versionLabel}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{new Date(item.timestamp).toLocaleString('id-ID')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <HardDrive size={11} />
                          {formatBytes(item.sizeBytes || 1024 * 50)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 text-xs font-medium transition"
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Hapus Snapshot"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <span className="text-xs text-slate-400">Autosave Interval: 5 Menit (Dapat diatur di Pengaturan)</span>
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
