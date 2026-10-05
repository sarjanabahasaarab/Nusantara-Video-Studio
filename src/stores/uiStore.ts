/**
 * Nusantara Video Studio - UI Store
 * Manages layout resizing, sidebar tabs, dialog states, and toast notifications.
 */

import { create } from 'zustand';
import { AppNotification, NotificationType } from '../types';

export type SidebarTab = 'media' | 'audio' | 'text' | 'transition' | 'effects' | 'filters';
export type ActiveDialog =
  | 'newProject'
  | 'projectSettings'
  | 'settings'
  | 'about'
  | 'shortcuts'
  | 'mediaTest'
  | 'textGenerator'
  | 'phase4Test'
  | null;

interface UIState {
  sidebarOpen: boolean;
  activeSidebarTab: SidebarTab;
  sidebarWidth: number; // in pixels
  propertiesWidth: number; // in pixels
  timelineHeight: number; // in pixels
  activeDialog: ActiveDialog;
  isFullscreen: boolean;
  notifications: AppNotification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  setSidebarWidth: (width: number) => void;
  setPropertiesWidth: (width: number) => void;
  setTimelineHeight: (height: number) => void;
  openDialog: (dialog: ActiveDialog) => void;
  closeDialog: () => void;
  toggleFullscreen: () => void;
  
  // Notification / Toast
  notify: (title: string, message: string, type?: NotificationType, duration?: number) => void;
  dismissNotification: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  activeSidebarTab: 'media',
  sidebarWidth: 320,
  propertiesWidth: 300,
  timelineHeight: 340,
  activeDialog: null,
  isFullscreen: false,
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab, sidebarOpen: true }),
  
  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(220, Math.min(w, 550)) }),
  setPropertiesWidth: (w) => set({ propertiesWidth: Math.max(240, Math.min(w, 500)) }),
  setTimelineHeight: (h) => set({ timelineHeight: Math.max(200, Math.min(h, 600)) }),

  openDialog: (dialog) => set({ activeDialog: dialog }),
  closeDialog: () => set({ activeDialog: null }),

  toggleFullscreen: () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      set({ isFullscreen: true });
    } else {
      document.exitFullscreen().catch(() => {});
      set({ isFullscreen: false });
    }
  },

  notify: (title, message, type = 'info', duration = 4000) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newNotif: AppNotification = {
      id,
      title,
      message,
      type,
      timestamp: Date.now(),
      duration,
    };

    set((state) => ({
      notifications: [...state.notifications.slice(-4), newNotif],
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().dismissNotification(id);
      }, duration);
    }
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
