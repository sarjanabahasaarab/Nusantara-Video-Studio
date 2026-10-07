/**
 * Nusantara Video Studio - TitleBar
 * Custom Desktop Window Header & Window Controls
 */

import React from 'react';
import { Minus, Square, X, Film } from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';

export const TitleBar: React.FC = () => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const isFullscreen = useUIStore((s) => s.isFullscreen);
  const toggleFullscreen = useUIStore((s) => s.toggleFullscreen);
  const notify = useUIStore((s) => s.notify);

  const activeWorkspace = useUIStore((s) => s.activeWorkspace);
  const setActiveWorkspace = useUIStore((s) => s.setActiveWorkspace);

  const handleMinimize = () => {
    notify('Window', 'Aplikasi diminimalkan (Tauri desktop window).', 'info', 1500);
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm('Ada perubahan yang belum disimpan. Yakin ingin keluar?')) {
        notify('Keluar', 'Menutup Nusantara Video Studio.', 'info', 1500);
      }
    } else {
      notify('Keluar', 'Menutup Nusantara Video Studio.', 'info', 1500);
    }
  };

  return (
    <header className="h-8 bg-[#0b0c10] border-b border-[#1f242e] flex items-center justify-between px-3 select-none text-xs z-40">
      {/* Left: App Logo & Branding */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-sm">
          <Film className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="font-semibold text-slate-200 tracking-wide text-[11px]">
          Nusantara Video Studio
        </span>
        <span className="text-[9px] font-mono text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/30">
          v0.6.0
        </span>

        {/* Workspace Switcher Tabs */}
        <div className="flex items-center bg-[#131620] border border-[#232b3c] rounded-md p-0.5 ml-2">
          {(
            [
              { id: 'edit', label: 'Editing' },
              { id: 'color', label: 'Color' },
              { id: 'audio', label: 'Audio' },
            ] as const
          ).map((ws) => (
            <button
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                activeWorkspace === ws.id
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {ws.label}
            </button>
          ))}
        </div>
      </div>

      {/* Center: Active Project Title */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span className="font-medium text-slate-200">{currentProject.name}</span>
        {isDirty && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />
        )}
        <span className="text-slate-600">|</span>
        <span className="text-[10px] text-slate-500">
          {currentProject.settings.width}x{currentProject.settings.height} @ {currentProject.settings.fps}fps
        </span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-[#1a1e27] rounded transition-colors"
          title="Minimize"
        >
          <Minus className="w-3 h-3" />
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-[#1a1e27] rounded transition-colors"
          title={isFullscreen ? 'Restore' : 'Maximize'}
        >
          <Square className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 rounded transition-colors"
          title="Close"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};
