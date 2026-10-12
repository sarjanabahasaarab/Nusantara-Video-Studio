/**
 * Nusantara Video Studio - Professional Workflow Store
 * Phase 8: Professional Editing Workflow
 *
 * Coordinates Proxy, Relink, Project Bins, Markers, Multicam, Command Palette,
 * Background Tasks, Workspaces, and Performance Monitoring.
 */

import { create } from 'zustand';
import {
  ProxySettings,
  ProjectBin,
  Marker,
  MarkerType,
  MulticamGroup,
  BackgroundTask,
  CustomWorkspace,
  StudioWorkspaceId,
  ProjectHealthReport,
  RecentProjectItem,
  SystemPerformanceMetrics,
  RecoverySessionInfo,
  MediaItem,
} from '../types';
import { ProxyManager, DEFAULT_PROXY_SETTINGS } from '../engine/workflow/ProxyManager';
import { TaskManager } from '../engine/workflow/TaskManager';
import { MarkerManager } from '../engine/workflow/MarkerManager';
import { MulticamManager } from '../engine/workflow/MulticamManager';
import { ProjectHealthChecker } from '../engine/workflow/ProjectHealthChecker';
import { RecentProjectsManager } from '../engine/workflow/RecentProjectsManager';
import { AutosaveRecoveryManager } from '../engine/workflow/AutosaveRecoveryManager';
import { useProjectStore } from './projectStore';
import { useUIStore } from './uiStore';

