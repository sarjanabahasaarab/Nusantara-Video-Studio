/**
 * Nusantara Video Studio - 5-Band Parametric Equalizer Modal
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements interactive 5-band EQ (Low, Low-Mid, Mid, High-Mid, High) with real DSP parameter curves,
 * Freq (Hz), Gain (dB), Q factor, and 8 professional audio presets.
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { EqualizerSettings } from '../../types/audio';
import { AudioProcessingEngine } from '../../engine/audio/AudioProcessingEngine';
import { SliderInput } from '../common/SliderInput';
import { Sliders, RotateCcw, Sparkles } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  eq: EqualizerSettings;
  onChange: (updated: EqualizerSettings) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  title,
  eq,
  onChange,
}) => {
  const presets = AudioProcessingEngine.getEQPresets();

  const handleApplyPreset = (presetId: string) => {
    const p = presets.find((pr) => pr.id === presetId);
    if (!p) return;

    const updatedBands = eq.bands.map((b) => {
      const target = p.bands.find((tb) => tb.id === b.id);
      return target ? { ...b, gain: target.gain } : b;
    });

    onChange({
      ...eq,
      preset: p.name,
      bands: updatedBands,
    });
  };

  const handleReset = () => {
    onChange(AudioProcessingEngine.getDefaultEQ());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Parametric Equalizer — ${title}`} maxWidth="max-w-3xl">
      <div className="flex flex-col gap-4 text-xs text-slate-200 select-none">
        {/* Header toolbar & Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#0e121a] border border-[#202737] rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Preset EQ:</span>
            </span>

            <select
              value={eq.preset || ''}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="bg-[#121622] border border-[#222938] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Pilih Preset EQ --</option>
              {presets.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161a25] hover:bg-[#1e2434] border border-[#263045] text-slate-300 text-xs transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-rose-400" />
            <span>Reset Flat</span>
          </button>
        </div>

        {/* 5-Band Slider Strips */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
          {eq.bands.map((band, idx) => (
            <div
              key={band.id}
              className="p-3 bg-[#10141f] border border-[#1f2738] rounded-xl flex flex-col gap-3 justify-between shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-[#1b2333] pb-1.5">
                <span className="font-semibold text-white text-[11px] truncate">{band.name}</span>
                <span className="text-[9px] font-mono text-blue-400">{band.frequency} Hz</span>
              </div>

              {/* Gain Slider */}
              <div className="flex flex-col gap-1">
                <SliderInput
                  label="Gain"
                  value={band.gain}
                  min={-15}
                  max={15}
                  step={0.5}
                  unit="dB"
                  onChange={(val) => {
                    const next = [...eq.bands];
                    next[idx] = { ...band, gain: val };
                    onChange({ ...eq, bands: next });
                  }}
                  onReset={() => {
                    const next = [...eq.bands];
                    next[idx] = { ...band, gain: 0 };
                    onChange({ ...eq, bands: next });
                  }}
                />
              </div>

              {/* Q factor */}
              <div className="flex flex-col gap-1 pt-1 border-t border-[#1a2130]">
                <SliderInput
                  label="Q Factor"
                  value={band.q}
                  min={0.2}
                  max={5}
                  step={0.1}
                  onChange={(val) => {
                    const next = [...eq.bands];
                    next[idx] = { ...band, q: val };
                    onChange({ ...eq, bands: next });
                  }}
                  onReset={() => {
                    const next = [...eq.bands];
                    next[idx] = { ...band, q: 1.0 };
                    onChange({ ...eq, bands: next });
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Modal footer */}
        <div className="flex justify-end pt-2 border-t border-[#1e2330]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </Modal>
  );
};
