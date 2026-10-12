/**
 * Nusantara Video Studio - Relink Media Workflow Modal
 * Phase 8: Professional Editing Workflow (Requirements 14-17)
 *
 * Implements full missing media detection, offline badges, automated directory scanning,
 * multi-criteria heuristic matching (filename, extension, size, duration, hash),
 * confidence scoring, batch relinking, and manual locator.
 */

import React, { useState, useMemo, useRef } from 'react';
import {
  Link2,
  AlertTriangle,
  FolderSearch,
  CheckCircle2,
  FileQuestion,
  Search,
  X,
  Upload,
  RefreshCw,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { RelinkEngine } from '../../engine/workflow/RelinkEngine';
import { RelinkCandidate, MediaItem } from '../../types';
import { formatBytes, formatDuration } from '../../utils/timecode';

interface RelinkMediaWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RelinkMediaWorkflowModal: React.FC<RelinkMediaWorkflowModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const notify = useUIStore((s) => s.notify);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMissingId, setSelectedMissingId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [candidates, setCandidates] = useState<RelinkCandidate[]>([]);

  // Find all offline/missing media in current project
  const missingMedia = useMemo(() => {
    return currentProject.media.filter(
      (m) => m.status === 'offline' || !m.url || (m as any).isMissing
    );
  }, [currentProject.media]);

  if (!isOpen) return null;

  const handleManualLocate = (mediaId: string) => {
    setSelectedMissingId(mediaId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedMissingId) return;

    const file = files[0];
    const newBlobUrl = URL.createObjectURL(file);

    // Apply manual relink
    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        media: state.currentProject.media.map((m) => {
          if (m.id === selectedMissingId) {
            return {
              ...m,
              url: newBlobUrl,
              status: 'online' as const,
              name: file.name,
              size: file.size,
              updatedAt: new Date().toISOString(),
            };
          }
          return m;
        }),
      },
      isDirty: true,
    }));

    notify('Media Berhasil Direlink', `File "${file.name}" berhasil dihubungkan kembali.`, 'success', 2500);
    setSelectedMissingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBatchScanFolder = async () => {
    setIsScanning(true);
    try {
      // Simulate/execute search using RelinkEngine
      const result = await RelinkEngine.scanFolderForMissingMedia(
        missingMedia,
        '/media/library'
      );
      setCandidates(result.candidates);
      notify(
        'Pemindaian Selesai',
        `Ditemukan ${result.strongMatchesCount} kecocokan kuat dari ${result.totalMissing} media offline.`,
        'info',
        3000
      );
    } finally {
      setIsScanning(false);
    }
  };

  const handleApplyMatch = (candidate: RelinkCandidate) => {
    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        media: state.currentProject.media.map((m) => {
          if (m.id === candidate.missingMediaId) {
            return {
              ...m,
              url: candidate.matchedBlobUrl || m.url,
              status: 'online' as const,
              name: candidate.matchedFilename,
              size: candidate.matchedSize || m.size,
              updatedAt: new Date().toISOString(),
            };
          }
          return m;
        }),
      },
      isDirty: true,
    }));

    setCandidates((prev) => prev.filter((c) => c.missingMediaId !== candidate.missingMediaId));
    notify('Relink Berhasil', `File "${candidate.matchedFilename}" ditautkan ke media proyek.`, 'success', 2000);
  };

  const handleRelinkAllStrongMatches = () => {
    const strongOnes = candidates.filter((c) => c.confidence === 'Strong Match');
    if (strongOnes.length === 0) {
      notify('Info', 'Tidak ada Strong Match otomatis yang tersedia.', 'info');
      return;
    }

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        media: state.currentProject.media.map((m) => {
          const matched = strongOnes.find((c) => c.missingMediaId === m.id);
          if (matched) {
            return {
              ...m,
              url: matched.matchedBlobUrl || m.url,
              status: 'online' as const,
              name: matched.matchedFilename,
              size: matched.matchedSize || m.size,
              updatedAt: new Date().toISOString(),
            };
          }
          return m;
        }),
      },
      isDirty: true,
    }));

    setCandidates((prev) => prev.filter((c) => c.confidence !== 'Strong Match'));
    notify('Relink Masal Selesai', `${strongOnes.length} file berhasil ditautkan kembali.`, 'success', 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Link2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Media Relink Manager</h2>
              <p className="text-xs text-slate-400">
                Pencarian dan penautan kembali file media yang terputus atau dipindahkan
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Missing Media Counter Card */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-[#181d28] border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${
                  missingMedia.length > 0
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {missingMedia.length > 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">
                  {missingMedia.length > 0
                    ? `${missingMedia.length} File Media Offline`
                    : 'Seluruh Media Online & Terhubung'}
                </h4>
                <p className="text-xs text-slate-400">
                  {missingMedia.length > 0
                    ? 'Hubungkan file secara manual atau gunakan pencarian otomatis'
                    : 'Tidak ada referensi media yang terputus dalam proyek ini'}
                </p>
              </div>
            </div>

            {missingMedia.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBatchScanFolder}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition disabled:opacity-50"
                >
                  <FolderSearch size={14} />
                  {isScanning ? 'Memindai...' : 'Search Folder'}
                </button>
                {candidates.some((c) => c.confidence === 'Strong Match') && (
                  <button
                    onClick={handleRelinkAllStrongMatches}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
                  >
                    <CheckCircle2 size={14} />
                    Relink All
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Missing Media List */}
          {missingMedia.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Daftar File Hilang / Offline
              </h3>
              <div className="space-y-2">
                {missingMedia.map((m) => {
                  const candidate = candidates.find((c) => c.missingMediaId === m.id);
                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="p-2 rounded bg-rose-500/10 text-rose-400 shrink-0">
                          <FileQuestion size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-slate-200 truncate">{m.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] uppercase font-bold">
                              Offline
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5 max-w-sm">
                            {(m as any).originalPath || m.url || 'Lokasi tidak diketahui'}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                            <span>Durasi: {formatDuration(m.duration || 0)}</span>
                            <span>•</span>
                            <span>Ukuran: {formatBytes(m.size || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Candidate match or manual action */}
                      <div className="flex items-center gap-2 shrink-0">
                        {candidate ? (
                          <div className="flex items-center gap-2 bg-[#12151c] px-3 py-1.5 rounded border border-slate-700">
                            <div>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  candidate.confidence === 'Strong Match'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}
                              >
                                {candidate.confidence} ({candidate.matchScore}%)
                              </span>
                              <p className="text-[11px] text-slate-300 font-medium truncate max-w-[140px]">
                                {candidate.matchedFilename}
                              </p>
                            </div>
                            <button
                              onClick={() => handleApplyMatch(candidate)}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-medium"
                            >
                              Terapkan
                            </button>
                          </div>
                        ) : null}

                        <button
                          onClick={() => handleManualLocate(m.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-medium transition"
                        >
                          <Upload size={13} />
                          Locate File
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-sm font-medium text-slate-300">Semua File Terhubung</p>
              <p className="text-xs text-slate-500 mt-1">
                Koneksi media dalam keadaan prima. Tidak ada file yang hilang.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Heuristik: Pencocokan nama, ekstensi, hash, durasi, dan byte stream.
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
