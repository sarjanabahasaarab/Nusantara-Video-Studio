/**
 * Nusantara Video Studio - Animation Presets Panel
 * Phase 4: Advanced Effects & Motion Engine
 *
 * 1-click application of Entrance, Exit, and Continuous Motion animation presets
 * generating fully editable keyframe curves.
 */

import React, { useState } from 'react';
import { AnimatedProperty, AnimationPresetType, Clip } from '../../types';
import { KeyframeEngine } from '../../engine/keyframes/KeyframeEngine';
import { Play, Wand2, LogIn, LogOut, Activity, Check } from 'lucide-react';
import { SliderInput } from '../common/SliderInput';

interface AnimationPresetsPanelProps {
  clip: Clip;
  onUpdateKeyframes: (animatedProperties: AnimatedProperty[]) => void;
  onNotify: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

interface PresetOption {
  id: AnimationPresetType;
  label: string;
  category: 'entrance' | 'exit' | 'motion';
  description: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  // Entrance
  { id: 'fade-in', label: 'Fade In', category: 'entrance', description: 'Smooth opacity dissolve' },
  { id: 'slide-in-left', label: 'Slide In Left', category: 'entrance', description: 'Enters from left boundary' },
  { id: 'slide-in-right', label: 'Slide In Right', category: 'entrance', description: 'Enters from right boundary' },
  { id: 'slide-in-up', label: 'Slide In Up', category: 'entrance', description: 'Ascends from lower screen' },
  { id: 'slide-in-down', label: 'Slide In Down', category: 'entrance', description: 'Descends from upper screen' },
  { id: 'zoom-in', label: 'Zoom In', category: 'entrance', description: 'Expands from central vortex' },
  { id: 'pop-in', label: 'Pop In (Bounce)', category: 'entrance', description: 'Energetic overshoot bounce' },

  // Exit
  { id: 'fade-out', label: 'Fade Out', category: 'exit', description: 'Dissolves to transparency' },
  { id: 'slide-out-left', label: 'Slide Out Left', category: 'exit', description: 'Exits towards left boundary' },
  { id: 'slide-out-right', label: 'Slide Out Right', category: 'exit', description: 'Exits towards right boundary' },
  { id: 'slide-out-up', label: 'Slide Out Up', category: 'exit', description: 'Ascends out of view' },
  { id: 'slide-out-down', label: 'Slide Out Down', category: 'exit', description: 'Descends out of view' },
  { id: 'zoom-out', label: 'Zoom Out', category: 'exit', description: 'Recedes to central infinity' },

  // Motion
  { id: 'slow-zoom', label: 'Slow Zoom', category: 'motion', description: 'Slow dramatic cinematic push' },
  { id: 'pan-left', label: 'Pan Left', category: 'motion', description: 'Horizontal tracking camera motion' },
  { id: 'pan-right', label: 'Pan Right', category: 'motion', description: 'Smooth rightward camera pan' },
  { id: 'pan-up', label: 'Pan Up', category: 'motion', description: 'Vertical upward camera tilt' },
  { id: 'pan-down', label: 'Pan Down', category: 'motion', description: 'Vertical downward camera tilt' },
  { id: 'rotate', label: '360° Rotate', category: 'motion', description: 'Full continuous 360-degree rotation' },
  { id: 'ken-burns', label: 'Ken Burns', category: 'motion', description: 'Cinematic scale and subtle diagonal drift' },
];

export const AnimationPresetsPanel: React.FC<AnimationPresetsPanelProps> = ({
  clip,
  onUpdateKeyframes,
  onNotify,
}) => {
  const [activeCategory, setActiveCategory] = useState<'entrance' | 'exit' | 'motion'>('entrance');
  const [presetDuration, setPresetDuration] = useState<number>(1.0);
  const [selectedPresetId, setSelectedPresetId] = useState<AnimationPresetType | null>(null);

  const filteredPresets = PRESET_OPTIONS.filter((p) => p.category === activeCategory);

  const handleApplyPreset = (presetId: AnimationPresetType) => {
    setSelectedPresetId(presetId);
    const newTracks = KeyframeEngine.createAnimationPresetTracks(
      presetId,
      clip.duration,
      presetDuration
    );

    // Merge generated preset tracks with existing other property tracks
    const existing = clip.animatedProperties || [];
    const newPropKeys = new Set(newTracks.map((t) => t.property));
    const merged = [
      ...existing.filter((t) => !newPropKeys.has(t.property)),
      ...newTracks,
    ];

    onUpdateKeyframes(merged);
    const opt = PRESET_OPTIONS.find((p) => p.id === presetId);
    onNotify(
      'Preset Diterapkan',
      `Animasi "${opt?.label}" (${presetDuration.toFixed(1)}s) berhasil diubah menjadi keyframe aktif.`,
      'success'
    );
  };

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* Category Tabs */}
      <div className="grid grid-cols-3 bg-[#0d0f16] p-1 rounded-xl border border-[#1f2537]">
        <button
          onClick={() => setActiveCategory('entrance')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
            activeCategory === 'entrance'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Entrance</span>
        </button>

        <button
          onClick={() => setActiveCategory('exit')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
            activeCategory === 'exit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit</span>
        </button>

        <button
          onClick={() => setActiveCategory('motion')}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
            activeCategory === 'motion'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Motion</span>
        </button>
      </div>

      {/* Preset Duration Slider */}
      {activeCategory !== 'motion' && (
        <SliderInput
          label="Preset Duration"
          value={presetDuration}
          min={0.3}
          max={Math.min(clip.duration, 5.0)}
          step={0.1}
          unit="s"
          onChange={setPresetDuration}
        />
      )}

      {/* Presets List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-0.5">
        {filteredPresets.map((p) => {
          const isSelected = selectedPresetId === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleApplyPreset(p.id)}
              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/40 border-blue-500 shadow-sm'
                  : 'bg-[#101420] hover:bg-[#151a2b] border-[#1d2436] hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-200 text-[11px]">
                    {p.label}
                  </span>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {p.description}
                </p>
              </div>

              <div className="mt-2 pt-1.5 border-t border-[#1b2233] flex items-center justify-between text-[9px] text-slate-500">
                <span>Keyframe Editable</span>
                <span className="text-blue-400 font-semibold">+ Terapkan</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
