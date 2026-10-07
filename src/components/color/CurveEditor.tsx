/**
 * Nusantara Video Studio - Professional Curve Editor
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements interactive curves editor for RGB Master, Red, Green, and Blue channels:
 * - Monotonic Cubic Spline graph display
 * - Interactive point addition (click on line), movement (drag), deletion (double-click/right-click)
 * - Numeric Input coordinate readout (Input X, Output Y)
 * - Channel Reset button
 */

import React, { useState, useRef, useEffect } from 'react';
import { ColorCurves, CurvePoint } from '../../types/color';
import { ColorEngine } from '../../engine/color/ColorEngine';
import { RotateCcw } from 'lucide-react';

interface CurveEditorProps {
  curves: ColorCurves;
  onChange: (updated: ColorCurves) => void;
}

type CurveChannel = 'rgb' | 'red' | 'green' | 'blue';

export const CurveEditor: React.FC<CurveEditorProps> = ({ curves, onChange }) => {
  const [activeChannel, setActiveChannel] = useState<CurveChannel>('rgb');
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDraggingRef = useRef(false);

  const currentPoints = curves[activeChannel] || [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ];

  // Helper to construct smooth SVG path from monotonic spline
  const generateSplinePath = (pts: CurvePoint[]) => {
    const coords: string[] = [];
    for (let x = 0; x <= 255; x += 4) {
      const y = ColorEngine.evaluateCurve(pts, x);
      const svgX = (x / 255) * 200;
      const svgY = 200 - (y / 255) * 200; // Flip Y for SVG coords
      coords.push(`${x === 0 ? 'M' : 'L'} ${svgX.toFixed(1)} ${svgY.toFixed(1)}`);
    }
    return coords.join(' ');
  };

  const channelColors = {
    rgb: '#ffffff',
    red: '#ef4444',
    green: '#22c55e',
    blue: '#3b82f6',
  };

  const handlePointerDown = (e: React.PointerEvent, idx?: number) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 255;
    const rawY = 255 - ((e.clientY - rect.top) / rect.height) * 255;

    let targetIdx = idx;

    if (targetIdx === undefined) {
      // User clicked on canvas to add a new point
      const newPt: CurvePoint = {
        x: Math.max(0, Math.min(255, Math.round(rawX))),
        y: Math.max(0, Math.min(255, Math.round(rawY))),
      };
      const newPoints = [...currentPoints, newPt].sort((a, b) => a.x - b.x);
      targetIdx = newPoints.findIndex((p) => p.x === newPt.x && p.y === newPt.y);
      onChange({
        ...curves,
        [activeChannel]: newPoints,
      });
    }

    setSelectedPointIndex(targetIdx);
    isDraggingRef.current = true;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current || !svgRef.current) return;
      const moveRect = svgRef.current.getBoundingClientRect();
      const curX = Math.max(0, Math.min(255, Math.round(((moveEvent.clientX - moveRect.left) / moveRect.width) * 255)));
      const curY = Math.max(0, Math.min(255, Math.round(255 - ((moveEvent.clientY - moveRect.top) / moveRect.height) * 255)));

      const updated = [...currentPoints];
      // Keep endpoints pinned to x=0 and x=255 unless dragged vertically
      if (targetIdx === 0) {
        updated[0] = { x: 0, y: curY };
      } else if (targetIdx === updated.length - 1) {
        updated[updated.length - 1] = { x: 255, y: curY };
      } else if (targetIdx !== undefined && targetIdx > 0 && targetIdx < updated.length - 1) {
        updated[targetIdx] = { x: curX, y: curY };
      }

      onChange({
        ...curves,
        [activeChannel]: updated,
      });
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleDeleteSelectedPoint = () => {
    if (selectedPointIndex === null || selectedPointIndex === 0 || selectedPointIndex === currentPoints.length - 1) {
      return;
    }
    const updated = currentPoints.filter((_, i) => i !== selectedPointIndex);
    setSelectedPointIndex(null);
    onChange({
      ...curves,
      [activeChannel]: updated,
    });
  };

  const handleResetCurrentCurve = () => {
    onChange({
      ...curves,
      [activeChannel]: [
        { x: 0, y: 0 },
        { x: 255, y: 255 },
      ],
    });
    setSelectedPointIndex(null);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#0d1017] border border-[#202737] rounded-xl select-none text-xs">
      {/* Channel Selector Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {(['rgb', 'red', 'green', 'blue'] as CurveChannel[]).map((ch) => (
            <button
              key={ch}
              onClick={() => {
                setActiveChannel(ch);
                setSelectedPointIndex(null);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors border ${
                activeChannel === ch
                  ? 'bg-[#182030] text-white border-blue-500 shadow-sm'
                  : 'bg-[#121620] text-slate-400 hover:text-slate-200 border-[#232a3a]'
              }`}
              style={{
                borderColor: activeChannel === ch ? channelColors[ch] : undefined,
                color: activeChannel === ch ? channelColors[ch] : undefined,
              }}
            >
              {ch}
            </button>
          ))}
        </div>

        <button
          onClick={handleResetCurrentCurve}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-[#1a1f2c] transition-colors"
          title={`Reset Kurva ${activeChannel.toUpperCase()}`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative w-full aspect-square bg-[#080b11] border border-[#1d2433] rounded-lg overflow-hidden flex items-center justify-center p-2">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          className="w-full h-full cursor-crosshair overflow-visible"
          onPointerDown={(e) => handlePointerDown(e)}
        >
          {/* Background Grid Lines (4x4) */}
          <line x1="50" y1="0" x2="50" y2="200" stroke="#161c28" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="#1f2738" strokeWidth="1" />
          <line x1="150" y1="0" x2="150" y2="200" stroke="#161c28" strokeWidth="1" strokeDasharray="3 3" />

          <line x1="0" y1="50" x2="200" y2="50" stroke="#161c28" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="#1f2738" strokeWidth="1" />
          <line x1="0" y1="150" x2="200" y2="150" stroke="#161c28" strokeWidth="1" strokeDasharray="3 3" />

          {/* Reference Diagonal Linear 1:1 Line */}
          <line x1="0" y1="200" x2="200" y2="0" stroke="#1c2434" strokeWidth="1.5" />

          {/* Smooth Spline Curve */}
          <path
            d={generateSplinePath(currentPoints)}
            fill="none"
            stroke={channelColors[activeChannel]}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Control Points */}
          {currentPoints.map((pt, idx) => {
            const svgX = (pt.x / 255) * 200;
            const svgY = 200 - (pt.y / 255) * 200;
            const isSelected = selectedPointIndex === idx;

            return (
              <g key={idx}>
                <circle
                  cx={svgX}
                  cy={svgY}
                  r={isSelected ? 6 : 4.5}
                  fill={isSelected ? '#38bdf8' : '#ffffff'}
                  stroke={channelColors[activeChannel]}
                  strokeWidth="2"
                  className="cursor-pointer hover:scale-125 transition-transform"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handlePointerDown(e, idx);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    setSelectedPointIndex(idx);
                    handleDeleteSelectedPoint();
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Point Coordinates & Delete Button */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        {selectedPointIndex !== null && currentPoints[selectedPointIndex] ? (
          <div className="flex items-center gap-3">
            <span>
              In: <strong className="text-white font-mono">{currentPoints[selectedPointIndex].x}</strong>
            </span>
            <span>
              Out: <strong className="text-white font-mono">{currentPoints[selectedPointIndex].y}</strong>
            </span>
            {selectedPointIndex !== 0 && selectedPointIndex !== currentPoints.length - 1 && (
              <button
                onClick={handleDeleteSelectedPoint}
                className="text-rose-400 hover:text-rose-300 underline text-[10px] ml-1"
              >
                Hapus Titik
              </button>
            )}
          </div>
        ) : (
          <span>Klik garis untuk tambah titik. Double click titik untuk hapus.</span>
        )}
      </div>
    </div>
  );
};
