/**
 * Nusantara Video Studio - Project Store
 * Handles current active project, project settings, and undo/redo history.
 */

import { create } from 'zustand';
import { Project, ProjectSettings, Track } from '../types';

export const createDefaultTracks = (): Track[] => [
  {
    id: 'track-v3',
    name: 'V3 (Overlay / PIP)',
    type: 'video',
    index: 0,
    locked: false,
    muted: false,
    hidden: false,
    clips: [],
  },
  {
    id: 'track-v2',
    name: 'V2 (Titles / Text)',
    type: 'video',
    index: 1,
    locked: false,
    muted: false,
    hidden: false,
    clips: [],
  },
  {
    id: 'track-v1',
    name: 'V1 (Main Video)',
    type: 'video',
    index: 2,
    locked: false,
    muted: false,
    hidden: false,
    clips: [],
  },
  {
    id: 'track-a1',
    name: 'A1 (Dialogue / Main Audio)',
    type: 'audio',
    index: 3,
    locked: false,
    muted: false,
    hidden: false,
    clips: [],
  },
  {
    id: 'track-a2',
    name: 'A2 (Music / BGM)',
    type: 'audio',
    index: 4,
    locked: false,
    muted: false,
    hidden: false,
    clips: [],
  },
  {
    id: 'track-a3',
    name: 'A3 (Sound Effects)',
    type: 'audio',
    index: 5,
    locked: false,
    muted: false,
    hidden: false,
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
    duration: customSettings?.duration || 120, // default 2 minutes timeline
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
    },
    metadata: {
      appVersion: '0.1.0',
      appName: 'Nusantara Video Studio',
    },
  };
};

interface ProjectState {
  currentProject: Project;
  isDirty: boolean;
  past: Project[];
  future: Project[];
  
  // Actions
  createNewProject: (settings?: Partial<ProjectSettings>) => void;
  loadProject: (project: Project) => void;
  updateSettings: (settings: Partial<ProjectSettings>) => void;
  setProjectName: (name: string) => void;
  updateTracks: (tracks: Track[]) => void;
  markSaved: () => void;
  
  // Undo/Redo
  pushHistorySnapshot: () => void;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 30;

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: createDefaultProject(),
  isDirty: false,
  past: [],
  future: [],

  pushHistorySnapshot: () => {
    const { currentProject, past } = get();
    // Deep clone snapshot
    const snapshot: Project = JSON.parse(JSON.stringify(currentProject));
    set({
      past: [...past.slice(-MAX_HISTORY), snapshot],
      future: [],
      isDirty: true,
    });
  },

  createNewProject: (settings) => {
    const newProj = createDefaultProject(settings);
    set({
      currentProject: newProj,
      isDirty: false,
      past: [],
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

  updateSettings: (newSettings) => {
    get().pushHistorySnapshot();
    const current = get().currentProject;
    set({
      currentProject: {
        ...current,
        settings: {
          ...current.settings,
          ...newSettings,
        },
        name: newSettings.name || current.name,
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  setProjectName: (name) => {
    get().pushHistorySnapshot();
    const current = get().currentProject;
    set({
      currentProject: {
        ...current,
        name,
        settings: {
          ...current.settings,
          name,
        },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  updateTracks: (tracks) => {
    const current = get().currentProject;
    set({
      currentProject: {
        ...current,
        timeline: {
          ...current.timeline,
          tracks,
        },
        updatedAt: new Date().toISOString(),
      },
      isDirty: true,
    });
  },

  markSaved: () => {
    set({ isDirty: false });
  },

  undo: () => {
    const { past, currentProject, future } = get();
    if (past.length === 0) return false;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    set({
      currentProject: previous,
      past: newPast,
      future: [currentProject, ...future],
      isDirty: true,
    });
    return true;
  },

  redo: () => {
    const { past, currentProject, future } = get();
    if (future.length === 0) return false;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      currentProject: next,
      past: [...past, currentProject],
      future: newFuture,
      isDirty: true,
    });
    return true;
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
}));
