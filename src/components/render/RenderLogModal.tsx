/**
 * Nusantara Video Studio - Render Log Inspector Modal
 * Phase 9: Professional Rendering & Export Engine (Requirement 62)
 */

import React, { useState, useEffect } from 'react';
import { FileText, X, Download, Copy, Check } from 'lucide-react';
import { RenderLogger } from '../../render/RenderLogger';
import { useUIStore } from '../../stores/uiStore';

interface RenderLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string | null;
}

export const RenderLogModal: React.FC<RenderLogModalProps> = ({
  isOpen,
  onClose,
  jobId,
}) => {
  const notify = useUIStore((s) => s.notify);
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && jobId) {
      setLogs(RenderLogger.getLogs(jobId));
      const interval = setInterval(() => {
        setLogs(RenderLogger.getLogs(jobId));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, jobId]);

  if (!isOpen || !jobId) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    notify('Log Disalin', 'Seluruh log render berhasil disalin ke clipboard.', 'info', 1800);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = RenderLogger.exportLogBlob(jobId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `render_log_${jobId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Log Diunduh', `Log berkas ${a.download} berhasil disimpan.`, 'success', 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wide">
                Render Log & Diagnostic Journal
              </h2>
              <p className="text-xs text-slate-400">
                Log eksekusi FFmpeg real-time tanpa eksposur token / kredensial sensitif
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Salin Seluruh Log"
            >
              {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Unduh Berkas Log (.txt)"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Console Log Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-black/90 font-mono text-[11px] leading-relaxed text-slate-300 space-y-1 select-text">
          {logs.length === 0 ? (
            <p className="text-slate-600 italic py-6 text-center">
              Belum ada baris log yang tercatat untuk tugas ini.
            </p>
          ) : (
            logs.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.includes('error') || line.includes('failed')
                    ? 'text-rose-400'
                    : line.includes('warning')
                    ? 'text-amber-400'
                    : line.includes('completed') || line.includes('Exit Code 0')
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }
              >
                {line}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800/80 bg-[#151924] text-xs text-slate-400">
          <span>Job ID: {jobId}</span>
          <span>{logs.length} Baris Log</span>
        </div>
      </div>
    </div>
  );
};
