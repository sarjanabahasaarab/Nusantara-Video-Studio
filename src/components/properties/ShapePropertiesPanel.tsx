/**
 * Nusantara Video Studio - Shape Properties Inspector
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Provides controls for Shape Type, Fill Color, Stroke Color, Stroke Width,
 * Opacity, Position, Width, Height, Rotation, and Corner Radius (Requirement 16).
 */

import React from 'react';
import { Shapes, RotateCcw } from 'lucide-react';
import { Clip, ShapeProperties, ShapeType } from '../../types';
import { useTimelineStore } from '../../stores/timelineStore';
import { SliderInput } from '../common/SliderInput';

interface ShapePropertiesPanelProps {
  clip: Clip;
  onNotify?: (title: string, message: string, type?: any) => void;
}

export const ShapePropertiesPanel: React.FC<ShapePropertiesPanelProps> = ({ clip, onNotify }) => {
  const updateClipShape = useTimelineStore((s) => s.updateClipShape);
  const updateClipTransform = useTimelineStore((s) => s.updateClipTransform);

  const shapeProps: ShapeProperties = clip.shapeProps || {
    shapeType: 'rectangle',
    fillColor: '#3b82f6',
    strokeColor: '#ffffff',
    strokeWidth: 2,
    opacity: 1,
    width: 320,
    height: 180,
    cornerRadius: 0,
  };

  const transform = clip.transform || {
    positionX: 0,
    positionY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
  };

  const shapeTypes: { id: ShapeType; label: string }[] = [
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'rounded-rectangle', label: 'Rounded Rect' },
    { id: 'circle', label: 'Circle' },
    { id: 'ellipse', label: 'Ellipse' },
    { id: 'line', label: 'Line' },
    { id: 'arrow', label: 'Arrow' },
    { id: 'triangle', label: 'Triangle' },
  ];

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      {/* 1. Shape Type Selector */}
      <div className="flex flex-col gap-2 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Shapes className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tipe Bentuk (Shape)</span>
        </span>

        <div className="grid grid-cols-3 gap-1">
          {shapeTypes.map((st) => (
            <button
              key={st.id}
              onClick={() => updateClipShape(clip.id, { shapeType: st.id })}
              className={`py-1 px-1.5 rounded text-[10px] font-medium border truncate transition-colors ${
                shapeProps.shapeType === st.id
                  ? 'bg-cyan-600/30 border-cyan-500/40 text-cyan-300'
                  : 'bg-[#141824] hover:bg-[#1c2232] border-[#222838] text-slate-300'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Fill & Stroke Colors */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
          Warna & Garis Tepi
        </span>

        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2 rounded-lg bg-[#121622] border border-[#222938] cursor-pointer">
            <span className="text-[10px] text-slate-300">Warna Isi (Fill)</span>
            <input
              type="color"
              value={shapeProps.fillColor}
              onChange={(e) => updateClipShape(clip.id, { fillColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-[#121622] border border-[#222938] cursor-pointer">
            <span className="text-[10px] text-slate-300">Garis (Stroke)</span>
            <input
              type="color"
              value={shapeProps.strokeColor}
              onChange={(e) => updateClipShape(clip.id, { strokeColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
            />
          </label>
        </div>

        <SliderInput
          label="Tebal Stroke"
          value={shapeProps.strokeWidth}
          min={0}
          max={20}
          unit="px"
          onChange={(v) => updateClipShape(clip.id, { strokeWidth: v })}
        />

        {shapeProps.shapeType === 'rounded-rectangle' && (
          <SliderInput
            label="Corner Radius"
            value={shapeProps.cornerRadius || 0}
            min={0}
            max={80}
            unit="px"
            onChange={(v) => updateClipShape(clip.id, { cornerRadius: v })}
          />
        )}
      </div>

      {/* 3. Dimensions & Transform */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
          Ukuran & Posisi
        </span>

        <div className="grid grid-cols-2 gap-2">
          <SliderInput
            label="Lebar (Width)"
            value={shapeProps.width}
            min={20}
            max={1200}
            unit="px"
            onChange={(v) => updateClipShape(clip.id, { width: v })}
          />
          <SliderInput
            label="Tinggi (Height)"
            value={shapeProps.height}
            min={10}
            max={800}
            unit="px"
            onChange={(v) => updateClipShape(clip.id, { height: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderInput
            label="Position X"
            value={transform.positionX || 0}
            min={-800}
            max={800}
            unit="px"
            onChange={(v) => updateClipTransform(clip.id, { positionX: v })}
          />
          <SliderInput
            label="Position Y"
            value={transform.positionY || 0}
            min={-500}
            max={500}
            unit="px"
            onChange={(v) => updateClipTransform(clip.id, { positionY: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderInput
            label="Rotation"
            value={transform.rotation || 0}
            min={-180}
            max={180}
            unit="°"
            onChange={(v) => updateClipTransform(clip.id, { rotation: v })}
          />
          <SliderInput
            label="Opacity"
            value={Math.round((shapeProps.opacity ?? 1) * 100)}
            min={0}
            max={100}
            unit="%"
            onChange={(v) => updateClipShape(clip.id, { opacity: v / 100 })}
          />
        </div>
      </div>
    </div>
  );
};
