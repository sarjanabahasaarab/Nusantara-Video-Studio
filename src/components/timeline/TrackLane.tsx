/**
 * Nusantara Video Studio - Track Lane & Clip Renderer
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Handles horizontal positioning, multi-select, trimming handles (L & R),
 * snapping movement, audio waveforms, volume keyframes, and media drag-and-drop ingestion.
 */

import React, { useRef, useState } from 'react';
import { Track, Clip, MediaItem, TimelineTransition } from '../../types';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { useMediaStore } from '../../stores/mediaStore';
import { useUIStore } from '../../stores/uiStore';
import { Film, Music, Type, Monitor, Camera, Mic, Image as ImageIcon, Diamond, Layers, Plus, X } from 'lucide-react';
import { TransitionEngine } from '../../engine/transitions/TransitionEngine';
import { KeyframeEngine } from '../../engine/keyframes/KeyframeEngine';

interface TrackLaneProps {
  track: Track;
  totalWidth: number;
  onClipContextMenu: (e: React.MouseEvent, clip: Clip) => void;
}

export const TrackLane: React.FC<TrackLaneProps> = ({ track, totalWidth, onClipContextMenu }) => {
  const zoom = useTimelineStore((s) => s.zoom);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const moveClip = useTimelineStore((s) => s.moveClip);
  const trimClipLeft = useTimelineStore((s) => s.trimClipLeft);
  const trimClipRight = useTimelineStore((s) => s.trimClipRight);
  const getSnappedTime = useTimelineStore((s) => s.getSnappedTime);
  const splitClipAtCurrentTime = useTimelineStore((s) => s.splitClipAtCurrentTime);
  const addClipToTrack = useTimelineStore((s) => s.addClipToTrack);
  const getAudioWaveform = useTimelineStore((s) => s.getAudioWaveform);
  const updateClipAudio = useTimelineStore((s) => s.updateClipAudio);

  const selectedClipIds = useSelectionStore((s) => s.selectedClipIds);
  const selectClip = useSelectionStore((s) => s.selectClip);
  const toggleClipSelection = useSelectionStore((s) => s.toggleClipSelection);
  const activeTool = useSelectionStore((s) => s.activeTool);
  const notify = useUIStore((s) => s.notify);

  const rawTransitions = useProjectStore((s) => s.currentProject.timeline.transitions);
  const transitions = rawTransitions || [];
  const addTransition = useProjectStore((s) => s.addTransition);
  const removeTransition = useProjectStore((s) => s.removeTransition);
  const updateTransition = useProjectStore((s) => s.updateTransition);
  const updateClipKeyframes = useProjectStore((s) => s.updateClipKeyframes);

  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null);

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

    // Check if dropping a Transition preset
    const rawData = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        if (parsed?.type === 'transition' && parsed?.transitionType) {
          const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime);
          for (let i = 0; i < sortedClips.length - 1; i++) {
            const c1 = sortedClips[i];
            const c2 = sortedClips[i + 1];
            const cutPoint = c1.startTime + c1.duration;
            if (Math.abs(dropTime - cutPoint) < 4.0) {
              const tr = TransitionEngine.createTransition(parsed.transitionType, c1, c2);
              if (tr) {
                addTransition(tr);
                notify('Transition Dipasang', `Transisi "${tr.name}" berhasil dipasang di antara dua clip.`, 'success');
              } else {
                notify('Gagal Memasang', 'Durasi clip tidak mencukupi untuk handle transisi.', 'warning');
              }
              return;
            }
          }
          notify('Transition', 'Jatuhkan transisi pada batas sambungan antara dua clip berturutan.', 'info');
          return;
        }
      } catch {
        // Not a transition JSON, continue media ingestion
      }
    }

    // Read dropped media ID or data
    const mediaId = rawData;
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

  // Drag a Keyframe Diamond Horizontally on the Clip (Requirement 6)
  const handleKeyframePointerDown = (
    e: React.PointerEvent,
    clip: Clip,
    propName: string,
    kfId: string,
    initialTime: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const clipDuration = clip.duration;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (me.clientX - startX) / zoom;
      const newTime = Math.max(0, Math.min(clipDuration, initialTime + deltaSec));

      const existingProps = clip.animatedProperties || [];
      const updated = existingProps.map((p) => {
        if (p.property !== propName) return p;
        return {
          ...p,
          keyframes: p.keyframes
            .map((k) => (k.id === kfId ? { ...k, time: parseFloat(newTime.toFixed(2)) } : k))
            .sort((a, b) => a.time - b.time),
        };
      });
      updateClipKeyframes(clip.id, updated);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleAddKeyframeAtPlayhead = (clip: Clip) => {
    const relTime = Math.max(0, Math.min(clip.duration, currentTime - clip.startTime));
    const existing = clip.animatedProperties || [];
    const opacityProp = existing.find((p) => p.property === 'opacity') || {
      property: 'opacity',
      keyframes: [],
    };
    const updatedProp = KeyframeEngine.addKeyframe(
      opacityProp,
      relTime,
      clip.transform.opacity ?? 1,
      'linear'
    );
    const otherProps = existing.filter((p) => p.property !== 'opacity');
    updateClipKeyframes(clip.id, [...otherProps, updatedProp]);
    notify('Keyframe Ditambahkan', `Keyframe ditambahkan pada playhead (${relTime.toFixed(2)}s).`, 'success', 2000);
  };

  const handleDeleteKeyframe = (clip: Clip, propName: string, kfId: string) => {
    const existing = clip.animatedProperties || [];
    const updated = existing.map((p) => {
      if (p.property !== propName) return p;
      return { ...p, keyframes: p.keyframes.filter((k) => k.id !== kfId) };
    });
    updateClipKeyframes(clip.id, updated);
    notify('Keyframe Dihapus', `Keyframe ${propName} dihapus.`, 'info', 1500);
  };

  // Transition Resize Handlers (Requirement 14)
  const handleTransitionTrimRight = (e: React.PointerEvent, tr: TimelineTransition) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialDuration = tr.duration;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (me.clientX - startX) / zoom;
      const newDuration = Math.max(0.2, Math.min(6.0, initialDuration + deltaSec));
      updateTransition(tr.id, { duration: parseFloat(newDuration.toFixed(2)) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleTransitionTrimLeft = (e: React.PointerEvent, tr: TimelineTransition) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialStart = tr.start;
    const initialDuration = tr.duration;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (me.clientX - startX) / zoom;
      const newStart = initialStart + deltaSec;
      const newDuration = Math.max(0.2, initialDuration - deltaSec);
      updateTransition(tr.id, {
        start: parseFloat(newStart.toFixed(2)),
        duration: parseFloat(newDuration.toFixed(2)),
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleFadeInPointerDown = (e: React.PointerEvent, clip: Clip) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialFadeIn = clip.audio?.fadeIn || 0;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (me.clientX - startX) / zoom;
      const newFade = Math.max(0, Math.min(clip.duration / 2, initialFadeIn + deltaSec));
      updateClipAudio(clip.id, { fadeIn: parseFloat(newFade.toFixed(2)) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleFadeOutPointerDown = (e: React.PointerEvent, clip: Clip) => {
    e.stopPropagation();
    const startX = e.clientX;
    const initialFadeOut = clip.audio?.fadeOut || 0;

    const onPointerMove = (me: PointerEvent) => {
      const deltaSec = (startX - me.clientX) / zoom;
      const newFade = Math.max(0, Math.min(clip.duration / 2, initialFadeOut + deltaSec));
      updateClipAudio(clip.id, { fadeOut: parseFloat(newFade.toFixed(2)) });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const trackTransitions = transitions.filter((tr) => tr.trackId === track.id);

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

            {/* Keyframe Mini-Lane on selected clip (Requirement 6) */}
            {isSelected && (
              <div
                className="h-4 bg-black/70 border-t border-amber-500/40 px-1.5 flex items-center justify-between relative cursor-default shrink-0 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1 shrink-0">
                  <Diamond className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                  <span className="text-[8px] font-mono text-amber-300 font-medium hidden sm:inline">
                    KF ({clip.animatedProperties?.reduce((acc, p) => acc + p.keyframes.length, 0) || 0})
                  </span>
                </div>

                <div className="flex-1 mx-2 h-full relative">
                  {clip.animatedProperties?.flatMap((prop) =>
                    prop.keyframes.map((kf) => {
                      const leftPercent = Math.min(100, Math.max(0, (kf.time / clip.duration) * 100));
                      return (
                        <div
                          key={`${prop.property}-${kf.id}`}
                          onPointerDown={(e) => handleKeyframePointerDown(e, clip, prop.property, kf.id, kf.time)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteKeyframe(clip, prop.property, kf.id);
                          }}
                          style={{ left: `${leftPercent}%` }}
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-amber-400 border border-slate-900 shadow hover:scale-150 cursor-pointer z-30 transition-transform"
                          title={`${prop.property}: ${kf.time.toFixed(2)}s = ${kf.value} (Klik kanan untuk hapus)`}
                        />
                      );
                    })
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddKeyframeAtPlayhead(clip);
                  }}
                  className="p-0.5 rounded bg-amber-950/80 hover:bg-amber-700 text-amber-300 hover:text-white border border-amber-600/40 text-[8px] flex items-center gap-0.5"
                  title="Tambah Keyframe pada Playhead"
                >
                  <Plus className="w-2 h-2" />
                  <span>+KF</span>
                </button>
              </div>
            )}

            {/* Visual Fade In Triangle Ramp (Requirement 23) */}
            {isAudioClip && clip.audio?.fadeIn && clip.audio.fadeIn > 0 && (
              <div
                style={{ width: `${Math.min(width, clip.audio.fadeIn * zoom)}px` }}
                className="absolute left-0 top-0 bottom-0 pointer-events-none z-15 overflow-hidden"
              >
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polygon points="0,0 100,0 0,100" fill="rgba(0,0,0,0.45)" />
                  <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(52,211,153,0.85)" strokeWidth="2.5" />
                </svg>
              </div>
            )}

            {/* Visual Fade Out Triangle Ramp (Requirement 23) */}
            {isAudioClip && clip.audio?.fadeOut && clip.audio.fadeOut > 0 && (
              <div
                style={{ width: `${Math.min(width, clip.audio.fadeOut * zoom)}px` }}
                className="absolute right-0 top-0 bottom-0 pointer-events-none z-15 overflow-hidden"
              >
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polygon points="0,0 100,0 100,100" fill="rgba(0,0,0,0.45)" />
                  <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(52,211,153,0.85)" strokeWidth="2.5" />
                </svg>
              </div>
            )}

            {/* Draggable Fade In Handle at Top Left */}
            {isAudioClip && (
              <div
                onPointerDown={(e) => handleFadeInPointerDown(e, clip)}
                style={{ left: `${Math.min(width - 8, (clip.audio?.fadeIn || 0) * zoom)}px` }}
                className="absolute top-0 w-3.5 h-3.5 bg-emerald-400 hover:bg-emerald-300 border border-slate-900 rounded-bl-full cursor-ew-resize opacity-0 group-hover:opacity-100 z-35 transition-opacity shadow-xs"
                title={`Fade In: ${(clip.audio?.fadeIn || 0).toFixed(1)}s (Drag untuk atur)`}
              />
            )}

            {/* Draggable Fade Out Handle at Top Right */}
            {isAudioClip && (
              <div
                onPointerDown={(e) => handleFadeOutPointerDown(e, clip)}
                style={{ right: `${Math.min(width - 8, (clip.audio?.fadeOut || 0) * zoom)}px` }}
                className="absolute top-0 w-3.5 h-3.5 bg-emerald-400 hover:bg-emerald-300 border border-slate-900 rounded-br-full cursor-ew-resize opacity-0 group-hover:opacity-100 z-35 transition-opacity shadow-xs"
                title={`Fade Out: ${(clip.audio?.fadeOut || 0).toFixed(1)}s (Drag untuk atur)`}
              />
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

      {/* Transitions on this track (Requirement 14 & 15) */}
      {trackTransitions.map((tr) => {
        const trLeft = tr.start * zoom;
        const trWidth = Math.max(24, tr.duration * zoom);
        const isEditingThisTr = selectedTransitionId === tr.id;

        return (
          <div
            key={tr.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedTransitionId(isEditingThisTr ? null : tr.id);
            }}
            style={{
              left: `${trLeft}px`,
              width: `${trWidth}px`,
            }}
            className="absolute top-1 bottom-1 bg-gradient-to-r from-purple-800/90 via-indigo-700/90 to-purple-800/90 border border-purple-400/90 rounded-md shadow-xl flex items-center justify-between px-1.5 cursor-pointer z-25 text-white select-none hover:brightness-110"
            title={`Transition: ${tr.name} (${tr.duration.toFixed(1)}s)`}
          >
            <div
              onPointerDown={(e) => handleTransitionTrimLeft(e, tr)}
              className="w-1.5 h-full bg-white/20 hover:bg-white cursor-ew-resize rounded-xs"
              title="Drag untuk mengubah durasi transisi"
            />

            <div className="flex items-center gap-1 mx-1 truncate pointer-events-none">
              <Layers className="w-3 h-3 text-purple-200 shrink-0" />
              <span className="text-[9px] font-semibold truncate">{tr.name}</span>
              <span className="text-[8px] font-mono text-purple-200 opacity-80">
                {tr.duration.toFixed(1)}s
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeTransition(tr.id);
                notify('Transition Dihapus', `Transisi "${tr.name}" dihapus.`, 'info');
              }}
              className="p-0.5 rounded text-white/60 hover:text-white hover:bg-black/40"
              title="Hapus Transition"
            >
              <X className="w-2.5 h-2.5" />
            </button>

            <div
              onPointerDown={(e) => handleTransitionTrimRight(e, tr)}
              className="w-1.5 h-full bg-white/20 hover:bg-white cursor-ew-resize rounded-xs"
              title="Drag untuk mengubah durasi transisi"
            />
          </div>
        );
      })}
    </div>
  );
};
