/**
 * Nusantara Video Studio - Keyframe Inspector
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Provides dedicated property keyframe management, interpolation selector,
 * diamond transport (Add, Previous, Next, Delete), and live value editing.
 */

import React, { useState } from 'react';
import { AnimatedProperty, Clip, Keyframe, KeyframeInterpolation } from '../../types';
import { KeyframeEngine } from '../../engine/keyframes/KeyframeEngine';
import {
  Diamond,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface KeyframeInspectorProps {
  clip: Clip;
  currentTime: number; // timeline current time in seconds
  onUpdateKeyframes: (animatedProperties: AnimatedProperty[]) => void;
}

const SUPPORTED_PROPERTIES: { id: string; label: string; defaultValue: number; min: number; max: number; step: number; unit: string }[] = [
  { id: 'positionX', label: 'Position X', defaultValue: 0, min: -960, max: 960, step: 1, unit: 'px' },
  { id: 'positionY', label: 'Position Y', defaultValue: 0, min: -540, max: 540, step: 1, unit: 'px' },
  { id: 'scaleX', label: 'Scale X', defaultValue: 1.0, min: 0.1, max: 5.0, step: 0.05, unit: 'x' },
  { id: 'scaleY', label: 'Scale Y', defaultValue: 1.0, min: 0.1, max: 5.0, step: 0.05, unit: 'x' },
  { id: 'rotation', label: 'Rotation', defaultValue: 0, min: 0, max: 360, step: 1, unit: '°' },
  { id: 'opacity', label: 'Opacity', defaultValue: 1.0, min: 0.0, max: 1.0, step: 0.05, unit: '' },
  { id: 'volume', label: 'Volume', defaultValue: 100, min: 0, max: 200, step: 1, unit: '%' },
  { id: 'blur', label: 'Blur', defaultValue: 0, min: 0, max: 50, step: 1, unit: 'px' },
  { id: 'brightness', label: 'Brightness', defaultValue: 100, min: 0, max: 200, step: 1, unit: '%' },
  { id: 'contrast', label: 'Contrast', defaultValue: 100, min: 0, max: 200, step: 1, unit: '%' },
  { id: 'saturation', label: 'Saturation', defaultValue: 100, min: 0, max: 250, step: 1, unit: '%' },
];

export const KeyframeInspector: React.FC<KeyframeInspectorProps> = ({
  clip,
  currentTime,
  onUpdateKeyframes,
}) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('positionX');
  const animatedProperties = clip.animatedProperties || [];

  // Clip relative time
  const clipRelativeTime = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime));

  const activeAnimProp = animatedProperties.find((p) => p.property === selectedPropertyId);
  const activeKeyframes = activeAnimProp?.keyframes || [];

  const propMeta = SUPPORTED_PROPERTIES.find((p) => p.id === selectedPropertyId) || SUPPORTED_PROPERTIES[0];

  // Current interpolated value at clipRelativeTime
  const evaluatedValue = KeyframeEngine.evaluate(activeAnimProp, clipRelativeTime, propMeta.defaultValue);

  // Check if a keyframe exists precisely at this time (tolerance 0.05s)
  const exactKeyframe = activeKeyframes.find((k) => Math.abs(k.time - clipRelativeTime) < 0.05);

  const prevKeyframe = KeyframeEngine.getPreviousKeyframe(activeAnimProp, clipRelativeTime);
  const nextKeyframe = KeyframeEngine.getNextKeyframe(activeAnimProp, clipRelativeTime);

  const handleToggleKeyframeAtPlayhead = () => {
    let prop = activeAnimProp;
    if (!prop) {
      prop = { property: selectedPropertyId, keyframes: [] };
    }

    let updatedProp: AnimatedProperty;
    if (exactKeyframe) {
      // Remove keyframe
      updatedProp = KeyframeEngine.removeKeyframe(prop, exactKeyframe.id);
    } else {
      // Add keyframe at current evaluated value
      updatedProp = KeyframeEngine.addKeyframe(prop, clipRelativeTime, evaluatedValue, 'linear');
    }

    const nextProperties = animatedProperties.filter((p) => p.property !== selectedPropertyId);
    if (updatedProp.keyframes.length > 0) {
      nextProperties.push(updatedProp);
    }
    onUpdateKeyframes(nextProperties);
  };

  const handleUpdateKeyframeValue = (keyframeId: string, value: number) => {
    if (!activeAnimProp) return;
    const updatedProp = {
      ...activeAnimProp,
      keyframes: activeAnimProp.keyframes.map((k) => (k.id === keyframeId ? { ...k, value } : k)),
    };
    const nextProperties = animatedProperties.map((p) =>
      p.property === selectedPropertyId ? updatedProp : p
    );
    onUpdateKeyframes(nextProperties);
  };

  const handleUpdateInterpolation = (keyframeId: string, interpolation: KeyframeInterpolation) => {
    if (!activeAnimProp) return;
    const updatedProp = {
      ...activeAnimProp,
      keyframes: activeAnimProp.keyframes.map((k) => (k.id === keyframeId ? { ...k, interpolation } : k)),
    };
    const nextProperties = animatedProperties.map((p) =>
      p.property === selectedPropertyId ? updatedProp : p
    );
    onUpdateKeyframes(nextProperties);
  };

  const handleDeleteKeyframe = (keyframeId: string) => {
    if (!activeAnimProp) return;
    const updatedProp = KeyframeEngine.removeKeyframe(activeAnimProp, keyframeId);
    const nextProperties = animatedProperties.filter((p) => p.property !== selectedPropertyId);
    if (updatedProp.keyframes.length > 0) {
      nextProperties.push(updatedProp);
    }
    onUpdateKeyframes(nextProperties);
  };

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* Property Selector */}
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Animated Property</span>
        </label>

        <select
          value={selectedPropertyId}
          onChange={(e) => setSelectedPropertyId(e.target.value)}
          className="bg-[#0e1119] border border-[#222a3d] text-slate-200 text-[11px] rounded-md px-2 py-1 focus:outline-none focus:border-blue-500"
        >
          {SUPPORTED_PROPERTIES.map((p) => {
            const hasKf = animatedProperties.some((ap) => ap.property === p.id && ap.keyframes.length > 0);
            return (
              <option key={p.id} value={p.id}>
                {p.label} {hasKf ? '●' : ''}
              </option>
            );
          })}
        </select>
      </div>

      {/* Keyframe Transport Controls Bar (Requirement 5) */}
      <div className="p-2.5 rounded-xl bg-[#11141f] border border-[#1f2638] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
            Evaluated at {clipRelativeTime.toFixed(2)}s
          </span>
          <span className="text-sm font-bold font-mono text-cyan-400">
            {evaluatedValue.toFixed(2)} {propMeta.unit}
          </span>
        </div>

        {/* Diamond Buttons */}
        <div className="flex items-center gap-1 bg-[#0b0d14] border border-[#1d2333] p-1 rounded-lg">
          <button
            disabled={!prevKeyframe}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Previous Keyframe"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleToggleKeyframeAtPlayhead}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
              exactKeyframe
                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 shadow-sm'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
            }`}
            title={exactKeyframe ? 'Hapus Keyframe pada Playhead (Shift+K)' : 'Tambah Keyframe pada Playhead (K)'}
          >
            <Diamond className={`w-3.5 h-3.5 ${exactKeyframe ? 'fill-current' : ''}`} />
            <span>{exactKeyframe ? 'Delete KF' : 'Add KF (K)'}</span>
          </button>

          <button
            disabled={!nextKeyframe}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Next Keyframe"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Keyframe List Table */}
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Active Keyframes ({activeKeyframes.length})</span>
          <span className="font-mono text-[9px] text-slate-500">Interpolation</span>
        </span>

        {activeKeyframes.length === 0 ? (
          <div className="p-3 text-center rounded-lg bg-[#0e111a] border border-[#1b2130] text-[10px] text-slate-500">
            Belum ada keyframe untuk {propMeta.label}. Tekan tombol <strong>Add KF (K)</strong> untuk membuat animasi.
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
            {activeKeyframes.map((kf, idx) => (
              <div
                key={kf.id}
                className="p-2 rounded-lg bg-[#101420] border border-[#1e2536] flex items-center justify-between gap-2"
              >
                {/* Time & Value */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Diamond className="w-3 h-3 fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-slate-400">
                      T: {kf.time.toFixed(2)}s
                    </span>
                    <input
                      type="number"
                      value={kf.value}
                      step={propMeta.step}
                      min={propMeta.min}
                      max={propMeta.max}
                      onChange={(e) => handleUpdateKeyframeValue(kf.id, parseFloat(e.target.value) || 0)}
                      className="w-16 bg-[#090b10] border border-[#202738] rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Interpolation Selector */}
                <div className="flex items-center gap-1.5">
                  <select
                    value={kf.interpolation}
                    onChange={(e) => handleUpdateInterpolation(kf.id, e.target.value as KeyframeInterpolation)}
                    className="bg-[#090b10] border border-[#202738] rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none"
                  >
                    <option value="linear">Linear</option>
                    <option value="ease-in">Ease In</option>
                    <option value="ease-out">Ease Out</option>
                    <option value="ease-in-out">Ease In-Out</option>
                    <option value="hold">Hold (Step)</option>
                  </select>

                  <button
                    onClick={() => handleDeleteKeyframe(kf.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    title="Hapus Keyframe"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
