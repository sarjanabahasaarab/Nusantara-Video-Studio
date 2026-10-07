/**
 * Nusantara Video Studio - .cube LUT Manager Panel
 * Phase 6: Professional Color & Audio Studio
 *
 * Provides .cube import, validation error reporting, intensity slider,
 * enable/disable toggle, and removal without altering original media.
 */

import React, { useRef } from 'react';
import { LUTEffect } from '../../types/color';
import { useColorStore } from '../../stores/colorStore';
import { useUIStore } from '../../stores/uiStore';
import { Upload, Trash2, CheckCircle2, AlertCircle, FileCode } from 'lucide-react';
import { SliderInput } from '../common/SliderInput';

interface LUTPanelProps {
  currentLUT?: LUTEffect;
  onChange: (lut?: LUTEffect) => void;
}

export const LUTPanel: React.FC<LUTPanelProps> = ({ currentLUT, onChange }) => {
  const importedLUTs = useColorStore((s) => s.importedLUTs);
  const importLUTFromText = useColorStore((s) => s.importLUTFromText);
  const removeLUT = useColorStore((s) => s.removeLUT);
  const notify = useUIStore((s) => s.notify);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = importLUTFromText(file.name, text);
      if (res.success && res.lut) {
        onChange(res.lut);
        notify('LUT Diimpor', `Tabel warna "${res.lut.name}" berhasil diparse dan diterapkan.`, 'success');
      } else {
        notify('Gagal Membaca LUT', res.error || 'File LUT tidak valid atau rusak.', 'error', 5000);
      }
    } catch (err) {
      notify('Gagal Membaca File', String(err), 'error');
    }
  };

  return (
    <div className="flex flex-col gap-3.5 p-3 bg-[#0d1017] border border-[#202737] rounded-xl select-none text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <FileCode className="w-3.5 h-3.5 text-blue-400" />
          <span>3D LUT (.cube)</span>
        </span>

        <input
          ref={fileInputRef}
          type="file"
          accept=".cube,text/plain"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] shadow-sm transition-colors"
        >
          <Upload className="w-3 h-3" />
          <span>Import .cube</span>
        </button>
      </div>

      {/* Active LUT Status Card */}
      {currentLUT ? (
        <div className="flex flex-col gap-2 p-2.5 bg-[#121622] border border-blue-500/40 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-white text-xs truncate max-w-[180px]">
                  {currentLUT.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {currentLUT.cubeData ? `3D Size: ${currentLUT.cubeData.size}x${currentLUT.cubeData.size}x${currentLUT.cubeData.size}` : 'LUT Aktif'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onChange({ ...currentLUT, enabled: !currentLUT.enabled })}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                  currentLUT.enabled
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                    : 'bg-[#181d2c] text-slate-400 border-[#252e42]'
                }`}
              >
                {currentLUT.enabled ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => onChange(undefined)}
                className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                title="Hapus LUT dari Clip"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Intensity Slider */}
          <SliderInput
            label="Intensitas LUT"
            value={currentLUT.intensity}
            min={0}
            max={100}
            step={1}
            unit="%"
            onChange={(val) => onChange({ ...currentLUT, intensity: val })}
            onReset={() => onChange({ ...currentLUT, intensity: 100 })}
          />
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-[#242b3b] text-center text-slate-400 flex flex-col items-center justify-center gap-1.5">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          <span className="text-[11px]">Belum ada 3D LUT yang diterapkan ke clip ini.</span>
          <span className="text-[10px] text-slate-500">
            Dukung format standar industri .cube tanpa mengubah file sumber.
          </span>
        </div>
      )}

      {/* Previously Imported LUTs Selector */}
      {importedLUTs.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-2 border-t border-[#1c2333]">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Library LUT Tersimpan:</span>
          <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {importedLUTs.map((l) => (
              <div
                key={l.id}
                onClick={() => onChange({ ...l, enabled: true })}
                className={`p-1.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  currentLUT?.id === l.id
                    ? 'bg-blue-600/20 border-blue-500/50 text-white'
                    : 'bg-[#121622] hover:bg-[#181d2a] border-[#222a3a] text-slate-300'
                }`}
              >
                <span className="truncate text-[11px]">{l.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeLUT(l.id);
                    if (currentLUT?.id === l.id) onChange(undefined);
                  }}
                  className="text-slate-500 hover:text-rose-400 p-0.5 rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
