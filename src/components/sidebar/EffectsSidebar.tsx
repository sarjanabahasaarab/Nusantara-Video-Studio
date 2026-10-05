/**
 * Nusantara Video Studio - Effects & Advanced Tools Sidebar Tab
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Implements Section 4 requirement categories:
 * - Animation Presets
 * - Keyframes
 * - Chroma Key (Green / Blue screen)
 * - Masking
 * - Motion Tracking
 * - Speed & Speed Ramping
 * - Picture-in-Picture (PiP)
 * - Effect Library (Color, Blur, Stylize, Distortion, Transform)
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Diamond,
  Wand2,
  Tv,
  Layers,
  Crosshair,
  Gauge,
  Layout,
  Plus,
  Check,
  Eye,
} from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { EFFECT_DEFINITIONS } from '../../engine/effects/EffectLibrary';
import { KeyframeEngine } from '../../engine/keyframes/KeyframeEngine';
import { MaskEngine } from '../../engine/masking/MaskEngine';
import { ChromaKeyEngine } from '../../engine/chromakey/ChromaKeyEngine';
import { SpeedEngine } from '../../engine/speed/SpeedEngine';
import { MotionTrackingEngine } from '../../engine/tracking/MotionTrackingEngine';
import { AnimationPresetType, Clip, ClipEffect } from '../../types';

export type EffectToolCategory =
  | 'library'
  | 'animation'
  | 'keyframes'
  | 'chroma'
  | 'masking'
  | 'tracking'
  | 'speed'
  | 'pip';

export const EffectsSidebar: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<EffectToolCategory>('library');
  const [selectedEffectCat, setSelectedEffectCat] = useState<string>('all');

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const notify = useUIStore((s) => s.notify);

  const updateClipEffects = useProjectStore((s) => s.updateClipEffects);
  const updateClipKeyframes = useProjectStore((s) => s.updateClipKeyframes);
  const updateClipMasks = useProjectStore((s) => s.updateClipMasks);
  const updateClipChromaKey = useProjectStore((s) => s.updateClipChromaKey);
  const updateClipSpeed = useProjectStore((s) => s.updateClipSpeed);
  const updateClipPiP = useProjectStore((s) => s.updateClipPiP);
  const updateClipTracking = useProjectStore((s) => s.updateClipTracking);

  let selectedClip: Clip | null = null;
  for (const t of tracks) {
    const c = t.clips.find((item) => item.id === selectedClipId);
    if (c) {
      selectedClip = c;
      break;
    }
  }

  // Categories list per Requirement 4
  const categories: { id: EffectToolCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'library', label: 'Effect Library', icon: <Sparkles className="w-3.5 h-3.5 text-pink-400" /> },
    { id: 'animation', label: 'Animation', icon: <Wand2 className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'keyframes', label: 'Keyframes', icon: <Diamond className="w-3.5 h-3.5 text-yellow-400" /> },
    { id: 'chroma', label: 'Chroma Key', icon: <Tv className="w-3.5 h-3.5 text-emerald-400" /> },
    { id: 'masking', label: 'Masking', icon: <Layers className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'tracking', label: 'Tracking', icon: <Crosshair className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'speed', label: 'Speed Ramp', icon: <Gauge className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'pip', label: 'PiP Overlay', icon: <Layout className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  // Helper to ensure clip is selected
  const ensureSelectedClip = (): Clip | null => {
    if (!selectedClip) {
      notify('Pilih Clip', 'Pilih clip di timeline terlebih dahulu untuk menerapkan efek.', 'info', 2500);
      return null;
    }
    return selectedClip;
  };

  // Add visual effect from library
  const handleAddEffect = (def: (typeof EFFECT_DEFINITIONS)[0]) => {
    const clip = ensureSelectedClip();
    if (!clip) return;

    const currentEffects = clip.effects || [];
    const defaultParams: Record<string, number | string | boolean> = {};
    def.parameters.forEach((p) => {
      defaultParams[p.key] = p.defaultValue;
    });

    const newEffect: ClipEffect = {
      id: `fx-${def.type}-${Date.now()}`,
      type: def.type,
      name: def.name,
      category: def.category,
      enabled: true,
      order: currentEffects.length,
      parameters: defaultParams,
    };

    updateClipEffects(clip.id, [...currentEffects, newEffect]);
    notify('Efek Ditambahkan', `"${def.name}" berhasil ditambahkan ke ${clip.name}.`, 'success');
  };

  // Apply Animation Preset
  const handleApplyAnimationPreset = (type: AnimationPresetType, name: string) => {
    const clip = ensureSelectedClip();
    if (!clip) return;

    const generated = KeyframeEngine.applyAnimationPreset(clip, type, 1.2);
    updateClipKeyframes(clip.id, generated);
    notify('Preset Diterapkan', `Preset animasi "${name}" diterapkan ke ${clip.name}.`, 'success');
  };

  // Apply Chroma Key
  const handleApplyChromaKey = (preset: 'green' | 'blue' | 'custom') => {
    const clip = ensureSelectedClip();
    if (!clip) return;

    const settings = ChromaKeyEngine.getDefaultSettings(preset);
    settings.enabled = true;
    updateClipChromaKey(clip.id, settings);
    notify('Chroma Key Aktif', `Chroma Key preset "${preset}" diterapkan ke ${clip.name}.`, 'success');
  };

  // Apply Mask
  const handleApplyMask = (type: 'rectangle' | 'ellipse' | 'linear' | 'polygon') => {
    const clip = ensureSelectedClip();
    if (!clip) return;

    const mask = MaskEngine.createDefaultMask(type);
    const existing = clip.masks || [];
    updateClipMasks(clip.id, [...existing, mask]);
    notify('Mask Ditambahkan', `Mask "${mask.name}" ditambahkan ke ${clip.name}.`, 'success');
  };

  // Apply Speed Preset
  const handleApplySpeedRate = (rate: number) => {
    const clip = ensureSelectedClip();
    if (!clip) return;

    const newDuration = SpeedEngine.calculateEffectiveDuration(clip.sourceDuration, rate);
    updateClipSpeed(clip.id, { rate, maintainPitch: true });
    useTimelineStore.getState().updateClip(clip.id, { duration: parseFloat(newDuration.toFixed(2)) });
    notify('Kecepatan Diubah', `Kecepatan clip diubah menjadi ${rate}x (${newDuration.toFixed(1)}s).`, 'success');
  };

  // Apply PiP Preset
  const handleApplyPiP = (presetPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center') => {
    const clip = ensureSelectedClip();
    if (!clip) return;

    updateClipPiP(clip.id, {
      enabled: true,
      presetPosition,
      presetSize: 'small',
      borderWidth: 2,
      borderColor: '#38bdf8',
      borderRadius: 8,
      shadowColor: '#000000',
      shadowBlur: 14,
    });
    notify('PiP Diterapkan', `Picture-in-Picture posisi ${presetPosition} diterapkan.`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#0e1017]">
      {/* Category Pills Header */}
      <div className="p-2 border-b border-[#1f2430] flex items-center gap-1 overflow-x-auto no-scrollbar bg-[#11131a]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium shrink-0 transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#171b26] text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Main Body per Category */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* 1. Effect Library */}
        {activeCategory === 'library' && (
          <div className="flex flex-col gap-3">
            {/* Sub-filter */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[10px]">
              {(['all', 'color', 'blur', 'stylize', 'distortion', 'transform'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedEffectCat(sub)}
                  className={`px-2 py-0.5 rounded capitalize ${
                    selectedEffectCat === sub
                      ? 'bg-pink-600 text-white font-semibold'
                      : 'bg-[#151924] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {EFFECT_DEFINITIONS.filter(
                (d) => selectedEffectCat === 'all' || d.category === selectedEffectCat
              ).map((def) => (
                <div
                  key={def.type}
                  className="bg-[#131620] hover:bg-[#181d2a] border border-[#212736] hover:border-pink-500/50 rounded-xl p-2.5 flex flex-col justify-between transition-all"
                >
                  <div>
                    <span className="text-[8px] font-mono uppercase tracking-wider text-pink-400 font-bold">
                      {def.category}
                    </span>
                    <h5 className="text-[11px] font-semibold text-slate-200 mt-0.5 truncate">
                      {def.name}
                    </h5>
                    <p className="text-[9px] text-slate-400 line-clamp-2 mt-0.5 leading-tight">
                      {def.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddEffect(def)}
                    className="mt-2 w-full py-1 rounded bg-[#1c2232] hover:bg-pink-600 text-slate-300 hover:text-white border border-[#273044] hover:border-pink-500 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Effect</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Animation Presets */}
        {activeCategory === 'animation' && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 leading-relaxed">
              Preset animasi non-destructive yang otomatis menghasilkan keyframe yang dapat diedit pada clip terpilih.
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-1">
              Entrance Animations
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'fade-in' as const, name: 'Fade In' },
                { type: 'slide-in-left' as const, name: 'Slide In Left' },
                { type: 'slide-in-right' as const, name: 'Slide In Right' },
                { type: 'slide-in-up' as const, name: 'Slide In Up' },
                { type: 'slide-in-down' as const, name: 'Slide In Down' },
                { type: 'zoom-in' as const, name: 'Zoom In' },
                { type: 'pop-in' as const, name: 'Pop In' },
              ].map((p) => (
                <button
                  key={p.type}
                  onClick={() => handleApplyAnimationPreset(p.type, p.name)}
                  className="p-2 rounded-lg bg-[#141824] hover:bg-amber-600/20 border border-[#23293c] hover:border-amber-500 text-left transition-all"
                >
                  <div className="text-[11px] font-medium text-slate-200">{p.name}</div>
                  <span className="text-[9px] text-amber-400">1.2 detik</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-2">
              Exit Animations
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'fade-out' as const, name: 'Fade Out' },
                { type: 'slide-out-left' as const, name: 'Slide Out Left' },
                { type: 'slide-out-right' as const, name: 'Slide Out Right' },
                { type: 'zoom-out' as const, name: 'Zoom Out' },
              ].map((p) => (
                <button
                  key={p.type}
                  onClick={() => handleApplyAnimationPreset(p.type, p.name)}
                  className="p-2 rounded-lg bg-[#141824] hover:bg-amber-600/20 border border-[#23293c] hover:border-amber-500 text-left transition-all"
                >
                  <div className="text-[11px] font-medium text-slate-200">{p.name}</div>
                  <span className="text-[9px] text-amber-400">1.2 detik</span>
                </button>
              ))}
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mt-2">
              Motion & Camera
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: 'slow-zoom' as const, name: 'Slow Zoom' },
                { type: 'pan-left' as const, name: 'Pan Left' },
                { type: 'pan-right' as const, name: 'Pan Right' },
                { type: 'ken-burns' as const, name: 'Ken Burns Effect' },
              ].map((p) => (
                <button
                  key={p.type}
                  onClick={() => handleApplyAnimationPreset(p.type, p.name)}
                  className="p-2 rounded-lg bg-[#141824] hover:bg-amber-600/20 border border-[#23293c] hover:border-amber-500 text-left transition-all"
                >
                  <div className="text-[11px] font-medium text-slate-200">{p.name}</div>
                  <span className="text-[9px] text-amber-400">Dynamic Motion</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3. Keyframes */}
        {activeCategory === 'keyframes' && (
          <div className="flex flex-col gap-3 text-center py-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-950/40 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mx-auto">
              <Diamond className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-semibold text-slate-200">Keyframe Motion Engine</h4>
            <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
              Atur animasi keyframe pada Position, Scale, Rotation, Opacity, Blur, dan Effect parameters.
            </p>
            <button
              onClick={() => {
                const clip = ensureSelectedClip();
                if (!clip) return;
                const relTime = Math.max(0, currentTime - clip.startTime);
                const existing = clip.animatedProperties || [];
                const opacityProp = existing.find((p) => p.property === 'opacity') || {
                  property: 'opacity',
                  keyframes: [],
                };
                const updated = KeyframeEngine.addKeyframe(opacityProp, relTime, 1, 'ease-in-out');
                updateClipKeyframes(clip.id, [...existing.filter((p) => p.property !== 'opacity'), updated]);
                notify('Keyframe Ditambahkan', `Keyframe ditambahkan pada playhead (${relTime.toFixed(1)}s).`, 'success');
              }}
              className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Keyframe at Playhead</span>
            </button>
          </div>
        )}

        {/* 4. Chroma Key */}
        {activeCategory === 'chroma' && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 leading-relaxed">
              Hapus latar belakang hijau atau biru dengan segmentasi Euclidean RGB dan spill suppression.
            </div>

            <div className="flex flex-col gap-2 mt-1">
              <button
                onClick={() => handleApplyChromaKey('green')}
                className="p-3 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/50 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#00ff00] border border-white shadow" />
                  <div>
                    <div className="text-xs font-semibold text-white">Green Screen</div>
                    <div className="text-[9px] text-emerald-300">Tolerance 45% • Similarity 40%</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Terapkan</span>
              </button>

              <button
                onClick={() => handleApplyChromaKey('blue')}
                className="p-3 rounded-xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-600/50 flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#0000ff] border border-white shadow" />
                  <div>
                    <div className="text-xs font-semibold text-white">Blue Screen</div>
                    <div className="text-[9px] text-blue-300">Tolerance 45% • Similarity 40%</div>
                  </div>
                </div>
                <span className="text-[10px] text-blue-400 font-semibold">Terapkan</span>
              </button>
            </div>
          </div>
        )}

        {/* 5. Masking */}
        {activeCategory === 'masking' && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 leading-relaxed">
              Tambahkan parametric vector mask (Rectangle, Ellipse, Linear, Polygon) dengan feathering dan inversion.
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { type: 'rectangle' as const, name: 'Rectangle Mask' },
                { type: 'ellipse' as const, name: 'Ellipse Mask' },
                { type: 'linear' as const, name: 'Linear Gradient' },
                { type: 'polygon' as const, name: 'Custom Polygon' },
              ].map((m) => (
                <button
                  key={m.type}
                  onClick={() => handleApplyMask(m.type)}
                  className="p-2.5 rounded-xl bg-[#141824] hover:bg-cyan-950/60 border border-[#23293c] hover:border-cyan-500 text-left transition-all"
                >
                  <div className="text-[11px] font-semibold text-slate-200">{m.name}</div>
                  <span className="text-[9px] text-cyan-400">+ Add Mask</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6. Motion Tracking */}
        {activeCategory === 'tracking' && (
          <div className="flex flex-col gap-3 text-center py-3">
            <div className="w-12 h-12 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
              <Crosshair className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-semibold text-slate-200">Point Motion Tracking</h4>
            <p className="text-[10px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
              Lacak pergerakan objek dan hubungkan posisi teks, logo, overlay, atau effect ke lintasan koordinat.
            </p>
            <button
              onClick={() => {
                const clip = ensureSelectedClip();
                if (!clip) return;
                const session = MotionTrackingEngine.createTrackingSession(clip.id);
                updateClipTracking(clip.id, session);
                notify('Tracking Dimulai', `Session tracking dibuka untuk ${clip.name}. Buka Inspector untuk kalkulasi.`, 'info');
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 mx-auto transition-colors"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Mulai Tracking Session</span>
            </button>
          </div>
        )}

        {/* 7. Speed */}
        {activeCategory === 'speed' && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 leading-relaxed">
              Ubah kecepatan playback clip secara non-destructive dengan pembaruan otomatis durasi timeline.
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mt-1">
              Preset Kecepatan
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 4.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleApplySpeedRate(rate)}
                  className={`py-1.5 rounded-lg border text-xs font-semibold text-center transition-colors ${
                    selectedClip?.speed.rate === rate
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-[#151924] hover:bg-[#1f2638] text-slate-300 border-[#222a3a]'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 8. Picture-in-Picture */}
        {activeCategory === 'pip' && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-slate-400 leading-relaxed">
              Atur posisi Picture-in-Picture (overlay video atau gambar di atas track video utama).
            </div>

            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mt-1">
              Preset Posisi PiP
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { pos: 'top-left' as const, label: 'Top Left' },
                { pos: 'top-right' as const, label: 'Top Right' },
                { pos: 'bottom-left' as const, label: 'Bottom Left' },
                { pos: 'bottom-right' as const, label: 'Bottom Right' },
                { pos: 'center' as const, label: 'Center Stage' },
              ].map((p) => (
                <button
                  key={p.pos}
                  onClick={() => handleApplyPiP(p.pos)}
                  className="p-2.5 rounded-xl bg-[#141824] hover:bg-purple-950/60 border border-[#23293c] hover:border-purple-500 text-left transition-all"
                >
                  <div className="text-[11px] font-semibold text-slate-200">{p.label}</div>
                  <span className="text-[9px] text-purple-400">Border + Shadow</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Clip Status Bar */}
      <div className="p-2 border-t border-[#1f2430] bg-[#0c0d13] text-[10px] text-slate-400 flex items-center justify-between">
        <span className="truncate max-w-[180px]">
          Target: {selectedClip ? selectedClip.name : 'Belum ada clip terpilih'}
        </span>
        <span className="text-blue-400 font-mono">Phase 4</span>
      </div>
    </div>
  );
};
