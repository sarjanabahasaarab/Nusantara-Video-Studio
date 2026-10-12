/**
 * Nusantara Video Studio - Project Health & Optimization Modal
 * Phase 8: Professional Editing Workflow (Requirement 32)
 *
 * Runs comprehensive audit for project integrity, unused assets, missing files,
 * timeline gaps, proxy coverage, and provides automated cleanup fixes.
 */

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Zap,
  RefreshCw,
  FolderMinus,
  Sparkles,
  X,
  FileQuestion,
  Layers,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useUIStore } from '../../stores/uiStore';
import { ProjectHealthChecker } from '../../engine/workflow/ProjectHealthChecker';
import { ProjectHealthReport } from '../../types';

interface ProjectHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectHealthModal: React.FC<ProjectHealthModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const notify = useUIStore((s) => s.notify);
  const openDialog = useUIStore((s) => s.openDialog);
  const generateProxyForMedia = useWorkflowStore((s) => s.generateProxyForMedia);

  const [report, setReport] = useState<ProjectHealthReport | null>(null);

  const runAudit = () => {
    const res = ProjectHealthChecker.checkProject(currentProject);
    setReport(res);
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
  }, [isOpen, currentProject]);

  if (!isOpen) return null;

  const handleRemoveUnusedMedia = () => {
    const unusedIds = report?.unusedMediaIds || [];
    if (unusedIds.length === 0) return;
    const removedCount = unusedIds.length;

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        media: state.currentProject.media.filter((m) => !unusedIds.includes(m.id)),
      },
      isDirty: true,
    }));

    notify('Pembersihan Berhasil', `${removedCount} media tak terpakai dihapus dari proyek.`, 'success', 2500);
    runAudit();
  };

  const handleGenerateMissingProxies = async () => {
    if (!report) return;
    const videoNeedsProxy = currentProject.media.filter(
      (m) => (m.type === 'video' || m.mimeType?.startsWith('video/')) && !m.proxy
    );

    for (const v of videoNeedsProxy) {
      generateProxyForMedia(v.id);
    }

    notify(
      'Proxy Didaftarkan',
      `${videoNeedsProxy.length} video dimasukkan ke antrean pembuatan proxy background.`,
      'info',
      3000
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HeartPulse size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Project Health & Optimization</h2>
              <p className="text-xs text-slate-400">
                Audit integritas timeline, deteksi celah, aset terputus, dan pembersihan sampah
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {report && (
            <>
              {/* Score Header Card */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#181d28] border border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-slate-100">
                      {report.healthScore ?? report.healthyScore}%
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-semibold uppercase ${
                        (report.healthScore ?? report.healthyScore) > 80
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : (report.healthScore ?? report.healthyScore) > 50
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {(report.healthScore ?? report.healthyScore) > 80
                        ? 'Sangat Sehat'
                        : (report.healthScore ?? report.healthyScore) > 50
                        ? 'Cukup'
                        : 'Perlu Perhatian'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {report.totalMediaCount ?? 0} Media Terdaftar • {report.timelineClipsCount ?? 0} Klip di Timeline
                  </p>
                </div>

                <button
                  onClick={runAudit}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Segarkan Audit"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              {/* Metric Badges */}
              <div className="grid grid-cols-4 gap-2.5 text-center text-xs">
                <div className="p-3 rounded-lg bg-[#181d28]/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Offline Files</span>
                  <p className={`text-base font-bold mt-1 ${(report.missingFilesCount ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {report.missingFilesCount ?? 0}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#181d28]/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Unused Media</span>
                  <p className="text-base font-bold text-amber-400 mt-1">{report.unusedMediaIds?.length ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#181d28]/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Timeline Gaps</span>
                  <p className="text-base font-bold text-slate-200 mt-1">{report.timelineGapsCount ?? 0}</p>
                </div>
                <div className="p-3 rounded-lg bg-[#181d28]/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Tanpa Proxy</span>
                  <p className="text-base font-bold text-blue-400 mt-1">{report.unproxiedVideosCount ?? 0}</p>
                </div>
              </div>

              {/* Issues & Warnings List */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Hasil Analisis Audit
                </h3>

                {report.issues.length === 0 ? (
                  <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>Tidak ada masalah ditemukan. Proyek Anda berkinerja optimal!</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.issues.map((iss, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                          iss.severity === 'error' || (iss.severity as any) === 'high'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            : iss.severity === 'warning' || (iss.severity as any) === 'medium'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                        }`}
                      >
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{iss.title || iss.message}</p>
                          {(iss.description || iss.suggestion) && (
                            <p className="text-[11px] opacity-80 mt-0.5">{iss.description || iss.suggestion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions / Optimization Buttons */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Tindakan Optimasi Cepat
                </h3>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(report.unusedMediaIds?.length ?? 0) > 0 && (
                    <button
                      onClick={handleRemoveUnusedMedia}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 transition"
                    >
                      <FolderMinus size={14} />
                      Hapus Media Tak Digunakan ({report.unusedMediaIds?.length})
                    </button>
                  )}

                  {(report.unproxiedVideosCount ?? 0) > 0 && (
                    <button
                      onClick={handleGenerateMissingProxies}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 transition"
                    >
                      <Zap size={14} />
                      Generate Missing Proxies ({report.unproxiedVideosCount})
                    </button>
                  )}

                  {(report.missingFilesCount ?? 0) > 0 && (
                    <button
                      onClick={() => {
                        onClose();
                        openDialog('relinkMediaWorkflow' as any);
                      }}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 transition"
                    >
                      <FileQuestion size={14} />
                      Buka Relink Missing Files
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Nusantara Video Studio Engine v0.8.0 Health Inspector
          </span>
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
