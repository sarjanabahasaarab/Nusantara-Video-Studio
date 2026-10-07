/**
 * Nusantara Video Studio - 3-Way Color Wheels
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements standard Lift (Shadows), Gamma (Midtones), Gain (Highlights) wheels:
 * - Stable polar coordinate math (Hue 0-360°, Saturation 0-100%)
 * - Dedicated Luminance slider (-100 to +100)
 * - Individual Reset buttons for Shadows, Midtones, and Highlights
 */

import React, { useRef } from 'react';
import { ColorWheels, ColorWheelSetting } from '../../types/color';
import { RotateCcw } from 'lucide-react';
import { SliderInput } from '../common/SliderInput';

interface ColorWheelsProps {
  wheels: ColorWheels;
  onChange: (updated: ColorWheels) => void;
}

interface SingleWheelProps {
  title: string;
  setting: ColorWheelSetting;
  onChange: (updated: ColorWheelSetting) => void;
  onReset: () => void;
}

const SingleWheel: React.FC<SingleWheelProps> = ({ title, setting, onChange, onReset }) => {
  const wheelRef = useRef<HTMLDivElement>(null);

  // Polar coordinates to XY offset within wheel (radius 50px)
  const rad = (setting.hue * Math.PI) / 180;
  const dist = (setting.saturation / 100) * 44; // max radius 44px
  const knobX = 50 + Math.cos(rad) * dist;
  const knobY = 50 + Math.sin(rad) * dist;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!wheelRef.current) return;

    const updateFromPointer = (clientX: number, clientY: number) => {
      const rect = wheelRef.current!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = clientX - centerX;
      const dy = clientY - centerY;

      const rawAngle = Math.atan2(dy, dx) * (180 / Math.PI);
      const hue = Math.round((rawAngle + 360) % 360);
      const distance = Math.min(1, Math.sqrt(dx * dx + dy * dy) / (rect.width / 2));
      const saturation = Math.round(distance * 100);

      onChange({
        ...setting,
        hue,
        saturation,
      });
    };

    updateFromPointer(e.clientX, e.clientY);

    const onPointerMove = (moveEv: PointerEvent) => {
      updateFromPointer(moveEv.clientX, moveEv.clientY);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-2 bg-[#0e121a] border border-[#202737] rounded-xl select-none">
      {/* Header & Reset */}
      <div className="w-full flex items-center justify-between px-1">
        <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">{title}</span>
        <button
          onClick={onReset}
          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
          title={`Reset ${title}`}
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </div>

      {/* Wheel Disc */}
      <div
        ref={wheelRef}
        onPointerDown={handlePointerDown}
        className="relative w-28 h-28 rounded-full cursor-crosshair shadow-inner border border-white/10 flex items-center justify-center overflow-hidden"
        style={{
          background: 'conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
        }}
      >
        {/* Desaturation center radial wash */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(18, 22, 32, 0.95) 0%, rgba(18, 22, 32, 0.4) 70%, transparent 100%)',
          }}
        />

        {/* Crosshair guidelines */}
        <div className="absolute w-full h-[1px] bg-white/20 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-white/20 pointer-events-none" />

        {/* Position Indicator Knob */}
        <div
          style={{
            left: `${knobX}%`,
            top: `${knobY}%`,
          }}
          className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50 shadow-md pointer-events-none"
        />
      </div>

      {/* Numerical readout */}
      <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 px-2">
        <span>H: {setting.hue}°</span>
        <span>S: {setting.saturation}%</span>
      </div>

      {/* Luminance Slider */}
      <div className="w-full px-1 pt-1">
        <SliderInput
          label="Luminance"
          value={setting.luminance}
          min={-100}
          max={100}
          step={1}
          onChange={(lum) => onChange({ ...setting, luminance: lum })}
          onReset={() => onChange({ ...setting, luminance: 0 })}
        />
      </div>
    </div>
  );
};

export const ColorWheelsComponent: React.FC<ColorWheelsProps> = ({ wheels, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
      <SingleWheel
        title="Shadows (Lift)"
        setting={wheels.shadows}
        onChange={(shadows) => onChange({ ...wheels, shadows })}
        onReset={() => onChange({ ...wheels, shadows: { hue: 0, saturation: 0, luminance: 0 } })}
      />
      <SingleWheel
        title="Midtones (Gamma)"
        setting={wheels.midtones}
        onChange={(midtones) => onChange({ ...wheels, midtones })}
        onReset={() => onChange({ ...wheels, midtones: { hue: 0, saturation: 0, luminance: 0 } })}
      />
      <SingleWheel
        title="Highlights (Gain)"
        setting={wheels.highlights}
        onChange={(highlights) => onChange({ ...wheels, highlights })}
        onReset={() => onChange({ ...wheels, highlights: { hue: 0, saturation: 0, luminance: 0 } })}
      />
    </div>
  );
};
