/**
 * Nusantara Video Studio - Playhead
 * Draggable red scrubber needle indicator positioned across ruler and tracks
 */

import React, { useRef } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { secondsToTimecode } from '../../utils/timecode';

interface PlayheadProps {
  totalHeight: number;
}

export const Playhead: React.FC<PlayheadProps> = ({ totalHeight }) => {
  const currentTime = useTimelineStore((s) => s.currentTime);
  const zoom = useTimelineStore((s) => s.zoom);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying);
  const duration = useProjectStore((s) => s.currentProject.timeline.duration);
  const fps = useProjectStore((s) => s.currentProject.settings.fps);

  const isDraggingRef = useRef(false);

  const leftPosition = currentTime * zoom;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsPlaying(false);

    const startX = e.clientX;
    const initialTime = currentTime;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = moveEvent.clientX - startX;
      const newTime = Math.max(0, Math.min(duration, initialTime + deltaX / zoom));
      setCurrentTime(newTime);
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      style={{
        transform: `translateX(${leftPosition}px)`,
        height: `${totalHeight}px`,
      }}
      className="absolute top-0 left-0 pointer-events-none z-30 transition-transform duration-75 will-change-transform"
    >
      {/* Playhead Top Handle (scrubber head) */}
      <div
        onPointerDown={handlePointerDown}
        className="pointer-events-auto cursor-ew-resize -translate-x-1/2 flex flex-col items-center group -mt-0.5"
      >
        <div className="w-3.5 h-3.5 bg-rose-500 rounded-t-sm shadow-md flex items-center justify-center text-[8px] font-bold text-white">
          ▼
        </div>

        {/* Floating Timecode Pill on Hover */}
        <div className="hidden group-hover:block absolute -top-5 bg-black/90 text-rose-300 font-mono text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap border border-rose-500/30">
          {secondsToTimecode(currentTime, fps)}
        </div>
      </div>

      {/* Vertical Red Needle Line */}
      <div className="w-0.5 bg-rose-500/90 shadow-sm h-full -translate-x-1/2" />
    </div>
  );
};