// Default Studio Project Bins (Requirement 7)
export const DEFAULT_BINS: ProjectBin[] = [
  { id: 'bin-video', name: 'Video', color: '#3b82f6', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-audio', name: 'Audio', color: '#ec4899', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-images', name: 'Images', color: '#10b981', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-music', name: 'Music', color: '#8b5cf6', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-voice', name: 'Voice', color: '#06b6d4', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-graphics', name: 'Graphics', color: '#f59e0b', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-logos', name: 'Logos', color: '#6366f1', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-subtitles', name: 'Subtitles', color: '#14b8a6', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-scenes', name: 'Scenes', color: '#f97316', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
  { id: 'bin-exports', name: 'Exports', color: '#64748b', parentId: null, mediaIds: [], isOpen: true, createdAt: new Date().toISOString() },
];

interface WorkflowState {
  // Proxy Media
  proxySettings: ProxySettings;
  proxyEnabled: boolean;
  toggleProxy: () => void;
  setProxyEnabled: (enabled: boolean) => void;
  updateProxySettings: (partial: Partial<ProxySettings>) => void;
  generateProxyForMedia: (mediaId: string) => Promise<void>;

  // Project Bins
  bins: ProjectBin[];
  activeBinId: string | null;
  createBin: (name: string, parentId?: string | null, color?: string) => void;
  renameBin: (binId: string, newName: string) => void;
  deleteBin: (binId: string) => void;
  moveMediaToBin: (mediaId: string, binId: string | null) => void;
  setActiveBinId: (binId: string | null) => void;

  // Markers
  markers: Marker[];
  markerFilterType: MarkerType | 'all';
  markerSearchQuery: string;
  addMarker: (time: number, name: string, type?: MarkerType, options?: { description?: string; color?: string; duration?: number }) => Marker;
  updateMarker: (id: string, partial: Partial<Marker>) => void;
  deleteMarker: (id: string) => void;
  duplicateMarker: (id: string) => void;
  setMarkerFilterType: (filter: MarkerType | 'all') => void;
  setMarkerSearchQuery: (query: string) => void;

  // Multicam
  multicamGroups: MulticamGroup[];
  createMulticamGroup: (name: string, mediaItems: MediaItem[], syncMethod?: 'timecode' | 'audio' | 'manual', audioSourceId?: string) => MulticamGroup;
  syncMulticamGroup: (groupId: string) => { success: boolean; message: string };

  // Command Palette
  isCommandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;

  // Workspaces
  customWorkspaces: CustomWorkspace[];
  saveCurrentWorkspace: (name: string) => void;
  deleteCustomWorkspace: (id: string) => void;

  // Background Tasks
  backgroundTasks: BackgroundTask[];
  cancelTask: (id: string) => void;
  clearCompletedTasks: () => void;

  // Project Health Check
  healthReport: ProjectHealthReport | null;
  runHealthCheck: () => ProjectHealthReport;

  // Recent Projects
  recentProjects: RecentProjectItem[];
  refreshRecentProjects: () => void;
  removeRecentProject: (id: string) => void;

  // Crash Recovery
  pendingRecovery: RecoverySessionInfo | null;
  checkRecovery: () => void;
  discardRecovery: () => void;

  // Performance Monitor
  metrics: SystemPerformanceMetrics;
  updateMetrics: (partial: Partial<SystemPerformanceMetrics>) => void;
}

const proxyManager = ProxyManager.getInstance();
const taskManager = TaskManager.getInstance();

export const useWorkflowStore = create<WorkflowState>((set, get) => {
  // Subscribe to background task updates
  taskManager.subscribe((backgroundTasks) => {
    set({ backgroundTasks });
  });

  return {
    proxySettings: proxyManager.getSettings(),
    proxyEnabled: false,

    toggleProxy: () => {
      const next = !get().proxyEnabled;
      set({ proxyEnabled: next });
      useUIStore.getState().notify(
        'Proxy Playback',
        next ? 'Proxy ON (Menggunakan video beresolusi rendah untuk performa)' : 'Proxy OFF (Menggunakan media original)',
        'info',
        1500
      );
    },

    setProxyEnabled: (proxyEnabled) => set({ proxyEnabled }),

    updateProxySettings: (partial) => {
      proxyManager.updateSettings(partial);
      set({ proxySettings: proxyManager.getSettings() });
    },

    generateProxyForMedia: async (mediaId) => {
      const projectStore = useProjectStore.getState();
      const media = projectStore.currentProject.media.find((m) => m.id === mediaId);
      if (!media) return;

      // Register background task
      taskManager.addTask(
        `Generate Proxy: ${media.name}`,
        'proxy',
        'normal',
        async (updateProgress) => {
          const proxyInfo = await proxyManager.generateProxy(media, updateProgress);
          useProjectStore.setState((state) => ({
            currentProject: {
              ...state.currentProject,
              media: state.currentProject.media.map((m) =>
                m.id === mediaId ? { ...m, proxy: proxyInfo } : m
              ),
            },
            isDirty: true,
          }));
        }
      );
    },

    // Bins
    bins: DEFAULT_BINS,
    activeBinId: null,

    createBin: (name, parentId = null, color = '#3b82f6') => {
      const newBin: ProjectBin = {
        id: `bin-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: name.trim() || 'New Bin',
        color,
        parentId,
        mediaIds: [],
        isOpen: true,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ bins: [...state.bins, newBin] }));
    },

    renameBin: (binId, newName) => {
      set((state) => ({
        bins: state.bins.map((b) => (b.id === binId ? { ...b, name: newName } : b)),
      }));
    },

    deleteBin: (binId) => {
      set((state) => ({
        bins: state.bins.filter((b) => b.id !== binId),
        activeBinId: state.activeBinId === binId ? null : state.activeBinId,
      }));
    },

    moveMediaToBin: (mediaId, binId) => {
      set((state) => ({
        bins: state.bins.map((b) => {
          const filtered = b.mediaIds.filter((id) => id !== mediaId);
          if (b.id === binId) {
            return { ...b, mediaIds: [...filtered, mediaId] };
          }
          return { ...b, mediaIds: filtered };
        }),
      }));
      useProjectStore.setState((state) => ({
        currentProject: {
          ...state.currentProject,
          media: state.currentProject.media.map((m) =>
            m.id === mediaId ? { ...m, binId } : m
          ),
        },
      }));
    },

    setActiveBinId: (activeBinId) => set({ activeBinId }),

    // Markers
    markers: [],
    markerFilterType: 'all',
    markerSearchQuery: '',

    addMarker: (time, name, type = 'general', options) => {
      const marker = MarkerManager.createMarker(time, name, type, options);
      set((state) => ({ markers: [...state.markers, marker] }));

      // Also sync to project timeline markers for backward compatibility
      useProjectStore.getState().addMarker(marker.time, marker.name, marker.color);
      return marker;
    },

    updateMarker: (id, partial) => {
      set((state) => ({
        markers: state.markers.map((m) => (m.id === id ? { ...m, ...partial } : m)),
      }));
    },

    deleteMarker: (id) => {
      set((state) => ({
        markers: state.markers.filter((m) => m.id !== id),
      }));
      useProjectStore.getState().removeMarker(id);
    },

    duplicateMarker: (id) => {
      const found = get().markers.find((m) => m.id === id);
      if (found) {
        get().addMarker(found.time + 1, `${found.name} (Copy)`, found.type, {
          description: found.description,
          color: found.color,
          duration: found.duration,
        });
      }
    },

    setMarkerFilterType: (markerFilterType) => set({ markerFilterType }),
    setMarkerSearchQuery: (markerSearchQuery) => set({ markerSearchQuery }),

    // Multicam
    multicamGroups: [],

    createMulticamGroup: (name, mediaItems, syncMethod = 'manual', audioSourceId) => {
      const group = MulticamManager.createGroup(name, mediaItems, syncMethod, audioSourceId);
      set((state) => ({ multicamGroups: [...state.multicamGroups, group] }));
      return group;
    },

    syncMulticamGroup: (groupId) => {
      const group = get().multicamGroups.find((g) => g.id === groupId);
      if (!group) return { success: false, message: 'Grup multicam tidak ditemukan.' };

      const result = MulticamManager.syncGroup(group);
      if (result.success) {
        set((state) => ({
          multicamGroups: state.multicamGroups.map((g) =>
            g.id === groupId ? result.group : g
          ),
        }));
      }
      return result;
    },

    // Command Palette
    isCommandPaletteOpen: false,
    openCommandPalette: () => set({ isCommandPaletteOpen: true }),
    closeCommandPalette: () => set({ isCommandPaletteOpen: false }),
    toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),

    // Workspaces
    customWorkspaces: [],
    saveCurrentWorkspace: (name) => {
      const ui = useUIStore.getState();
      const custom: CustomWorkspace = {
        id: `ws-${Date.now()}`,
        name,
        sidebarWidth: ui.sidebarWidth,
        propertiesWidth: ui.propertiesWidth,
        timelineHeight: ui.timelineHeight,
        sidebarTab: ui.activeSidebarTab,
        visiblePanels: ['media', 'preview', 'timeline', 'properties'],
        previewQuality: ui.previewQuality,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ customWorkspaces: [...state.customWorkspaces, custom] }));
      ui.notify('Workspace', `Tata letak workspace "${name}" berhasil disimpan.`, 'success');
    },

    deleteCustomWorkspace: (id) => {
      set((state) => ({
        customWorkspaces: state.customWorkspaces.filter((w) => w.id !== id),
      }));
    },

    // Background Tasks
    backgroundTasks: taskManager.getTasks(),
    cancelTask: (id) => taskManager.cancelTask(id),
    clearCompletedTasks: () => taskManager.clearCompleted(),

    // Health Check
    healthReport: null,
    runHealthCheck: () => {
      const project = useProjectStore.getState().currentProject;
      const report = ProjectHealthChecker.runHealthCheck(project);
      set({ healthReport: report });
      return report;
    },

    // Recents
    recentProjects: RecentProjectsManager.getRecentProjects(),
    refreshRecentProjects: () => {
      set({ recentProjects: RecentProjectsManager.getRecentProjects() });
    },
    removeRecentProject: (id) => {
      const updated = RecentProjectsManager.removeProject(id);
      set({ recentProjects: updated });
    },

    // Recovery
    pendingRecovery: null,
    checkRecovery: () => {
      const rec = AutosaveRecoveryManager.checkForCrashRecovery();
      if (rec) set({ pendingRecovery: rec });
    },
    discardRecovery: () => {
      const current = get().pendingRecovery;
      if (current) {
        AutosaveRecoveryManager.discardRecovery(current.projectId);
        set({ pendingRecovery: null });
      }
    },

    // Performance
    metrics: {
      fps: 60,
      droppedFrames: 0,
      timelineClipCount: 0,
      mediaItemCount: 0,
      activeBackgroundTasks: 0,
      playbackQuality: 'full',
    },
    updateMetrics: (partial) => {
      set((state) => ({ metrics: { ...state.metrics, ...partial } }));
    },
  };
});
