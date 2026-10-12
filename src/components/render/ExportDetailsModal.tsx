/**
 * Nusantara Video Studio - Export Details & Output Inspector Modal
 * Phase 9: Professional Rendering & Export Engine (Requirements 50, 51)
 */

import React, { useState, useEffect } from 'react';
import {
  FileVideo,
  X,
  Play,
  Download,
  FolderOpen,
  CheckCircle2,
  HardDrive,
  Clock,
  Layers,
  Volume2,
  Activity,
} from 'lucide-react';
import { RenderJob, OutputValidationReport } from '../../types/render';
import { RenderValidator } from '../../render/RenderValidator';
import { RenderProgressCalculator } from '../../render/RenderProgress';

interface ExportDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: RenderJob | null;
}

export const ExportDetailsModal: React.FC<ExportDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
}) => {
  const [report, setReport] = useState<OutputValidationReport | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen && job && job.outputPath) {
      RenderValidator.validateOutputFile(job.outputPath, job.settings).then((rep) => {
        setReport(rep);
      });
    }
  }, [isOpen, job]);

  if (!isOpen || !job) return null;

  const downloadUrl = `/api/render/download?path=${encodeURIComponent(job.outputPath)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wide">
                Export Details & Output Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Laporan metadata teknis aktual yang dibaca langsung dari berkas video hasil render
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Video Player Preview if active */}
          {isPlaying && (
            <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
              <video
                src={downloadUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Technical Specs Grid (Requirement 50) */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Nama Berkas</span>
              <p className="font-semibold text-slate-200 text-sm font-mono truncate">
                {job.outputPath.split('/').pop() || 'Final.mp4'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Ukuran File</span>
              <p className="font-semibold text-slate-200 text-sm font-mono">
                {report
                  ? `${(report.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`
                  : 'Memuat...'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Durasi Video</span>
              <p className="font-semibold text-slate-200 text-sm font-mono">
                {report
                  ? RenderProgressCalculator.formatSecondsToHms(report.durationSec)
                  : '00:00:00'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Resolusi</span>
              <p className="font-semibold text-slate-200 text-sm font-mono">
                {report ? `${report.width} × ${report.height}` : '1920 × 1080'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Frame Rate</span>
              <p className="font-semibold text-slate-200 text-sm font-mono">
                {report ? `${report.fps} FPS` : '30 FPS'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Video Codec</span>
              <p className="font-semibold text-blue-400 text-sm font-mono uppercase">
                {report?.videoCodec || job.settings.videoCodec}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Bitrate Rata-Rata</span>
              <p className="font-semibold text-slate-200 text-sm font-mono">
                {report ? `${(report.bitrateKbps / 1000).toFixed(1)} Mbps` : '12.0 Mbps'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Spesifikasi Audio</span>
              <p className="font-semibold text-slate-200 text-sm font-mono uppercase">
                {report?.audioCodec || job.settings.audioCodec} • {job.settings.audioSampleRate} Hz •{' '}
                {job.settings.audioChannels === 2 ? 'Stereo' : 'Mono'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#141822] border border-slate-800 text-[11px] font-mono text-slate-400 break-all">
            <span className="text-slate-500">Path: </span>
            {job.outputPath}
          </div>
        </div>

        {/* Footer Actions (Requirement 51) */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold border border-blue-500/30 transition flex items-center gap-2"
            >
              <Play size={14} className="fill-blue-300" />
              <span>{isPlaying ? 'Tutup Pemutar' : 'Putar Video'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={downloadUrl}
              download
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition flex items-center gap-2 border border-slate-700"
            >
              <Download size={14} />
              <span>Simpan Berkas</span>
            </a>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition shadow-lg shadow-blue-600/20"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
