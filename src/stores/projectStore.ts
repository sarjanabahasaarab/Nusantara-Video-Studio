/**
 * Nusantara Video Studio - Project Store
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Handles current active project, project settings, V1-V5 & A1-A5 tracks,
 * timeline markers, and undo/redo history.
 */

import { create } from 'zustand';
import { Clip, Project, ProjectSettings, TimelineMarker, Track } from '../types';

export const createDefaultTracks = (): Track[] => [
  {
    id: 'track-v5',
    name: 'V5 (Titles & Lower Thirds)',
    type: 'video',
    index: 0,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-v4',
    name: 'V4 (Graphics & Captions)',
    type: 'video',
    index: 1,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-v3',
    name: 'V3 (Overlay & PIP)',
    type: 'video',
    index: 2,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-v2',
    name: 'V2 (B-Roll & Cutaways)',
    type: 'video',
    index: 3,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-v1',
    name: 'V1 (Primary Video)',
    type: 'video',
    index: 4,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-a1',
    name: 'A1 (Primary Dialogue)',
    type: 'audio',
    index: 5,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-a2',
    name: 'A2 (Voiceover & Mic)',
    type: 'audio',
    index: 6,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-a3',
    name: 'A3 (Music & Score)',
    type: 'audio',
    index: 7,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-a4',
    name: 'A4 (Ambient & Atmosphere)',
    type: 'audio',
    index: 8,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
  {
    id: 'track-a5',
    name: 'A5 (Sound Effects)',
    type: 'audio',
    index: 9,
    locked: false,
    muted: false,
    hidden: false,
    solo: false,
    clips: [],
  },
];

export const createDefaultProject = (customSettings?: Partial<ProjectSettings>): Project => {
  const settings: ProjectSettings = {
    name: customSettings?.name || 'Untitled Project',
    width: customSettings?.width || 1920,
    height: customSettings?.height || 1080,
    fps: customSettings?.fps || 30,
    aspectRatio: customSettings?.aspectRatio || '16:9',
    duration: customSettings?.duration || 180, // default 3 minutes timeline
    sampleRate: customSettings?.sampleRate || 48000,
  };

  const id = `nvs-proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  return {
    projectVersion: 1,
    id,
    name: settings.name,
    createdAt: now,
    updatedAt: now,
    settings,
    media: [],
    timeline: {
      tracks: createDefaultTracks(),
      duration: settings.duration,
      markers: [],
    },
    metadata: {
      appVersion: '0.3.0',
      appName: 'Nusantara Video Studio',
    },
  };
};

/**
 * Nusantara Demo Project (Requirement 44)
 * Contains 2 videos, 2 images, 2 audio clips, 1 title, and 1 marker.
 */
export const createDemoProject = (): Project => {
  const base = createDefaultProject({ name: 'Nusantara Demo Project' });
  const tracks = createDefaultTracks();

  // 1. Primary Video Clip on V1
  const videoClip1: Clip = {
    id: 'demo-clip-v1-1',
    trackId: 'track-v1',
    name: 'Nusantara_Archipelago_4K.mp4',
    type: 'video',
    startTime: 0,
    duration: 18,
    sourceStartTime: 0,
    sourceDuration: 18,
    color: '#2563eb',
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    appearance: { brightness: 100, contrast: 105, saturation: 110, exposure: 0, temperature: 5, tint: 0 },
    basicEffects: { blur: 0, sharpen: 10, vignette: 15, grayscale: 0, sepia: 0 },
    speed: { rate: 1, reverse: false },
    audio: { volume: 100, pan: 0, mute: false },
  };

  // 2. Second Video Clip on V1
  const videoClip2: Clip = {
    id: 'demo-clip-v1-2',
    trackId: 'track-v1',
    name: 'Jakarta_Cityscape_Aerial.mp4',
    type: 'video',
    startTime: 20,
    duration: 15,
    sourceStartTime: 0,
    sourceDuration: 15,
    color: '#1d4ed8',
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    appearance: { brightness: 100, contrast: 100, saturation: 100, exposure: 0, temperature: 0, tint: 0 },
    basicEffects: { blur: 0, sharpen: 0, vignette: 0, grayscale: 0, sepia: 0 },
    speed: { rate: 1, reverse: false },
    audio: { volume: 100, pan: 0, mute: false },
  };

  // 3. Image Clip 1 on V2
  const imageClip1: Clip = {
    id: 'demo-clip-v2-1',
    trackId: 'track-v2',
    name: 'Borobudur_Sunrise.jpg',
    type: 'image',
    startTime: 5,
    duration: 8,
    sourceStartTime: 0,
    sourceDuration: 8,
    color: '#7c3aed',
    transform: { positionX: 200, positionY: -100, scaleX: 0.65, scaleY: 0.65, rotation: 0, opacity: 0.95 },
    appearance: { brightness: 105, contrast: 105, saturation: 115, exposure: 0, temperature: 10, tint: 0 },
    basicEffects: { blur: 0, sharpen: 0, vignette: 20, grayscale: 0, sepia: 0 },
    speed: { rate: 1, reverse: false },
  };

  // 4. Image Clip 2 on V3
  const imageClip2: Clip = {
    id: 'demo-clip-v3-1',
    trackId: 'track-v3',
    name: 'Batik_Texture_Watermark.png',
    type: 'image',
    startTime: 15,
    duration: 12,
    sourceStartTime: 0,
    sourceDuration: 12,
    color: '#9333ea',
    transform: { positionX: -350, positionY: -200, scaleX: 0.4, scaleY: 0.4, rotation: 0, opacity: 0.7 },
    appearance: { brightness: 100, contrast: 100, saturation: 100, exposure: 0, temperature: 0, tint: 0 },
    basicEffects: { blur: 0, sharpen: 0, vignette: 0, grayscale: 0, sepia: 0 },
    speed: { rate: 1, reverse: false },
  };

  // 5. Title Text Clip on V5
  const textClip: Clip = {
    id: 'demo-clip-v5-1',
    trackId: 'track-v5',
    name: 'Title: Nusantara Video Studio',
    type: 'text',
    startTime: 1,
    duration: 10,
    sourceStartTime: 0,
    sourceDuration: 10,
    color: '#d97706',
    transform: { positionX: 0, positionY: 150, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    textProps: {
      text: 'NUSANTARA VIDEO STUDIO',
      fontFamily: 'Inter',
      fontSize: 54,
      bold: true,
      italic: false,
      color: '#f8fafc',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      alignment: 'center',
      outlineWidth: 2,
      outlineColor: '#0284c7',
      shadowBlur: 12,
      shadowColor: '#000000',
      textPreset: 'title',
    },
    speed: { rate: 1, reverse: false },
  };

  // 6. Audio Clip 1 on A1 (Voiceover)
  const audioClip1: Clip = {
    id: 'demo-clip-a1-1',
    trackId: 'track-a1',
    name: 'Narrator_Voiceover_Intro.wav',
    type: 'audio',
    startTime: 2,
    duration: 16,
    sourceStartTime: 0,
    sourceDuration: 16,
    color: '#059669',
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    audio: {
      volume: 100,
      pan: 0,
      mute: false,
      fadeIn: 0.5,
      fadeOut: 1.0,
      keyframes: [
        { id: 'kf-1', time: 0, volume: 100 },
        { id: 'kf-2', time: 10, volume: 100 },
        { id: 'kf-3', time: 16, volume: 0 },
      ],
    },
    speed: { rate: 1, reverse: false },
  };

  // 7. Audio Clip 2 on A3 (Music Score)
  const audioClip2: Clip = {
    id: 'demo-clip-a3-1',
    trackId: 'track-a3',
    name: 'Traditional_Gamelan_BGM.wav',
    type: 'audio',
    startTime: 0,
    duration: 35,
    sourceStartTime: 0,
    sourceDuration: 35,
    color: '#047857',
    transform: { positionX: 0, positionY: 0, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 },
    audio: {
      volume: 75,
      pan: 0,
      mute: false,
      fadeIn: 2.0,
      fadeOut: 3.0,
      keyframes: [
        { id: 'kf-m1', time: 0, volume: 75 },
        { id: 'kf-m2', time: 15, volume: 45 }, // Ducking for voice
        { id: 'kf-m3', time: 22, volume: 80 },
      ],
    },
    speed: { rate: 1, reverse: false },
  };

  // Assign clips to tracks
  tracks.find((t) => t.id === 'track-v1')!.clips = [videoClip1, videoClip2];
  tracks.find((t) => t.id === 'track-v2')!.clips = [imageClip1];
  tracks.find((t) => t.id === 'track-v3')!.clips = [imageClip2];
  tracks.find((t) => t.id === 'track-v5')!.clips = [textClip];
  tracks.find((t) => t.id === 'track-a1')!.clips = [audioClip1];
  tracks.find((t) => t.id === 'track-a3')!.clips = [audioClip2];

  // 1 Marker (Requirement 44)
  const marker: TimelineMarker = {
    id: 'marker-demo-1',
    time: 5.0,
    name: 'Intro Transition Point',
    color: '#f59e0b',
  };

  base.timeline.tracks = tracks;
  base.timeline.markers = [marker];
  base.timeline.duration = 60; // 1 min demo timeline

  return base;
};

interface ProjectState {
  currentProject: Project;
  isDirty: boolean;
  past: Project[];
  future: Project[];

  // Actions
  createNewProject: (settings?: Partial<ProjectSettings>) => void;
  loadDemoProject: () => void;
  loadProject: (project: Project) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  setProjectName: (name: string) => void;
  updateTracks: (tracks: Track[]) => void;
  addMarker: (time: number, name?: string, color?: string) => void;
  removeMarker: (markerId: string) => void;
  markSaved: () => void;

  // Undo/Redo
  pushHistorySnapshot: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 40;

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: createDefaultProject(),
  isDirty: false,
  past: [],
  future: [],

  pushHistorySnapshot: () => {
    const { currentProject, past } = get();
    const snapshot: Project = JSON.parse(JSON.stringify(currentProject));
    set({
      past: [...past.slice(-MAX_HISTORY), snapshot],
      future: [],
      isDirty: true,
    });
  },

  createNewProject: (settings) => {
    const newProject = createDefaultProject(settings);
    set({
      currentProject: newProject,
      isDirty: false,
      past: [],
      future: [],
    });
  },

  loadDemoProject: () => {
    get().pushHistorySnapshot();
    const demo = createDemoProject();
    set({
      currentProject: demo,
      isDirty: true,
      future: [],
    });
  },

  loadProject: (project) => {
    set({
      currentProject: project,
      isDirty: false,
      past: [],
      future: [],
    });
  },

  updateSettings: (settings) => {
    get().pushHistorySnapshot();
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        settings: { ...state.currentProject.settings, ...settings },
        timeline: {
          ...state.currentProject.timeline,
          duration: settings.duration || state.currentProject.timeline.duration,
        },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  },

  setProjectName: (name) => {
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        name,
        settings: { ...state.currentProject.settings, name },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  },

  updateTracks: (tracks) => {
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, tracks },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    }));
  },

  addMarker: (time, name = 'Marker', color = '#38bdf8') => {
    get().pushHistorySnapshot();
    const currentMarkers = get().currentProject.timeline.markers || [];
    const newMarker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      time,
      name,
      color,
    };
    const updated = [...currentMarkers, newMarker].sort((a, b) => a.time - b.time);
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: { ...state.currentProject.timeline, markers: updated },
      },
      isDirty: true,
    }));
  },

  removeMarker: (markerId) => {
    get().pushHistorySnapshot();
    const currentMarkers = get().currentProject.timeline.markers || [];
    set((state) => ({
      currentProject: {
        ...state.currentProject,
        timeline: {
          ...state.currentProject.timeline,
          markers: currentMarkers.filter((m) => m.id !== markerId),
        },
      },
      isDirty: true,
    }));
  },

  markSaved: () => set({ isDirty: false }),

  undo: () => {
    const { past, currentProject, future } = get();
    if (past.length === 0) return false;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const currentSnapshot: Project = JSON.parse(JSON.stringify(currentProject));

    set({
      currentProject: previous,
      past: newPast,
      future: [currentSnapshot, ...future],
      isDirty: true,
    });
    return true;
  },

  redo: () => {
    const { future, currentProject, past } = get();
    if (future.length === 0) return false;

    const next = future[0];
    const newFuture = future.slice(1);
    const currentSnapshot: Project = JSON.parse(JSON.stringify(currentProject));

    set({
      currentProject: next,
      past: [...past, currentSnapshot],
      future: newFuture,
      isDirty: true,
    });
    return true;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
