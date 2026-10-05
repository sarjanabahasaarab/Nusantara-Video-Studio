/**
 * Nusantara Video Studio - Dedicated Subtitle Track Lane & Header
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Implements interactive Subtitle Track (Requirement 12):
 * - Subtitle blocks displayed at exact timeline timecode
 * - Select, Drag/Move, Trim Left handle, Trim Right handle, Delete
 * - Overlap indicator badge
 * - Click opens Subtitle Editor Modal
 */

import React, { useRef } from 'react';
import { MessageSquare, AlertTriangle, Plus, Trash2, Edit3, Eye, EyeOff } from 'lucide-react';
import { useSubtitleStore } from '../../stores/subtitleStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { SubtitleItem } from '../../types';

interface SubtitleTrackLaneProps {
  totalWidth: number;
}

export const SubtitleTrackLane: React.FC<SubtitleTrackLaneProps> = ({ totalWidth }) => {
  const zoom = useTimelineStore((s) => s.zoom);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);

  const activeTrack = useSubtitleStore((s) => s.getActiveTrack());
  const selectedSubtitleId = useSubtitleStore((s) => s.selectedSubtitleId);
  const selectSubtitle = useSubtitleStore((s) => s.selectSubtitle);
  const updateSubtitle = useSubtitleStore((s) => s.updateSubtitle);
  const deleteSubtitle = useSubtitleStore((s) => s.deleteSubtitle);
  const validation = useSubtitleStore((s) => s.validation);

  const notify = useUIStore((s) => s.notify);
  const openDialog = useUIStore((s) => s.openDialog);

  const trackLaneRef = useRef<HTMLDivElement>(null);

  if (!activeTrack) return null;

  // Trim & Drag Handlers for Subtitle Block
  const handleStartMove = (e: React.PointerEvent, item: SubtitleItem) => {
    e.stopPropagation();
    selectSubtitle(item.id);

    const startX = e.clientX;
    const origStart = item.startTime;
    const dur = item.endTime - item.startTime;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (me.clientX - startX) / zoom;
      const newStart = Math.max(0, origStart + deltaSec);
      const newEnd = newStart + dur;
      updateSubtitle(item.id, {
        startTime: parseFloat(newStart.toFixed(2)),
        endTime: parseFloat(newEnd.toFixed(2)),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleTrimLeft = (e: React.PointerEvent, item: SubtitleItem) => {
    e.stopPropagation();
    const startX = e.clientX;
    const origStart = item.startTime;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (me.clientX - startX) / zoom;
      const newStart = Math.max(0, Math.min(item.endTime - 0.2, origStart + deltaSec));
      updateSubtitle(item.id, { startTime: parseFloat(newStart.toFixed(2)) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleTrimRight = (e: React.PointerEvent, item: SubtitleItem) => {
    e.stopPropagation();
    const startX = e.clientX;
    const origEnd = item.endTime;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (me.clientX - startX) / zoom;
      const newEnd = Math.max(item.startTime + 0.2, origEnd + deltaSec);
      updateSubtitle(item.id, { endTime: parseFloat(newEnd.toFixed(2)) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      ref={trackLaneRef}
      style={{ width: `${totalWidth}px` }}
      className="h-10 bg-[#0c0e15] border-b border-[#212838] relative flex items-center select-none overflow-hidden"
    >
      {/* Background timeline time ticks grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#2a3348_1px,transparent_1px)] bg-[size:45px_100%]" />

      {/* Subtitle Items */}
      {activeTrack.items.map((item, idx) => {
        const leftPx = item.startTime * zoom;
        const durSec = Math.max(0.1, item.endTime - item.startTime);
        const widthPx = Math.max(24, durSec * zoom);
        const isSelected = item.id === selectedSubtitleId;
        const isOverlapping = validation.overlaps.some(
          (ov) => ov.indexA === item.index || ov.indexB === item.index
        );

        return (
          <div
            key={item.id}
            onPointerDown={(e) => handleStartMove(e, item)}
            onClick={(e) => {
              e.stopPropagation();
              selectSubtitle(item.id);
              setCurrentTime(item.startTime);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              openDialog('subtitleEditor');
            }}
            style={{
              left: `${leftPx}px`,
              width: `${widthPx}px`,
            }}
            className={`absolute h-7.5 top-1 rounded-md px-1.5 flex items-center justify-between text-[10px] font-medium cursor-move transition-shadow z-20 group ${
              isSelected
                ? 'bg-amber-600/90 text-white ring-2 ring-amber-400 shadow-lg'
                : isOverlapping
                ? 'bg-amber-900/80 border border-amber-500/70 text-amber-200'
                : 'bg-[#1b2234] hover:bg-[#232b40] border border-[#2e3954] text-slate-200'
            }`}
            title={`Subtitle #${item.index || idx + 1}: ${item.text} (Klik 2x untuk buka editor)`}
          >
            {/* Left Trim Handle */}
            <div
              onPointerDown={(e) => handleTrimLeft(e, item)}
              className="absolute left-0 top-0 bottom-0 w-2 hover:bg-amber-400/80 cursor-ew-resize rounded-l-md transition-colors"
              title="Tarik untuk ubah waktu mulai"
            />

            {/* Content & Badge */}
            <div className="flex items-center gap-1 truncate pointer-events-none px-1">
              <span className="font-mono text-[8px] opacity-75 shrink-0">
                #{item.index || idx + 1}
              </span>
              <span className="truncate font-sans">{item.text}</span>
            </div>

            {/* Overlap Indicator */}
            {isOverlapping && (
              <AlertTriangle className="w-3 h-3 text-amber-300 shrink-0 animate-pulse ml-1" />
            )}

            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => handleTrimRight(e, item)}
              className="absolute right-0 top-0 bottom-0 w-2 hover:bg-amber-400/80 cursor-ew-resize rounded-r-md transition-colors"
              title="Tarik untuk ubah waktu selesai"
            />
          </div>
        );
      })}
    </div>
  );
};

export const SubtitleTrackHeader: React.FC = () => {
  const activeTrack = useSubtitleStore((s) => s.getActiveTrack());
  const addSubtitle = useSubtitleStore((s) => s.addSubtitle);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const openDialog = useUIStore((s) => s.openDialog);
  const notify = useUIStore((s) => s.notify);

  if (!activeTrack) return null;

  return (
    <div className="h-10 px-3 bg-[#11141c] border-b border-[#212838] flex items-center justify-between text-xs select-none">
      <div className="flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-slate-200 text-[11px] truncate max-w-[100px]">
          Subtitle (S1)
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => {
            addSubtitle(currentTime, 3, 'Teks Subtitle');
            notify('Subtitle Ditambahkan', 'Subtitle baru ditambahkan pada playhead.', 'success');
          }}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1c2232] transition-colors"
          title="Tambah Subtitle di Playhead"
        >
          <Plus className="w-3 h-3 text-amber-400" />
        </button>

        <button
          onClick={() => openDialog('subtitleEditor')}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1c2232] transition-colors"
          title="Buka Subtitle Editor List"
        >
          <Edit3 className="w-3 h-3 text-blue-400" />
        </button>
      </div>
    </div>
  );
};
