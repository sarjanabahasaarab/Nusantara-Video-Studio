/**
 * Nusantara Video Studio - Video Preview Monitor
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Multi-layer compositor reading all timeline tracks at currentTime,
 * with direct preview editing (interactive bounding box, drag repositioning,
 * scale handles, rotation knob), transport controls, and SMPTE timecode.
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCw,
  Tv,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useMediaStore } from '../../stores/mediaStore';
import { secondsToTimecode } from '../../utils/timecode';
import { Clip } from '../../types';

export const VideoPreview: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const { fps, aspectRatio, width, height, duration } = currentProject.settings;
  const tracks = currentProject.timeline.tracks;

  const currentTime = useTimelineStore((s) => s.currentTime);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const previewVolume = useTimelineStore((s) => s.previewVolume);
  const setPreviewVolume = useTimelineStore((s) => s.setPreviewVolume);
  const previewMuted = useTimelineStore((s) => s.previewMuted);
  const setPreviewMuted = useTimelineStore((s) => s.setPreviewMuted);
  const updateClipTransform = useTimelineStore((s) => s.updateClipTransform);

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const mediaItems = useMediaStore((s) => s.items);

  const monitorContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Direct Preview Manipulation Interaction States
  const [isInteracting, setIsInteracting] = useState(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    origPosX: number;
    origPosY: number;
    origScaleX: number;
    origScaleY: number;
    origRotation: number;
    action: 'move' | 'scale-br' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'rotate';
  } | null>(null);

  // Playback Loop Engine
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSeconds = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const newTime = useTimelineStore.getState().currentTime + deltaSeconds;
      const projDuration = useProjectStore.getState().currentProject.timeline.duration;

      if (newTime >= projDuration) {
        if (useTimelineStore.getState().loop) {
          setCurrentTime(0);
          animFrameRef.current = requestAnimationFrame(loop);
        } else {
          setCurrentTime(projDuration);
          setIsPlaying(false);
        }
      } else {
        setCurrentTime(newTime);
        animFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, setCurrentTime, setIsPlaying]);

  // Find all active video tracks in composite order (V1 bottom to V5 top)
  const activeClipsAtTime = useMemo(() => {
    const videoTracks = tracks
      .filter((t) => t.type === 'video' && !t.hidden)
      .slice()
      .reverse(); // Lower track indices rendered first

    const activeList: { clip: Clip; mediaUrl?: string }[] = [];

    videoTracks.forEach((track) => {
      const clip = track.clips.find(
        (c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration
      );
      if (clip) {
        const media = mediaItems.find((m) => m.id === clip.mediaId);
        activeList.push({ clip, mediaUrl: media?.blobUrl || media?.thumbnail });
      }
    });

    return activeList;
  }, [tracks, currentTime, mediaItems]);

  const selectedActiveItem = useMemo(() => {
    return activeClipsAtTime.find((item) => item.clip.id === selectedClipId);
  }, [activeClipsAtTime, selectedClipId]);

  // Direct Preview Manipulation Handlers
  const handleStartInteraction = (
    e: React.MouseEvent,
    action: 'move' | 'scale-br' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'rotate'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedActiveItem) return;

    const clip = selectedActiveItem.clip;
    const transform = clip.transform || { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0 };

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origPosX: transform.positionX || 0,
      origPosY: transform.positionY || 0,
      origScaleX: transform.scaleX ?? transform.scale ?? 1,
      origScaleY: transform.scaleY ?? transform.scale ?? 1,
      origRotation: transform.rotation || 0,
      action,
    };

    setIsInteracting(true);
  };

  const handlePointerMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStartRef.current || !selectedClipId) return;

      const { startX, startY, origPosX, origPosY, origScaleX, origScaleY, origRotation, action } =
        dragStartRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (action === 'move') {
        updateClipTransform(selectedClipId, {
          positionX: Math.round(origPosX + dx),
          positionY: Math.round(origPosY + dy),
        });
      } else if (action === 'scale-br') {
        const factorX = Math.max(0.1, origScaleX + dx / 150);
        const factorY = Math.max(0.1, origScaleY + dy / 150);
        updateClipTransform(selectedClipId, {
          scaleX: parseFloat(factorX.toFixed(2)),
          scaleY: parseFloat(factorY.toFixed(2)),
        });
      } else if (action === 'rotate') {
        const rot = Math.round(origRotation + dx * 0.75);
        updateClipTransform(selectedClipId, {
          rotation: (rot + 360) % 360,
        });
      }
    },
    [selectedClipId, updateClipTransform]
  );

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
    setIsInteracting(false);
  }, []);

  useEffect(() => {
    if (isInteracting) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      return () => {
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
      };
    }
  }, [isInteracting, handlePointerMove, handlePointerUp]);

  const handleFullscreenPreview = () => {
    if (monitorContainerRef.current) {
      if (!document.fullscreenElement) {
        monitorContainerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div
      ref={monitorContainerRef}
      className="flex-1 flex flex-col bg-[#0b0c10] border-b border-[#1e2330] overflow-hidden select-none"
    >
      {/* Viewport Canvas Frame */}
      <div className="flex-1 relative flex items-center justify-center p-3 overflow-hidden bg-[radial-gradient(#151922_1px,transparent_1px)] [background-size:16px_16px]">
        {/* Aspect Ratio Framing Stage */}
        <div
          ref={viewportRef}
          style={{ aspectRatio: aspectRatio.replace(':', '/') }}
          className="relative max-h-full max-w-full w-full bg-black rounded shadow-2xl overflow-hidden border border-[#232938] flex items-center justify-center"
        >
          {/* Empty State when no clips active */}
          {activeClipsAtTime.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none">
              <div className="w-12 h-12 rounded-xl bg-[#141722] border border-[#222838] flex items-center justify-center text-slate-500 mb-2">
                <Tv className="w-6 h-6 opacity-60" />
              </div>
              <h4 className="text-xs font-semibold text-slate-300">Nusantara Monitor</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {width} × {height} ({aspectRatio}) • {fps} FPS
              </p>
            </div>
          )}

          {/* Composited Video / Image / Text Layers */}
          {activeClipsAtTime.map(({ clip, mediaUrl }) => {
            const isSelected = clip.id === selectedClipId;
            const t = clip.transform || {
              positionX: 0,
              positionY: 0,
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              opacity: 1,
            };
            const app = clip.appearance || {
              brightness: 100,
              contrast: 100,
              saturation: 100,
              exposure: 0,
              temperature: 0,
              tint: 0,
            };
            const fx = clip.basicEffects || {
              blur: 0,
              sharpen: 0,
              vignette: 0,
              grayscale: 0,
              sepia: 0,
            };

            const filterStyle = `brightness(${app.brightness}%) contrast(${app.contrast}%) saturate(${app.saturation}%) blur(${fx.blur}px) grayscale(${fx.grayscale}%) sepia(${fx.sepia}%)`;

            return (
              <div
                key={clip.id}
                onClick={(e) => {
                  e.stopPropagation();
                  useSelectionStore.getState().selectClip(clip.id);
                }}
                style={{
                  transform: `translate(${t.positionX}px, ${t.positionY}px) rotate(${t.rotation}deg) scale(${
                    (t.scaleX ?? t.scale ?? 1) * (t.flipHorizontal ? -1 : 1)
                  }, ${(t.scaleY ?? t.scale ?? 1) * (t.flipVertical ? -1 : 1)})`,
                  opacity: t.opacity,
                  filter: filterStyle,
                }}
                className={`absolute transition-transform duration-75 max-w-full max-h-full flex items-center justify-center cursor-pointer ${
                  isSelected ? 'z-40' : 'z-20'
                }`}
              >
                {/* Visual Content: Video / Image / Text */}
                {clip.type === 'text' && clip.textProps ? (
                  <div
                    style={{
                      fontFamily: clip.textProps.fontFamily,
                      fontSize: `${Math.round(clip.textProps.fontSize * 0.75)}px`,
                      fontWeight: clip.textProps.bold ? 'bold' : 'normal',
                      fontStyle: clip.textProps.italic ? 'italic' : 'normal',
                      color: clip.textProps.color,
                      backgroundColor: clip.textProps.backgroundColor,
                      textAlign: clip.textProps.alignment,
                      WebkitTextStroke: clip.textProps.outlineWidth
                        ? `${clip.textProps.outlineWidth}px ${clip.textProps.outlineColor || '#000'}`
                        : undefined,
                      textShadow: clip.textProps.shadowBlur
                        ? `0 2px ${clip.textProps.shadowBlur}px ${clip.textProps.shadowColor || '#000'}`
                        : undefined,
                    }}
                    className="px-4 py-2 rounded select-none whitespace-pre-wrap"
                  >
                    {clip.textProps.text}
                  </div>
                ) : clip.type === 'image' ? (
                  <div className="relative max-w-md max-h-80 overflow-hidden rounded">
                    {mediaUrl ? (
                      <img src={mediaUrl} alt={clip.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-64 h-48 bg-gradient-to-tr from-purple-950 to-indigo-950 border border-purple-500/30 flex items-center justify-center text-purple-300 font-semibold text-xs">
                        {clip.name}
                      </div>
                    )}
                  </div>
                ) : (
                  // Video or Screen/Camera Recording
                  <div className="relative max-w-lg max-h-80 overflow-hidden rounded bg-black">
                    {mediaUrl && (mediaUrl.endsWith('.mp4') || mediaUrl.startsWith('blob:')) ? (
                      <video
                        src={mediaUrl}
                        playsInline
                        muted
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    ) : (
                      <div className="w-80 h-48 bg-gradient-to-tr from-blue-950/80 to-slate-900 border border-blue-500/30 flex flex-col items-center justify-center p-4 text-center">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold mb-1">
                          {clip.type}
                        </span>
                        <span className="text-xs font-semibold text-slate-200 truncate max-w-[240px]">
                          {clip.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Direct Editing Bounding Box & Handles (Requirement 16) */}
                {isSelected && (
                  <div
                    onMouseDown={(e) => handleStartInteraction(e, 'move')}
                    className="absolute -inset-2 border-2 border-blue-400 rounded ring-1 ring-blue-500/50 cursor-move pointer-events-auto select-none"
                  >
                    {/* Corner Handles */}
                    <div
                      onMouseDown={(e) => handleStartInteraction(e, 'scale-br')}
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 border border-white rounded-xs cursor-nwse-resize hover:scale-125 transition-transform"
                      title="Resize Scale"
                    />
                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-400 border border-white rounded-xs pointer-events-none" />
                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-400 border border-white rounded-xs pointer-events-none" />
                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-400 border border-white rounded-xs pointer-events-none" />

                    {/* Rotation Knob Top Center */}
                    <div
                      onMouseDown={(e) => handleStartInteraction(e, 'rotate')}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 border border-white flex items-center justify-center cursor-grab hover:scale-125 transition-transform"
                      title="Rotate Angle"
                    >
                      <RotateCw className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Project Framing Badge */}
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 font-mono text-[9px] text-slate-300 pointer-events-none border border-white/5">
            {aspectRatio} • {fps}fps
          </div>
        </div>
      </div>

      {/* Modern Compact Transport Controls Bar */}
      <div className="h-10 bg-[#10121a] border-t border-[#1e2330] px-3 flex items-center justify-between text-xs select-none">
        {/* Left: SMPTE Timecode */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-blue-400 bg-[#0a0c10] border border-[#212735] px-2 py-0.5 rounded">
            {secondsToTimecode(currentTime)}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            / {secondsToTimecode(duration)}
          </span>
        </div>

        {/* Center: Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => useTimelineStore.getState().jumpToBeginning()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
            title="Beginning (Home)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => useTimelineStore.getState().previousFrame()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
            title="Previous Frame (Arrow Left)"
          >
            <span className="text-[10px] font-mono font-bold">1F-</span>
          </button>
          <button
            onClick={togglePlay}
            className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            title="Play / Pause (Space)"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            onClick={() => useTimelineStore.getState().stop()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={() => useTimelineStore.getState().nextFrame()}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
            title="Next Frame (Arrow Right)"
          >
            <span className="text-[10px] font-mono font-bold">1F+</span>
          </button>
        </div>

        {/* Right: Volume & Fullscreen */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-[#212735] px-2 py-0.5 rounded">
            <button
              onClick={() => setPreviewMuted(!previewMuted)}
              className="text-slate-400 hover:text-slate-200"
            >
              {previewMuted || previewVolume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-slate-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={previewMuted ? 0 : previewVolume}
              onChange={(e) => {
                setPreviewVolume(parseInt(e.target.value, 10));
                if (previewMuted) setPreviewMuted(false);
              }}
              className="w-14 h-1 bg-[#202738] rounded accent-blue-500 cursor-pointer"
            />
            <span className="font-mono text-[9px] text-slate-400 w-6 text-right">
              {previewMuted ? 0 : previewVolume}%
            </span>
          </div>

          <button
            onClick={handleFullscreenPreview}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1a1f2b] rounded transition-colors"
            title="Fullscreen Monitor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
