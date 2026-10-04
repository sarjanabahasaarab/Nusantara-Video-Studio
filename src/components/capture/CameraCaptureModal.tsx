/**
 * Nusantara Video Studio - Camera Capture Modal
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Webcam video & audio recording with live monitor, camera switcher,
 * VU meter, timer, and automatic Media Library & Timeline ingestion.
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
  Camera,
  Square,
  Mic,
  Play,
  Pause,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Clip, MediaItem } from '../../types';

export const CameraCaptureModal: React.FC = () => {
  const activeModal = useCaptureStore((s) => s.activeModal);
  const closeModal = useCaptureStore((s) => s.closeModal);
  const cameraConfig = useCaptureStore((s) => s.cameraConfig);
  const setCameraConfig = useCaptureStore((s) => s.setCameraConfig);
  const cameras = useCaptureStore((s) => s.cameras);
  const microphones = useCaptureStore((s) => s.microphones);
  const loadDevices = useCaptureStore((s) => s.loadDevices);
  const notify = useUIStore((s) => s.notify);
  const addClipToTrack = useTimelineStore((s) => s.addClipToTrack);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [vuLevel, setVuLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<MediaItem | null>(null);

  const isOpen = activeModal === 'camera';

  // Start live preview when modal opens
  useEffect(() => {
    let localStream: MediaStream | null = null;

    if (isOpen) {
      setIsRecording(false);
      setIsPaused(false);
      setElapsed(0);
      setVuLevel(0);
      setErrorMsg(null);
      setCapturedMedia(null);

      // Start webcam preview stream
      navigator.mediaDevices
        ?.getUserMedia({
          video: cameraConfig.videoDeviceId
            ? { deviceId: { exact: cameraConfig.videoDeviceId } }
            : true,
          audio: false,
        })
        .then((stream) => {
          localStream = stream;
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = stream;
            videoPreviewRef.current.play().catch(() => {});
          }
        })
        .catch((e) => {
          console.warn('[CameraCapture] Live preview error:', e);
          setErrorMsg('Izin kamera belum diberikan atau kamera tidak terdeteksi.');
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
    };
  }, [isOpen, cameraConfig.videoDeviceId]);

  useEffect(() => {
    const unsubProgress = captureManager.on('recording-progress', (data: unknown) => {
      const p = data as { elapsedSeconds: number; audioLevel: number };
      setElapsed(p.elapsedSeconds);
      setVuLevel(p.audioLevel);
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
    try {
      const stream = await captureManager.startCameraRecording(cameraConfig);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }
      setIsRecording(true);
      setIsPaused(false);
      notify('Kamera Merekam', 'Merekam video kamera ke project...', 'info', 2500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleStopRecording = async () => {
    try {
      const item = await captureManager.stopCameraRecording();
      setIsRecording(false);
      setIsPaused(false);
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      if (item) {
        setCapturedMedia(item);
        notify('Perekaman Kamera Selesai', `Berkas ${item.name} disimpan ke Media Library.`, 'success', 3500);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddToTimeline = () => {
    if (!capturedMedia) return;
    const targetTrack = tracks.find((t) => t.type === 'video') || tracks[0];
    if (!targetTrack) return;

    const clip: Clip = {
      id: `clip-cam-${Date.now()}`,
      trackId: targetTrack.id,
      name: capturedMedia.name,
      type: 'camera-recording',
      mediaId: capturedMedia.id,
      startTime: useTimelineStore.getState().currentTime,
      duration: capturedMedia.duration || 10,
      sourceStartTime: 0,
      sourceDuration: capturedMedia.duration || 10,
      color: '#e11d48',
      transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
      speed: { rate: 1, reverse: false },
      audio: { volume: 100, pan: 0, mute: false },
    };

    addClipToTrack(targetTrack.id, clip);
    notify('Ditaruh di Timeline', `Kamera ditaruh di track ${targetTrack.name}.`, 'success');
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title="Camera Recording"
      subtitle="Rekam video langsung dari webcam atau kamera USB eksternal"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4 text-xs select-none">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-600/40 text-rose-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-rose-100">Perekaman Kamera Gagal</span>
              <p className="text-[11px] mt-0.5 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Live Camera Viewport */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#272e3f] flex items-center justify-center shadow-inner">
          <video
            ref={videoPreviewRef}
            muted
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Recording Badge */}
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

          {/* Audio VU Meter */}
          {isRecording && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2 bg-black/75 px-3 py-1 rounded border border-white/10">
              <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="flex-1 h-1.5 bg-[#1e2535] rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.round(vuLevel * 100)}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
                />
              </div>
              <span className="font-mono text-[9px] text-slate-400 w-8 text-right">
                {Math.round(vuLevel * 100)}%
              </span>
            </div>
          )}
        </div>

        {/* Device Selectors */}
        {!isRecording && !capturedMedia && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#11141c] border border-[#202534] rounded-lg">
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-blue-400" />
                  <span>Kamera:</span>
                </span>
                <button
                  type="button"
                  onClick={() => loadDevices()}
                  className="text-slate-500 hover:text-slate-300"
                  title="Refresh Perangkat"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <select
                value={cameraConfig.videoDeviceId || ''}
                onChange={(e) => setCameraConfig({ videoDeviceId: e.target.value })}
                className="bg-[#0a0c10] border border-[#262c3e] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                {cameras.length === 0 ? (
                  <option value="">Default Webcam</option>
                ) : (
                  cameras.map((c) => (
                    <option key={c.deviceId} value={c.deviceId}>
                      {c.label || `Kamera ${c.deviceId.slice(0, 5)}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                <span>Microphone:</span>
              </span>
              <select
                value={cameraConfig.audioDeviceId || ''}
                onChange={(e) => setCameraConfig({ audioDeviceId: e.target.value })}
                className="bg-[#0a0c10] border border-[#262c3e] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                {microphones.length === 0 ? (
                  <option value="">Default Mic</option>
                ) : (
                  microphones.map((m) => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        )}

        {/* Capture Finished State */}
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
              <span>Masukkan ke Timeline</span>
            </button>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#202534]">
          <span className="text-[11px] text-slate-500">
            {isRecording ? 'Perekaman kamera aktif' : 'Resolusi 1280×720 @ 30 FPS'}
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
