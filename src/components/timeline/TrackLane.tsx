/**
 * Nusantara Video Studio - Track Lane & Clip Renderer
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Handles horizontal positioning, multi-select, trimming handles (L & R),
 * snapping movement, audio waveforms, volume keyframes, and media drag-and-drop ingestion.
 */

import React, { useRef, useState } from 'react';
import { Track, Clip, MediaItem } from '../../types';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { useMediaStore } from '../../stores/mediaStore';
import { useUIStore } from '../../stores/uiStore';
import { Film, Music, Type, Monitor, Camera, Mic, Image as ImageIcon } from 'lucide-react';

interface TrackLaneProps {
  track: Track;
  totalWidth: number;
  onClipContextMenu: (e: React.MouseEvent, clip: Clip) => void;
}

export const TrackLane: React.FC<TrackLaneProps> = ({ track, totalWidth, onClipContextMenu }) => {
  const zoom = useTimelineStore((s) => s.zoom);
  const moveClip = useTimelineStore((s) => s.moveClip);
  const trimClipLeft = useTimelineStore((s) => s.trimClipLeft);
  const trimClipRight = useTimelineStore((s) => s.trimClipRight);
  const getSnappedTime = useTimelineStore((s) => s.getSnappedTime);
  const splitClipAtCurrentTime = useTimelineStore((s) => s.splitClipAtCurrentTime);
  const addClipToTrack = useTimelineStore((s) => s.addClipToTrack);
  const getAudioWaveform = useTimelineStore((s) => s.getAudioWaveform);

  const selectedClipIds = useSelectionStore((s) => s.selectedClipIds);
  const selectClip = useSelectionStore((s) => s.selectClip);
  const toggleClipSelection = useSelectionStore((s) => s.toggleClipSelection);
  const activeTool = useSelectionStore((s) => s.activeTool);
  const notify = useUIStore((s) => s.notify);

  const laneRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Drag and Drop from Media Library into Track (Requirement 10)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!laneRef.current) return;
    const rect = laneRef.current.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const rawDropTime = Math.max(0, dropX / zoom);
    const dropTime = getSnappedTime(rawDropTime);

    // Read dropped media ID or data
    const mediaId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
    const mediaItems = useMediaStore.getState().items;
    let targetMedia: MediaItem | undefined;

    if (mediaId) {
      try {
        const parsed = JSON.parse(mediaId);
        targetMedia = mediaItems.find((m) => m.id === parsed.id || m.id === parsed);
      } catch {
        targetMedia = mediaItems.find((m) => m.id === mediaId);
      }
    }

    if (!targetMedia) {
      // Fallback: check selected media in mediaStore
      const selId = useMediaStore.getState().selectedMediaId;
      if (selId) targetMedia = mediaItems.find((m) => m.id === selId);
    }

    if (!targetMedia) {
      notify('Drop Media', 'Seret media dari panel Media Library ke track timeline.', 'info', 2000);
      return;
    }

    // Type validation for track (Video track vs Audio track)
    if (track.type === 'video' && targetMedia.type === 'audio') {
      notify('Tipe Tidak Sesuai', 'Audio harus diletakkan pada Audio Track (A1-A5).', 'warning');
      return;
    }
    if (track.type === 'audio' && (targetMedia.type === 'video' || targetMedia.type === 'image')) {
      notify('Tipe Tidak Sesuai', 'Video & Gambar harus diletakkan pada Video Track (V1-V5).', 'warning');
      return;
    }

    // Default duration: 5 seconds for images, otherwise media duration
    const duration = targetMedia.type === 'image' ? 5.0 : targetMedia.duration || 10.0;

    const newClip: Clip = {
      id: `clip-${targetMedia.type}-${Date.now()}`,
      trackId: track.id,
      mediaId: targetMedia.id,
      name: targetMedia.name,
      type: targetMedia.type,
      startTime: dropTime,
      duration,
      sourceStartTime: 0,
      sourceDuration: duration,
      color:
        targetMedia.type === 'video'
          ? '#2563eb'
          : targetMedia.type === 'audio'
          ? '#059669'
          : targetMedia.type === 'image'
          ? '#9333ea'
          : '#0284c7',
      transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      speed: { rate: 1, reverse: false },
      audio: { volume: 100, pan: 0, mute: false },
    };

    addClipToTrack(track.id, newClip);
    notify('Clip Ditambahkan', `"${targetMedia.name}" berhasil ditaruh pada track ${track.name}.`, 'success');
  };

  // Handle clicking on clip
  const handleClipClick = (e: React.MouseEvent, clip: Clip) => {
    e.stopPropagation();

    if (activeTool === 'cut' || activeTool === 'split') {
      splitClipAtCurrentTime(clip.id);
      return;
    }

    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      toggleClipSelection(clip.id);
    } else {
      selectClip(clip.id);
    }
  };

  // Move clip horizontally (with snapping)
  const handleMovePointerDown = (e: React.PointerEvent, clip: Clip) => {
    if (track.locked) return;
    if (activeTool === 'cut' || activeTool === 'split') return;

    e.stopPropagation();
    if (!selectedClipIds.includes(clip.id)) {
      selectClip(clip.id);
    }

    const startX = e.clientX;
    const initialStartTime = clip.startTime;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaTime = deltaX / zoom;
      const rawNewStart = Math.max(0, initialStartTime + deltaTime);
      const snappedNewStart = getSnappedTime(rawNewStart, clip.id);

      moveClip(clip.id, track.id, snappedNewStart);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Trim Left Handle Drag
  const handleTrimLeftDown = (e: React.PointerEvent, clip: Clip) => {
    if (track.locked) return;
    e.stopPropagation();
    const startX = e.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSeconds = deltaX / zoom;
      trimClipLeft(clip.id, deltaSeconds);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Trim Right Handle Drag
  const handleTrimRightDown = (e: React.PointerEvent, clip: Clip) => {
    if (track.locked) return;
    e.stopPropagation();
    const startX = e.clientX;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSeconds = deltaX / zoom;
      trimClipRight(clip.id, deltaSeconds);
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
      ref={laneRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ width: `${totalWidth}px` }}
      className={`h-16 border-b border-[#1b202c] relative select-none transition-colors ${
        track.locked
          ? 'bg-[#101217]/85 opacity-70'
          : isDragOver
          ? 'bg-blue-950/30 ring-1 ring-inset ring-blue-500'
          : track.type === 'video'
          ? 'bg-[#0f1219]/50 hover:bg-[#121622]/50'
          : 'bg-[#0e1418]/40 hover:bg-[#111920]/40'
      }`}
    >
      {/* Visual Drop Hint */}
      {isDragOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <span className="text-[10px] font-semibold text-blue-300 bg-blue-950/90 px-2 py-0.5 rounded border border-blue-400">
            Lepaskan untuk menempatkan pada {track.name}
          </span>
        </div>
      )}

      {/* Render clips inside track */}
      {track.clips.map((clip) => {
        const isSelected = selectedClipIds.includes(clip.id);
        const left = clip.startTime * zoom;
        const width = Math.max(16, clip.duration * zoom);
        const isAudioClip = clip.type === 'audio' || clip.type === 'voice-recording';

        const waveformBars = isAudioClip
          ? getAudioWaveform(clip.mediaId || clip.name, clip.duration)
          : null;

        return (
          <div
            key={clip.id}
            onClick={(e) => handleClipClick(e, clip)}
            onContextMenu={(e) => onClipContextMenu(e, clip)}
            style={{
              left: `${left}px`,
              width: `${width}px`,
              backgroundColor: clip.color || '#1e293b',
            }}
            className={`group absolute top-1 bottom-1 rounded-md border flex flex-col justify-between overflow-hidden cursor-pointer select-none transition-shadow ${
              isSelected
                ? 'border-white ring-2 ring-blue-400 shadow-xl z-20 brightness-110'
                : 'border-white/15 hover:border-white/35 z-10'
            }`}
          >
            {/* Top Bar: Icon, Name, and Duration */}
            <div
              onPointerDown={(e) => handleMovePointerDown(e, clip)}
              className="px-2 py-1 flex items-center justify-between text-white/95 text-[10px] font-semibold bg-black/25 shrink-0 truncate cursor-move"
            >
              <div className="flex items-center gap-1.5 truncate">
                {clip.type === 'video' && <Film className="w-3 h-3 text-blue-200 shrink-0" />}
                {clip.type === 'audio' && <Music className="w-3 h-3 text-emerald-200 shrink-0" />}
                {clip.type === 'image' && <ImageIcon className="w-3 h-3 text-purple-200 shrink-0" />}
                {clip.type === 'text' && <Type className="w-3 h-3 text-amber-200 shrink-0" />}
                {clip.type === 'screen-recording' && <Monitor className="w-3 h-3 text-cyan-200 shrink-0" />}
                {clip.type === 'camera-recording' && <Camera className="w-3 h-3 text-rose-200 shrink-0" />}
                {clip.type === 'voice-recording' && <Mic className="w-3 h-3 text-emerald-200 shrink-0" />}

                <span className="truncate">{clip.name}</span>
              </div>

              <span className="font-mono text-[9px] text-white/70 ml-2 shrink-0">
                {clip.duration.toFixed(1)}s
              </span>
            </div>

            {/* Middle: Cached Audio Waveform or Pattern */}
            {isAudioClip && waveformBars && (
              <div className="flex-1 flex items-center px-1.5 gap-0.5 overflow-hidden opacity-75 pointer-events-none">
                {waveformBars.map((val, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${Math.round(val * 100)}%` }}
                    className="flex-1 min-w-[2px] bg-white/80 rounded-xs"
                  />
                ))}
              </div>
            )}

            {/* Audio Keyframes Overlay Dots (Requirement 22) */}
            {isAudioClip && clip.audio?.keyframes && clip.audio.keyframes.length > 0 && (
              <div className="absolute inset-x-2 bottom-1.5 h-3 flex items-center pointer-events-none">
                {clip.audio.keyframes.map((kf) => {
                  const kfLeft = `${Math.min(100, Math.max(0, (kf.time / clip.duration) * 100))}%`;
                  return (
                    <div
                      key={kf.id}
                      style={{ left: kfLeft }}
                      className="absolute w-2 h-2 rounded-full bg-amber-400 border border-black shadow -translate-x-1"
                      title={`Keyframe: ${kf.time.toFixed(1)}s (${kf.volume}%)`}
                    />
                  );
                })}
              </div>
            )}

            {/* Trim Left Interactive Handle (Requirement 11) */}
            <div
              onPointerDown={(e) => handleTrimLeftDown(e, clip)}
              className="absolute left-0 top-0 bottom-0 w-2.5 bg-black/40 hover:bg-blue-400 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-30"
              title="Trim Left"
            >
              <div className="w-0.5 h-4 bg-white/70 rounded-full" />
            </div>

            {/* Trim Right Interactive Handle (Requirement 11) */}
            <div
              onPointerDown={(e) => handleTrimRightDown(e, clip)}
              className="absolute right-0 top-0 bottom-0 w-2.5 bg-black/40 hover:bg-blue-400 cursor-ew-resize opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-30"
              title="Trim Right"
            >
              <div className="w-0.5 h-4 bg-white/70 rounded-full" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
