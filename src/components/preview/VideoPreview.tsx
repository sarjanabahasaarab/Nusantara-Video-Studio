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
  Grid,
  Crosshair,
  ShieldAlert,
  Layers,
  Edit3,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useMediaStore } from '../../stores/mediaStore';
import { useGraphicsStore } from '../../stores/graphicsStore';
import { useSubtitleStore } from '../../stores/subtitleStore';
import { secondsToTimecode } from '../../utils/timecode';
import { Clip, ClipColorGrading } from '../../types';
import { KeyframeEngine } from '../../engine/keyframes/KeyframeEngine';
import { EffectLibrary } from '../../engine/effects/EffectLibrary';
import { MaskEngine } from '../../engine/masking/MaskEngine';
import { ChromaKeyEngine } from '../../engine/chromakey/ChromaKeyEngine';
import { ShapeEngine } from '../../engine/graphics/ShapeEngine';
import { TextAnimationEngine } from '../../engine/text/TextAnimationEngine';
import { ColorEngine } from '../../engine/color/ColorEngine';
import { TransitionEngine } from '../../engine/transitions/TransitionEngine';

export const VideoPreview: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const { fps, aspectRatio, width, height, duration } = currentProject.settings;
  const tracks = currentProject.timeline.tracks;
  const transitions = currentProject.timeline.transitions || [];

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
  const updateClipText = useTimelineStore((s) => s.updateClipText);

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const mediaItems = useMediaStore((s) => s.items);

  // Phase 5 Safe Area & Subtitles
  const safeArea = useGraphicsStore((s) => s.safeArea);
  const toggleSafeArea = useGraphicsStore((s) => s.toggleSafeArea);
  const setSafeAreaSetting = useGraphicsStore((s) => s.setSafeAreaSetting);
  const activeSubtitleTrack = useSubtitleStore((s) => s.getActiveTrack());

  const [inlineEditingClipId, setInlineEditingClipId] = useState<string | null>(null);
  const [showSafeAreaMenu, setShowSafeAreaMenu] = useState(false);

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
      track.clips.forEach((clip) => {
        const isDirect = currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration;
        // Check if clip is active as part of a transition
        const isTransitioning = transitions.some(
          (tr) =>
            (tr.fromClipId === clip.id || tr.toClipId === clip.id) &&
            currentTime >= tr.start &&
            currentTime <= tr.start + tr.duration
        );

        if (isDirect || isTransitioning) {
          const media = mediaItems.find((m) => m.id === clip.mediaId);
          if (!activeList.some((item) => item.clip.id === clip.id)) {
            activeList.push({ clip, mediaUrl: media?.blobUrl || media?.thumbnail });
          }
        }
      });
    });

    return activeList;
  }, [tracks, currentTime, mediaItems, transitions]);

  const selectedActiveItem = useMemo(() => {
    return activeClipsAtTime.find((item) => item.clip.id === selectedClipId);
  }, [activeClipsAtTime, selectedClipId]);

  // Phase 5: Find active subtitle at playhead
  const activeSubtitleAtTime = useMemo(() => {
    if (!activeSubtitleTrack || !activeSubtitleTrack.visible) return null;
    return activeSubtitleTrack.items.find(
      (it) => currentTime >= it.startTime && currentTime <= it.endTime
    );
  }, [activeSubtitleTrack, currentTime]);

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

          {/* Composited Video / Image / Text Layers with Phase 4 Motion Engine */}
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

            // 1. Evaluate Keyframes at relative clip time
            const relTime = Math.max(0, currentTime - clip.startTime);
            const colorGrading = clip.colorGrading;
            const defaultKfValues: Record<string, number> = {
              positionX: t.positionX || 0,
              positionY: t.positionY || 0,
              scaleX: t.scaleX ?? t.scale ?? 1,
              scaleY: t.scaleY ?? t.scale ?? 1,
              rotation: t.rotation || 0,
              opacity: t.opacity ?? 1,
              brightness: app.brightness ?? 100,
              contrast: app.contrast ?? 100,
              saturation: app.saturation ?? 100,
              blur: fx.blur ?? 0,
              // Color Grading Keyframes (Requirement 17)
              exposure: colorGrading?.basic?.exposure ?? 0,
              temperature: colorGrading?.basic?.temperature ?? 0,
              tint: colorGrading?.basic?.tint ?? 0,
              vignette: colorGrading?.vignette?.amount ?? 0,
              effectIntensity: colorGrading?.lut?.intensity ?? 100,
            };
            const evalKf = KeyframeEngine.evaluateAllProperties(
              clip.animatedProperties,
              relTime,
              defaultKfValues
            );

            // Dynamically combine color grading with evaluated keyframes
            const activeColorGrading: ClipColorGrading | undefined = colorGrading ? {
              ...colorGrading,
              basic: {
                ...colorGrading.basic,
                exposure: evalKf.exposure ?? colorGrading.basic.exposure,
                temperature: evalKf.temperature ?? colorGrading.basic.temperature,
                tint: evalKf.tint ?? colorGrading.basic.tint,
              },
              vignette: {
                ...colorGrading.vignette,
                amount: evalKf.vignette ?? colorGrading.vignette.amount,
              },
            } : undefined;

            const colorFilter = activeColorGrading ? ColorEngine.getCSSFilterString(activeColorGrading) : 'none';

            // 2. Picture-in-Picture (PiP) Settings & Presets
            let pipTransform = '';
            let pipBorder = '';
            let pipRadius = '';
            let pipShadow = '';
            let pipCrop = '';

            if (clip.pip?.enabled) {
              const pip = clip.pip;
              if (pip.borderWidth) pipBorder = `${pip.borderWidth}px solid ${pip.borderColor || '#38bdf8'}`;
              if (pip.borderRadius) pipRadius = `${pip.borderRadius}px`;
              if (pip.shadowBlur) pipShadow = `0 8px ${pip.shadowBlur}px ${pip.shadowColor || 'rgba(0,0,0,0.6)'}`;

              if (pip.presetPosition === 'top-left') {
                pipTransform = 'translate(-32%, -32%) ';
              } else if (pip.presetPosition === 'top-right') {
                pipTransform = 'translate(32%, -32%) ';
              } else if (pip.presetPosition === 'bottom-left') {
                pipTransform = 'translate(-32%, 32%) ';
              } else if (pip.presetPosition === 'bottom-right') {
                pipTransform = 'translate(32%, 32%) ';
              } else if (pip.presetPosition === 'center') {
                pipTransform = 'translate(0%, 0%) ';
              }

              if (pip.presetSize === 'small') {
                evalKf.scaleX = (evalKf.scaleX || 1) * 0.4;
                evalKf.scaleY = (evalKf.scaleY || 1) * 0.4;
              } else if (pip.presetSize === 'medium') {
                evalKf.scaleX = (evalKf.scaleX || 1) * 0.55;
                evalKf.scaleY = (evalKf.scaleY || 1) * 0.55;
              } else if (pip.presetSize === 'large') {
                evalKf.scaleX = (evalKf.scaleX || 1) * 0.75;
                evalKf.scaleY = (evalKf.scaleY || 1) * 0.75;
              }

              if (pip.cropLeft || pip.cropRight || pip.cropTop || pip.cropBottom) {
                pipCrop = `inset(${pip.cropTop || 0}% ${pip.cropRight || 0}% ${pip.cropBottom || 0}% ${pip.cropLeft || 0}%)`;
              }
            }

            // 3. Effect Stack live compilation
            const compiledFx = EffectLibrary.compileCssFilter(clip.effects);

            const filterParts = [
              `brightness(${evalKf.brightness}%)`,
              `contrast(${evalKf.contrast}%)`,
              `saturate(${evalKf.saturation}%)`,
              `blur(${evalKf.blur}px)`,
              `grayscale(${fx.grayscale}%)`,
              `sepia(${fx.sepia}%)`,
              compiledFx.filter,
              colorFilter !== 'none' ? colorFilter : '',
            ].filter(Boolean).join(' ');

            // 4. Vector Masking
            const activeMask = clip.masks?.find((m) => m.enabled);
            const maskStyle = MaskEngine.computeClipPath(activeMask);

            // 5. Transitions
            const activeTransition = transitions.find(
              (tr) =>
                (tr.fromClipId === clip.id || tr.toClipId === clip.id) &&
                currentTime >= tr.start &&
                currentTime <= tr.start + tr.duration
            );

            let transitionStyle: React.CSSProperties = {};
            let dipOverlay: { color: string; opacity: number } | null = null;

            if (activeTransition) {
              const trEval = TransitionEngine.evaluateTransition(activeTransition, currentTime);
              if (activeTransition.fromClipId === clip.id) {
                transitionStyle = trEval.fromStyle;
              } else {
                transitionStyle = trEval.toStyle;
              }
              if (trEval.overlayColor && trEval.overlayOpacity !== undefined) {
                dipOverlay = { color: trEval.overlayColor, opacity: trEval.overlayOpacity };
              }
            }

            const finalTransform = `${pipTransform}translate(${evalKf.positionX}px, ${evalKf.positionY}px) rotate(${evalKf.rotation}deg) scale(${
              (evalKf.scaleX ?? 1) * (t.flipHorizontal ? -1 : 1)
            }, ${(evalKf.scaleY ?? 1) * (t.flipVertical ? -1 : 1)})`;

            return (
              <div
                key={clip.id}
                onClick={(e) => {
                  e.stopPropagation();
                  useSelectionStore.getState().selectClip(clip.id);
                }}
                style={{
                  transform: finalTransform,
                  opacity: Math.max(0, Math.min(1, (evalKf.opacity ?? 1) * ((transitionStyle.opacity as number) ?? 1))),
                  filter: filterParts,
                  clipPath: maskStyle.clipPath || pipCrop || (transitionStyle.clipPath as string) || undefined,
                  ...compiledFx.style,
                  ...transitionStyle,
                }}
                className={`absolute transition-transform duration-75 max-w-full max-h-full flex items-center justify-center cursor-pointer ${
                  isSelected ? 'z-40' : 'z-20'
                }`}
              >
                {/* Visual Content Container with PiP styling & Chroma Key */}
                <div
                  style={{
                    border: pipBorder || undefined,
                    borderRadius: pipRadius || undefined,
                    boxShadow: pipShadow || undefined,
                  }}
                  className="relative overflow-hidden"
                >
                {/* Visual Content: Video / Image / Text / Shape / Logo */}
                {clip.type === 'text' && clip.textProps ? (
                  inlineEditingClipId === clip.id ? (
                    <textarea
                      autoFocus
                      value={clip.textProps.text}
                      onChange={(e) => updateClipText(clip.id, { text: e.target.value })}
                      onBlur={() => setInlineEditingClipId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setInlineEditingClipId(null);
                      }}
                      style={{
                        fontFamily: clip.textProps.fontFamily,
                        fontSize: `${Math.round(clip.textProps.fontSize * 0.75)}px`,
                        fontWeight: clip.textProps.bold ? 'bold' : clip.textProps.fontWeight || 'normal',
                        fontStyle: clip.textProps.italic ? 'italic' : 'normal',
                        textDecoration: clip.textProps.underline ? 'underline' : 'none',
                        letterSpacing: clip.textProps.letterSpacing ? `${clip.textProps.letterSpacing}px` : undefined,
                        lineHeight: clip.textProps.lineHeight || 1.2,
                        color: clip.textProps.color,
                        backgroundColor: clip.textProps.backgroundColor || 'rgba(0,0,0,0.65)',
                        textAlign: clip.textProps.alignment,
                      }}
                      className="p-2 rounded resize-none border border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  ) : (
                    <div
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setInlineEditingClipId(clip.id);
                      }}
                      style={{
                        fontFamily: clip.textProps.fontFamily,
                        fontSize: `${Math.round(clip.textProps.fontSize * 0.75)}px`,
                        fontWeight: clip.textProps.bold ? 'bold' : clip.textProps.fontWeight || 'normal',
                        fontStyle: clip.textProps.italic ? 'italic' : 'normal',
                        textDecoration: clip.textProps.underline ? 'underline' : 'none',
                        letterSpacing: clip.textProps.letterSpacing ? `${clip.textProps.letterSpacing}px` : undefined,
                        lineHeight: clip.textProps.lineHeight || 1.2,
                        color: clip.textProps.color,
                        backgroundColor: clip.textProps.backgroundColor,
                        textAlign: clip.textProps.alignment,
                        padding: clip.textProps.padding ? `${clip.textProps.padding}px` : undefined,
                        WebkitTextStroke: clip.textProps.outlineWidth
                          ? `${clip.textProps.outlineWidth}px ${clip.textProps.outlineColor || '#000'}`
                          : undefined,
                        textShadow: clip.textProps.shadowBlur
                          ? `${clip.textProps.shadowOffsetX || 0}px ${clip.textProps.shadowOffsetY || 2}px ${clip.textProps.shadowBlur}px ${clip.textProps.shadowColor || '#000'}`
                          : undefined,
                      }}
                      className="px-4 py-2 rounded select-none whitespace-pre-wrap cursor-pointer"
                      title="Klik ganda untuk mengedit teks langsung di preview"
                    >
                      {TextAnimationEngine.evaluateTypewriterText(
                        clip.textProps.text,
                        relTime,
                        clip.textProps.animation
                      )}
                    </div>
                  )
                ) : clip.type === 'shape' && clip.shapeProps ? (
                  <div
                    style={{
                      width: `${clip.shapeProps.width}px`,
                      height: `${clip.shapeProps.height}px`,
                      opacity: clip.shapeProps.opacity ?? 1,
                    }}
                    className="relative flex items-center justify-center select-none"
                  >
                    <svg
                      width={clip.shapeProps.width}
                      height={clip.shapeProps.height}
                      viewBox={`0 0 ${clip.shapeProps.width} ${clip.shapeProps.height}`}
                      className="overflow-visible"
                    >
                      {clip.shapeProps.shapeType === 'rectangle' ? (
                        <rect
                          x={clip.shapeProps.strokeWidth / 2}
                          y={clip.shapeProps.strokeWidth / 2}
                          width={clip.shapeProps.width - clip.shapeProps.strokeWidth}
                          height={clip.shapeProps.height - clip.shapeProps.strokeWidth}
                          fill={clip.shapeProps.fillColor}
                          stroke={clip.shapeProps.strokeColor}
                          strokeWidth={clip.shapeProps.strokeWidth}
                        />
                      ) : clip.shapeProps.shapeType === 'rounded-rectangle' ? (
                        <rect
                          x={clip.shapeProps.strokeWidth / 2}
                          y={clip.shapeProps.strokeWidth / 2}
                          width={clip.shapeProps.width - clip.shapeProps.strokeWidth}
                          height={clip.shapeProps.height - clip.shapeProps.strokeWidth}
                          rx={clip.shapeProps.cornerRadius || 16}
                          ry={clip.shapeProps.cornerRadius || 16}
                          fill={clip.shapeProps.fillColor}
                          stroke={clip.shapeProps.strokeColor}
                          strokeWidth={clip.shapeProps.strokeWidth}
                        />
                      ) : clip.shapeProps.shapeType === 'circle' ? (
                        <circle
                          cx={clip.shapeProps.width / 2}
                          cy={clip.shapeProps.height / 2}
                          r={Math.max(1, Math.min(clip.shapeProps.width, clip.shapeProps.height) / 2 - clip.shapeProps.strokeWidth / 2)}
                          fill={clip.shapeProps.fillColor}
                          stroke={clip.shapeProps.strokeColor}
                          strokeWidth={clip.shapeProps.strokeWidth}
                        />
                      ) : clip.shapeProps.shapeType === 'ellipse' ? (
                        <ellipse
                          cx={clip.shapeProps.width / 2}
                          cy={clip.shapeProps.height / 2}
                          rx={Math.max(1, clip.shapeProps.width / 2 - clip.shapeProps.strokeWidth / 2)}
                          ry={Math.max(1, clip.shapeProps.height / 2 - clip.shapeProps.strokeWidth / 2)}
                          fill={clip.shapeProps.fillColor}
                          stroke={clip.shapeProps.strokeColor}
                          strokeWidth={clip.shapeProps.strokeWidth}
                        />
                      ) : clip.shapeProps.shapeType === 'line' ? (
                        <line
                          x1={0}
                          y1={clip.shapeProps.height / 2}
                          x2={clip.shapeProps.width}
                          y2={clip.shapeProps.height / 2}
                          stroke={clip.shapeProps.strokeColor}
                          strokeWidth={clip.shapeProps.strokeWidth}
                        />
                      ) : clip.shapeProps.shapeType === 'arrow' ? (
                        <path
                          d={ShapeEngine.getArrowPath(clip.shapeProps.width, clip.shapeProps.height, clip.shapeProps.arrowDirection || 'right')}
                          fill={clip.shapeProps.fillColor}
                          stroke={clip.shapeProps.strokeColor}
                          strokeWidth={clip.shapeProps.strokeWidth}
                        />
                      ) : (
                        <path
                          d={ShapeEngine.getTrianglePath(clip.shapeProps.width, clip.shapeProps.height)}
                          fill={clip.shapeProps.fillColor}
                          stroke={clip.shapeProps.strokeColor}
                          strokeWidth={clip.shapeProps.strokeWidth}
                        />
                      )}
                    </svg>
                  </div>
                ) : clip.type === 'logo' ? (
                  <div
                    style={{
                      border: clip.logoProps?.borderWidth ? `${clip.logoProps.borderWidth}px solid ${clip.logoProps.borderColor || '#fff'}` : undefined,
                      boxShadow: clip.logoProps?.shadowBlur ? `0 4px ${clip.logoProps.shadowBlur}px ${clip.logoProps.shadowColor || '#000'}` : undefined,
                      opacity: clip.logoProps?.opacity ?? 1,
                    }}
                    className="relative max-w-xs max-h-36 overflow-hidden rounded select-none"
                  >
                    {mediaUrl ? (
                      <img src={mediaUrl} alt={clip.name} className="w-full h-full object-contain pointer-events-none" />
                    ) : (
                      <div className="w-32 h-20 bg-purple-900/60 border border-purple-500/40 rounded flex items-center justify-center text-purple-300 font-semibold text-[10px]">
                        Logo Overlay
                      </div>
                    )}
                  </div>
                ) : clip.type === 'image' ? (
                  <div className="relative max-w-md max-h-80 overflow-hidden rounded">
                    {mediaUrl ? (
                      <img id="video-preview-image" src={mediaUrl} alt={clip.name} className="w-full h-full object-contain" />
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
                        id="video-preview-element"
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

                {/* Vignette Overlay (Requirement 12) */}
                {activeColorGrading?.enabled && activeColorGrading.vignette && activeColorGrading.vignette.amount !== 0 && (
                  <div
                    style={{
                      background: `radial-gradient(ellipse at ${50 + (activeColorGrading.vignette.position?.x || 0)}% ${50 + (activeColorGrading.vignette.position?.y || 0)}%, transparent ${activeColorGrading.vignette.size}%, rgba(0,0,0,${Math.abs(activeColorGrading.vignette.amount) / 100}) ${Math.min(100, activeColorGrading.vignette.size + activeColorGrading.vignette.feather)}%)`,
                      mixBlendMode: activeColorGrading.vignette.amount < 0 ? 'multiply' : 'screen',
                    }}
                    className="absolute inset-0 pointer-events-none z-10"
                  />
                )}
                </div>

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

          {/* Active Transition Dip Overlay (Dip to Black / Dip to White) */}
          {transitions.map((tr) => {
            if (currentTime >= tr.start && currentTime <= tr.start + tr.duration) {
              const trEval = TransitionEngine.evaluateTransition(tr, currentTime);
              if (trEval.overlayColor && trEval.overlayOpacity !== undefined && trEval.overlayOpacity > 0) {
                return (
                  <div
                    key={`dip-${tr.id}`}
                    style={{
                      backgroundColor: trEval.overlayColor,
                      opacity: trEval.overlayOpacity,
                    }}
                    className="absolute inset-0 pointer-events-none z-50 transition-opacity duration-75"
                  />
                );
              }
            }
            return null;
          })}

          {/* Phase 5 Subtitle Track Overlay at Current Time (Requirements 11, 12, 13) */}
          {activeSubtitleAtTime && (
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center px-8 z-30 pointer-events-none select-none">
              <div
                style={{
                  fontFamily: activeSubtitleTrack?.defaultStyle?.fontFamily || 'Inter',
                  fontSize: `${activeSubtitleTrack?.defaultStyle?.fontSize ? Math.round(activeSubtitleTrack.defaultStyle.fontSize * 0.7) : 24}px`,
                  color: activeSubtitleTrack?.defaultStyle?.color || '#ffffff',
                  backgroundColor: activeSubtitleTrack?.defaultStyle?.backgroundColor || 'rgba(0, 0, 0, 0.75)',
                  WebkitTextStroke: activeSubtitleTrack?.defaultStyle?.outlineWidth
                    ? `${activeSubtitleTrack.defaultStyle.outlineWidth}px ${activeSubtitleTrack.defaultStyle.outlineColor || '#000'}`
                    : '1px #000',
                  textShadow: '0 2px 8px rgba(0, 0, 0, 0.85)',
                }}
                className="px-4 py-1.5 rounded text-center max-w-[85%] whitespace-pre-wrap leading-relaxed shadow-lg font-medium"
              >
                {activeSubtitleAtTime.text}
              </div>
            </div>
          )}

          {/* Phase 5 Title Safe Area Guides (Requirement 10) */}
          {safeArea.showSafeArea && (
            <div className="absolute inset-0 pointer-events-none select-none z-40 overflow-hidden">
              {/* Action Safe (90% boundary) */}
              {safeArea.showActionSafe && (
                <div className="absolute inset-[5%] border border-amber-400/40 border-dotted flex items-start justify-start p-1">
                  <span className="text-[8px] font-mono text-amber-400/70 bg-black/60 px-1 rounded">
                    ACTION SAFE (90%)
                  </span>
                </div>
              )}

              {/* Title Safe (80% boundary) */}
              {safeArea.showTitleSafe && (
                <div className="absolute inset-[10%] border border-cyan-400/50 border-dashed flex items-start justify-start p-1">
                  <span className="text-[8px] font-mono text-cyan-400/80 bg-black/60 px-1 rounded">
                    TITLE SAFE (80%)
                  </span>
                </div>
              )}

              {/* Center Crosshair Guide */}
              {safeArea.showCenterGuide && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-8 h-[1px] bg-red-400/70 absolute" />
                  <div className="h-8 w-[1px] bg-red-400/70 absolute" />
                  <div className="w-3 h-3 rounded-full border border-red-400/50 absolute" />
                </div>
              )}

              {/* 3x3 Grid (Rule of Thirds) */}
              {safeArea.showGrid && (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div className="border-r border-b border-white/15" />
                  <div />
                </div>
              )}
            </div>
          )}

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

          {/* Safe Area Guides Toggle & Options (Requirement 10) */}
          <div className="relative">
            <button
              onClick={() => setShowSafeAreaMenu(!showSafeAreaMenu)}
              className={`p-1.5 rounded transition-colors ${
                safeArea.showSafeArea
                  ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#1a1f2b]'
              }`}
              title="Title Safe Area & Grid Guides"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>

            {showSafeAreaMenu && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#141824] border border-[#252f42] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1 text-[11px] select-none">
                <div className="px-2 py-1 font-semibold text-slate-300 border-b border-[#202738] flex items-center justify-between">
                  <span>Safe Area Guides</span>
                  <button
                    onClick={toggleSafeArea}
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      safeArea.showSafeArea ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {safeArea.showSafeArea ? 'ON' : 'OFF'}
                  </button>
                </div>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#1a2030] cursor-pointer">
                  <span className="text-slate-300">Title Safe (80%)</span>
                  <input
                    type="checkbox"
                    checked={safeArea.showTitleSafe}
                    onChange={(e) => setSafeAreaSetting('showTitleSafe', e.target.checked)}
                    className="accent-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#1a2030] cursor-pointer">
                  <span className="text-slate-300">Action Safe (90%)</span>
                  <input
                    type="checkbox"
                    checked={safeArea.showActionSafe}
                    onChange={(e) => setSafeAreaSetting('showActionSafe', e.target.checked)}
                    className="accent-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#1a2030] cursor-pointer">
                  <span className="text-slate-300">Center Guide (+)</span>
                  <input
                    type="checkbox"
                    checked={safeArea.showCenterGuide}
                    onChange={(e) => setSafeAreaSetting('showCenterGuide', e.target.checked)}
                    className="accent-blue-500"
                  />
                </label>

                <label className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#1a2030] cursor-pointer">
                  <span className="text-slate-300">Rule of Thirds Grid</span>
                  <input
                    type="checkbox"
                    checked={safeArea.showGrid}
                    onChange={(e) => setSafeAreaSetting('showGrid', e.target.checked)}
                    className="accent-blue-500"
                  />
                </label>
              </div>
            )}
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
