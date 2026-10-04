/**
 * Nusantara Video Studio - Timeline Ruler
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Interactive time ruler with SMPTE timecode ticks, snapped playhead scrub-drag,
 * and marker pins visualization.
 */

import React, { useRef } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { secondsToTimecode } from '../../utils/timecode';
import { Bookmark } from 'lucide-react';

interface TimelineRulerProps {
  totalWidth: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ totalWidth }) => {
  const zoom = useTimelineStore((s) => s.zoom);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying);
  const getSnappedTime = useTimelineStore((s) => s.getSnappedTime);

  const currentProject = useProjectStore((s) => s.currentProject);
  const duration = currentProject.timeline.duration;
  const markers = currentProject.timeline.markers || [];

  const rulerRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  // Dynamic tick intervals based on zoom
  let stepSeconds = 5;
  if (zoom > 120) stepSeconds = 1;
  else if (zoom > 60) stepSeconds = 2;
  else if (zoom > 25) stepSeconds = 5;
  else if (zoom > 10) stepSeconds = 10;
  else stepSeconds = 30;

  const totalTicks = Math.ceil(duration / stepSeconds);
  const ticks = Array.from({ length: totalTicks + 1 }, (_, i) => i * stepSeconds);

  const updateTimeFromPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const rawTime = Math.max(0, Math.min(duration, offsetX / zoom));
    const snapped = getSnappedTime(rawTime);
    setCurrentTime(snapped);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isScrubbingRef.current = true;
    setIsPlaying(false);
    updateTimeFromPointer(e);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (isScrubbingRef.current) {
        updateTimeFromPointer(moveEvent);
      }
    };

    const handlePointerUp = () => {
      isScrubbingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      ref={rulerRef}
      style={{ width: `${Math.max(totalWidth, duration * zoom + 300)}px` }}
      onPointerDown={handlePointerDown}
      className="h-7 bg-[#141722] border-b border-[#212634] relative cursor-pointer select-none overflow-hidden"
    >
      {/* Timecode Ticks and Labels */}
      {ticks.map((sec) => {
        const left = sec * zoom;
        return (
          <div
            key={sec}
            style={{ left: `${left}px` }}
            className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
          >
            {/* Tick line */}
            <div className="w-px h-2 bg-slate-600" />

            {/* SMPTE / Sec Label */}
            <span className="font-mono text-[9px] text-slate-400 pl-1 -translate-y-0.5 select-none font-semibold">
              {zoom > 80 ? secondsToTimecode(sec) : `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`}
            </span>
          </div>
        );
      })}

      {/* Minor Sub-second Ticks when zoomed in */}
      {zoom > 60 &&
        Array.from({ length: Math.ceil(duration) }, (_, i) => i).map((sec) => {
          if (sec % stepSeconds === 0) return null;
          return (
            <div
              key={`sub-${sec}`}
              style={{ left: `${sec * zoom}px` }}
              className="absolute top-0 w-px h-1.5 bg-slate-700 pointer-events-none"
            />
          );
        })}

      {/* Timeline Markers Pins (Requirement 35) */}
      {markers.map((marker) => {
        const left = marker.time * zoom;
        return (
          <div
            key={marker.id}
            style={{ left: `${left}px` }}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentTime(marker.time);
            }}
            className="group absolute top-0 z-30 cursor-pointer -translate-x-1/2 flex flex-col items-center"
            title={`${marker.name} (${secondsToTimecode(marker.time)})`}
          >
            <div
              style={{ backgroundColor: marker.color || '#38bdf8' }}
              className="w-3.5 h-3.5 rounded-b-sm flex items-center justify-center shadow-md transform hover:scale-125 transition-transform"
            >
              <Bookmark className="w-2.5 h-2.5 text-black fill-current" />
            </div>

            {/* Hover Tooltip */}
            <div className="hidden group-hover:block absolute top-4 bg-[#0a0c12] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow-lg border border-white/20 whitespace-nowrap pointer-events-none z-50">
              {marker.name}
            </div>
          </div>
        );
      })}
    </div>
  );
};
