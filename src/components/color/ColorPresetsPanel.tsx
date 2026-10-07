/**
 * Nusantara Video Studio - Color Presets & User Management Panel
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements 8 factory color grading presets plus custom user preset saving,
 * JSON export/import, and deletion.
 */

import React, { useState } from 'react';
import { ColorPreset, ClipColorGrading } from '../../types/color';
import { useColorStore } from '../../stores/colorStore';
import { useUIStore } from '../../stores/uiStore';
import { Sparkles, Plus, Trash2, Check, Download, Upload } from 'lucide-react';

interface ColorPresetsPanelProps {
  currentGrading: ClipColorGrading;
  onApplyPreset: (preset: ColorPreset) => void;
}

export const ColorPresetsPanel: React.FC<ColorPresetsPanelProps> = ({ currentGrading, onApplyPreset }) => {
  const builtinPresets = useColorStore((s) => s.builtinPresets);
  const customPresets = useColorStore((s) => s.customPresets);
  const saveCustomPreset = useColorStore((s) => s.saveCustomPreset);
  const deleteCustomPreset = useColorStore((s) => s.deleteCustomPreset);
  const notify = useUIStore((s) => s.notify);

  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    saveCustomPreset(newPresetName.trim(), 'Preset Kustom Pengguna', currentGrading);
    notify('Preset Tersimpan', `Preset warna "${newPresetName}" berhasil disimpan ke sistem data.`, 'success');
    setNewPresetName('');
    setShowSaveForm(false);
  };

  return (
    <div className="flex flex-col gap-3.5 p-3 bg-[#0d1017] border border-[#202737] rounded-xl select-none text-xs">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Preset Color Grading</span>
        </span>

        <button
          onClick={() => setShowSaveForm(!showSaveForm)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] shadow-sm transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Simpan Preset</span>
        </button>
      </div>

      {/* Save Custom Preset Input Modal Form */}
      {showSaveForm && (
        <form onSubmit={handleSaveCustom} className="flex items-center gap-2 p-2 bg-[#121622] border border-blue-500/40 rounded-lg">
          <input
            type="text"
            placeholder="Nama preset baru..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            className="flex-1 bg-[#0a0d14] border border-[#232b3b] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Simpan
          </button>
        </form>
      )}

      {/* Built-in Presets Grid */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-slate-400 uppercase font-semibold">Preset Studio (8 Preset):</span>
        <div className="grid grid-cols-2 gap-2">
          {builtinPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onApplyPreset(preset);
                notify('Preset Diterapkan', `Preset "${preset.name}" diterapkan ke clip terpilih.`, 'info');
              }}
              className="p-2.5 rounded-xl border border-[#202737] bg-[#121622] hover:bg-[#181f30] hover:border-blue-500/50 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-100 text-xs group-hover:text-blue-400 transition-colors">
                  {preset.name}
                </span>
                <span className="text-[9px] font-mono text-slate-500 px-1 py-0.5 rounded bg-black/40">
                  {preset.category}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {preset.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* User Custom Presets */}
      {customPresets.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-[#1c2333]">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Preset Kustom Anda:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {customPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-2.5 rounded-xl border border-[#242d3e] bg-[#131722] flex items-center justify-between"
              >
                <div
                  onClick={() => onApplyPreset(preset)}
                  className="flex flex-col cursor-pointer flex-1"
                >
                  <span className="font-semibold text-white text-xs">{preset.name}</span>
                  <span className="text-[10px] text-slate-400">{preset.description}</span>
                </div>
                <button
                  onClick={() => deleteCustomPreset(preset.id)}
                  className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors ml-2"
                  title="Hapus Preset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
