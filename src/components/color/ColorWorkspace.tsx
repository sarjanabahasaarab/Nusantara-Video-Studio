/**
 * Nusantara Video Studio - Color Workspace
 * Phase 6: Professional Color & Audio Studio
 *
 * Integrates Color Toolbar, Video Preview Monitor, Real-Time Scopes,
 * Color Inspector (Basic, Curves, Wheels, LUT, Vignette, Presets, Match), and Timeline.
 */

import React from 'react';
import { VideoPreview } from '../preview/VideoPreview';
import { ScopeMonitor } from './ScopeMonitor';
import { ColorInspector } from './ColorInspector';
import { Timeline } from '../timeline/Timeline';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { useColorStore } from '../../stores/colorStore';
import {
  Palette,
  Eye,
  Activity,
  RotateCcw,
  Sliders,
  ChevronLeft,
} from 'lucide-react';

export const ColorWorkspace: React.FC = () => {
  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const setActiveWorkspace = useUIStore((s) => s.setActiveWorkspace);
  const showScopes = useUIStore((s) => s.showScopes);
  const toggleScopes = useUIStore((s) => s.toggleScopes);

  // Find currently selected clip across video tracks
  const selectedClip = tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId);

  return (
    <div className="flex-1 flex flex-col bg-[#0a0d14] overflow-hidden select-none">
      {/* 1. Color Workspace Dedicated Toolbar */}
      <div className="h-10 bg-[#121622] border-b border-[#202738] px-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveWorkspace('edit')}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#181e2b] hover:bg-[#20283a] text-slate-300 hover:text-white border border-[#273248] text-xs transition-colors"
            title="Kembali ke Workspace Editing (Shortcut E)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Edit</span>
          </button>

          <div className="h-4 w-px bg-[#262f44] mx-1" />

          <div className="flex items-center gap-1.5 text-xs text-white font-semibold">
            <Palette className="w-4 h-4 text-blue-400" />
            <span>Color Studio Workspace</span>
          </div>
        </div>

        {/* Center / Right controls: Scopes toggle, clip badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleScopes}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors border ${
              showScopes
                ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                : 'bg-[#161a25] text-slate-400 hover:text-white border-[#242b3b]'
            }`}
            title="Tampilkan / Sembunyikan Real-Time Video Scopes"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{showScopes ? 'Hide Scopes' : 'Show Scopes'}</span>
          </button>

          {selectedClip && (
            <span className="text-[11px] font-mono text-slate-300 bg-[#161b26] border border-[#263147] px-2.5 py-1 rounded max-w-[200px] truncate">
              {selectedClip.name}
            </span>
          )}
        </div>
      </div>

      {/* 2. Middle Section: Video Preview + Scopes on Left, Inspector on Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column: Preview Monitor + Scopes Monitor */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex overflow-hidden">
            <VideoPreview />
          </div>

          {showScopes && (
            <div className="h-48 border-t border-[#1f2738] bg-[#0b0e15] shrink-0 p-2">
              <ScopeMonitor />
            </div>
          )}
        </div>

        {/* Right column: Color Inspector */}
        <div className="w-80 md:w-96 flex shrink-0">
          <ColorInspector clip={selectedClip} />
        </div>
      </div>

      {/* 3. Bottom Multi-track Timeline */}
      <Timeline />
    </div>
  );
};
