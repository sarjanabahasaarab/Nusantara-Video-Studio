/**
 * Nusantara Video Studio - Effect Stack Panel
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Manages active effect layers, reordering, per-effect parameter adjustments,
 * and integration with EffectLibrary.
 */

import React, { useState } from 'react';
import { Clip, ClipEffect } from '../../types';
import { EFFECT_DEFINITIONS, EffectLibrary } from '../../engine/effects/EffectLibrary';
import { EffectLibraryModal } from './EffectLibraryModal';
import {
  Sparkles,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { SliderInput } from '../common/SliderInput';

interface EffectsStackPanelProps {
  clip: Clip;
  onUpdateEffects: (effects: ClipEffect[]) => void;
}

export const EffectsStackPanel: React.FC<EffectsStackPanelProps> = ({
  clip,
  onUpdateEffects,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const effects = clip.effects || [];

  const handleAddEffect = (type: string) => {
    const newEffect = EffectLibrary.createEffect(type, effects.length);
    onUpdateEffects([...effects, newEffect]);
  };

  const handleToggleEffect = (effectId: string) => {
    const updated = effects.map((e) =>
      e.id === effectId ? { ...e, enabled: !e.enabled } : e
    );
    onUpdateEffects(updated);
  };

  const handleRemoveEffect = (effectId: string) => {
    const updated = effects.filter((e) => e.id !== effectId);
    onUpdateEffects(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const copy = [...effects];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    // Re-index orders
    const reordered = copy.map((e, idx) => ({ ...e, order: idx }));
    onUpdateEffects(reordered);
  };

  const handleMoveDown = (index: number) => {
    if (index >= effects.length - 1) return;
    const copy = [...effects];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    const reordered = copy.map((e, idx) => ({ ...e, order: idx }));
    onUpdateEffects(reordered);
  };

  const handleParamChange = (
    effectId: string,
    key: string,
    value: number | string | boolean
  ) => {
    const updated = effects.map((e) => {
      if (e.id !== effectId) return e;
      return {
        ...e,
        parameters: {
          ...e.parameters,
          [key]: value,
        },
      };
    });
    onUpdateEffects(updated);
  };

  const handleResetEffect = (effectId: string) => {
    const target = effects.find((e) => e.id === effectId);
    if (!target) return;
    const def = EFFECT_DEFINITIONS.find((d) => d.type === target.type);
    if (!def) return;

    const defaultParams: Record<string, number | string | boolean> = {};
    def.parameters.forEach((p) => {
      defaultParams[p.key] = p.defaultValue;
    });

    const updated = effects.map((e) =>
      e.id === effectId ? { ...e, parameters: defaultParams } : e
    );
    onUpdateEffects(updated);
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Header with Add Effect Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Active Effect Stack ({effects.length})</span>
        </div>

        <button
          onClick={() => setIsLibraryOpen(true)}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-3 h-3" />
          <span>Add Effect</span>
        </button>
      </div>

      {/* Effect Stack Items */}
      {effects.length === 0 ? (
        <div className="p-4 rounded-xl bg-[#0f121a] border border-[#1e2434] text-center flex flex-col items-center justify-center my-2">
          <div className="w-8 h-8 rounded-lg bg-[#151a26] flex items-center justify-center text-slate-500 mb-2">
            <Sliders className="w-4 h-4 opacity-70" />
          </div>
          <span className="text-[11px] font-medium text-slate-300">Belum ada efek aktif</span>
          <p className="text-[10px] text-slate-500 max-w-[200px] mt-0.5">
            Tambahkan efek seperti Gaussian Blur, Vignette, Glow, atau Filter Warna dari Effect Library.
          </p>
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="mt-3 px-3 py-1 rounded bg-[#181f30] hover:bg-[#202940] border border-[#2b3754] text-blue-400 text-[10px] font-medium transition-colors"
          >
            Buka Effect Library
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {effects.map((fx, idx) => {
            const def = EFFECT_DEFINITIONS.find((d) => d.type === fx.type);

            return (
              <div
                key={fx.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  fx.enabled
                    ? 'bg-[#121622] border-[#222a3d]'
                    : 'bg-[#0f1118]/60 border-[#1a1f2c] opacity-60'
                }`}
              >
                {/* Effect Card Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleEffect(fx.id)}
                      className={`p-1 rounded transition-colors ${
                        fx.enabled
                          ? 'text-blue-400 hover:text-blue-300 bg-blue-950/40'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={fx.enabled ? 'Nonaktifkan Efek' : 'Aktifkan Efek'}
                    >
                      {fx.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>

                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-200">
                        {fx.name}
                      </span>
                      <span className="text-[9px] font-mono uppercase text-slate-500">
                        {fx.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      title="Geser Efek ke Atas"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === effects.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
                      title="Geser Efek ke Bawah"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleResetEffect(fx.id)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      title="Reset Parameter ke Default"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveEffect(fx.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                      title="Hapus Efek"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Effect Parameter Controls */}
                {fx.enabled && def && (
                  <div className="mt-2.5 pt-2 border-t border-[#1a2030] flex flex-col gap-2">
                    {def.parameters.map((param) => {
                      const val = fx.parameters[param.key] ?? param.defaultValue;

                      if (param.type === 'number') {
                        return (
                          <SliderInput
                            key={param.key}
                            label={param.label}
                            value={Number(val)}
                            min={param.min ?? 0}
                            max={param.max ?? 100}
                            step={param.step ?? 1}
                            unit={param.unit}
                            onChange={(newVal) =>
                              handleParamChange(fx.id, param.key, newVal)
                            }
                          />
                        );
                      }

                      if (param.type === 'boolean') {
                        return (
                          <div key={param.key} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{param.label}</span>
                            <input
                              type="checkbox"
                              checked={Boolean(val)}
                              onChange={(e) =>
                                handleParamChange(fx.id, param.key, e.target.checked)
                              }
                              className="w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer"
                            />
                          </div>
                        );
                      }

                      if (param.type === 'select' && param.options) {
                        return (
                          <div key={param.key} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">{param.label}</span>
                            <select
                              value={String(val)}
                              onChange={(e) =>
                                handleParamChange(fx.id, param.key, e.target.value)
                              }
                              className="bg-[#0b0d14] border border-[#232b3d] text-slate-200 text-[10px] rounded px-2 py-0.5 focus:outline-none"
                            >
                              {param.options.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Effect Library Modal */}
      <EffectLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectEffect={handleAddEffect}
      />
    </div>
  );
};
