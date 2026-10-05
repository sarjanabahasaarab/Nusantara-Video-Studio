/**
 * Nusantara Video Studio - Speed & Speed Ramping Panel
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Inspector controls for constant playback speed (0.25x - 4x), custom rate,
 * pitch preservation, and non-linear speed ramp curve point editing.
 */

import React from 'react';
import { Clip, SpeedPoint, SpeedRampCurve } from '../../types';
import { SpeedEngine } from '../../engine/speed/SpeedEngine';
import { Gauge, FastForward, RotateCcw, Plus, Trash2, Activity } from 'lucide-react';
import { SliderInput } from '../common/SliderInput';

interface SpeedRampPanelProps {
  clip: Clip;
  onUpdateSpeed: (speed: Partial<Clip['speed']>) => void;
  onNotify: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0];

export const SpeedRampPanel: React.FC<SpeedRampPanelProps> = ({
  clip,
  onUpdateSpeed,
  onNotify,
}) => {
  const currentSpeed = clip.speed || { rate: 1.0, reverse: false };
  const ramp = currentSpeed.ramp;
  const isRampEnabled = Boolean(ramp?.enabled);

  const handleSetConstantSpeed = (rate: number) => {
    const validRate = Math.max(0.1, Math.min(16, rate));
    const newDuration = SpeedEngine.calculateEffectiveDuration(
      clip.sourceDuration || clip.duration,
      validRate
    );

    onUpdateSpeed({
      rate: validRate,
      ramp: { enabled: false, points: [] },
    });

    onNotify('Kecepatan Diubah', `Kecepatan diatur ke ${validRate}x. Durasi clip disesuaikan ke ${newDuration.toFixed(1)}s.`, 'info');
  };

  const handleApplyRampPreset = (
    preset: 'slow-motion' | 'fast-motion' | 'speed-up' | 'speed-down' | 'montage'
  ) => {
    const newRamp = SpeedEngine.createPresetRamp(preset, clip.sourceDuration || clip.duration);
    const newDuration = SpeedEngine.calculateEffectiveDuration(
      clip.sourceDuration || clip.duration,
      currentSpeed.rate,
      newRamp
    );

    onUpdateSpeed({
      ramp: newRamp,
    });

    onNotify(
      'Speed Ramp Diterapkan',
      `Kurva kecepatan "${preset}" diterapkan. Durasi efektif menjadi ${newDuration.toFixed(1)}s.`,
      'success'
    );
  };

  const handleAddSpeedPoint = () => {
    const points = ramp?.points ? [...ramp.points] : [];
    const sourceDur = clip.sourceDuration || clip.duration;
    const midTime = sourceDur / 2;

    const newPt: SpeedPoint = {
      id: `sp-${Date.now()}`,
      time: midTime,
      speed: 1.0,
      interpolation: 'ease-in-out',
    };

    const updatedPoints = [...points, newPt].sort((a, b) => a.time - b.time);
    onUpdateSpeed({
      ramp: {
        enabled: true,
        preset: 'custom',
        points: updatedPoints,
      },
    });
  };

  const handleDeleteSpeedPoint = (pointId: string) => {
    if (!ramp?.points) return;
    const updated = ramp.points.filter((p) => p.id !== pointId);
    onUpdateSpeed({
      ramp: {
        ...ramp,
        points: updated,
      },
    });
  };

  const handleUpdatePointSpeed = (pointId: string, speed: number) => {
    if (!ramp?.points) return;
    const updated = ramp.points.map((p) =>
      p.id === pointId ? { ...p, speed: Math.max(0.1, speed) } : p
    );
    onUpdateSpeed({
      ramp: {
        ...ramp,
        points: updated,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* Mode Toggle: Constant Speed vs Speed Ramp */}
      <div className="grid grid-cols-2 bg-[#0d0f16] p-1 rounded-xl border border-[#1f2537]">
        <button
          onClick={() => onUpdateSpeed({ ramp: { enabled: false, points: [] } })}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
            !isRampEnabled
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Constant Speed</span>
        </button>

        <button
          onClick={() => handleApplyRampPreset('slow-motion')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
            isRampEnabled
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Speed Ramping</span>
        </button>
      </div>

      {!isRampEnabled ? (
        /* Constant Speed UI */
        <div className="flex flex-col gap-3">
          {/* Preset Buttons */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Speed Presets
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {SPEED_PRESETS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleSetConstantSpeed(preset)}
                  className={`py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-colors ${
                    currentSpeed.rate === preset
                      ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                      : 'bg-[#111420] border-[#1e2536] text-slate-300 hover:text-white hover:bg-[#181d2e]'
                  }`}
                >
                  {preset}x
                </button>
              ))}
            </div>
          </div>

          {/* Custom Speed Slider */}
          <SliderInput
            label="Playback Rate"
            value={currentSpeed.rate}
            min={0.1}
            max={8.0}
            step={0.05}
            unit="x"
            onChange={handleSetConstantSpeed}
          />

          {/* Maintain Pitch Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f121a] border border-[#1e2434]">
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200 text-[11px]">Maintain Audio Pitch</span>
              <span className="text-[10px] text-slate-500">Pertahankan nada suara saat mengubah tempo</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(currentSpeed.maintainPitch ?? true)}
              onChange={(e) => onUpdateSpeed({ maintainPitch: e.target.checked })}
              className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
            />
          </div>
        </div>
      ) : (
        /* Speed Ramping UI */
        <div className="flex flex-col gap-3">
          {/* Ramp Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Ramp Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => handleApplyRampPreset('slow-motion')}
                className="py-1 px-2 rounded-lg bg-[#111420] hover:bg-[#181d2e] border border-[#1e2536] text-[10px] text-slate-300 font-medium"
              >
                Slow Motion
              </button>
              <button
                onClick={() => handleApplyRampPreset('fast-motion')}
                className="py-1 px-2 rounded-lg bg-[#111420] hover:bg-[#181d2e] border border-[#1e2536] text-[10px] text-slate-300 font-medium"
              >
                Fast Motion
              </button>
              <button
                onClick={() => handleApplyRampPreset('speed-up')}
                className="py-1 px-2 rounded-lg bg-[#111420] hover:bg-[#181d2e] border border-[#1e2536] text-[10px] text-slate-300 font-medium"
              >
                Speed Up
              </button>
              <button
                onClick={() => handleApplyRampPreset('speed-down')}
                className="py-1 px-2 rounded-lg bg-[#111420] hover:bg-[#181d2e] border border-[#1e2536] text-[10px] text-slate-300 font-medium"
              >
                Speed Down
              </button>
              <button
                onClick={() => handleApplyRampPreset('montage')}
                className="py-1 px-2 rounded-lg bg-[#111420] hover:bg-[#181d2e] border border-[#1e2536] text-[10px] text-slate-300 font-medium col-span-2"
              >
                Montage Ramp (Dynamic)
              </button>
            </div>
          </div>

          {/* Interactive Curve Visualizer */}
          <div className="p-3 bg-[#0d0f16] border border-[#1f2537] rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Speed Curve</span>
              <button
                onClick={handleAddSpeedPoint}
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
              >
                <Plus className="w-3 h-3" />
                <span>Add Point</span>
              </button>
            </div>

            {/* SVG Curve Representation */}
            <div className="h-20 w-full bg-[#08090e] rounded-lg border border-[#1a2030] relative overflow-hidden flex items-end p-2">
              <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                {ramp?.points && ramp.points.length >= 2 && (
                  <path
                    d={`M 0 ${50 - Math.min(48, (ramp.points[0]?.speed || 1) * 12)} ${ramp.points
                      .map((p, idx) => {
                        const x = (p.time / (clip.sourceDuration || clip.duration || 10)) * 100;
                        const y = 50 - Math.min(48, p.speed * 12);
                        return `L ${x} ${y}`;
                      })
                      .join(' ')} L 100 ${50 - Math.min(48, (ramp.points[ramp.points.length - 1]?.speed || 1) * 12)}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                )}
              </svg>
            </div>

            {/* Speed Points List */}
            <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto mt-1">
              {ramp?.points?.map((pt, idx) => (
                <div
                  key={pt.id}
                  className="flex items-center justify-between p-1.5 bg-[#121624] rounded-lg border border-[#1e2538] text-[10px]"
                >
                  <span className="font-mono text-slate-400">Point {idx + 1} ({pt.time.toFixed(1)}s)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={pt.speed}
                      step={0.1}
                      min={0.1}
                      max={8.0}
                      onChange={(e) => handleUpdatePointSpeed(pt.id, parseFloat(e.target.value) || 1)}
                      className="w-14 bg-[#090b10] border border-[#202738] rounded px-1 text-right text-slate-200"
                    />
                    <span className="text-slate-400">x</span>
                    <button
                      onClick={() => handleDeleteSpeedPoint(pt.id)}
                      className="text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
