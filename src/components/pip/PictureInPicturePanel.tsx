/**
 * Nusantara Video Studio - Picture-in-Picture (PiP) Panel
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Inspector controls for Picture-in-Picture layout presets, border styling,
 * rounded corners, drop shadows, and automatic coordinate placement.
 */

import React from 'react';
import { Clip, PictureInPictureSettings } from '../../types';
import { Layout, Maximize2, Square, Sparkles } from 'lucide-react';
import { SliderInput } from '../common/SliderInput';

interface PictureInPicturePanelProps {
  clip: Clip;
  onUpdatePiP: (pip: Partial<PictureInPictureSettings>) => void;
  onUpdateTransform: (transform: Partial<Clip['transform']>) => void;
}

export const PictureInPicturePanel: React.FC<PictureInPicturePanelProps> = ({
  clip,
  onUpdatePiP,
  onUpdateTransform,
}) => {
  const pip = clip.pip || {
    enabled: false,
    presetPosition: 'top-right',
    presetSize: 'small',
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowBlur: 12,
  };

  const applyPositionPreset = (
    pos: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | 'custom',
    size: 'small' | 'medium' | 'large' | 'custom'
  ) => {
    // Sizing factor
    const scaleFactor =
      size === 'small'
        ? 0.28
        : size === 'medium'
        ? 0.42
        : size === 'large'
        ? 0.6
        : clip.transform?.scaleX ?? 0.4;

    // Coordinate positions in 1920x1080 canvas
    let posX = clip.transform?.positionX ?? 0;
    let posY = clip.transform?.positionY ?? 0;

    switch (pos) {
      case 'top-left':
        posX = -580;
        posY = -310;
        break;
      case 'top-right':
        posX = 580;
        posY = -310;
        break;
      case 'bottom-left':
        posX = -580;
        posY = 310;
        break;
      case 'bottom-right':
        posX = 580;
        posY = 310;
        break;
      case 'center':
        posX = 0;
        posY = 0;
        break;
    }

    onUpdateTransform({
      positionX: posX,
      positionY: posY,
      scaleX: scaleFactor,
      scaleY: scaleFactor,
      rotation: 0,
    });

    onUpdatePiP({
      enabled: true,
      presetPosition: pos,
      presetSize: size,
    });
  };

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* Enable Switch */}
      <div className="p-2.5 rounded-xl bg-[#11141f] border border-[#1f2638] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
            PiP
          </div>
          <div>
            <h4 className="text-[11px] font-semibold text-slate-200">Picture-in-Picture</h4>
            <span className="text-[10px] text-slate-500">Overlay sekunder dengan border & shadow</span>
          </div>
        </div>

        <input
          type="checkbox"
          checked={pip.enabled}
          onChange={(e) => {
            if (e.target.checked) {
              applyPositionPreset(pip.presetPosition || 'top-right', pip.presetSize || 'small');
            } else {
              onUpdatePiP({ enabled: false });
            }
          }}
          className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
        />
      </div>

      {pip.enabled && (
        <div className="flex flex-col gap-3">
          {/* Position Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Position Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => applyPositionPreset(pos, pip.presetSize || 'small')}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-medium capitalize transition-colors ${
                    pip.presetPosition === pos
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-[#121622] border-[#22293b] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Size Presets */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Size Presets
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['small', 'medium', 'large'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => applyPositionPreset(pip.presetPosition || 'top-right', sz)}
                  className={`py-1.5 px-2 rounded-lg border text-[10px] font-medium capitalize transition-colors ${
                    pip.presetSize === sz
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300'
                      : 'bg-[#121622] border-[#22293b] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sz} {sz === 'small' ? '(28%)' : sz === 'medium' ? '(42%)' : '(60%)'}
                </button>
              ))}
            </div>
          </div>

          {/* Border & Corner Styling */}
          <div className="flex flex-col gap-2.5 bg-[#0f121a] p-3 rounded-xl border border-[#1f2638]">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Framing & Border
            </span>

            <SliderInput
              label="Border Width"
              value={pip.borderWidth || 0}
              min={0}
              max={16}
              step={1}
              unit="px"
              onChange={(borderWidth) => onUpdatePiP({ borderWidth })}
            />

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Border Color</span>
              <div className="flex items-center gap-1.5 bg-[#121622] border border-[#22293b] rounded-lg px-2 py-0.5">
                <input
                  type="color"
                  value={pip.borderColor || '#ffffff'}
                  onChange={(e) => onUpdatePiP({ borderColor: e.target.value })}
                  className="w-4 h-4 rounded cursor-pointer bg-transparent border-0 p-0"
                />
                <span className="font-mono text-[10px] text-slate-300">{pip.borderColor || '#ffffff'}</span>
              </div>
            </div>

            <SliderInput
              label="Corner Radius"
              value={pip.borderRadius || 0}
              min={0}
              max={40}
              step={1}
              unit="px"
              onChange={(borderRadius) => onUpdatePiP({ borderRadius })}
            />

            <SliderInput
              label="Drop Shadow Blur"
              value={pip.shadowBlur || 0}
              min={0}
              max={40}
              step={1}
              unit="px"
              onChange={(shadowBlur) => onUpdatePiP({ shadowBlur })}
            />
          </div>
        </div>
      )}
    </div>
  );
};
