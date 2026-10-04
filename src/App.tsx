/**
 * Nusantara Video Studio - Desktop Video Editor
 * Phase 1: Foundation
 *
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { MenuBar } from './components/menu/MenuBar';
import { Toolbar } from './components/toolbar/Toolbar';
import { Workspace } from './components/layout/Workspace';
import { StatusBar } from './components/layout/StatusBar';
import { ToastContainer } from './components/common/ToastContainer';

import { NewProjectDialog } from './components/dialogs/NewProjectDialog';
import { ProjectSettingsDialog } from './components/dialogs/ProjectSettingsDialog';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { AboutDialog } from './components/dialogs/AboutDialog';
import { ShortcutsDialog } from './components/dialogs/ShortcutsDialog';

import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAutoSave } from './hooks/useAutoSave';
import { databaseService } from './services/databaseService';
import { useUIStore } from './stores/uiStore';

export default function App() {
  // Initialize Global Keyboard Hotkeys
  useKeyboardShortcuts();

  // Initialize AutoSave Architecture
  useAutoSave();

  const notify = useUIStore((s) => s.notify);

  // Initialize Database Service
  useEffect(() => {
    databaseService.initialize().then(() => {
      notify(
        'Nusantara Video Studio v0.1.0',
        'Phase 1 Foundation siap digunakan. Tekan Space untuk Play/Pause.',
        'info',
        3500
      );
    });
  }, [notify]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d0e12] text-slate-200 overflow-hidden select-none font-sans">
      {/* 1. Desktop Window Titlebar */}
      <TitleBar />

      {/* 2. Menu Bar */}
      <MenuBar />

      {/* 3. Fast Action Toolbar */}
      <Toolbar />

      {/* 4. Resizable Workspace (Sidebar | Preview | Properties & Timeline) */}
      <Workspace />

      {/* 5. Status Bar */}
      <StatusBar />

      {/* Modals & Dialogs */}
      <NewProjectDialog />
      <ProjectSettingsDialog />
      <SettingsDialog />
      <AboutDialog />
      <ShortcutsDialog />

      {/* Toast Notifications System */}
      <ToastContainer />
    </div>
  );
}
