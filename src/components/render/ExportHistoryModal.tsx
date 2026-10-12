/**
 * Nusantara Video Studio - Export History Modal
 * Phase 9: Professional Rendering & Export Engine (Requirement 77)
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  X,
  Play,
  Download,
  Trash2,
  RotateCcw,
  Film,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { ExportHistoryItem } from '../../types/render';
import { ExportManager } from '../../render/ExportManager';
import { useUIStore } from '../../stores/uiStore';

interface ExportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReRender?: (item: ExportHistoryItem) => void;
}

export const ExportHistoryModal: React.FC<ExportHistoryModalProps> = ({
  isOpen,
  onClose,
  onReRender,
}) => {
  const notify = useUIStore((s) => s.notify);
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);

  const loadHistory = () => {
    setHistory(ExportManager.getExportHistory());
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string) => {
    ExportManager.deleteHistoryItem(id);
    loadHistory();
    notify('Riwayat Dihapus', 'Entri riwayat ekspor dihapus (berkas fisik tetap aman).', 'info', 1800);
  };

  const handleClearAll = () => {
    ExportManager.clearHistory();
    loadHistory();
    notify('Riwayat Dibersihkan', 'Semua riwayat ekspor telah dibersihkan.', 'info', 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <History size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wide">
                Riwayat Ekspor (Export History)
              </h2>
              <p className="text-xs text-slate-400">
                Daftar rekaman ekspor video masa lalu dengan parameter format, durasi, dan tautan unduhan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-xs text-slate-300 font-medium transition"
              >
                Hapus Semua
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {history.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-[#141822] border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Film size={32} />
              </div>
              <p className="text-sm font-semibold text-slate-300">Belum Ada Riwayat Ekspor</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Setelah Anda menyelesaikan proses ekspor video, catatan teknis hasil render akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-[#141822] border border-slate-800 flex items-center justify-between gap-4 transition hover:border-slate-700"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-100 truncate">
                        {item.projectName}
                      </h3>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>{new Date(item.date).toLocaleString()}</span>
                      <span>•</span>
                      <span>
                        {item.format.toUpperCase()} • {item.resolution}
                      </span>
                      <span>•</span>
                      <span>Durasi: {item.duration}</span>
                      <span>•</span>
                      <span>Ukuran: {(item.fileSizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                    </div>

                    <p className="text-[11px] text-slate-500 font-mono truncate max-w-xl">
                      {item.outputPath}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`/api/render/download?path=${encodeURIComponent(item.outputPath)}`}
                      download
                      className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 transition"
                      title="Unduh Berkas Video"
                    >
                      <Download size={15} />
                    </a>

                    {onReRender && (
                      <button
                        onClick={() => onReRender(item)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Render Ulang dengan Pengaturan Ini"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                      title="Hapus dari Riwayat"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
