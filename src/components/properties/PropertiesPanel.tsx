/**
 * Nusantara Video Studio - Right Properties Panel / Inspector
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Full inspector for Transform, Appearance (Color), Basic Effects,
 * Text Styling, and Audio Controls (Volume, Keyframes, Fades, Pan).
 */

import React, { useState } from 'react';
import {
  Sliders,
  Move,
  Volume2,
  Sparkles,
  Layers,
  RotateCcw,
  Type,
  Maximize2,
  FlipHorizontal,
  FlipVertical,
  Plus,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { SliderInput } from '../common/SliderInput';

export const PropertiesPanel: React.FC = () => {
  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const propertiesWidth = useUIStore((s) => s.propertiesWidth);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const projectSettings = useProjectStore((s) => s.currentProject.settings);

  const updateClipTransform = useTimelineStore((s) => s.updateClipTransform);
  const updateClipAppearance = useTimelineStore((s) => s.updateClipAppearance);
  const updateClipBasicEffects = useTimelineStore((s) => s.updateClipBasicEffects);
  const updateClipAudio = useTimelineStore((s) => s.updateClipAudio);
  const updateClipText = useTimelineStore((s) => s.updateClipText);
  const resetClipProperties = useTimelineStore((s) => s.resetClipProperties);
  const addAudioKeyframe = useTimelineStore((s) => s.addAudioKeyframe);
  const removeAudioKeyframe = useTimelineStore((s) => s.removeAudioKeyframe);

  const [activeTab, setActiveTab] = useState<'transform' | 'appearance' | 'effects' | 'audio' | 'text'>('transform');

  // Find currently selected clip across tracks
  let selectedClip = null;
  let parentTrack = null;
  for (const track of tracks) {
    const found = track.clips.find((c) => c.id === selectedClipId);
    if (found) {
      selectedClip = found;
      parentTrack = track;
      break;
    }
  }

  const isVideoOrImage =
    selectedClip &&
    (selectedClip.type === 'video' ||
      selectedClip.type === 'image' ||
      selectedClip.type === 'screen-recording' ||
      selectedClip.type === 'camera-recording');

  const isAudio =
    selectedClip && (selectedClip.type === 'audio' || selectedClip.type === 'voice-recording');

  const isText = selectedClip && selectedClip.type === 'text';

  const transform = selectedClip?.transform || {
    positionX: 0,
    positionY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
    flipHorizontal: false,
    flipVertical: false,
  };

  const appearance = selectedClip?.appearance || {
    brightness: 100,
    contrast: 100,
    saturation: 100,
    exposure: 0,
    temperature: 0,
    tint: 0,
  };

  const effects = selectedClip?.basicEffects || {
    blur: 0,
    sharpen: 0,
    vignette: 0,
    grayscale: 0,
    sepia: 0,
  };

  const audio = selectedClip?.audio || {
    volume: 100,
    pan: 0,
    gain: 0,
    mute: false,
    fadeIn: 0,
    fadeOut: 0,
    keyframes: [],
  };

  const textProps = selectedClip?.textProps || {
    text: 'Title Text',
    fontFamily: 'Inter',
    fontSize: 48,
    bold: true,
    italic: false,
    color: '#ffffff',
    alignment: 'center',
  };

  return (
    <aside
      style={{ width: `${propertiesWidth}px` }}
      className="bg-[#12141c] border-l border-[#212633] flex flex-col shrink-0 select-none overflow-hidden z-10"
    >
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#1f2430] bg-[#0e1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold text-slate-200 tracking-wide uppercase">
            Properties
          </span>
        </div>
        {selectedClip ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-800/30 truncate max-w-[120px]">
              {selectedClip.name}
            </span>
            <button
              onClick={() => resetClipProperties(selectedClip!.id)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
              title="Reset Semua Parameter ke Default (Requirement 15)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Sub-tab Navigation if Clip Selected */}
      {selectedClip && (
        <div className="grid grid-cols-4 border-b border-[#1f2430] bg-[#101219] text-[10px]">
          {isVideoOrImage && (
            <>
              <button
                onClick={() => setActiveTab('transform')}
                className={`py-1.5 transition-colors ${
                  activeTab === 'transform'
                    ? 'border-b-2 border-blue-500 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Transform
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`py-1.5 transition-colors ${
                  activeTab === 'appearance'
                    ? 'border-b-2 border-blue-500 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Color
              </button>
              <button
                onClick={() => setActiveTab('effects')}
                className={`py-1.5 transition-colors ${
                  activeTab === 'effects'
                    ? 'border-b-2 border-blue-500 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Effects
              </button>
              <button
                onClick={() => setActiveTab('audio')}
                className={`py-1.5 transition-colors ${
                  activeTab === 'audio'
                    ? 'border-b-2 border-blue-500 text-blue-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Audio
              </button>
            </>
          )}

          {isAudio && (
            <button
              onClick={() => setActiveTab('audio')}
              className="col-span-4 py-1.5 border-b-2 border-emerald-500 text-emerald-400 font-semibold"
            >
              Audio Settings & Keyframes
            </button>
          )}

          {isText && (
            <>
              <button
                onClick={() => setActiveTab('text')}
                className={`col-span-2 py-1.5 transition-colors ${
                  activeTab === 'text'
                    ? 'border-b-2 border-amber-500 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Text Styling
              </button>
              <button
                onClick={() => setActiveTab('transform')}
                className={`col-span-2 py-1.5 transition-colors ${
                  activeTab === 'transform'
                    ? 'border-b-2 border-amber-500 text-amber-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Transform
              </button>
            </>
          )}
        </div>
      )}

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 text-xs">
        {!selectedClip ? (
          // Default: Project Summary
          <div className="flex flex-col items-center justify-center text-center my-auto py-8">
            <div className="w-12 h-12 rounded-2xl bg-[#171a24] border border-[#242b3b] flex items-center justify-center text-slate-500 mb-3 shadow-inner">
              <Layers className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">No Selection</h3>
            <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed mb-4">
              Pilih clip pada timeline atau monitor preview untuk menyesuaikan atribut transform, warna, teks, dan audio.
            </p>

            {/* Project Specs Summary */}
            <div className="w-full bg-[#0d0f15] border border-[#1f2432] rounded-lg p-2.5 text-left flex flex-col gap-1 text-[10px]">
              <span className="font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Project Specs
              </span>
              <div className="flex justify-between text-slate-400">
                <span>Nama:</span>
                <span className="text-slate-200 truncate max-w-[120px]">{projectSettings.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Resolusi:</span>
                <span className="text-slate-200">
                  {projectSettings.width} × {projectSettings.height}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Frame Rate:</span>
                <span className="text-slate-200">{projectSettings.fps} FPS</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tracks:</span>
                <span className="text-slate-200">{tracks.length} Tracks</span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. Transform Tab */}
            {activeTab === 'transform' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-blue-400" />
                    <span>Transform</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateClipTransform(selectedClip!.id, {
                          flipHorizontal: !transform.flipHorizontal,
                        })
                      }
                      className={`p-1 rounded border ${
                        transform.flipHorizontal
                          ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                          : 'bg-[#151924] border-[#222938] text-slate-400'
                      }`}
                      title="Flip Horizontal"
                    >
                      <FlipHorizontal className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() =>
                        updateClipTransform(selectedClip!.id, {
                          flipVertical: !transform.flipVertical,
                        })
                      }
                      className={`p-1 rounded border ${
                        transform.flipVertical
                          ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                          : 'bg-[#151924] border-[#222938] text-slate-400'
                      }`}
                      title="Flip Vertical"
                    >
                      <FlipVertical className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <SliderInput
                  label="Position X"
                  value={transform.positionX || 0}
                  min={-960}
                  max={960}
                  step={1}
                  unit="px"
                  onChange={(v) => updateClipTransform(selectedClip!.id, { positionX: v })}
                />

                <SliderInput
                  label="Position Y"
                  value={transform.positionY || 0}
                  min={-540}
                  max={540}
                  step={1}
                  unit="px"
                  onChange={(v) => updateClipTransform(selectedClip!.id, { positionY: v })}
                />

                <SliderInput
                  label="Scale X"
                  value={Math.round((transform.scaleX ?? transform.scale ?? 1) * 100)}
                  min={10}
                  max={400}
                  step={1}
                  unit="%"
                  onChange={(v) => updateClipTransform(selectedClip!.id, { scaleX: v / 100 })}
                />

                <SliderInput
                  label="Scale Y"
                  value={Math.round((transform.scaleY ?? transform.scale ?? 1) * 100)}
                  min={10}
                  max={400}
                  step={1}
                  unit="%"
                  onChange={(v) => updateClipTransform(selectedClip!.id, { scaleY: v / 100 })}
                />

                <SliderInput
                  label="Rotation"
                  value={transform.rotation || 0}
                  min={0}
                  max={360}
                  step={1}
                  unit="°"
                  onChange={(v) => updateClipTransform(selectedClip!.id, { rotation: v })}
                />

                <SliderInput
                  label="Opacity"
                  value={Math.round((transform.opacity ?? 1) * 100)}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(v) => updateClipTransform(selectedClip!.id, { opacity: v / 100 })}
                />
              </div>
            )}

            {/* 2. Appearance (Color & Exposure) Tab */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  <span>Color & Exposure</span>
                </span>

                <SliderInput
                  label="Brightness"
                  value={appearance.brightness}
                  min={0}
                  max={200}
                  unit="%"
                  onChange={(v) => updateClipAppearance(selectedClip!.id, { brightness: v })}
                />

                <SliderInput
                  label="Contrast"
                  value={appearance.contrast}
                  min={0}
                  max={200}
                  unit="%"
                  onChange={(v) => updateClipAppearance(selectedClip!.id, { contrast: v })}
                />

                <SliderInput
                  label="Saturation"
                  value={appearance.saturation}
                  min={0}
                  max={200}
                  unit="%"
                  onChange={(v) => updateClipAppearance(selectedClip!.id, { saturation: v })}
                />

                <SliderInput
                  label="Exposure"
                  value={appearance.exposure}
                  min={-100}
                  max={100}
                  unit=""
                  onChange={(v) => updateClipAppearance(selectedClip!.id, { exposure: v })}
                />

                <SliderInput
                  label="Temperature"
                  value={appearance.temperature}
                  min={-100}
                  max={100}
                  unit=""
                  onChange={(v) => updateClipAppearance(selectedClip!.id, { temperature: v })}
                />

                <SliderInput
                  label="Tint"
                  value={appearance.tint}
                  min={-100}
                  max={100}
                  unit=""
                  onChange={(v) => updateClipAppearance(selectedClip!.id, { tint: v })}
                />
              </div>
            )}

            {/* 3. Basic Effects Tab */}
            {activeTab === 'effects' && (
              <div className="flex flex-col gap-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Basic Effects</span>
                </span>

                <SliderInput
                  label="Blur"
                  value={effects.blur}
                  min={0}
                  max={40}
                  step={0.5}
                  unit="px"
                  onChange={(v) => updateClipBasicEffects(selectedClip!.id, { blur: v })}
                />

                <SliderInput
                  label="Sharpen"
                  value={effects.sharpen}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => updateClipBasicEffects(selectedClip!.id, { sharpen: v })}
                />

                <SliderInput
                  label="Vignette"
                  value={effects.vignette}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => updateClipBasicEffects(selectedClip!.id, { vignette: v })}
                />

                <SliderInput
                  label="Grayscale"
                  value={effects.grayscale}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => updateClipBasicEffects(selectedClip!.id, { grayscale: v })}
                />

                <SliderInput
                  label="Sepia"
                  value={effects.sepia}
                  min={0}
                  max={100}
                  unit="%"
                  onChange={(v) => updateClipBasicEffects(selectedClip!.id, { sepia: v })}
                />
              </div>
            )}

            {/* 4. Audio Tab (Volume, Fades, Keyframes) */}
            {activeTab === 'audio' && (
              <div className="flex flex-col gap-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Audio Controls</span>
                </span>

                <SliderInput
                  label="Volume"
                  value={audio.volume ?? 100}
                  min={0}
                  max={200}
                  unit="%"
                  onChange={(v) => updateClipAudio(selectedClip!.id, { volume: v })}
                />

                <SliderInput
                  label="Pan (Left / Right)"
                  value={audio.pan || 0}
                  min={-100}
                  max={100}
                  unit=""
                  onChange={(v) => updateClipAudio(selectedClip!.id, { pan: v })}
                />

                <div className="grid grid-cols-2 gap-2">
                  <SliderInput
                    label="Fade In"
                    value={audio.fadeIn || 0}
                    min={0}
                    max={5}
                    step={0.1}
                    unit="s"
                    onChange={(v) => updateClipAudio(selectedClip!.id, { fadeIn: v })}
                  />
                  <SliderInput
                    label="Fade Out"
                    value={audio.fadeOut || 0}
                    min={0}
                    max={5}
                    step={0.1}
                    unit="s"
                    onChange={(v) => updateClipAudio(selectedClip!.id, { fadeOut: v })}
                  />
                </div>

                {/* Volume Keyframe Points Manager (Requirement 22) */}
                <div className="p-2.5 bg-[#0e1118] border border-[#202534] rounded-lg flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">
                      Volume Keyframes ({audio.keyframes?.length || 0})
                    </span>
                    <button
                      onClick={() =>
                        addAudioKeyframe(
                          selectedClip!.id,
                          Math.max(0, useTimelineStore.getState().currentTime - selectedClip!.startTime),
                          audio.volume || 100
                        )
                      }
                      className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add KF</span>
                    </button>
                  </div>

                  {audio.keyframes && audio.keyframes.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                      {audio.keyframes.map((kf) => (
                        <div
                          key={kf.id}
                          className="flex items-center justify-between p-1.5 rounded bg-[#161a24] text-[10px] text-slate-300 font-mono"
                        >
                          <span>{kf.time.toFixed(1)}s</span>
                          <span>{kf.volume}%</span>
                          <button
                            onClick={() => removeAudioKeyframe(selectedClip!.id, kf.id)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500">
                      Belum ada keyframe. Klik Add KF pada posisi playhead.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 5. Text Styling Tab */}
            {activeTab === 'text' && (
              <div className="flex flex-col gap-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>Text Content & Style</span>
                </span>

                <textarea
                  rows={2}
                  value={textProps.text}
                  onChange={(e) => updateClipText(selectedClip!.id, { text: e.target.value })}
                  className="w-full bg-[#0a0c10] border border-[#242b3b] rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                />

                <SliderInput
                  label="Font Size"
                  value={textProps.fontSize}
                  min={12}
                  max={96}
                  unit="px"
                  onChange={(v) => updateClipText(selectedClip!.id, { fontSize: v })}
                />

                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center justify-between bg-[#11141c] border border-[#202532] p-2 rounded cursor-pointer">
                    <span className="text-slate-400 text-[10px]">Warna Teks:</span>
                    <input
                      type="color"
                      value={textProps.color}
                      onChange={(e) => updateClipText(selectedClip!.id, { color: e.target.value })}
                      className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                  </label>

                  <label className="flex items-center justify-between bg-[#11141c] border border-[#202532] p-2 rounded cursor-pointer">
                    <span className="text-slate-400 text-[10px]">Background:</span>
                    <input
                      type="color"
                      value={
                        textProps.backgroundColor && textProps.backgroundColor.startsWith('#')
                          ? textProps.backgroundColor
                          : '#000000'
                      }
                      onChange={(e) =>
                        updateClipText(selectedClip!.id, { backgroundColor: e.target.value })
                      }
                      className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                  </label>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
