/**
 * Nusantara Video Studio - Master Timeline Component
 * Composes TimelineToolbar, TrackHeaders, Ruler, Playhead, and TrackLanes
 */

import React, { useRef, useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { TimelineToolbar } from './TimelineToolbar';
import { TrackHeader } from './TrackHeader';
import { TimelineRuler } from './TimelineRuler';
import { TrackLane } from './TrackLane';
import { Playhead } from './Playhead';
import { Film } from 'lucide-react';

export const Timeline: React.FC = () => {
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const duration = useProjectStore((s) => s.currentProject.timeline.duration);
  const zoom = useTimelineStore((s) => s.zoom);

  const timelineHeight = useUIStore((s) => s.timelineHeight);
  const setTimelineHeight = useUIStore((s) => s.setTimelineHeight);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  // Resize observer for container width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Timeline vertical resize drag
  const handleResizeDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = timelineHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = startY - moveEvent.clientY; // dragging upwards increases height
      setTimelineHeight(startHeight + deltaY);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const laneAreaWidth = Math.max(containerWidth - 220, duration * zoom + 200);
  const trackCount = tracks.length;
  const tracksTotalHeight = 24 + trackCount * 64; // ruler (24px) + tracks (64px each)

  return (
    <div
      ref={containerRef}
      style={{ height: `${timelineHeight}px` }}
      className="bg-[#0f1117] border-t border-[#1f2432] flex flex-col shrink-0 select-none relative z-20"
    >
      {/* Top Drag Resize Handle */}
      <div
        onPointerDown={handleResizeDrag}
        className="h-1.5 w-full hover:bg-blue-500/50 cursor-ns-resize transition-colors absolute top-0 left-0 z-40 flex items-center justify-center group"
      >
        <div className="w-12 h-1 bg-[#2e3648] group-hover:bg-blue-400 rounded-full" />
      </div>

      {/* Timeline Controls Toolbar */}
      <TimelineToolbar containerWidth={containerWidth} />

      {/* Main Track Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {tracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Film className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-medium">Timeline tidak memiliki track.</p>
            <p className="text-[11px] text-slate-600 mt-1">Gunakan tombol + Video / + Audio Track untuk memulai.</p>
          </div>
        ) : (
          <>
            {/* Left Column: Fixed Track Headers */}
            <div className="w-52 flex flex-col shrink-0 border-r border-[#202534] bg-[#11131a] z-20 overflow-y-hidden">
              {/* Header Corner Spacer (aligns with Ruler) */}
              <div className="h-6 bg-[#0c0e14] border-b border-[#202534] px-2.5 flex items-center justify-between text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                <span>Tracks</span>
                <span className="font-mono text-slate-500">{tracks.length}</span>
              </div>

              {/* Vertical Stack of Track Headers */}
              <div className="flex-1 overflow-y-auto">
                {tracks.map((track) => (
                  <TrackHeader key={track.id} track={track} />
                ))}
              </div>
            </div>

            {/* Right Column: Scrollable Ruler + Track Lanes + Playhead */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0b0c10]"
            >
              <div style={{ width: `${laneAreaWidth}px` }} className="relative min-h-full">
                {/* Ruler */}
                <TimelineRuler totalWidth={laneAreaWidth} />

                {/* Track Lanes */}
                <div className="flex flex-col">
                  {tracks.map((track) => (
                    <TrackLane key={track.id} track={track} totalWidth={laneAreaWidth} />
                  ))}
                </div>

                {/* Vertical Playhead Scrubber */}
                <Playhead totalHeight={Math.max(tracksTotalHeight, 400)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
