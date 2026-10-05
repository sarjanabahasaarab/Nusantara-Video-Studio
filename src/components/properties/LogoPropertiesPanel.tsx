/**
 * Nusantara Video Studio - Logo Overlay Properties Inspector
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Implements Logo/Watermark overlay management (Requirement 17):
 * Presets, Scale, Rotation, Opacity, Crop, Shadow, Border.
 */

import React from 'react';
import { Image, Shield, Move } from 'lucide-react';
import { Clip, LogoOverlayProperties } from '../../types';
import { useTimelineStore } from '../../stores/timelineStore';
import { SliderInput } from '../common/SliderInput';

interface LogoPropertiesPanelProps {
  clip: Clip;
  onNotify?: (title: string, message: string, type?: any) => void;
}

export const LogoPropertiesPanel: React.FC<LogoPropertiesPanelProps> = ({ clip, onNotify }) => {
  const updateClipLogo = useTimelineStore((s) => s.updateClipLogo);
  const updateClipTransform = useTimelineStore((s) => s.updateClipTransform);

  const logoProps: LogoOverlayProperties = clip.logoProps || {
    presetPosition: 'top-right',
    scale: 0.6,
    rotation: 0,
    opacity: 0.9,
    borderWidth: 0,
    shadowBlur: 10,
    shadowColor: '#000000',
  };

  const transform = clip.transform || {
    positionX: 380,
    positionY: -220,
    scaleX: 0.6,
    scaleY: 0.6,
    rotation: 0,
    opacity: 0.9,
  };

  const handleApplyPresetPosition = (preset: LogoOverlayProperties['presetPosition']) => {
    let posX = 0;
    let posY = 0;

    switch (preset) {
      case 'top-left':
        posX = -380;
        posY = -220;
        break;
      case 'top-right':
        posX = 380;
        posY = -220;
        break;
      case 'bottom-left':
        posX = -380;
        posY = 220;
        break;
      case 'bottom-right':
        posX = 380;
        posY = 220;
        break;
      case 'center':
        posX = 0;
        posY = 0;
        break;
    }

    updateClipLogo(clip.id, { presetPosition: preset });
    updateClipTransform(clip.id, { positionX: posX, positionY: posY });
    if (onNotify) {
      onNotify('Posisi Watermark', `Logo diposisikan ke ${preset}.`, 'info');
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      {/* 1. Presets */}
      <div className="flex flex-col gap-2 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-purple-400" />
          <span>Preset Posisi Watermark</span>
        </span>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'top-left', label: 'Top Left' },
            { id: 'top-right', label: 'Top Right' },
            { id: 'center', label: 'Center' },
            { id: 'bottom-left', label: 'Bottom Left' },
            { id: 'bottom-right', label: 'Bottom Right' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPresetPosition(p.id as any)}
              className={`p-1.5 rounded text-[10px] font-medium border truncate transition-colors ${
                logoProps.presetPosition === p.id
                  ? 'bg-purple-600/30 border-purple-500/40 text-purple-300'
                  : 'bg-[#141824] hover:bg-[#1c2232] border-[#222838] text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Scale, Opacity & Rotation */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
          Ukuran & Transparansi
        </span>

        <SliderInput
          label="Ukuran Logo (Scale)"
          value={Math.round((logoProps.scale ?? 0.6) * 100)}
          min={10}
          max={200}
          unit="%"
          onChange={(v) => {
            const s = v / 100;
            updateClipLogo(clip.id, { scale: s });
            updateClipTransform(clip.id, { scaleX: s, scaleY: s });
          }}
        />

        <SliderInput
          label="Opacity"
          value={Math.round((logoProps.opacity ?? 0.9) * 100)}
          min={10}
          max={100}
          unit="%"
          onChange={(v) => {
            const op = v / 100;
            updateClipLogo(clip.id, { opacity: op });
            updateClipTransform(clip.id, { opacity: op });
          }}
        />

        <SliderInput
          label="Rotation"
          value={logoProps.rotation || 0}
          min={-180}
          max={180}
          unit="°"
          onChange={(v) => {
            updateClipLogo(clip.id, { rotation: v });
            updateClipTransform(clip.id, { rotation: v });
          }}
        />
      </div>

      {/* 3. Shadow & Border */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
          Shadow & Border
        </span>

        <SliderInput
          label="Border Width"
          value={logoProps.borderWidth || 0}
          min={0}
          max={10}
          unit="px"
          onChange={(v) => updateClipLogo(clip.id, { borderWidth: v })}
        />

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2 rounded-lg bg-[#121622] border border-[#222938] cursor-pointer">
            <span className="text-[10px] text-slate-300">Warna Border</span>
            <input
              type="color"
              value={logoProps.borderColor || '#ffffff'}
              onChange={(e) => updateClipLogo(clip.id, { borderColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-[#121622] border border-[#222938] cursor-pointer">
            <span className="text-[10px] text-slate-300">Warna Shadow</span>
            <input
              type="color"
              value={logoProps.shadowColor || '#000000'}
              onChange={(e) => updateClipLogo(clip.id, { shadowColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
            />
          </label>
        </div>

        <SliderInput
          label="Shadow Blur"
          value={logoProps.shadowBlur || 0}
          min={0}
          max={30}
          unit="px"
          onChange={(v) => updateClipLogo(clip.id, { shadowBlur: v })}
        />
      </div>
    </div>
  );
};
