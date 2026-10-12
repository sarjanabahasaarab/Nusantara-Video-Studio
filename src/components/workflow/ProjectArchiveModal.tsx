/**
 * Nusantara Video Studio - Project Archive Modal
 * Phase 8: Professional Editing Workflow (Requirements 18-20)
 *
 * Implements self-contained project archive packaging, asset dependency checking,
 * storage estimation, and standalone project archive generation.
 */

import React, { useState, useMemo } from 'react';
import {
  Archive,
  AlertTriangle,
  CheckCircle,
  FileText,
  HardDrive,
  Download,
  X,
  Layers,
  FolderArchive,
  Sparkles,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { ProjectArchiveManager } from '../../engine/workflow/ProjectArchiveManager';
import { ArchiveOptions } from '../../types/workflow';
import { formatBytes } from '../../utils/timecode';

interface ProjectArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectArchiveModal: React.FC<ProjectArchiveModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const notify = useUIStore((s) => s.notify);

  const [options, setOptions] = useState<ArchiveOptions>({
    includeProjectFile: true,
    includeUsedMedia: true,
    includeAudio: true,
    includeImages: true,
    includeGraphics: true,
    includeSubtitles: true,
    includeProxyFiles: false,
    includeCache: false,
    includeUnusedMedia: false,
  });

  const [isExporting, setIsExporting] = useState(false);

  // Validate archive contents
  const validation = useMemo(() => {
    return ProjectArchiveManager.validateArchive(currentProject, options);
  }, [currentProject, options]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof ArchiveOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateArchive = async () => {
    try {
      setIsExporting(true);
      const { manifest, blobUrl } = await ProjectArchiveManager.createProjectArchive(currentProject, options);

      // Trigger browser download of manifest / archive payload
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${manifest.archiveName}.nvarc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      notify(
        'Project Archive Berhasil',
        `Arsip "${manifest.archiveName}.nvarc" berhasil diekspor (${formatBytes(manifest.totalSizeBytes)}).`,
        'success',
        4000
      );
      onClose();
    } catch (err: any) {
      notify('Gagal Membuat Arsip', err.message || 'Terjadi kesalahan saat mengarsipkan.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FolderArchive size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Project Archive & Package</h2>
              <p className="text-xs text-slate-400">Bundling seluruh media dan data proyek mandiri ke arsip .nvarc</p>
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
          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle size={15} />
                Peringatan Validasi Arsip:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 pl-1">
                {validation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Archive Summary Statistics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[#181d28] border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Media Terpakai</span>
              <p className="text-lg font-bold text-slate-100 mt-1">{validation.usedMediaCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#181d28] border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Media Hilang</span>
              <p className={`text-lg font-bold mt-1 ${validation.missingMediaCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {validation.missingMediaCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#181d28] border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">File Proxy</span>
              <p className="text-lg font-bold text-slate-100 mt-1">{validation.proxyFilesCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#181d28] border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Estimasi Ukuran</span>
              <p className="text-lg font-bold text-blue-400 mt-1">{formatBytes(validation.totalEstimatedBytes)}</p>
            </div>
          </div>

          {/* Options Checklist */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Komponen Arsip</h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeProjectFile}
                  onChange={() => handleToggle('includeProjectFile')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">File Proyek (.nvproj)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeUsedMedia}
                  onChange={() => handleToggle('includeUsedMedia')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">Media Terpakai di Timeline</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeAudio}
                  onChange={() => handleToggle('includeAudio')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">Aset Audio & Musik</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeImages}
                  onChange={() => handleToggle('includeImages')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">Gambar & Grafik</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeSubtitles}
                  onChange={() => handleToggle('includeSubtitles')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">Subtitle & Track Teks</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeUnusedMedia}
                  onChange={() => handleToggle('includeUnusedMedia')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">Media yang Tidak Digunakan</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeProxyFiles}
                  onChange={() => handleToggle('includeProxyFiles')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">Sertakan File Proxy</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#181d28]/70 border border-slate-800/80 cursor-pointer hover:bg-[#1e2330]">
                <input
                  type="checkbox"
                  checked={options.includeCache}
                  onChange={() => handleToggle('includeCache')}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <span className="text-slate-200">Cache Waveform & Render</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Format: <span className="text-slate-200 font-mono">.nvarc (Nusantara Video Archive)</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Batal
            </button>
            <button
              onClick={handleCreateArchive}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              <Download size={14} />
              {isExporting ? 'Mengemas Arsip...' : 'Ekspor Project Archive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
