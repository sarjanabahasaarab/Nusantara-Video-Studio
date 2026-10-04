/**
 * Nusantara Video Studio - Import Progress Modal
 * Phase 2: Media Library & Media Import
 *
 * Displays asynchronous progress bar for batch media file imports
 */

import React from 'react';
import { useMediaStore } from '../../stores/mediaStore';
import { Loader2 } from 'lucide-react';

export const ImportProgressModal: React.FC = () => {
  const importProgress = useMediaStore((s) => s.importProgress);

  if (!importProgress.active) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-md bg-[#161922] border border-[#273042] rounded-xl shadow-2xl p-5 flex flex-col gap-3">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            <h3 className="text-sm font-semibold text-white">Importing Media</h3>
          </div>
          <span className="font-mono text-xs text-blue-400 font-bold">
            {importProgress.percentage}%
          </span>
        </div>

        {/* Progress Track */}
        <div className="w-full h-2.5 bg-[#0f1118] border border-[#232938] rounded-full overflow-hidden p-0.5">
          <div
            style={{ width: `${importProgress.percentage}%` }}
            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-150"
          />
        </div>

        {/* File and counter stats */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate max-w-[260px] font-mono text-slate-300">
            {importProgress.filename}
          </span>
          <span className="font-mono text-slate-400 shrink-0">
            {importProgress.current} / {importProgress.total} files
          </span>
        </div>
      </div>
    </div>
  );
};
