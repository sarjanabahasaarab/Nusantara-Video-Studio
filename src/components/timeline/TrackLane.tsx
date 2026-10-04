/**
 * Nusantara Video Studio - Track Lane & Clip Renderer
 * Displays clips horizontally positioned based on startTime and duration
 */

import React, { useRef } from 'react';
import { Track, Clip } from '../../types';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { Film, Music, Type, GripVertical } from 'lucide-react';

interface TrackLaneProps {
  track: Track;
  totalWidth: number;
}

export const TrackLane: React.FC<TrackLaneProps> = ({ track, totalWidth }) => {
  const zoom = useTimelineStore((s) => s.zoom);
  const updateClip = useTimelineStore((s) => s.updateClip);
  const duration = useProjectStore((s) => s.currentProject.timeline.duration);

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const selectClip = useSelectionStore((s) => s.selectClip);
  const activeTool = useSelectionStore((s) => s.activeTool);

  const splitClipAtCurrentTime = useTimelineStore((s) => s.splitClipAtCurrentTime);

  const handleClipClick = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();

    if (activeTool === 'cut' || activeTool === 'split') {
      splitClipAtCurrentTime(clip.id);
      return;
    }

    selectClip(clip.id, track.id);
  };

  const handleClipDragStart = (e: React.PointerEvent, clip: Clip) => {
    if (track.locked) return;
    if (activeTool === 'cut' || activeTool === 'split') return;

    e.stopPropagation();
    selectClip(clip.id, track.id);

    const startX = e.clientX;
    const initialStartTime = clip.startTime;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / zoom;
      const maxStart = duration - clip.duration;
      const newStartTime = Math.max(0, Math.min(maxStart, initialStartTime + deltaTime));

      updateClip(clip.id, { startTime: newStartTime });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      style={{ width: `${totalWidth}px` }}
      className={`h-16 border-b border-[#1b202c] relative select-none transition-colors ${
        track.locked
          ? 'bg-[#101217]/80 opacity-70'
          : track.type === 'video'
          ? 'bg-[#0f1219]/40 hover:bg-[#121622]/40'
          : 'bg-[#0e1418]/30 hover:bg-[#111920]/30'
      }`}
    >
      {/* Background timeline grid marks */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px)',
          backgroundSize: `${zoom * 5}px 100%`,
        }}
      />

      {/* Empty track lane watermark if no clips */}
      {track.clips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-slate-700 font-mono tracking-widest uppercase">
          Track Kosong • Drop Media di sini
        </div>
      )}

      {/* Render clips inside track */}
      {track.clips.map((clip) => {
        const left = clip.startTime * zoom;
        const width = Math.max(20, clip.duration * zoom);
        const isSelected = selectedClipId === clip.id;

        return (
          <div
            key={clip.id}
            onClick={(e) => handleClipClick(e, clip)}
            onPointerDown={(e) => handleClipDragStart(e, clip)}
            style={{
              left: `${left}px`,
              width: `${width}px`,
              backgroundColor: clip.color || (clip.type === 'audio' ? '#065f46' : '#1e40af'),
            }}
            className={`absolute top-1 bottom-1 rounded-md border shadow-md flex flex-col justify-between p-1.5 cursor-grab active:cursor-grabbing overflow-hidden transition-shadow ${
              isSelected
                ? 'border-white ring-2 ring-blue-500 z-20 shadow-lg brightness-110'
                : 'border-white/20 hover:border-white/50 z-10'
            }`}
          >
            {/* Header of Clip */}
            <div className="flex items-center justify-between gap-1 text-[10px] text-white font-medium drop-shadow-sm">
              <div className="flex items-center gap-1 truncate">
                {clip.type === 'video' ? (
                  <Film className="w-3 h-3 text-blue-200 shrink-0" />
                ) : clip.type === 'audio' ? (
                  <Music className="w-3 h-3 text-emerald-200 shrink-0" />
                ) : (
                  <Type className="w-3 h-3 text-amber-200 shrink-0" />
                )}
                <span className="truncate">{clip.name}</span>
              </div>
              <GripVertical className="w-2.5 h-2.5 opacity-40 shrink-0" />
            </div>

            {/* Middle simulated content preview */}
            {clip.type === 'audio' ? (
              <div className="flex items-center gap-0.5 h-3 opacity-60">
                {Array.from({ length: Math.min(30, Math.floor(width / 6)) }).map((_, i) => (
                  <div
                    key={i}
                    style={{ height: `${20 + ((i * 19) % 80)}%` }}
                    className="w-1 bg-white/70 rounded-full"
                  />
                ))}
              </div>
            ) : (
              <div className="text-[9px] text-white/70 font-mono">
                {clip.duration.toFixed(1)}s
              </div>
            )}

            {/* Left and Right trim indicator notches */}
            <div className="flex items-center justify-between text-[8px] text-white/50 font-mono pt-0.5">
              <span>{clip.startTime.toFixed(1)}s</span>
              <span>{(clip.startTime + clip.duration).toFixed(1)}s</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
