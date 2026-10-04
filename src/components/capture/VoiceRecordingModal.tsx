/**
 * Nusantara Video Studio - Voice Recording Modal
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Dedicated voiceover and microphone recorder with live waveform monitor,
 * VU level meter, timer, and automatic Media Library & Timeline placement.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useCaptureStore } from '../../stores/captureStore';
import { captureManager } from '../../engine/capture/CaptureManager';
import { useUIStore } from '../../stores/uiStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { secondsToTimecode } from '../../utils/timecode';
import {
  Mic,
  Square,
  Play,
  Pause,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Clip, MediaItem } from '../../types';

export const VoiceRecordingModal: React.FC = () => {
  const activeModal = useCaptureStore((s) => s.activeModal);
  const closeModal = useCaptureStore((s) => s.closeModal);
  const voiceConfig = useCaptureStore((s) => s.voiceConfig);
  const setVoiceConfig = useCaptureStore((s) => s.setVoiceConfig);
  const microphones = useCaptureStore((s) => s.microphones);
  const loadDevices = useCaptureStore((s) => s.loadDevices);
  const notify = useUIStore((s) => s.notify);
  const addClipToTrack = useTimelineStore((s) => s.addClipToTrack);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [vuLevel, setVuLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<MediaItem | null>(null);
  const waveHistoryRef = useRef<number[]>([]);

  const isOpen = activeModal === 'voice';

  useEffect(() => {
    if (!isOpen) {
      setIsRecording(false);
      setIsPaused(false);
      setElapsed(0);
      setVuLevel(0);
      setErrorMsg(null);
      setCapturedMedia(null);
      waveHistoryRef.current = [];
    }
  }, [isOpen]);

  // Handle live progress and waveform rendering
  useEffect(() => {
    const unsubProgress = captureManager.on('recording-progress', (data: unknown) => {
      const p = data as { elapsedSeconds: number; audioLevel: number };
      setElapsed(p.elapsedSeconds);
      setVuLevel(p.audioLevel);

      // Append to waveform history
      waveHistoryRef.current.push(p.audioLevel);
      if (waveHistoryRef.current.length > 80) {
        waveHistoryRef.current.shift();
      }

      // Draw live waveform on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Center line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, h / 2);
          ctx.lineTo(w, h / 2);
          ctx.stroke();

          // Waveform bars
          const bars = waveHistoryRef.current;
          const barWidth = Math.max(3, w / 80);
          for (let i = 0; i < bars.length; i++) {
            const barH = Math.max(4, bars[i] * (h - 16));
            const x = i * barWidth;
            const y = (h - barH) / 2;

            ctx.fillStyle = bars[i] > 0.8 ? '#ef4444' : bars[i] > 0.6 ? '#f59e0b' : '#10b981';
            ctx.beginPath();
            ctx.roundRect(x, y, barWidth - 1, barH, 2);
            ctx.fill();
          }
        }
      }
    });

    const unsubPaused = captureManager.on('recording-paused', () => setIsPaused(true));
    const unsubResumed = captureManager.on('recording-resumed', () => setIsPaused(false));

    return () => {
      unsubProgress();
      unsubPaused();
      unsubResumed();
    };
  }, []);

  const handleStartRecording = async () => {
    setErrorMsg(null);
    waveHistoryRef.current = [];
    try {
      await captureManager.startVoiceRecording(voiceConfig);
      setIsRecording(true);
      setIsPaused(false);
      notify('Voice Recording Dimulai', 'Merekam suara dari microphone...', 'info', 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStopRecording = async () => {
    try {
      const item = await captureManager.stopVoiceRecording();
      setIsRecording(false);
      setIsPaused(false);
      if (item) {
        setCapturedMedia(item);
        notify(
          'Rekaman Suara Selesai',
          `Berkas ${item.name} berhasil disimpan dan masuk ke Media Library.`,
          'success',
          3500
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddToTimeline = () => {
    if (!capturedMedia) return;
    const targetTrack = tracks.find((t) => t.type === 'audio') || tracks[tracks.length - 1];
    if (!targetTrack) return;

    const clip: Clip = {
      id: `clip-voice-${Date.now()}`,
      trackId: targetTrack.id,
      name: capturedMedia.name,
      type: 'voice-recording',
      mediaId: capturedMedia.id,
      startTime: useTimelineStore.getState().currentTime,
      duration: capturedMedia.duration || 5,
      sourceStartTime: 0,
      sourceDuration: capturedMedia.duration || 5,
      color: '#059669',
      transform: { positionX: 0, positionY: 0, rotation: 0, opacity: 1 },
      speed: { rate: 1, reverse: false },
      audio: { volume: 100, pan: 0, mute: false, fadeIn: 0.2, fadeOut: 0.2 },
    };

    addClipToTrack(targetTrack.id, clip);
    notify('Ditaruh di Audio Track', `Rekaman suara ditaruh di track ${targetTrack.name}.`, 'success');
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Voice Recording"
      subtitle="Rekam suara / voiceover langsung dari microphone ke audio track"
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4 text-xs select-none">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-100">Perekaman Suara Gagal</span>
              <p className="text-[11px] mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Live Audio Visualizer Canvas */}
        <div className="relative h-36 bg-[#080b11] border border-[#202636] rounded-xl overflow-hidden flex flex-col items-center justify-center shadow-inner">
          <canvas
            ref={canvasRef}
            width={480}
            height={130}
            className="w-full h-full object-cover"
          />

          {!isRecording && !capturedMedia && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-2 shadow-lg">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
              <p className="font-semibold text-slate-200 text-xs">VOICE LEVEL MONITOR</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Tekan tombol Mulai Merekam untuk mulai merekam narasi atau voiceover.
              </p>
            </div>
          )}

          {/* Recording Timer Badge */}
          {isRecording && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2 bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-full border border-red-500/40">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-xs font-bold text-white tracking-wider">
                REC {secondsToTimecode(elapsed)}
              </span>
              {isPaused && (
                <span className="px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-bold">
                  PAUSED
                </span>
              )}
            </div>
          )}

          {/* Live VU Meter */}
          {isRecording && (
            <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2 bg-black/70 px-2.5 py-1 rounded border border-white/5">
              <span className="text-[9px] font-mono text-slate-400 uppercase">VU Level:</span>
              <div className="flex-1 h-1.5 bg-[#171c26] rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.round(vuLevel * 100)}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                />
              </div>
              <span className="font-mono text-[9px] text-emerald-400 w-8 text-right">
                {Math.round(vuLevel * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Microphone Source Selection */}
        {!isRecording && !capturedMedia && (
          <div className="flex flex-col gap-1.5 p-3 bg-[#11141c] border border-[#202534] rounded-lg">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilih Sumber Microphone:</span>
              </span>
              <button
                type="button"
                onClick={() => loadDevices()}
                className="text-slate-500 hover:text-slate-300 flex items-center gap-1"
                title="Refresh Perangkat"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="text-[10px]">Refresh</span>
              </button>
            </div>
            <select
              value={voiceConfig.audioDeviceId || ''}
              onChange={(e) => setVoiceConfig({ audioDeviceId: e.target.value })}
              className="bg-[#0a0c10] border border-[#262c3e] rounded px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
            >
              {microphones.length === 0 ? (
                <option value="">Default Microphone</option>
              ) : (
                microphones.map((m) => (
                  <option key={m.deviceId} value={m.deviceId}>
                    {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Finished State */}
        {capturedMedia && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-600/40 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="font-semibold text-emerald-100">{capturedMedia.name}</p>
                <p className="text-[10px] text-emerald-300">
                  Durasi: {capturedMedia.duration?.toFixed(1)} detik • Masuk ke Media Library
                </p>
              </div>
            </div>
            <button
              onClick={handleAddToTimeline}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Masukkan ke Audio Track</span>
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#202534]">
          <span className="text-[11px] text-slate-500">
            {isRecording ? 'Perekaman suara aktif' : 'Opus / WAV Audio Studio Quality'}
          </span>

          <div className="flex items-center gap-2">
            {!isRecording ? (
              <>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleStartRecording}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold shadow-md flex items-center gap-1.5 transition-colors"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>START RECORDING</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    isPaused ? captureManager.resumeRecording() : captureManager.pauseRecording()
                  }
                  className="px-3 py-1.5 rounded-lg bg-[#202737] hover:bg-[#2a3449] text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStopRecording}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold shadow flex items-center gap-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>STOP RECORDING</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
