/**
 * Nusantara Video Studio - Auto Save Hook
 * Periodically backs up project state if dirty
 */

import { useEffect, useRef } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { databaseService } from '../services/databaseService';

export function useAutoSave() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const markSaved = useProjectStore((s) => s.markSaved);
  const autoSaveSettings = useSettingsStore((s) => s.settings.general);
  const notify = useUIStore((s) => s.notify);

  const lastSavedRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!autoSaveSettings.autoSaveEnabled) {
      return;
    }

    const intervalMs = Math.max(1, autoSaveSettings.autoSaveIntervalMinutes) * 60 * 1000;

    const timer = setInterval(async () => {
      if (isDirty) {
        try {
          const res = await databaseService.projects.save(currentProject);
          if (res.success) {
            markSaved();
            lastSavedRef.current = Date.now();
            notify('Auto Save', `Proyek "${currentProject.name}" berhasil disimpan secara otomatis.`, 'info', 2500);
          }
        } catch (err) {
          console.error('[AutoSave] Failed:', err);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoSaveSettings.autoSaveEnabled, autoSaveSettings.autoSaveIntervalMinutes, currentProject, isDirty, markSaved, notify]);
}
