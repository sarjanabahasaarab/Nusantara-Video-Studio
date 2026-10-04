/**
 * Nusantara Video Studio - Slider Input with Numeric display
 */

import React from 'react';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  onReset?: () => void;
  defaultValue?: number;
}

export const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  onReset,
  defaultValue,
}) => {
  return (
    <div className="flex flex-col gap-1.5 py-1 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="text-slate-400 font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={Number(value.toFixed(2))}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num)) {
                onChange(Math.max(min, Math.min(max, num)));
              }
            }}
            className="w-14 bg-[#0e1014] border border-[#262c39] rounded px-1.5 py-0.5 text-right font-mono text-[11px] text-slate-200 focus:outline-none focus:border-blue-500"
          />
          {unit && <span className="text-slate-500 w-3">{unit}</span>}
          {onReset && defaultValue !== undefined && (
            <button
              onClick={onReset}
              title="Reset ke default"
              className="text-[10px] text-slate-500 hover:text-blue-400 ml-1 transition-colors"
            >
              ↺
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-[#232833] rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
};
