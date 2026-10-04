/**
 * Nusantara Video Studio - Capture Store
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Coordinates UI states, input devices, and active capture configs.
 */

import { create } from 'zustand';
import { CaptureConfig, CaptureMode, MediaItem } from '../types';
import { captureManager } from '../engine/capture/CaptureManager';

interface CaptureState {
  activeModal: CaptureMode | null;
  isRecording: boolean;
  isPaused: boolean;
  elapsedSeconds: number;
  audioLevel: number; // 0.0 to 1.0 (VU Meter)
  lastRecordedItem: MediaItem | null;

  // Device lists
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];

  // Configurations
  screenConfig: CaptureConfig;
  cameraConfig: CaptureConfig;
  voiceConfig: CaptureConfig;

  // Actions
  openModal: (mode: CaptureMode) => void;
  closeModal: () => void;
  loadDevices: () => Promise<void>;
  setScreenConfig: (partial: Partial<CaptureConfig>) => void;
  setCameraConfig: (partial: Partial<CaptureConfig>) => void;
  setVoiceConfig: (partial: Partial<CaptureConfig>) => void;
  setRecordingState: (isRecording: boolean, isPaused?: boolean) => void;
  setProgress: (elapsed: number, level: number) => void;
  setLastRecordedItem: (item: MediaItem | null) => void;
}

export const useCaptureStore = create<CaptureState>((set, get) => ({
  activeModal: null,
  isRecording: false,
  isPaused: false,
  elapsedSeconds: 0,
  audioLevel: 0,
  lastRecordedItem: null,

  cameras: [],
  microphones: [],

  screenConfig: {
    mode: 'screen',
    screenAreaMode: 'fullscreen',
    includeSystemAudio: true,
    includeMicrophone: true,
    resolution: { width: 1920, height: 1080 },
    fps: 30,
  },

  cameraConfig: {
    mode: 'camera',
    includeSystemAudio: false,
    includeMicrophone: true,
    resolution: { width: 1280, height: 720 },
    fps: 30,
  },

  voiceConfig: {
    mode: 'voice',
    includeSystemAudio: false,
    includeMicrophone: true,
    resolution: { width: 0, height: 0 },
    fps: 0,
  },

  openModal: (mode) => {
    set({ activeModal: mode, elapsedSeconds: 0, audioLevel: 0, isRecording: false, isPaused: false });
    get().loadDevices();
  },

  closeModal: () => {
    if (get().isRecording) {
      if (confirm('Perekaman sedang berlangsung. Hentikan perekaman sekarang?')) {
        if (get().activeModal === 'screen') captureManager.stopScreenRecording();
        else if (get().activeModal === 'camera') captureManager.stopCameraRecording();
        else if (get().activeModal === 'voice') captureManager.stopVoiceRecording();
      } else {
        return;
      }
    }
    set({ activeModal: null, isRecording: false, isPaused: false });
  },

  loadDevices: async () => {
    const devices = await captureManager.getDevices();
    set({ cameras: devices.cameras, microphones: devices.microphones });

    // Auto-select first devices if not configured
    const state = get();
    if (!state.cameraConfig.videoDeviceId && devices.cameras[0]) {
      get().setCameraConfig({ videoDeviceId: devices.cameras[0].deviceId });
    }
    if (!state.screenConfig.audioDeviceId && devices.microphones[0]) {
      get().setScreenConfig({ audioDeviceId: devices.microphones[0].deviceId });
    }
    if (!state.cameraConfig.audioDeviceId && devices.microphones[0]) {
      get().setCameraConfig({ audioDeviceId: devices.microphones[0].deviceId });
    }
    if (!state.voiceConfig.audioDeviceId && devices.microphones[0]) {
      get().setVoiceConfig({ audioDeviceId: devices.microphones[0].deviceId });
    }
  },

  setScreenConfig: (partial) =>
    set((state) => ({ screenConfig: { ...state.screenConfig, ...partial } })),

  setCameraConfig: (partial) =>
    set((state) => ({ cameraConfig: { ...state.cameraConfig, ...partial } })),

  setVoiceConfig: (partial) =>
    set((state) => ({ voiceConfig: { ...state.voiceConfig, ...partial } })),

  setRecordingState: (isRecording, isPaused = false) => set({ isRecording, isPaused }),

  setProgress: (elapsed, level) => set({ elapsedSeconds: elapsed, audioLevel: level }),

  setLastRecordedItem: (item) => set({ lastRecordedItem: item }),
}));
