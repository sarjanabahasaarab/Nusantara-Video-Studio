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
import { MediaPreviewModal } from './components/dialogs/MediaPreviewModal';
import { MediaPropertiesModal } from './components/dialogs/MediaPropertiesModal';
import { RelinkMediaDialog } from './components/dialogs/RelinkMediaDialog';
import { ImportProgressModal } from './components/dialogs/ImportProgressModal';
import { MediaTestModal } from './components/dialogs/MediaTestModal';

import { ScreenCaptureModal } from './components/capture/ScreenCaptureModal';
import { CameraCaptureModal } from './components/capture/CameraCaptureModal';
import { VoiceRecordingModal } from './components/capture/VoiceRecordingModal';
import { TextGeneratorModal } from './components/text/TextGeneratorModal';
import { SubtitleEditorModal } from './components/subtitles/SubtitleEditorModal';
import { Phase5TestModal } from './components/dialogs/Phase5TestModal';
import { Phase6TestModal } from './components/dialogs/Phase6TestModal';
import { Phase7TestModal } from './components/dialogs/Phase7TestModal';
import { Phase8TestModal } from './components/dialogs/Phase8TestModal';

import { RecentProjectsModal } from './components/workflow/RecentProjectsModal';
import { ProjectArchiveModal } from './components/workflow/ProjectArchiveModal';
import { ProjectBackupModal } from './components/workflow/ProjectBackupModal';
import { ProjectMetadataModal } from './components/workflow/ProjectMetadataModal';
import { RelinkMediaWorkflowModal } from './components/workflow/RelinkMediaWorkflowModal';
import { MulticamModal } from './components/workflow/MulticamModal';
import { KeyboardCustomizationModal } from './components/workflow/KeyboardCustomizationModal';
import { TaskManagerModal } from './components/workflow/TaskManagerModal';
import { ProjectHealthModal } from './components/workflow/ProjectHealthModal';
import { MarkersModal } from './components/workflow/MarkersModal';
import { CommandPaletteModal } from './components/workflow/CommandPaletteModal';

