/**
 * Nusantara Video Studio - Dynamics Compressor Modal
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements standard dynamics compressor controls: Threshold (dB), Ratio, Attack (ms),
 * Release (ms), Knee (dB), Makeup Gain (dB), and factory presets.
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { CompressorSettings } from '../../types/audio';
import { AudioProcessingEngine } from '../../engine/audio/AudioProcessingEngine';
import { SliderInput } from '../common/SliderInput';
import { Sparkles, RotateCcw } from 'lucide-react';

interface CompressorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  compressor: CompressorSettings;
  onChange: (updated: CompressorSettings) => void;
}

export const CompressorModal: React.FC<CompressorModalProps> = ({
  isOpen,
  onClose,
  title,
  compressor,
  onChange,
}) => {
  const presets = AudioProcessingEngine.getCompressorPresets();

  const handleApplyPreset = (presetId: string) => {
    const p = presets.find((pr) => pr.id === presetId);
    if (!p) return;

    onChange({
      ...compressor,
      ...p.settings,
      preset: p.name,
      enabled: true,
    });
  };

  const handleReset = () => {
    onChange(AudioProcessingEngine.getDefaultCompressor());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Dynamics Compressor — ${title}`} maxWidth="max-w-2xl">
      <div className="flex flex-col gap-4 text-xs text-slate-200 select-none">
        {/* Presets header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#0e121a] border border-[#202737] rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Preset Kompresor:</span>
            </span>

            <select
              value={compressor.preset || ''}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="bg-[#121622] border border-[#222938] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Pilih Preset Kompresi --</option>
              {presets.map((pr) => (
                <option key={pr.id} value={pr.id}>
                  {pr.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ ...compressor, enabled: !compressor.enabled })}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                compressor.enabled
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                  : 'bg-[#161a25] text-slate-400 border-[#252e42]'
              }`}
            >
              {compressor.enabled ? 'AKTIF' : 'BYPASS'}
            </button>

            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-[#1a1f2c] transition-colors"
              title="Reset ke Default"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-[#10141f] border border-[#1f2738] rounded-xl">
          <SliderInput
            label="Threshold"
            value={compressor.threshold}
            min={-60}
            max={0}
            step={1}
            unit="dB"
            onChange={(val) => onChange({ ...compressor, threshold: val })}
            onReset={() => onChange({ ...compressor, threshold: -18 })}
          />

          <SliderInput
            label="Ratio"
            value={compressor.ratio}
            min={1}
            max={20}
            step={0.5}
            unit=":1"
            onChange={(val) => onChange({ ...compressor, ratio: val })}
            onReset={() => onChange({ ...compressor, ratio: 3.5 })}
          />

          <SliderInput
            label="Attack"
            value={Math.round(compressor.attack * 1000)}
            min={1}
            max={500}
            step={1}
            unit="ms"
            onChange={(val) => onChange({ ...compressor, attack: val / 1000 })}
            onReset={() => onChange({ ...compressor, attack: 0.02 })}
          />

          <SliderInput
            label="Release"
            value={Math.round(compressor.release * 1000)}
            min={10}
            max={1000}
            step={10}
            unit="ms"
            onChange={(val) => onChange({ ...compressor, release: val / 1000 })}
            onReset={() => onChange({ ...compressor, release: 0.15 })}
          />

          <SliderInput
            label="Knee"
            value={compressor.knee}
            min={0}
            max={40}
            step={1}
            unit="dB"
            onChange={(val) => onChange({ ...compressor, knee: val })}
            onReset={() => onChange({ ...compressor, knee: 6 })}
          />

          <SliderInput
            label="Makeup Gain"
            value={compressor.makeupGain}
            min={0}
            max={24}
            step={0.5}
            unit="dB"
            onChange={(val) => onChange({ ...compressor, makeupGain: val })}
            onReset={() => onChange({ ...compressor, makeupGain: 2 })}
          />
        </div>

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
