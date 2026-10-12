/**
 * Nusantara Video Studio - Render Queue Manager Modal
 * Phase 9: Professional Rendering & Export Engine (Requirements 38-51)
 */

import React, { useState, useEffect } from 'react';
import {
  ListOrdered,
  X,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Gauge,
  Film,
  Download,
  Eye,
  Sliders,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { RenderJob, RenderProgress } from '../../types/render';
import { RenderQueueManager } from '../../render/RenderQueue';
import { RenderProgressCalculator } from '../../render/RenderProgress';

interface RenderQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDetails?: (job: RenderJob) => void;
  onOpenLogs?: (jobId: string) => void;
}

export const RenderQueueModal: React.FC<RenderQueueModalProps> = ({
  isOpen,
  onClose,
  onOpenDetails,
  onOpenLogs,
}) => {
  const notify = useUIStore((s) => s.notify);
  const queueMgr = RenderQueueManager.getInstance();

  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [maxParallel, setMaxParallel] = useState<number>(queueMgr.getMaxParallel());
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const unsub = queueMgr.subscribe((updatedJobs) => {
        setJobs(updatedJobs);
      });
      return unsub;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePause = async (id: string) => {
    const ok = await queueMgr.pauseJob(id);
    if (ok) notify('Render Dijeda', 'Proses FFmpeg dihentikan sementara.', 'info', 1800);
  };

  const handleResume = async (id: string) => {
    const ok = await queueMgr.resumeJob(id);
    if (ok) notify('Render Dilanjutkan', 'Proses FFmpeg dilanjutkan kembali.', 'info', 1800);
  };

  const confirmCancel = async (id: string) => {
    await queueMgr.cancelJob(id);
    setCancellingJobId(null);
    notify('Render Dibatalkan', 'Proses dihentikan dan berkas sementara dibersihkan.', 'warning', 2000);
  };

  const getStatusBadge = (status: RenderJob['status']) => {
    switch (status) {
      case 'rendering':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40 animate-pulse';
      case 'preparing':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'paused':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'failed':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'cancelled':
        return 'bg-slate-700 text-slate-400 border-slate-600';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <ListOrdered size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wide">
                Antrean Render (Render Queue)
              </h2>
              <p className="text-xs text-slate-400">
                Pengelolaan tugas render multi-antrean latar belakang dengan pemantauan metrik aktual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Parallel limit */}
            <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400">Render Simultan:</span>
              <select
                value={maxParallel}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMaxParallel(val);
                  queueMgr.setMaxParallel(val);
                }}
                className="bg-transparent text-blue-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="1">1 Tugas</option>
                <option value="2">2 Tugas</option>
                <option value="3">3 Tugas</option>
              </select>
            </div>

            <button
              onClick={() => queueMgr.clearCompleted()}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
              title="Bersihkan tugas yang selesai"
            >
              Bersihkan Selesai
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Queue Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {jobs.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#141822] border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Film size={32} />
              </div>
              <p className="text-sm font-semibold text-slate-300">Antrean Render Kosong</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Buka dialog Ekspor Video untuk menambahkan proyek Anda ke dalam antrean render ini.
              </p>
            </div>
          ) : (
            jobs.map((job, idx) => {
              const p = job.progressDetails;
              const isRendering = job.status === 'rendering';
              const isPaused = job.status === 'paused';
              const isCompleted = job.status === 'completed';

              return (
                <div
                  key={job.id}
                  className="p-4 rounded-xl bg-[#141822] border border-slate-800/80 space-y-3 transition hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-slate-100 truncate">
                            {job.projectName}
                          </h3>
                          <span
                            className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border font-bold ${getStatusBadge(
                              job.status
                            )}`}
                          >
                            {job.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                          <span>
                            {job.settings.format.toUpperCase()} • {job.settings.videoCodec.toUpperCase()}
                          </span>
                          <span>•</span>
                          <span>
                            {job.settings.width}×{job.settings.height} @ {job.settings.fps} fps
                          </span>
                          <span>•</span>
                          <span>{job.settings.qualityPreset}</span>
                        </div>
                      </div>
                    </div>

                    {/* Job Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isRendering && (
                        <button
                          onClick={() => handlePause(job.id)}
                          className="p-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition"
                          title="Jeda Render"
                        >
                          <Pause size={15} />
                        </button>
                      )}

                      {isPaused && (
                        <button
                          onClick={() => handleResume(job.id)}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition"
                          title="Lanjutkan Render"
                        >
                          <Play size={15} />
                        </button>
                      )}

                      {(job.status === 'failed' || job.status === 'cancelled') && (
                        <button
                          onClick={() => queueMgr.retryJob(job.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Coba Lagi"
                        >
                          <RotateCcw size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => queueMgr.duplicateJob(job.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Duplikasi Tugas"
                      >
                        <Copy size={15} />
                      </button>

                      <button
                        onClick={() => queueMgr.moveUp(job.id)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition disabled:opacity-30"
                        title="Geser ke Atas"
                      >
                        <ArrowUp size={15} />
                      </button>

                      <button
                        onClick={() => queueMgr.moveDown(job.id)}
                        disabled={idx === jobs.length - 1}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition disabled:opacity-30"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown size={15} />
                      </button>

                      {onOpenLogs && (
                        <button
                          onClick={() => onOpenLogs(job.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="Lihat Log Render"
                        >
                          <FileText size={15} />
                        </button>
                      )}

                      {isCompleted && onOpenDetails && (
                        <button
                          onClick={() => onOpenDetails(job)}
                          className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 transition"
                          title="Inspeksi Detail Output"
                        >
                          <Eye size={15} />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (isRendering || isPaused) {
                            setCancellingJobId(job.id);
                          } else {
                            queueMgr.removeJob(job.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                        title="Batalkan / Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Real-time Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-3 text-slate-400">
                        {p ? (
                          <>
                            <span>
                              Frame: {p.currentFrame} / {p.totalFrames}
                            </span>
                            <span>•</span>
                            <span>{p.fps > 0 ? `${p.fps.toFixed(1)} fps` : '...'}</span>
                            <span>•</span>
                            <span>
                              Kecepatan:{' '}
                              {p.renderSpeedRealtime > 0
                                ? `${p.renderSpeedRealtime.toFixed(1)}x realtime`
                                : '1.0x'}
                            </span>
                          </>
                        ) : (
                          <span>{job.status === 'completed' ? 'Selesai 100%' : 'Menunggu giliran'}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {p?.remainingSeconds ? (
                          <span className="text-slate-400">
                            Sisa:{' '}
                            <span className="text-slate-200 font-bold">
                              {RenderProgressCalculator.formatSecondsToHms(p.remainingSeconds)}
                            </span>
                          </span>
                        ) : null}
                        <span className="font-bold text-blue-400">
                          {Math.round(job.progress)}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          job.status === 'completed'
                            ? 'bg-emerald-500'
                            : job.status === 'failed'
                            ? 'bg-rose-500'
                            : job.status === 'paused'
                            ? 'bg-yellow-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, job.progress))}%` }}
                      />
                    </div>
                  </div>

                  {/* Destination Path & Error info */}
                  {job.error ? (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{job.error.message}</span>
                    </div>
                  ) : job.outputPath ? (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                      <span className="truncate">Output: {job.outputPath}</span>
                      {isCompleted && (
                        <a
                          href={`/api/render/download?path=${encodeURIComponent(job.outputPath)}`}
                          download
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 ml-2 shrink-0 font-medium font-sans"
                        >
                          <Download size={13} />
                          <span>Unduh File</span>
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Cancellation Confirmation Dialog (Requirement 45) */}
        {cancellingJobId && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
            <div className="bg-[#121622] border border-slate-700 rounded-xl p-5 max-w-md w-full space-y-3 shadow-2xl">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" />
                <span>Batalkan Proses Render?</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tugas render ini sedang berjalan. Berkas keluaran sementara (temporary files) akan
                dibersihkan dari disk. Apakah Anda yakin ingin membatalkan?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCancellingJobId(null)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium transition"
                >
                  Lanjutkan Render
                </button>
                <button
                  onClick={() => confirmCancel(cancellingJobId)}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold transition"
                >
                  Batalkan Render
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
