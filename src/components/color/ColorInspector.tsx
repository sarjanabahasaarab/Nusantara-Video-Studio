/**
 * Nusantara Video Studio - Color Inspector Panel
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements full color grading controls:
 * 1. Basic Correction (Exposure, Contrast, Highlights, Shadows, Whites, Blacks, Saturation, Vibrance, Temp, Tint, Sharpness, Clarity)
 * 2. Curves (RGB, Red, Green, Blue)
 * 3. Color Wheels (Lift, Gamma, Gain)
 * 4. HSL Secondary Hue Controls (8 color bands)
 * 5. 3D LUT (.cube)
 * 6. Vignette
 * 7. Color Presets & Match
 */

import React from 'react';
import { Clip, ClipColorGrading, HSLChannel } from '../../types';
import { useColorStore } from '../../stores/colorStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { ColorEngine } from '../../engine/color/ColorEngine';
import { SliderInput } from '../common/SliderInput';
import { CurveEditor } from './CurveEditor';
import { ColorWheelsComponent } from './ColorWheels';
import { LUTPanel } from './LUTPanel';
import { VignettePanel } from './VignettePanel';
import { ColorPresetsPanel } from './ColorPresetsPanel';
import { ColorMatchPanel } from './ColorMatchPanel';
import {
  Sliders,
  TrendingUp,
  CircleDot,
  FileCode,
  Sparkles,
  RotateCcw,
  Palette,
  Layers,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ColorInspectorProps {
  clip?: Clip | null;
  onNotify?: (title: string, message: string, type?: any) => void;
}

export const ColorInspector: React.FC<ColorInspectorProps> = ({ clip, onNotify }) => {
  const activeTab = useColorStore((s) => s.activeInspectorTab);
  const setActiveTab = useColorStore((s) => s.setActiveInspectorTab);

  const updateClipColorGrading = useTimelineStore((s) => s.updateClipColorGrading);
  const resetClipColor = useTimelineStore((s) => s.resetClipColor);

  if (!clip) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-slate-500 bg-[#0d1017]">
        <Palette className="w-10 h-10 mb-3 opacity-30 text-blue-400" />
        <span className="text-xs font-semibold text-slate-300 mb-1">Tidak Ada Clip Terpilih</span>
        <p className="text-[11px] text-slate-500 max-w-[220px] leading-relaxed">
          Pilih clip video atau gambar di timeline untuk mengaktifkan Color Grading Studio.
        </p>
      </div>
    );
  }

  const grading: ClipColorGrading = clip.colorGrading || ColorEngine.getDefaultColorGrading();
  const basic = grading.basic;
  const isEnabled = grading.enabled;

  const handleUpdateBasic = (partial: Partial<typeof basic>) => {
    updateClipColorGrading(clip.id, {
      basic: { ...basic, ...partial },
    });
  };

  const handleToggleBypass = () => {
    updateClipColorGrading(clip.id, { enabled: !isEnabled });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0b0e15] border-l border-[#1f2738] select-none text-xs overflow-hidden">
      {/* Top Inspector Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#10141f] border-b border-[#1c2333]">
        <div className="flex items-center gap-2 min-w-0">
          <Palette className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-slate-200 truncate">
              {clip.name}
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              Color Grading Inspector
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleToggleBypass}
            className={`p-1 rounded transition-colors ${
              isEnabled
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'text-slate-500 hover:text-white bg-[#181d2a]'
            }`}
            title={isEnabled ? 'Nonaktifkan Color Grading (Bypass)' : 'Aktifkan Color Grading'}
          >
            {isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => resetClipColor(clip.id)}
            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-[#1a1f2c] transition-colors"
            title="Reset Seluruh Color Grading"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="grid grid-cols-6 bg-[#0e121a] border-b border-[#1b2230] text-[10px]">
        {[
          { id: 'basic', label: 'Basic', icon: <Sliders className="w-3 h-3" /> },
          { id: 'curves', label: 'Curves', icon: <TrendingUp className="w-3 h-3" /> },
          { id: 'wheels', label: 'Wheels', icon: <CircleDot className="w-3 h-3" /> },
          { id: 'lut', label: 'LUT', icon: <FileCode className="w-3 h-3" /> },
          { id: 'vignette', label: 'Vignette', icon: <CircleDot className="w-3 h-3" /> },
          { id: 'presets', label: 'Presets', icon: <Sparkles className="w-3 h-3" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center justify-center py-1.5 gap-0.5 transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400 bg-[#141926] font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {activeTab === 'basic' && (
          <div className="flex flex-col gap-3.5">
            {/* Tone Controls */}
            <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e121a] border border-[#202737] rounded-xl">
              <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">
                Tone & Eksposur
              </span>

              <SliderInput
                label="Exposure"
                value={basic.exposure}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ exposure: val })}
                onReset={() => handleUpdateBasic({ exposure: 0 })}
              />

              <SliderInput
                label="Contrast"
                value={basic.contrast}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ contrast: val })}
                onReset={() => handleUpdateBasic({ contrast: 0 })}
              />

              <SliderInput
                label="Highlights"
                value={basic.highlights}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ highlights: val })}
                onReset={() => handleUpdateBasic({ highlights: 0 })}
              />

              <SliderInput
                label="Shadows"
                value={basic.shadows}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ shadows: val })}
                onReset={() => handleUpdateBasic({ shadows: 0 })}
              />

              <SliderInput
                label="Whites"
                value={basic.whites}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ whites: val })}
                onReset={() => handleUpdateBasic({ whites: 0 })}
              />

              <SliderInput
                label="Blacks"
                value={basic.blacks}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ blacks: val })}
                onReset={() => handleUpdateBasic({ blacks: 0 })}
              />
            </div>

            {/* White Balance & Color Saturation */}
            <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e121a] border border-[#202737] rounded-xl">
              <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">
                White Balance & Saturasi
              </span>

              <SliderInput
                label="Temperature (Warm/Cool)"
                value={basic.temperature}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ temperature: val })}
                onReset={() => handleUpdateBasic({ temperature: 0 })}
              />

              <SliderInput
                label="Tint (Green/Magenta)"
                value={basic.tint}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ tint: val })}
                onReset={() => handleUpdateBasic({ tint: 0 })}
              />

              <SliderInput
                label="Saturation"
                value={basic.saturation}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ saturation: val })}
                onReset={() => handleUpdateBasic({ saturation: 0 })}
              />

              <SliderInput
                label="Vibrance"
                value={basic.vibrance}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ vibrance: val })}
                onReset={() => handleUpdateBasic({ vibrance: 0 })}
              />
            </div>

            {/* Detail & Clarity */}
            <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e121a] border border-[#202737] rounded-xl">
              <span className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">
                Detail & Kejernihan
              </span>

              <SliderInput
                label="Sharpness"
                value={basic.sharpness}
                min={0}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ sharpness: val })}
                onReset={() => handleUpdateBasic({ sharpness: 0 })}
              />

              <SliderInput
                label="Clarity"
                value={basic.clarity}
                min={-100}
                max={100}
                step={1}
                onChange={(val) => handleUpdateBasic({ clarity: val })}
                onReset={() => handleUpdateBasic({ clarity: 0 })}
              />
            </div>
          </div>
        )}

        {activeTab === 'curves' && (
          <CurveEditor
            curves={grading.curves}
            onChange={(curves) => updateClipColorGrading(clip.id, { curves })}
          />
        )}

        {activeTab === 'wheels' && (
          <ColorWheelsComponent
            wheels={grading.wheels}
            onChange={(wheels) => updateClipColorGrading(clip.id, { wheels })}
          />
        )}

        {activeTab === 'lut' && (
          <LUTPanel
            currentLUT={grading.lut}
            onChange={(lut) => updateClipColorGrading(clip.id, { lut })}
          />
        )}

        {activeTab === 'vignette' && (
          <VignettePanel
            vignette={grading.vignette}
            onChange={(vignette) => updateClipColorGrading(clip.id, { vignette })}
          />
        )}

        {activeTab === 'presets' && (
          <div className="flex flex-col gap-3">
            <ColorPresetsPanel
              currentGrading={grading}
              onApplyPreset={(preset) => useColorStore.getState().applyPresetToClip(preset, clip.id)}
            />
            <ColorMatchPanel
              targetClipId={clip.id}
              currentGrading={grading}
              onApplyGrading={(part) => updateClipColorGrading(clip.id, part)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
