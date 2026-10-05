/**
 * Nusantara Video Studio - Chroma Key Panel
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Inspector controls for real-time Green Screen / Blue Screen thresholding,
 * spill suppression, tolerance, edge feathering, and color sampling.
 */

import React from 'react';
import { ChromaKeySettings, Clip } from '../../types';
import { ChromaKeyEngine } from '../../engine/chromakey/ChromaKeyEngine';
import { SliderInput } from '../common/SliderInput';
import { Eye, EyeOff, Pipette, RefreshCw, Wand2 } from 'lucide-react';

interface ChromaKeyPanelProps {
  clip: Clip;
  onUpdateChromaKey: (settings: Partial<ChromaKeySettings>) => void;
}

export const ChromaKeyPanel: React.FC<ChromaKeyPanelProps> = ({
  clip,
  onUpdateChromaKey,
}) => {
  const current = clip.chromaKey || ChromaKeyEngine.getDefaultSettings('green');

  const handleApplyPreset = (preset: 'green' | 'blue' | 'custom') => {
    const s = ChromaKeyEngine.getDefaultSettings(preset);
    onUpdateChromaKey({
      ...s,
      enabled: true,
    });
  };

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* Enable / Disable Switch */}
      <div className="p-2.5 rounded-xl bg-[#11141f] border border-[#1f2638] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
            CK
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-slate-200">Chroma Key / Green Screen</h4>
            <span className="text-[10px] text-slate-500">Isolasi dan transparansi latar belakang</span>
          </div>
        </div>

        <button
          onClick={() => onUpdateChromaKey({ enabled: !current.enabled })}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            current.enabled
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
              : 'bg-[#1b2130] text-slate-400 hover:text-slate-200'
          }`}
        >
          {current.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{current.enabled ? 'Enabled' : 'Disabled'}</span>
        </button>
      </div>

      {current.enabled && (
        <div className="flex flex-col gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Color Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleApplyPreset('green')}
                className={`py-1 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  current.color === '#00ff00'
                    ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                    : 'bg-[#121622] border-[#22293b] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#00ff00] border border-black/40" />
                <span>Green Screen</span>
              </button>

              <button
                onClick={() => handleApplyPreset('blue')}
                className={`py-1 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  current.color === '#0000ff'
                    ? 'bg-blue-950/50 border-blue-500 text-blue-300'
                    : 'bg-[#121622] border-[#22293b] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#0000ff] border border-black/40" />
                <span>Blue Screen</span>
              </button>

              <div className="flex items-center gap-1.5 bg-[#121622] border border-[#22293b] rounded-lg px-2 py-1">
                <input
                  type="color"
                  value={current.color}
                  onChange={(e) =>
                    onUpdateChromaKey({ color: e.target.value, preset: 'custom' })
                  }
                  className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
                  title="Pick Custom Color"
                />
                <span className="font-mono text-[10px] text-slate-300 truncate">
                  {current.color}
                </span>
              </div>
            </div>
          </div>

          {/* Tolerance & Detection Sliders */}
          <div className="flex flex-col gap-2.5 bg-[#0f121a] p-3 rounded-xl border border-[#1f2638]">
            <SliderInput
              label="Tolerance"
              value={current.tolerance}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val) => onUpdateChromaKey({ tolerance: val })}
            />

            <SliderInput
              label="Similarity Threshold"
              value={current.similarity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val) => onUpdateChromaKey({ similarity: val })}
            />

            <SliderInput
              label="Smoothness / Blend"
              value={current.smoothness}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val) => onUpdateChromaKey({ smoothness: val })}
            />

            <SliderInput
              label="Spill Suppression"
              value={current.spillSuppression}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val) => onUpdateChromaKey({ spillSuppression: val })}
            />

            <SliderInput
              label="Edge Feather"
              value={current.edgeFeather}
              min={0}
              max={50}
              step={1}
              unit="px"
              onChange={(val) => onUpdateChromaKey({ edgeFeather: val })}
            />

            <SliderInput
              label="Opacity"
              value={current.opacity}
              min={0}
              max={100}
              step={1}
              unit="%"
              onChange={(val) => onUpdateChromaKey({ opacity: val })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
