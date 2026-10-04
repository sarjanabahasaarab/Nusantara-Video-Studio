/**
 * Nusantara Video Studio - Master Timeline Component
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Composes TimelineToolbar, TrackHeaders, Ruler, Playhead, TrackLanes,
 * and Timeline Clip Context Menu (Cut, Copy, Duplicate, Split, Delete, Reset).
 */

import React, { useRef, useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
import { TimelineToolbar } from './TimelineToolbar';
import { TrackHeader } from './TrackHeader';
import { TimelineRuler } from './TimelineRuler';
import { TrackLane } from './TrackLane';
import { Playhead } from './Playhead';
import {
  Film,
  Scissors,
  Copy,
  Trash2,
  CopyPlus,
  RotateCcw,
  Sliders,
  FolderOpen,
} from 'lucide-react';
import { Clip } from '../../types';

export const Timeline: React.FC = () => {
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const duration = useProjectStore((s) => s.currentProject.timeline.duration);
  const zoom = useTimelineStore((s) => s.zoom);

  const splitClipAtCurrentTime = useTimelineStore((s) => s.splitClipAtCurrentTime);
  const duplicateClip = useTimelineStore((s) => s.duplicateClip);
  const removeClip = useTimelineStore((s) => s.removeClip);
  const resetClipProperties = useTimelineStore((s) => s.resetClipProperties);

  const selectClip = useSelectionStore((s) => s.selectClip);
  const copyClip = useSelectionStore((s) => s.copyClip);
  const notify = useUIStore((s) => s.notify);

  const timelineHeight = useUIStore((s) => s.timelineHeight);
  const setTimelineHeight = useUIStore((s) => s.setTimelineHeight);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  // Context Menu State for Timeline Clip (Requirement 33)
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    clip: Clip | null;
  }>({ visible: false, x: 0, y: 0, clip: null });

  // Close context menu on outside click
  useEffect(() => {
    const handleClose = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, clip: null });
      }
    };
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, [contextMenu.visible]);

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
      const deltaY = startY - moveEvent.clientY;
      setTimelineHeight(startHeight + deltaY);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleClipContextMenu = (e: React.MouseEvent, clip: Clip) => {
    e.preventDefault();
    e.stopPropagation();
    selectClip(clip.id);
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 240),
      clip,
    });
  };

  const laneAreaWidth = Math.max(containerWidth - 220, duration * zoom + 300);
  const trackCount = tracks.length;
  const tracksTotalHeight = 28 + trackCount * 64; // ruler (28px) + tracks (64px each)

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
            {/* Left Column: Fixed Track Headers with header spacer */}
            <div className="w-52 border-r border-[#212634] flex flex-col shrink-0 z-20 bg-[#12141c] overflow-y-auto no-scrollbar">
              {/* Ruler header spacer */}
              <div className="h-7 border-b border-[#212634] bg-[#0d0f15] px-3 flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                Tracks
              </div>

              {/* Track headers */}
              <div className="flex flex-col">
                {tracks.map((track) => (
                  <TrackHeader key={track.id} track={track} />
                ))}
              </div>
            </div>

            {/* Right Column: Horizontally and vertically scrollable lanes + ruler + playhead */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#0b0d13]"
            >
              {/* Ruler Bar */}
              <TimelineRuler totalWidth={laneAreaWidth} />

              {/* Lanes Area */}
              <div style={{ width: `${laneAreaWidth}px` }} className="flex flex-col relative">
                {tracks.map((track) => (
                  <TrackLane
                    key={track.id}
                    track={track}
                    totalWidth={laneAreaWidth}
                    onClipContextMenu={handleClipContextMenu}
                  />
                ))}

                {/* Vertical Scrubber Playhead spanning entire tracks */}
                <Playhead totalHeight={tracksTotalHeight} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Timeline Clip Context Menu (Requirement 33) */}
      {contextMenu.visible && contextMenu.clip && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed bg-[#161a24] border border-[#273042] rounded-xl shadow-2xl py-1 z-50 min-w-[190px] text-xs animate-in fade-in zoom-in-95 duration-75 select-none"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 border-b border-[#222938] truncate max-w-[180px]">
            {contextMenu.clip.name}
          </div>

          <button
            onClick={() => {
              splitClipAtCurrentTime(contextMenu.clip!.id);
              setContextMenu({ visible: false, x: 0, y: 0, clip: null });
              notify('Split Clip', 'Clip berhasil dipotong pada playhead.', 'success');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <Scissors className="w-3.5 h-3.5 text-blue-400" />
            <span>Split at Playhead (Ctrl+K)</span>
          </button>

          <button
            onClick={() => {
              duplicateClip(contextMenu.clip!.id);
              setContextMenu({ visible: false, x: 0, y: 0, clip: null });
              notify('Duplicate', 'Clip berhasil diduplikasi.', 'success');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <CopyPlus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Duplicate Clip (Ctrl+D)</span>
          </button>

          <button
            onClick={() => {
              copyClip(contextMenu.clip!);
              setContextMenu({ visible: false, x: 0, y: 0, clip: null });
              notify('Copy', 'Clip disalin ke clipboard (Ctrl+C).', 'info');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Clip (Ctrl+C)</span>
          </button>

          <button
            onClick={() => {
              resetClipProperties(contextMenu.clip!.id);
              setContextMenu({ visible: false, x: 0, y: 0, clip: null });
              notify('Reset', 'Transform dan efek clip direset ke default.', 'info');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Properties</span>
          </button>

          <div className="my-1 border-t border-[#222938]" />

          <button
            onClick={() => {
              removeClip(contextMenu.clip!.id);
              setContextMenu({ visible: false, x: 0, y: 0, clip: null });
              notify('Hapus', 'Clip dihapus dari timeline.', 'info');
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete (Del)</span>
          </button>
        </div>
      )}
    </div>
  );
};
