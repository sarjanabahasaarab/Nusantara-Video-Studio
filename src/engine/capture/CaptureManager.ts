/**
 * Nusantara Video Studio - Capture Engine (CaptureManager)
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Implements real-time screen capture, webcam recording, and voice recording
 * using the HTML5 MediaStream Recording API and Web Audio API mixing,
 * with error resilience, event emission, VU level analysis, thumbnail generation,
 * and automatic ingestion into Media Library & Timeline.
 */

import { CaptureConfig, MediaItem } from '../../types';
import { mediaService } from '../../services/mediaService';
import { useMediaStore } from '../../stores/mediaStore';

export type CaptureEventName =
  | 'recording-started'
  | 'recording-paused'
  | 'recording-resumed'
  | 'recording-stopped'
  | 'recording-error'
  | 'recording-progress';

export interface CaptureProgressData {
  elapsedSeconds: number;
  audioLevel: number; // 0.0 to 1.0 (VU meter)
}

export type CaptureEventListener = (data?: unknown) => void;

export class CaptureManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private activeStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private timerInterval: number | null = null;
  private animFrameId: number | null = null;

  private startTime: number = 0;
  private elapsedSeconds: number = 0;
  private currentMode: 'screen' | 'camera' | 'voice' | null = null;
  private isPaused: boolean = false;

  private eventListeners: Map<CaptureEventName, Set<CaptureEventListener>> = new Map();

  constructor() {
    (['recording-started', 'recording-paused', 'recording-resumed', 'recording-stopped', 'recording-error', 'recording-progress'] as CaptureEventName[]).forEach(
      (ev) => this.eventListeners.set(ev, new Set())
    );
  }

  on(event: CaptureEventName, listener: CaptureEventListener): () => void {
    const set = this.eventListeners.get(event);
    if (set) {
      set.add(listener);
    }
    return () => {
      set?.delete(listener);
    };
  }

  private emit(event: CaptureEventName, data?: unknown): void {
    const set = this.eventListeners.get(event);
    if (set) {
      set.forEach((fn) => {
        try {
          fn(data);
        } catch (e) {
          console.error(`[CaptureManager] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state !== 'inactive';
  }

  getElapsedSeconds(): number {
    return this.elapsedSeconds;
  }

  getCurrentMode(): 'screen' | 'camera' | 'voice' | null {
    return this.currentMode;
  }

  /**
   * Helper to retrieve available video and audio input hardware devices.
   */
  async getDevices(): Promise<{ cameras: MediaDeviceInfo[]; microphones: MediaDeviceInfo[] }> {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        return { cameras: [], microphones: [] };
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        cameras: devices.filter((d) => d.kind === 'videoinput'),
        microphones: devices.filter((d) => d.kind === 'audioinput'),
      };
    } catch (e) {
      console.warn('[CaptureManager] Enumerate devices failed:', e);
      return { cameras: [], microphones: [] };
    }
  }

  /**
   * Screen Recording (Requirement 24)
   * Captures screen / window / tab, mixes with system audio & mic.
   */
  async startScreenRecording(config: CaptureConfig): Promise<MediaStream> {
    if (this.isRecording()) {
      throw new Error('Perekaman lain sedang aktif.');
    }

    try {
      this.currentMode = 'screen';
      this.recordedChunks = [];
      this.elapsedSeconds = 0;

      // 1. Get Display Media (Screen Stream)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: config.resolution.width },
          height: { ideal: config.resolution.height },
          frameRate: { ideal: config.fps },
        },
        audio: config.includeSystemAudio ? true : false,
      });

      let finalStream = displayStream;

      // 2. Mix with microphone audio if requested
      if (config.includeMicrophone) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: config.audioDeviceId ? { deviceId: { exact: config.audioDeviceId } } : true,
          });

          // Mix audio tracks via AudioContext
          const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (AudioContextClass) {
            this.audioContext = new AudioContextClass();
            const destination = this.audioContext.createMediaStreamDestination();

            // Connect display audio if present
            if (displayStream.getAudioTracks().length > 0) {
              const displaySource = this.audioContext.createMediaStreamSource(displayStream);
              displaySource.connect(destination);
            }

            // Connect mic audio
            const micSource = this.audioContext.createMediaStreamSource(micStream);
            this.analyserNode = this.audioContext.createAnalyser();
            this.analyserNode.fftSize = 64;
            micSource.connect(this.analyserNode);
            micSource.connect(destination);

            // Construct composite stream
            const combinedTracks = [
              ...displayStream.getVideoTracks(),
              ...destination.stream.getAudioTracks(),
            ];
            finalStream = new MediaStream(combinedTracks);
          }
        } catch (micErr) {
          console.warn('[CaptureManager] Microphone access failed or denied, proceeding with screen only:', micErr);
        }
      }

      this.activeStream = finalStream;

      // Auto stop when user clicks browser's native "Stop Sharing"
      displayStream.getVideoTracks()[0].onended = () => {
        if (this.isRecording()) {
          this.stopScreenRecording().catch((e) => console.error(e));
        }
      };

      this.setupRecorder(finalStream, 'video/webm;codecs=vp9,opus');
      this.startTimer();
      this.emit('recording-started', { mode: 'screen' });

      return finalStream;
    } catch (err) {
      this.currentMode = null;
      const msg = this.formatErrorMessage(err, 'screen');
      this.emit('recording-error', { error: msg });
      throw new Error(msg);
    }
  }

  async stopScreenRecording(): Promise<MediaItem | null> {
    return this.stopRecording('screen');
  }

  /**
   * Camera Recording (Requirement 25)
   * Captures webcam video and microphone audio.
   */
  async startCameraRecording(config: CaptureConfig): Promise<MediaStream> {
    if (this.isRecording()) {
      throw new Error('Perekaman lain sedang aktif.');
    }

    try {
      this.currentMode = 'camera';
      this.recordedChunks = [];
      this.elapsedSeconds = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: config.videoDeviceId
          ? { deviceId: { exact: config.videoDeviceId }, width: config.resolution.width, height: config.resolution.height, frameRate: config.fps }
          : { width: config.resolution.width, height: config.resolution.height, frameRate: config.fps },
        audio: config.includeMicrophone
          ? config.audioDeviceId
            ? { deviceId: { exact: config.audioDeviceId } }
            : true
          : false,
      });

      this.activeStream = stream;

      // Setup audio analyzer for VU meter
      if (stream.getAudioTracks().length > 0) {
        this.setupAudioAnalysis(stream);
      }

      this.setupRecorder(stream, 'video/webm;codecs=vp8,opus');
      this.startTimer();
      this.emit('recording-started', { mode: 'camera' });

      return stream;
    } catch (err) {
      this.currentMode = null;
      const msg = this.formatErrorMessage(err, 'camera');
      this.emit('recording-error', { error: msg });
      throw new Error(msg);
    }
  }

  async stopCameraRecording(): Promise<MediaItem | null> {
    return this.stopRecording('camera');
  }

  /**
   * Voice Recording (Requirement 23)
   * Captures high quality microphone audio with live waveform & VU metering.
   */
  async startVoiceRecording(config: CaptureConfig): Promise<MediaStream> {
    if (this.isRecording()) {
      throw new Error('Perekaman lain sedang aktif.');
    }

    try {
      this.currentMode = 'voice';
      this.recordedChunks = [];
      this.elapsedSeconds = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: config.audioDeviceId
          ? { deviceId: { exact: config.audioDeviceId }, echoCancellation: true, noiseSuppression: true }
          : { echoCancellation: true, noiseSuppression: true },
        video: false,
      });

      this.activeStream = stream;
      this.setupAudioAnalysis(stream);

      this.setupRecorder(stream, 'audio/webm;codecs=opus');
      this.startTimer();
      this.emit('recording-started', { mode: 'voice' });

      return stream;
    } catch (err) {
      this.currentMode = null;
      const msg = this.formatErrorMessage(err, 'voice');
      this.emit('recording-error', { error: msg });
      throw new Error(msg);
    }
  }

  async stopVoiceRecording(): Promise<MediaItem | null> {
    return this.stopRecording('voice');
  }

  /**
   * Pause / Resume toggle
   */
  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.emit('recording-paused');
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.emit('recording-resumed');
    }
  }

  /**
   * Generic recording terminator that converts chunks into a MediaItem
   * and automatically adds it to MediaLibrary.
   */
  private async stopRecording(mode: 'screen' | 'camera' | 'voice'): Promise<MediaItem | null> {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      return null;
    }

    return new Promise((resolve) => {
      this.stopTimer();

      this.mediaRecorder!.onstop = async () => {
        try {
          const isAudioOnly = mode === 'voice';
          const mimeType = isAudioOnly ? 'audio/webm' : 'video/webm';
          const blob = new Blob(this.recordedChunks, { type: mimeType });

          // Generate file name
          const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const extension = isAudioOnly ? 'webm' : 'mp4'; // Use standard mp4 container name for desktop NLE
          const prefix =
            mode === 'screen'
              ? 'screen-recording'
              : mode === 'camera'
              ? 'camera-recording'
              : 'voice-recording';
          const fileName = `${prefix}-${dateStr}.${extension}`;

          // Create File object
          const file = new File([blob], fileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          // Process and extract metadata through mediaService
          const mediaItem = await mediaService.processFile(file);

          // Tag recording type for specialized timeline rendering
          mediaItem.type =
            mode === 'screen'
              ? 'screen-recording'
              : mode === 'camera'
              ? 'camera-recording'
              : 'voice-recording';

          // Override duration if recorder captured a longer or shorter real time
          if (this.elapsedSeconds > 0) {
            mediaItem.duration = this.elapsedSeconds;
            if (mediaItem.metadata) {
              mediaItem.metadata.duration = this.elapsedSeconds;
            }
          }

          // Ingest into Media Library
          await useMediaStore.getState().addMedia(mediaItem);

          this.cleanup();
          this.emit('recording-stopped', { mediaItem, mode });
          resolve(mediaItem);
        } catch (err) {
          console.error('[CaptureManager] Error saving recording:', err);
          this.cleanup();
        }
      };

      if (this.mediaRecorder) {
        this.mediaRecorder.stop();
      } else {
        this.cleanup();
        resolve(null);
      }
    });
  }

  private setupRecorder(stream: MediaStream, preferredMime: string): void {
    let mimeType = preferredMime;
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (preferredMime.startsWith('video/')) {
        mimeType = 'video/webm';
      } else {
        mimeType = 'audio/webm';
      }
    }

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };
  }

  private setupAudioAnalysis(stream: MediaStream): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 64;
      this.analyserNode.smoothingTimeConstant = 0.5;
      source.connect(this.analyserNode);
    } catch (e) {
      console.warn('[CaptureManager] Audio analysis init failed:', e);
    }
  }

  private startTimer(): void {
    this.startTime = Date.now();
    this.elapsedSeconds = 0;
    this.isPaused = false;

    // Periodic time tick
    this.timerInterval = window.setInterval(() => {
      if (!this.isPaused) {
        this.elapsedSeconds += 1;
      }
    }, 1000);

    // High frequency VU level emitter
    const sampleVU = () => {
      let level = 0;
      if (this.analyserNode && !this.isPaused) {
        const data = new Uint8Array(this.analyserNode.frequencyBinCount);
        this.analyserNode.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i];
        }
        level = Math.min(1.0, (sum / (data.length * 255)) * 2.5);
      }

      this.emit('recording-progress', {
        elapsedSeconds: this.elapsedSeconds,
        audioLevel: level,
      } as CaptureProgressData);

      if (this.isRecording()) {
        this.animFrameId = requestAnimationFrame(sampleVU);
      }
    };

    this.animFrameId = requestAnimationFrame(sampleVU);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private cleanup(): void {
    this.stopTimer();

    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => track.stop());
      this.activeStream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.analyserNode = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.currentMode = null;
    this.isPaused = false;
  }

  private formatErrorMessage(err: unknown, mode: string): string {
    const errorStr = err instanceof Error ? err.name : String(err);
    if (errorStr.includes('NotAllowedError') || errorStr.includes('PermissionDeniedError')) {
      if (mode === 'screen') {
        return 'Izin screen capture dibatalkan atau ditolak oleh pengguna.';
      }
      return 'Izin akses kamera atau microphone ditolak. Izinkan akses perangkat di pengaturan sistem.';
    }
    if (errorStr.includes('NotFoundError') || errorStr.includes('DevicesNotFoundError')) {
      return 'Perangkat input (kamera / microphone) tidak ditemukan pada sistem.';
    }
    if (errorStr.includes('NotReadableError') || errorStr.includes('TrackStartError')) {
      return 'Perangkat sedang digunakan oleh aplikasi lain atau terkunci.';
    }
    return `Perekaman gagal: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export const captureManager = new CaptureManager();
