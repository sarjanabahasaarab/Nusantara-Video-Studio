/**
 * Nusantara Video Studio - Video Preview Monitor
 * Viewport with aspect ratio framing, playback engine, SMPTE timecode, and playback controls.
 */

import React, { useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Tv,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { secondsToTimecode } from '../../utils/timecode';

export const VideoPreview: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const { fps, aspectRatio, width, height, duration } = currentProject.settings;

  const currentTime = useTimelineStore((s) => s.currentTime);
  const isPlaying = useTimelineStore((s) => s.isPlaying);
  const togglePlay = useTimelineStore((s) => s.togglePlay);
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const previewVolume = useTimelineStore((s) => s.previewVolume);
  const setPreviewVolume = useTimelineStore((s) => s.setPreviewVolume);
  const previewMuted = useTimelineStore((s) => s.previewMuted);
  const setPreviewMuted = useTimelineStore((s) => s.setPreviewMuted);

  const monitorContainerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Playback loop engine
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

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePrevFrame = () => {
    setIsPlaying(false);
    setCurrentTime(Math.max(0, currentTime - 1 / fps));
  };

  const handleNextFrame = () => {
    setIsPlaying(false);
    setCurrentTime(Math.min(duration, currentTime + 1 / fps));
  };

  const handleFullscreenPreview = () => {
    if (monitorContainerRef.current) {
      if (!document.fullscreenElement) {
        monitorContainerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Determine aspect ratio class
  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case '9:16':
        return { aspectRatio: '9 / 16', maxHeight: '100%', maxWidth: 'calc(100% * 9 / 16)' };
      case '1:1':
        return { aspectRatio: '1 / 1', maxHeight: '100%', maxWidth: '100%' };
      case '4:3':
        return { aspectRatio: '4 / 3', maxHeight: '100%', maxWidth: '100%' };
      case '16:9':
      default:
        return { aspectRatio: '16 / 9', maxHeight: '100%', maxWidth: '100%' };
    }
  };

  return (
    <div
      ref={monitorContainerRef}
      className="flex-1 bg-[#0b0c10] flex flex-col justify-between overflow-hidden relative select-none"
    >
      {/* Top Monitor Bar / Overlay Info */}
      <div className="h-7 px-3 bg-[#0e1017]/80 backdrop-blur-sm border-b border-[#1b1f29] flex items-center justify-between text-[11px] text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">PREVIEW MONITOR</span>
          <span className="text-[10px] bg-[#1a1e27] px-1.5 py-0.5 rounded text-slate-400 font-mono">
            {aspectRatio} • {width}x{height}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500">{fps} FPS</span>
          <button
            onClick={handleFullscreenPreview}
            className="text-slate-400 hover:text-white transition-colors"
            title="Fullscreen Monitor"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Canvas / Preview Screen Frame */}
      <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-gradient-to-b from-[#090a0d] to-[#0f1117]">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Video Canvas Box */}
        <div
          style={getAspectRatioStyle()}
          className="relative bg-black rounded shadow-2xl border border-[#232938] flex flex-col items-center justify-center overflow-hidden transition-all duration-200"
        >
          {/* Safe Area Guides */}
          <div className="absolute inset-4 border border-dashed border-white/5 pointer-events-none rounded" />
          <div className="absolute inset-8 border border-dashed border-white/10 pointer-events-none rounded" />

          {/* Empty State / No Media Message */}
          <div className="flex flex-col items-center justify-center text-center p-6 z-10">
            <div className="w-16 h-16 rounded-2xl bg-[#141720] border border-[#232a39] flex items-center justify-center text-slate-500 mb-3 shadow-inner">
              <Tv className="w-8 h-8 opacity-70" />
            </div>
            <h2 className="text-sm font-semibold text-slate-200 mb-1">No Media</h2>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Import video untuk mulai mengedit proyek Anda.
            </p>
            <div className="mt-3 px-2.5 py-1 bg-[#151922] border border-[#242b3b] rounded text-[10px] text-slate-400 font-mono">
              Playback engine aktif • Scrub timeline untuk menguji
            </div>
          </div>

          {/* Big Timecode Badge in Canvas bottom */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 font-mono-time text-xs text-blue-400 tracking-wider font-semibold">
            {secondsToTimecode(currentTime, fps)}
          </div>
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="h-11 bg-[#101219] border-t border-[#1e2330] px-4 flex items-center justify-between z-10">
        {/* Left: SMPTE Timecode Display */}
        <div className="flex items-center gap-2">
          <div className="bg-[#090b0f] border border-[#222735] px-3 py-1 rounded font-mono-time font-semibold text-sm text-slate-100 tracking-widest shadow-inner">
            {secondsToTimecode(currentTime, fps)}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            / {secondsToTimecode(duration, fps)}
          </span>
        </div>

        {/* Center: Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStop}
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1f2430] transition-colors"
            title="Stop & Reset to Start (Home)"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>
          <button
            onClick={handlePrevFrame}
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1f2430] transition-colors"
            title="Previous Frame (Left Arrow)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={togglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95 ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>
          <button
            onClick={handleNextFrame}
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1f2430] transition-colors"
            title="Next Frame (Right Arrow)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Master Volume & Fullscreen */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-[#212634] px-2 py-1 rounded">
            <button
              onClick={() => setPreviewMuted(!previewMuted)}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title={previewMuted ? 'Unmute' : 'Mute'}
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
              className="w-16 h-1 bg-[#232938] rounded appearance-none cursor-pointer accent-blue-500"
              title={`Master Volume: ${previewMuted ? 0 : previewVolume}%`}
            />
            <span className="text-[10px] text-slate-400 font-mono w-6 text-right">
              {previewMuted ? 0 : previewVolume}%
            </span>
          </div>

          <button
            onClick={handleFullscreenPreview}
            className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1f2430] transition-colors"
            title="Toggle Monitor Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