import { ExportDialog } from './components/render/ExportDialog';
import { RenderQueueModal } from './components/render/RenderQueueModal';
import { ExportDetailsModal } from './components/render/ExportDetailsModal';
import { RenderLogModal } from './components/render/RenderLogModal';
import { ExportHistoryModal } from './components/render/ExportHistoryModal';
import { Phase9TestModal } from './components/dialogs/Phase9TestModal';
import { Phase10TestModal } from './components/dialogs/Phase10TestModal';
import { FirstRunWizardModal } from './components/setup/FirstRunWizardModal';
import { DiagnosticsModal } from './components/dialogs/DiagnosticsModal';
import { DocumentationModal } from './components/dialogs/DocumentationModal';
import { UpdateCheckerModal } from './components/dialogs/UpdateCheckerModal';
import { RenderJob } from './types/render';

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

  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const openDialog = useUIStore((s) => s.openDialog);

  const [inspectedJob, setInspectedJob] = React.useState<RenderJob | null>(null);
  const [inspectedLogJobId, setInspectedLogJobId] = React.useState<string | null>(null);

  // Initialize Database Service and check First-Run Experience
  useEffect(() => {
    databaseService.initialize().then(() => {
      const isFirstRun = typeof localStorage !== 'undefined' && localStorage.getItem('nvs_first_run_completed') !== 'true';
      if (isFirstRun) {
        openDialog('firstRunWizard');
      } else {
        notify(
          'Nusantara Video Studio v1.0.0',
          'Official Production Release v1.0.0 siap digunakan. Seluruh 10 Phase rekayasa selesai dan terverifikasi.',
          'info',
          4000
        );
      }
    });
  }, [notify, openDialog]);

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

      {/* Phase 1 Modals & Dialogs */}
      <NewProjectDialog />
      <ProjectSettingsDialog />
      <SettingsDialog />
      <AboutDialog />
      <ShortcutsDialog />

      {/* Phase 2 Media Modals */}
      <MediaPreviewModal />
      <MediaPropertiesModal />
      <RelinkMediaDialog />
      <ImportProgressModal />
      <MediaTestModal
        isOpen={activeDialog === 'mediaTest'}
        onClose={closeDialog}
      />

      {/* Phase 3 Capture Engine & Text Generator Modals */}
      <ScreenCaptureModal />
      <CameraCaptureModal />
      <VoiceRecordingModal />
      <TextGeneratorModal
        isOpen={activeDialog === 'textGenerator'}
        onClose={closeDialog}
      />
      <SubtitleEditorModal
        isOpen={activeDialog === 'subtitleEditor' || activeDialog === 'subtitleStudio'}
        onClose={closeDialog}
      />
      <Phase5TestModal
        isOpen={activeDialog === 'phase5Test'}
        onClose={closeDialog}
      />
      <Phase6TestModal
        isOpen={activeDialog === 'phase6Test'}
        onClose={closeDialog}
      />
      <Phase7TestModal
        isOpen={activeDialog === 'phase7Test'}
        onClose={closeDialog}
      />
      <Phase8TestModal
        isOpen={activeDialog === 'phase8Test'}
        onClose={closeDialog}
      />

      {/* Phase 8 Professional Editing Workflow Modals */}
      <RecentProjectsModal
        isOpen={activeDialog === 'recentProjects'}
        onClose={closeDialog}
      />
      <ProjectArchiveModal
        isOpen={activeDialog === 'projectArchive'}
        onClose={closeDialog}
      />
      <ProjectBackupModal
        isOpen={activeDialog === 'projectBackup'}
        onClose={closeDialog}
      />
      <ProjectMetadataModal
        isOpen={activeDialog === 'projectMetadata'}
        onClose={closeDialog}
      />
      <RelinkMediaWorkflowModal
        isOpen={activeDialog === 'relinkMediaWorkflow'}
        onClose={closeDialog}
      />
      <MulticamModal
        isOpen={activeDialog === 'multicam'}
        onClose={closeDialog}
      />
      <KeyboardCustomizationModal
        isOpen={activeDialog === 'keyboardCustomization'}
        onClose={closeDialog}
      />
      <TaskManagerModal
        isOpen={activeDialog === 'taskManager'}
        onClose={closeDialog}
      />
      <ProjectHealthModal
        isOpen={activeDialog === 'projectHealth'}
        onClose={closeDialog}
      />
      <MarkersModal
        isOpen={activeDialog === 'markers'}
        onClose={closeDialog}
      />
      <CommandPaletteModal />

      {/* Phase 9 Professional Rendering & Export Engine Modals */}
      <ExportDialog
        isOpen={activeDialog === 'exportVideo'}
        onClose={closeDialog}
      />
      <RenderQueueModal
        isOpen={activeDialog === 'renderQueue'}
        onClose={closeDialog}
        onOpenDetails={(j) => {
          setInspectedJob(j);
          openDialog('exportDetails');
        }}
        onOpenLogs={(jId) => {
          setInspectedLogJobId(jId);
          openDialog('renderLogs');
        }}
      />
      <ExportDetailsModal
        isOpen={activeDialog === 'exportDetails'}
        onClose={closeDialog}
        job={inspectedJob}
      />
      <RenderLogModal
        isOpen={activeDialog === 'renderLogs'}
        onClose={closeDialog}
        jobId={inspectedLogJobId}
      />
      <ExportHistoryModal
        isOpen={activeDialog === 'exportHistory'}
        onClose={closeDialog}
      />
      <Phase9TestModal
        isOpen={activeDialog === 'phase9Test'}
        onClose={closeDialog}
      />
      <Phase10TestModal
        isOpen={activeDialog === 'phase10Test'}
        onClose={closeDialog}
      />

      {/* Phase 10 Production & Diagnostics Modals */}
      <FirstRunWizardModal />
      <DiagnosticsModal />
      <DocumentationModal />
      <UpdateCheckerModal />

      {/* Toast Notifications System */}
      <ToastContainer />
    </div>
  );
}
