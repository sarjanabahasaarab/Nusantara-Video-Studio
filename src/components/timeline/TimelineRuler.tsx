/**
 * Nusantara Video Studio - Timeline Ruler
 * Interactive time ruler with tick marks and scrubber scrub-drag
 */

import React, { useRef } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { formatDuration } from '../../utils/timecode';

interface TimelineRulerProps {
  totalWidth: number;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ totalWidth }) => {
  const zoom = useTimelineStore((s) => s.zoom);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying);
  const duration = useProjectStore((s) => s.currentProject.timeline.duration);

  const rulerRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  // Determine tick interval in seconds based on zoom (px per second)
  let stepSeconds = 5;
  if (zoom > 100) stepSeconds = 1;
  else if (zoom > 50) stepSeconds = 2;
  else if (zoom > 25) stepSeconds = 5;
  else if (zoom > 10) stepSeconds = 10;
  else stepSeconds = 30;

  const totalTicks = Math.ceil(duration / stepSeconds);
  const ticks = Array.from({ length: totalTicks + 1 }, (_, i) => i * stepSeconds);

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

  const updateTimeFromPointer = (e: React.PointerEvent | PointerEvent) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const calculatedTime = Math.max(0, Math.min(duration, offsetX / zoom));
    setCurrentTime(calculatedTime);
  };

  return (
    <div
      ref={rulerRef}
      onPointerDown={handlePointerDown}
      style={{ width: `${Math.max(totalWidth, duration * zoom)}px` }}
      className="h-6 bg-[#10131a] border-b border-[#202534] relative cursor-pointer select-none shrink-0"
    >
      {ticks.map((sec) => {
        const left = sec * zoom;
        return (
          <div
            key={sec}
            style={{ left: `${left}px` }}
            className="absolute top-0 bottom-0 flex flex-col justify-between pointer-events-none"
          >
            {/* Major tick line */}
            <div className="w-px h-2 bg-[#333d52]" />
            {/* Time label */}
            <span className="text-[9px] font-mono text-slate-400 pl-1 -mt-1">
              {formatDuration(sec)}
            </span>
            <div className="w-px h-1.5 bg-[#252c3c]" />
          </div>
        );
      })}

      {/* Sub-second minor ticks when zoomed in */}
      {zoom > 60 &&
        Array.from({ length: Math.ceil(duration) }, (_, i) => i).map((sec) => (
          <div
            key={`sub-${sec}`}
            style={{ left: `${sec * zoom}px` }}
            className="absolute top-3 h-1.5 w-px bg-[#262e3f] pointer-events-none"
          />
        ))}
    </div>
  );
};
