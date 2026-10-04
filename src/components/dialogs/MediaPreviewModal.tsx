/**
 * Nusantara Video Studio - Media Preview Modal
 * Phase 2: Media Library & Media Import
 *
 * Dedicated playback inspector for Video, Audio, and Image assets
 * with transport controls, scrub bar, timecode, volume, and codec fallback warning.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useMediaStore } from '../../stores/mediaStore';
import { secondsToTimecode, formatBytes } from '../../utils/timecode';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  AlertCircle,
  Film,
  Music,
  Image as ImageIcon,
} from 'lucide-react';

export const MediaPreviewModal: React.FC = () => {
  const previewItem = useMediaStore((s) => s.previewMediaItem);
  const setPreviewMedia = useMediaStore((s) => s.setPreviewMedia);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const isOpen = previewItem !== null;

  useEffect(() => {
    if (previewItem) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(previewItem.duration || 0);
      setPlaybackError(null);
    }
  }, [previewItem]);

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPreviewMedia(null);
  };

  const handlePlayPause = () => {
    const el = previewItem?.type === 'video' ? videoRef.current : audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.warn('[MediaPreview] Playback failed:', e);
          setPlaybackError(
            'Format ini dapat digunakan sebagai media project, tetapi preview langsung belum didukung oleh engine preview browser.'
          );
        });
    }
  };

  const handleStop = () => {
    const el = previewItem?.type === 'video' ? videoRef.current : audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleSeek = (time: number) => {
    const el = previewItem?.type === 'video' ? videoRef.current : audioRef.current;
    if (!el) return;
    el.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    const el = previewItem?.type === 'video' ? videoRef.current : audioRef.current;
    if (el) {
      el.volume = newVol / 100;
      if (isMuted && newVol > 0) setIsMuted(false);
    }
  };

  const toggleMute = () => {
    const el = previewItem?.type === 'video' ? videoRef.current : audioRef.current;
    if (!el) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    el.muted = nextMute;
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  if (!previewItem) return null;

  const activeDuration = duration || previewItem.duration || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Preview: ${previewItem.name}`}
      subtitle={`${previewItem.type.toUpperCase()} • ${previewItem.extension.toUpperCase()} • ${formatBytes(
        previewItem.size
      )}`}
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-3">
        {/* Playback Error Notice (Requirement 17) */}
        {playbackError && (
          <div className="p-3 bg-amber-950/60 border border-amber-600/40 rounded-lg flex items-start gap-2.5 text-amber-200 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-100">Notice Preview Codec</p>
              <p className="text-[11px] mt-0.5 leading-relaxed">{playbackError}</p>
            </div>
          </div>
        )}

        {/* Media Display Viewport */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#262c3b] flex items-center justify-center shadow-inner">
          {previewItem.type === 'video' && (
            <video
              ref={videoRef}
              src={previewItem.blobUrl}
              loop={isLooping}
              onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
              onLoadedMetadata={() =>
                videoRef.current && setDuration(videoRef.current.duration || previewItem.duration || 0)
              }
              onEnded={() => setIsPlaying(false)}
              onError={() =>
                setPlaybackError(
                  'Format ini dapat digunakan sebagai media project, tetapi preview langsung belum didukung oleh engine preview browser.'
                )
              }
              className="w-full h-full object-contain"
            />
          )}

          {previewItem.type === 'audio' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#091512] to-[#040907] relative">
              <audio
                ref={audioRef}
                src={previewItem.blobUrl}
                loop={isLooping}
                onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
                onLoadedMetadata={() =>
                  audioRef.current && setDuration(audioRef.current.duration || previewItem.duration || 0)
                }
                onEnded={() => setIsPlaying(false)}
                onError={() =>
                  setPlaybackError(
                    'Audio codec preview belum didukung secara langsung oleh platform browser.'
                  )
                }
              />
              <div className="w-20 h-20 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center mb-4 shadow-xl">
                <Music className="w-10 h-10 text-emerald-400 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-slate-100 truncate max-w-md">
                {previewItem.name}
              </h4>
              <p className="text-xs text-emerald-400 font-mono mt-1">
                {previewItem.sampleRate ? `${previewItem.sampleRate} Hz` : 'Audio Track'} •{' '}
                {previewItem.channels === 1 ? 'Mono' : 'Stereo'}
              </p>
            </div>
          )}

          {previewItem.type === 'image' && (
            <div className="w-full h-full flex items-center justify-center p-2 bg-[#090b10]">
              <img
                src={previewItem.blobUrl || previewItem.thumbnail}
                alt={previewItem.name}
                className="max-h-full max-w-full object-contain rounded"
              />
            </div>
          )}
        </div>

        {/* Transport Controls for Video & Audio */}
        {previewItem.type !== 'image' && (
          <div className="bg-[#12151d] border border-[#222836] rounded-lg p-3 flex flex-col gap-2 select-none">
            {/* Scrubber timeline */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-blue-400 w-14">
                {secondsToTimecode(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={activeDuration || 1}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-[#232938] rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="font-mono text-[11px] text-slate-400 w-14 text-right">
                {secondsToTimecode(activeDuration)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStop}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2533] transition-colors"
                  title="Stop (Reset to 0)"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors text-xs"
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
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isLooping ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title={isLooping ? 'Loop: ON' : 'Loop: OFF'}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Volume & Fullscreen */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 bg-[#0a0c10] border border-[#212735] px-2 py-1 rounded-md">
                  <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                    className="w-16 h-1 bg-[#232938] rounded appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="font-mono text-[10px] text-slate-400 w-6 text-right">
                    {isMuted ? 0 : volume}%
                  </span>
                </div>

                {previewItem.type === 'video' && (
                  <button
                    onClick={handleFullscreen}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f2533] transition-colors"
                    title="Fullscreen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quick Metadata Pill Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-300">
          <span className="px-2 py-0.5 rounded bg-[#171b26] border border-[#252c3c] font-mono">
            {previewItem.extension.toUpperCase()}
          </span>
          {previewItem.width && previewItem.height && (
            <span className="px-2 py-0.5 rounded bg-[#171b26] border border-[#252c3c] font-mono">
              {previewItem.width} × {previewItem.height}
            </span>
          )}
          {previewItem.fps && (
            <span className="px-2 py-0.5 rounded bg-[#171b26] border border-[#252c3c] font-mono">
              {previewItem.fps} FPS
            </span>
          )}
          {previewItem.codec && (
            <span className="px-2 py-0.5 rounded bg-[#171b26] border border-[#252c3c] font-mono">
              {previewItem.codec}
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-[#171b26] border border-[#252c3c] font-mono">
            {formatBytes(previewItem.size)}
          </span>
        </div>
      </div>
    </Modal>
  );
};
