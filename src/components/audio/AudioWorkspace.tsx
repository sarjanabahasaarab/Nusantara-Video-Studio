/**
 * Nusantara Video Studio - Professional Audio Studio Workspace
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements Audio Workspace:
 * - Audio Toolbar with Return to Edit and Voice Record trigger
 * - Multi-track Mixer Channel Strips (Volume in dB, Pan, EQ, Compressor, Solo, Mute)
 * - Master Output Bus Strip with Anti-Clipping Limiter & VU meters
 * - Bottom Multi-track Timeline with waveform display
 */

import React from 'react';
import { TrackMixer } from './TrackMixer';
import { MasterBus } from './MasterBus';
import { Timeline } from '../timeline/Timeline';
import { useUIStore } from '../../stores/uiStore';
import { useCaptureStore } from '../../stores/captureStore';
import { Music, ChevronLeft, Mic, Sliders, Volume2 } from 'lucide-react';

export const AudioWorkspace: React.FC = () => {
  const setActiveWorkspace = useUIStore((s) => s.setActiveWorkspace);
  const openCaptureModal = useCaptureStore((s) => s.openModal);

  return (
    <div className="flex-1 flex flex-col bg-[#080b10] overflow-hidden select-none">
      {/* 1. Audio Toolbar */}
      <div className="h-10 bg-[#121622] border-b border-[#202738] px-3 flex items-center justify-between z-20 shrink-0">
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
            <Music className="w-4 h-4 text-emerald-400" />
            <span>Audio Studio Workspace & Mixer</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openCaptureModal('voice')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs shadow-sm transition-colors"
            title="Rekam Suara / Voiceover"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Rekam Voiceover</span>
          </button>
        </div>
      </div>

      {/* 2. Middle Section: Track Mixer on Left, Master Bus on Right */}
      <div className="flex-1 flex overflow-hidden border-b border-[#1c2230]">
        <div className="flex-1 flex overflow-hidden">
          <TrackMixer />
        </div>

        <MasterBus />
      </div>

      {/* 3. Bottom Multi-track Timeline */}
      <Timeline />
    </div>
  );
};
