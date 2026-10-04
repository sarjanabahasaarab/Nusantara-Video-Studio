/**
 * Nusantara Video Studio - Bottom Status Bar
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Displays: Project name, resolution & FPS, SMPTE timecode, media count, track count.
 */

import React from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useMediaStore } from '../../stores/mediaStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { secondsToTimecode } from '../../utils/timecode';
import { CheckCircle2, RefreshCw } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const mediaCount = useMediaStore((s) => s.items.length);
  const autoSaveSettings = useSettingsStore((s) => s.settings.general);

  const { name, width, height, fps } = currentProject.settings;
  const trackCount = currentProject.timeline.tracks.length;

  return (
    <footer className="h-6 bg-[#0a0b0e] border-t border-[#1e2330] px-3 flex items-center justify-between text-[10px] text-slate-400 select-none shrink-0 z-20">
      {/* Left: Project Specs per Requirement 47 */}
      <div className="flex items-center gap-2.5">
        <span className="text-slate-300">
          Project: <strong className="text-white font-medium">{name || 'Untitled'}</strong>
        </span>

        <span className="text-slate-600">|</span>

        <span className="font-mono text-slate-300">
          {width} × {height} | {fps} FPS
        </span>

        <span className="text-slate-600">|</span>

        <span className="font-mono text-blue-400 font-semibold">
          {secondsToTimecode(currentTime, fps)}
        </span>

        <span className="text-slate-600">|</span>

        <span>
          Media: <strong className="text-slate-200 font-mono">{mediaCount}</strong>
        </span>

        <span className="text-slate-600">|</span>

        <span>
          Tracks: <strong className="text-slate-200 font-mono">{trackCount}</strong>
        </span>
      </div>

      {/* Right: Autosave status & Version */}
      <div className="flex items-center gap-3 font-mono text-[10px]">
        {autoSaveSettings.autoSaveEnabled && (
          <div className="flex items-center gap-1">
            {isDirty ? (
              <span className="flex items-center gap-1 text-amber-400">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Unsaved Changes</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Autosaved</span>
              </span>
            )}
          </div>
        )}

        <span className="text-slate-600">|</span>

        <span className="text-slate-400 font-semibold">v0.3.0</span>
      </div>
    </footer>
  );
};
