/**
 * Nusantara Video Studio - Masking Panel
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Inspector controls for parametric vector masks (Rectangle, Ellipse, Linear, Polygon),
 * feathering, inversion, scale, and expansion.
 */

import React, { useState } from 'react';
import { Clip, ClipMask, MaskShapeType } from '../../types';
import { MaskEngine } from '../../engine/masking/MaskEngine';
import { SliderInput } from '../common/SliderInput';
import {
  Square,
  Circle,
  Slash,
  Maximize2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  FlipHorizontal,
  Layers,
} from 'lucide-react';

interface MaskingPanelProps {
  clip: Clip;
  onUpdateMasks: (masks: ClipMask[]) => void;
}

export const MaskingPanel: React.FC<MaskingPanelProps> = ({ clip, onUpdateMasks }) => {
  const masks = clip.masks || [];
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(
    masks.length > 0 ? masks[0].id : null
  );

  const activeMask = masks.find((m) => m.id === selectedMaskId) || masks[0];

  const handleAddMask = (type: MaskShapeType) => {
    const newMask = MaskEngine.createDefaultMask(type);
    const updated = [...masks, newMask];
    onUpdateMasks(updated);
    setSelectedMaskId(newMask.id);
  };

  const handleUpdateActiveMask = (partial: Partial<ClipMask>) => {
    if (!activeMask) return;
    const updated = masks.map((m) => (m.id === activeMask.id ? { ...m, ...partial } : m));
    onUpdateMasks(updated);
  };

  const handleDeleteMask = (maskId: string) => {
    const updated = masks.filter((m) => m.id !== maskId);
    onUpdateMasks(updated);
    if (selectedMaskId === maskId) {
      setSelectedMaskId(updated.length > 0 ? updated[0].id : null);
    }
  };

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* Header & Add Mask Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Vector Masks ({masks.length})</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handleAddMask('rectangle')}
            className="p-1 rounded bg-[#171c2a] hover:bg-[#20273a] text-slate-300 hover:text-white border border-[#232b3f] transition-colors"
            title="Tambah Rectangle Mask"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleAddMask('ellipse')}
            className="p-1 rounded bg-[#171c2a] hover:bg-[#20273a] text-slate-300 hover:text-white border border-[#232b3f] transition-colors"
            title="Tambah Ellipse Mask"
          >
            <Circle className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleAddMask('linear')}
            className="p-1 rounded bg-[#171c2a] hover:bg-[#20273a] text-slate-300 hover:text-white border border-[#232b3f] transition-colors"
            title="Tambah Linear Gradient Mask"
          >
            <Slash className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Mask Selector Tabs */}
      {masks.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {masks.map((m, idx) => (
              <button
                key={m.id}
                onClick={() => setSelectedMaskId(m.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1.5 shrink-0 transition-colors ${
                  activeMask?.id === m.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#121622] text-slate-400 hover:text-slate-200 border border-[#1f2738]'
                }`}
              >
                <span>Mask {idx + 1} ({m.type})</span>
              </button>
            ))}
          </div>

          {activeMask && (
            <div className="flex flex-col gap-2.5 bg-[#0f121a] p-3 rounded-xl border border-[#1f2638]">
              {/* Active Mask Controls Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-[#1b2233]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateActiveMask({ enabled: !activeMask.enabled })}
                    className={`p-1 rounded transition-colors ${
                      activeMask.enabled
                        ? 'text-blue-400 bg-blue-950/40'
                        : 'text-slate-500'
                    }`}
                    title={activeMask.enabled ? 'Nonaktifkan Mask' : 'Aktifkan Mask'}
                  >
                    {activeMask.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  <span className="font-semibold text-slate-200 text-[11px]">
                    {activeMask.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateActiveMask({ inverted: !activeMask.inverted })}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      activeMask.inverted
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-[#151a26] border-[#222b3e] text-slate-400'
                    }`}
                    title="Invert Mask"
                  >
                    Invert Mask
                  </button>

                  <button
                    onClick={() => handleDeleteMask(activeMask.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors"
                    title="Hapus Mask"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <SliderInput
                label="Feather (Softness)"
                value={activeMask.feather}
                min={0}
                max={100}
                step={1}
                unit="px"
                onChange={(feather) => handleUpdateActiveMask({ feather })}
              />

              <SliderInput
                label="Expand / Contract"
                value={activeMask.expand}
                min={-30}
                max={30}
                step={1}
                unit="%"
                onChange={(expand) => handleUpdateActiveMask({ expand })}
              />

              <SliderInput
                label="Mask Opacity"
                value={Math.round(activeMask.opacity * 100)}
                min={0}
                max={100}
                step={1}
                unit="%"
                onChange={(v) => handleUpdateActiveMask({ opacity: v / 100 })}
              />

              <SliderInput
                label="Scale"
                value={activeMask.scale}
                min={0.2}
                max={3.0}
                step={0.05}
                unit="x"
                onChange={(scale) => handleUpdateActiveMask({ scale })}
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <SliderInput
                  label="Position X"
                  value={activeMask.positionX}
                  min={-200}
                  max={200}
                  step={1}
                  unit="px"
                  onChange={(positionX) => handleUpdateActiveMask({ positionX })}
                />
                <SliderInput
                  label="Position Y"
                  value={activeMask.positionY}
                  min={-200}
                  max={200}
                  step={1}
                  unit="px"
                  onChange={(positionY) => handleUpdateActiveMask({ positionY })}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 text-center rounded-xl bg-[#0f121a] border border-[#1e2434] text-[10px] text-slate-500">
          Belum ada mask pada clip ini. Gunakan tombol di atas untuk menambahkan Rectangle, Ellipse, atau Linear Mask.
        </div>
      )}
    </div>
  );
};
