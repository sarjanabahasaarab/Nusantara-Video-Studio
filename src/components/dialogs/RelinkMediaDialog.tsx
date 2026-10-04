/**
 * Nusantara Video Studio - Relink Media Dialog
 * Phase 2: Media Library & Media Import
 *
 * Allows users to replace an offline or moved media file with a new file.
 */

import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { useMediaStore } from '../../stores/mediaStore';
import { useUIStore } from '../../stores/uiStore';
import { Link, Upload, AlertCircle } from 'lucide-react';
import { formatBytes } from '../../utils/timecode';

export const RelinkMediaDialog: React.FC = () => {
  const relinkTarget = useMediaStore((s) => s.relinkTargetItem);
  const setRelinkTarget = useMediaStore((s) => s.setRelinkTarget);
  const relinkMedia = useMediaStore((s) => s.relinkMedia);
  const notify = useUIStore((s) => s.notify);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!relinkTarget) return null;

  const handleSelectReplacement = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const updated = await relinkMedia(relinkTarget.id, file);
      if (updated) {
        notify(
          'Media Berhasil Direlink',
          `Berkas "${relinkTarget.name}" berhasil ditautkan kembali ke file baru (${file.name}).`,
          'success',
          3500
        );
      } else {
        notify('Gagal Relink', 'Format file tidak sesuai atau gagal diproses.', 'error');
      }
    } catch (err) {
      notify('Gagal Relink', err instanceof Error ? err.message : String(err), 'error');
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setRelinkTarget(null)}
      title="Relink Media File"
      subtitle={`Tautkan kembali berkas: ${relinkTarget.name}`}
      maxWidth="max-w-md"
    >
      <div className="flex flex-col gap-4 text-xs">
        <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-lg flex items-start gap-2.5 text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-semibold text-amber-100">Berkas Asli:</span>
            <p className="truncate text-slate-300 font-mono mt-0.5">{relinkTarget.path}</p>
            <p className="text-slate-400 mt-1">
              Tipe: {relinkTarget.type.toUpperCase()} • Ukuran Asli: {formatBytes(relinkTarget.size)}
            </p>
          </div>
        </div>

        <p className="text-slate-300 text-[11px] leading-relaxed">
          Pilih file pengganti dari komputer Anda. ID media dan referensi timeline di masa mendatang
          akan tetap dipertahankan.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleSelectReplacement}
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#222836]">
          <button
            type="button"
            onClick={() => setRelinkTarget(null)}
            className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2b] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Pilih Berkas Baru...</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
