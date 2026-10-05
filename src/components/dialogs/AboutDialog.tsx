/**
 * Nusantara Video Studio - About Dialog
 * Phase 1 Foundation info, custom emblem, and 10-phase roadmap
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import { Film, CheckCircle2, Circle } from 'lucide-react';

export const AboutDialog: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);

  const isOpen = activeDialog === 'about';

  const phases = [
    { phase: 'Phase 1', name: 'Foundation', status: 'completed' },
    { phase: 'Phase 2', name: 'Media Library & Ingestion', status: 'completed' },
    { phase: 'Phase 3', name: 'Timeline & Capture Engine', status: 'completed' },
    { phase: 'Phase 4', name: 'Advanced Effects & Motion Engine', status: 'completed' },
    { phase: 'Phase 5', name: 'Professional Text, Subtitle & Graphics Studio', status: 'completed' },
    { phase: 'Phase 6', name: 'Audio Studio & Mixing', status: 'upcoming' },
    { phase: 'Phase 7', name: 'Color Grading & LUT Studio', status: 'upcoming' },
    { phase: 'Phase 8', name: 'Multi-Camera & Sync Engine', status: 'upcoming' },
    { phase: 'Phase 9', name: 'Rendering & 4K Export Engine', status: 'upcoming' },
    { phase: 'Phase 10', name: 'Final Release & Ecosystem', status: 'upcoming' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={closeDialog} title="About" maxWidth="max-w-md">
      <div className="flex flex-col items-center text-center">
        {/* Bespoke Nusantara Video Studio Emblem */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20 mb-3 flex items-center justify-center">
          <div className="w-full h-full bg-[#12151e] rounded-[14px] flex items-center justify-center">
            <Film className="w-8 h-8 text-cyan-400" />
          </div>
        </div>

        <h2 className="text-base font-bold text-white tracking-wide">
          Nusantara Video Studio
        </h2>
        <p className="text-xs font-medium text-blue-400 mt-0.5">
          Professional Desktop Video Editor
        </p>
        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#1f2535] text-[10px] text-blue-300 font-mono border border-blue-500/30">
          Version 0.5.0 • Phase 5 Professional Text, Subtitle & Graphics Studio
        </span>

        <p className="text-[11px] text-slate-400 mt-3 leading-relaxed max-w-sm">
          Aplikasi video editor desktop profesional generasi baru untuk Windows, macOS, dan Linux. Dibuat dengan arsitektur modern berkecepatan tinggi menggunakan React, TypeScript, Vite, Tauri, dan Rust.
        </p>

        {/* 10-Phase Roadmap Summary */}
        <div className="w-full mt-4 p-3 bg-[#0d0f15] border border-[#212738] rounded-xl text-left">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            10-Phase Engineering Roadmap
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {phases.map((p) => (
              <div key={p.phase} className="flex items-center gap-1.5 py-0.5">
                {p.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                )}
                <span
                  className={
                    p.status === 'completed'
                      ? 'text-emerald-300 font-medium'
                      : 'text-slate-400'
                  }
                >
                  <strong className="text-slate-200">{p.phase}:</strong> {p.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full mt-4 pt-3 border-t border-[#1e2330] flex flex-col items-center gap-1 text-[10px] text-slate-500">
          <div>Identifier: <code className="text-slate-400 font-mono">com.nusantara.videostudio</code></div>
          <div>© {new Date().getFullYear()} Nusantara Video Studio. All rights reserved.</div>
        </div>
      </div>
    </Modal>
  );
};
