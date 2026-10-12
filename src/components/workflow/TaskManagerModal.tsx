/**
 * Nusantara Video Studio - Background Task Manager Modal
 * Phase 8: Professional Editing Workflow (Requirement 30)
 *
 * Provides real-time visibility into asynchronous background processes:
 * proxy generation, AI transcription, relink scanners, archive creation, and waveform cache.
 */

import React from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Pause,
  Play,
  Trash2,
  X,
  Layers,
  Cpu,
  Clock,
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useUIStore } from '../../stores/uiStore';
import { TaskManager } from '../../engine/workflow/TaskManager';
import { BackgroundTask } from '../../types';

interface TaskManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaskManagerModal: React.FC<TaskManagerModalProps> = ({ isOpen, onClose }) => {
  const backgroundTasks = useWorkflowStore((s) => s.backgroundTasks);
  const cancelTask = useWorkflowStore((s) => s.cancelTask);
  const clearCompletedTasks = useWorkflowStore((s) => s.clearCompletedTasks);
  const notify = useUIStore((s) => s.notify);

  if (!isOpen) return null;

  const runningCount = backgroundTasks.filter((t) => t.status === 'running').length;

  const handleCancel = (id: string, name: string) => {
    cancelTask(id);
    notify('Tugas Dibatalkan', `Proses "${name}" telah dihentikan.`, 'info', 2000);
  };

  const getStatusIcon = (status: BackgroundTask['status']) => {
    switch (status) {
      case 'running':
        return <Activity size={16} className="text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'failed':
        return <AlertCircle size={16} className="text-rose-400" />;
      case 'cancelled':
        return <XCircle size={16} className="text-slate-500" />;
      default:
        return <Clock size={16} className="text-amber-400" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'proxy':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'ai':
      case 'ai_transcription':
      case 'scene_detection':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'archive':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'relink':
      case 'media_analysis':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'render':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-100">Background Task Manager</h2>
                {runningCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold animate-pulse">
                    {runningCount} Berjalan
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Kelola proses asinkron yang berjalan di latar belakang tanpa mengunci antarmuka
              </p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {backgroundTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Activity size={40} className="mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">Tidak ada proses latar belakang</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Pembuatan proxy, ekspor arsip, atau tugas AI akan muncul di sini secara otomatis
              </p>
            </div>
          ) : (
            backgroundTasks.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 space-y-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">{getStatusIcon(t.status)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 truncate">{t.title || t.name}</span>
                        <span
                          className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${getTypeBadgeColor(
                            t.type
                          )}`}
                        >
                          {t.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Mulai: {new Date(t.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {Math.round(t.progress)}%
                    </span>
                    {t.status === 'running' && (
                      <button
                        onClick={() => handleCancel(t.id, t.title || t.name || 'Task')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 text-xs font-medium transition"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      t.status === 'failed'
                        ? 'bg-rose-500'
                        : t.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <button
            onClick={clearCompletedTasks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
          >
            <Trash2 size={13} />
            Bersihkan yang Selesai
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
