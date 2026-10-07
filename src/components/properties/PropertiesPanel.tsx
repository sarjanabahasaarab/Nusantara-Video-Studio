/**
 * Nusantara Video Studio - Right Properties Panel / Inspector
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Full inspector supporting Transform, Keyframe Animations, Animation Presets,
 * Effect Stack, Chroma Key (Green Screen), Vector Masking, Speed Ramping,
 * Picture-in-Picture (PiP), Motion Tracking, and Color Appearance.
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
  SlidersHorizontal,
  Diamond,
  Wand2,
  Activity,
  Layout,
  Crosshair,
  Trash2,
} from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { SliderInput } from '../common/SliderInput';

// Phase 4 Modular Panels
import { EffectsStackPanel } from '../effects/EffectsStackPanel';
import { KeyframeInspector } from '../keyframes/KeyframeInspector';
import { AnimationPresetsPanel } from '../animation/AnimationPresetsPanel';
import { ChromaKeyPanel } from '../chromakey/ChromaKeyPanel';
import { MaskingPanel } from '../masking/MaskingPanel';
import { SpeedRampPanel } from '../speed/SpeedRampPanel';
import { PictureInPicturePanel } from '../pip/PictureInPicturePanel';
import { MotionTrackingPanel } from '../tracking/MotionTrackingPanel';
import { Clip } from '../../types';

// Phase 5 Modular Panels
import { TextPropertiesPanel } from './TextPropertiesPanel';
import { ShapePropertiesPanel } from './ShapePropertiesPanel';
import { LogoPropertiesPanel } from './LogoPropertiesPanel';

export type PropertiesTab =
  | 'transform'
  | 'effects'
  | 'chroma'
  | 'mask'
  | 'pip'
  | 'speed'
  | 'animation'
  | 'keyframes'
  | 'tracking'
  | 'appearance'
  | 'audio'
  | 'text'
  | 'shape'
  | 'logo';

export const PropertiesPanel: React.FC = () => {
  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const propertiesWidth = useUIStore((s) => s.propertiesWidth);
  const notify = useUIStore((s) => s.notify);

  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const projectSettings = useProjectStore((s) => s.currentProject.settings);

  // Phase 4 Project Store actions
  const updateClipKeyframes = useProjectStore((s) => s.updateClipKeyframes);
  const updateClipEffects = useProjectStore((s) => s.updateClipEffects);
  const updateClipMasks = useProjectStore((s) => s.updateClipMasks);
  const updateClipChromaKey = useProjectStore((s) => s.updateClipChromaKey);
  const updateClipSpeed = useProjectStore((s) => s.updateClipSpeed);
  const updateClipPiP = useProjectStore((s) => s.updateClipPiP);
  const updateClipTracking = useProjectStore((s) => s.updateClipTracking);

  // Timeline Store actions
  const currentTime = useTimelineStore((s) => s.currentTime);
  const updateClipTransform = useTimelineStore((s) => s.updateClipTransform);
  const updateClipAppearance = useTimelineStore((s) => s.updateClipAppearance);
  const updateClipAudio = useTimelineStore((s) => s.updateClipAudio);
  const updateClipText = useTimelineStore((s) => s.updateClipText);
  const resetClipProperties = useTimelineStore((s) => s.resetClipProperties);
  const addAudioKeyframe = useTimelineStore((s) => s.addAudioKeyframe);
  const removeAudioKeyframe = useTimelineStore((s) => s.removeAudioKeyframe);

  const [activeTab, setActiveTab] = useState<PropertiesTab>('transform');

  // Find currently selected clip across tracks
  let selectedClip: Clip | null = null;
  let parentTrack = null;
  const allClips: Clip[] = [];

  for (const track of tracks) {
    track.clips.forEach((c) => allClips.push(c));
    const found = track.clips.find((c) => c.id === selectedClipId);
    if (found) {
      selectedClip = found;
      parentTrack = track;
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
  const isShape = selectedClip && selectedClip.type === 'shape';
  const isLogo = selectedClip && selectedClip.type === 'logo';

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

  const handleApplyTrackingToTarget = (targetClipId: string, trackingData: any) => {
    // When tracking applies to a target clip, attach tracking or create keyframe trajectory
    const target = allClips.find((c) => c.id === targetClipId);
    if (!target) return;

    if (trackingData.points && trackingData.points.length > 0) {
      // Map normalized tracking points (0 to 1) to target transform coordinates (-960 to +960)
      const xKeyframes = trackingData.points.map((pt: any, idx: number) => ({
        id: `kf-trk-x-${idx}`,
        time: pt.time,
        value: Math.round((pt.x - 0.5) * 1920),
        interpolation: 'linear' as const,
      }));
      const yKeyframes = trackingData.points.map((pt: any, idx: number) => ({
        id: `kf-trk-y-${idx}`,
        time: pt.time,
        value: Math.round((pt.y - 0.5) * 1080),
        interpolation: 'linear' as const,
      }));

      const existingKfs = target.animatedProperties || [];
      const updated = [
        ...existingKfs.filter((k) => k.property !== 'positionX' && k.property !== 'positionY'),
        { property: 'positionX', keyframes: xKeyframes },
        { property: 'positionY', keyframes: yKeyframes },
      ];

      updateClipKeyframes(targetClipId, updated);
    }
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
            Inspector
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
              title="Reset Semua Parameter ke Default"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Sub-tab Navigation if Clip Selected */}
      {selectedClip && (
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-[#1f2430] bg-[#101219] overflow-x-auto select-none no-scrollbar text-[10px]">
          {isVideoOrImage && (
            <>
              <button
                onClick={() => setActiveTab('transform')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'transform'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Transform
              </button>
              <button
                onClick={() => setActiveTab('effects')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'effects'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Effects ({selectedClip.effects?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('chroma')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'chroma'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Chroma Key
              </button>
              <button
                onClick={() => setActiveTab('mask')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'mask'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Mask ({selectedClip.masks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('pip')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'pip'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                PiP
              </button>
              <button
                onClick={() => setActiveTab('speed')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'speed'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Speed
              </button>
              <button
                onClick={() => setActiveTab('animation')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'animation'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setActiveTab('keyframes')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'keyframes'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Keyframes
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'tracking'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Tracking
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Color
              </button>
              <button
                onClick={() => setActiveTab('audio')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'audio'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d2a]'
                }`}
              >
                Audio
              </button>
            </>
          )}

          {isAudio && (
            <>
              <button
                onClick={() => setActiveTab('audio')}
                className="px-3 py-1 bg-emerald-600 text-white rounded-md font-semibold text-[10px]"
              >
                Audio Settings & Keyframes
              </button>
              <button
                onClick={() => setActiveTab('speed')}
                className={`px-3 py-1 rounded-md font-medium text-[10px] transition-colors ${
                  activeTab === 'speed' ? 'bg-blue-600 text-white' : 'text-slate-400'
                }`}
              >
                Audio Speed
              </button>
            </>
          )}

          {isText && (
            <>
              <button
                onClick={() => setActiveTab('text')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'text' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Text Styling
              </button>
              <button
                onClick={() => setActiveTab('transform')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'transform' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Transform
              </button>
              <button
                onClick={() => setActiveTab('animation')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'animation' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Presets
              </button>
              <button
                onClick={() => setActiveTab('keyframes')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'keyframes' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Keyframes
              </button>
            </>
          )}

          {isShape && (
            <>
              <button
                onClick={() => setActiveTab('shape')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'shape' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Shape Properties
              </button>
              <button
                onClick={() => setActiveTab('transform')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'transform' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Transform
              </button>
            </>
          )}

          {isLogo && (
            <>
              <button
                onClick={() => setActiveTab('logo')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'logo' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400'
                }`}
              >
                Logo Overlay
              </button>
              <button
                onClick={() => setActiveTab('transform')}
                className={`px-2.5 py-1 rounded-md font-medium shrink-0 transition-colors ${
                  activeTab === 'transform' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400'
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
              Pilih clip pada timeline atau monitor preview untuk menyesuaikan atribut transform, efek, chroma key, masking, kecepatan, dan animasi.
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
                    <span>Transform & Keyframes</span>
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

                {/* Quick Keyframe Jump Link */}
                <button
                  onClick={() => setActiveTab('keyframes')}
                  className="mt-2 py-1.5 px-3 rounded-lg bg-[#141824] hover:bg-[#1a2133] border border-[#222a3d] text-blue-400 font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Diamond className="w-3.5 h-3.5" />
                  <span>Buka Keyframe Curves & Interpolasi</span>
                </button>
              </div>
            )}

            {/* 2. Effect Stack Tab (Requirement 16) */}
            {activeTab === 'effects' && (
              <EffectsStackPanel
                clip={selectedClip}
                onUpdateEffects={(effects) => updateClipEffects(selectedClip!.id, effects)}
              />
            )}

            {/* 3. Chroma Key / Green Screen (Requirement 8) */}
            {activeTab === 'chroma' && (
              <ChromaKeyPanel
                clip={selectedClip}
                onUpdateChromaKey={(settings) => updateClipChromaKey(selectedClip!.id, settings)}
              />
            )}

            {/* 4. Masking (Requirement 9) */}
            {activeTab === 'mask' && (
              <MaskingPanel
                clip={selectedClip}
                onUpdateMasks={(masks) => updateClipMasks(selectedClip!.id, masks)}
              />
            )}

            {/* 5. Picture-in-Picture (Requirement 13) */}
            {activeTab === 'pip' && (
              <PictureInPicturePanel
                clip={selectedClip}
                onUpdatePiP={(pip) => updateClipPiP(selectedClip!.id, pip)}
                onUpdateTransform={(t) => updateClipTransform(selectedClip!.id, t)}
              />
            )}

            {/* 6. Speed & Speed Ramping (Requirement 11 & 12) */}
            {activeTab === 'speed' && (
              <SpeedRampPanel
                clip={selectedClip}
                onUpdateSpeed={(speed) => updateClipSpeed(selectedClip!.id, speed)}
                onNotify={notify}
              />
            )}

            {/* 7. Animation Presets (Requirement 7) */}
            {activeTab === 'animation' && (
              <AnimationPresetsPanel
                clip={selectedClip}
                onUpdateKeyframes={(kfs) => updateClipKeyframes(selectedClip!.id, kfs)}
                onNotify={notify}
              />
            )}

            {/* 8. Keyframe Inspector (Requirement 5 & 6) */}
            {activeTab === 'keyframes' && (
              <KeyframeInspector
                clip={selectedClip}
                currentTime={currentTime}
                onUpdateKeyframes={(kfs) => updateClipKeyframes(selectedClip!.id, kfs)}
              />
            )}

            {/* 9. Motion Tracking (Requirement 10) */}
            {activeTab === 'tracking' && (
              <MotionTrackingPanel
                clip={selectedClip}
                currentTime={currentTime}
                availableTargetClips={allClips.filter((c) => c.id !== selectedClip!.id)}
                onUpdateTracking={(trk) => updateClipTracking(selectedClip!.id, trk)}
                onApplyTrackingToTarget={handleApplyTrackingToTarget}
                onNotify={notify}
              />
            )}

            {/* 10. Color Appearance Tab */}
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

            {/* 11. Audio Tab */}
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

                <SliderInput
                  label="Audio Gain"
                  value={audio.gain || 0}
                  min={-24}
                  max={24}
                  step={0.5}
                  unit="dB"
                  onChange={(v) => updateClipAudio(selectedClip!.id, { gain: v })}
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

            {/* 12. Text Styling Tab (Phase 5 Professional Text Studio) */}
            {activeTab === 'text' && (
              <TextPropertiesPanel clip={selectedClip!} onNotify={notify} />
            )}

            {/* 13. Shape Graphics Tab (Phase 5 Shape Studio) */}
            {activeTab === 'shape' && (
              <ShapePropertiesPanel clip={selectedClip!} onNotify={notify} />
            )}

            {/* 14. Logo Overlay Tab (Phase 5 Watermark Studio) */}
            {activeTab === 'logo' && (
              <LogoPropertiesPanel clip={selectedClip!} onNotify={notify} />
            )}
          </>
        )}
      </div>
    </aside>
  );
};
