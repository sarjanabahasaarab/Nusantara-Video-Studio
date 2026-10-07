/**
 * Nusantara Video Studio - Vignette Controls Panel
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements vignette controls: Amount (-100 to +100), Size, Feather, Roundness, Center Position, and Reset.
 */

import React from 'react';
import { ColorVignette } from '../../types/color';
import { SliderInput } from '../common/SliderInput';
import { RotateCcw, CircleDot } from 'lucide-react';

interface VignettePanelProps {
  vignette: ColorVignette;
  onChange: (updated: ColorVignette) => void;
}

export const VignettePanel: React.FC<VignettePanelProps> = ({ vignette, onChange }) => {
  const handleReset = () => {
    onChange({
      amount: 0,
      size: 50,
      feather: 50,
      roundness: 0,
      position: { x: 0, y: 0 },
    });
  };

  return (
    <div className="flex flex-col gap-3.5 p-3 bg-[#0d1017] border border-[#202737] rounded-xl select-none text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <CircleDot className="w-3.5 h-3.5 text-blue-400" />
          <span>Vignette Effect</span>
        </span>

        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-[#1a1f2c] transition-colors"
          title="Reset Vignette ke Default"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <SliderInput
          label="Amount (Intensitas)"
          value={vignette.amount}
          min={-100}
          max={100}
          step={1}
          onChange={(val) => onChange({ ...vignette, amount: val })}
          onReset={() => onChange({ ...vignette, amount: 0 })}
        />

        <SliderInput
          label="Size (Ukuran Radius)"
          value={vignette.size}
          min={0}
          max={100}
          step={1}
          onChange={(val) => onChange({ ...vignette, size: val })}
          onReset={() => onChange({ ...vignette, size: 50 })}
        />

        <SliderInput
          label="Feather (Kelembutan Tepi)"
          value={vignette.feather}
          min={0}
          max={100}
          step={1}
          onChange={(val) => onChange({ ...vignette, feather: val })}
          onReset={() => onChange({ ...vignette, feather: 50 })}
        />

        <SliderInput
          label="Roundness (Bentuk Lingkaran)"
          value={vignette.roundness}
          min={-100}
          max={100}
          step={1}
          onChange={(val) => onChange({ ...vignette, roundness: val })}
          onReset={() => onChange({ ...vignette, roundness: 0 })}
        />

        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1c2333]">
          <SliderInput
            label="Position X"
            value={vignette.position.x}
            min={-50}
            max={50}
            step={1}
            onChange={(val) => onChange({ ...vignette, position: { ...vignette.position, x: val } })}
            onReset={() => onChange({ ...vignette, position: { ...vignette.position, x: 0 } })}
          />

          <SliderInput
            label="Position Y"
            value={vignette.position.y}
            min={-50}
            max={50}
            step={1}
            onChange={(val) => onChange({ ...vignette, position: { ...vignette.position, y: val } })}
            onReset={() => onChange({ ...vignette, position: { ...vignette.position, y: 0 } })}
          />
        </div>
      </div>
    </div>
  );
};
