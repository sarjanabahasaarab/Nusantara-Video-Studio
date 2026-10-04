/**
 * Nusantara Video Studio - Bottom Status Bar
 * Displays project dimensions, timecode, zoom scale, auto-save status, and engine state
 */

import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { secondsToTimecode } from '../../utils/timecode';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const zoom = useTimelineStore((s) => s.zoom);
  const autoSaveSettings = useSettingsStore((s) => s.settings.general);

  const { width, height, fps, aspectRatio } = currentProject.settings;
  const trackCount = currentProject.timeline.tracks.length;

  return (
    <footer className="h-6 bg-[#0a0b0e] border-t border-[#1e2330] px-3 flex items-center justify-between text-[10px] text-slate-400 select-none shrink-0 z-20">
      {/* Left: System Status & Project format */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-slate-300 font-medium">Nusantara Engine</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono text-slate-300">
            {width}x{height} ({aspectRatio}) @ {fps}fps
          </span>
        </div>

        <span className="text-slate-600">|</span>

        <span className="text-slate-400">
          Tracks: <strong className="text-slate-200">{trackCount}</strong>
        </span>
      </div>

      {/* Center: Current Timecode */}
      <div className="font-mono text-blue-400 font-medium hidden sm:block">
        T: {secondsToTimecode(currentTime, fps)}
      </div>

      {/* Right: Autosave & Zoom info */}
      <div className="flex items-center gap-3 font-mono text-[10px]">
        <div className="flex items-center gap-1">
          {isDirty ? (
            <span className="flex items-center gap-1 text-amber-400">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
              <span>Unsaved Changes</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>Saved</span>
            </span>
          )}
        </div>

        <span className="text-slate-600">|</span>

        <span className="text-slate-400">
          Auto-Save: {autoSaveSettings.autoSaveEnabled ? `${autoSaveSettings.autoSaveIntervalMinutes}m` : 'OFF'}
        </span>

        <span className="text-slate-600">|</span>

        <span className="text-slate-400">Zoom: {Math.round(zoom)}px/s</span>
      </div>
    </footer>
  );
};
