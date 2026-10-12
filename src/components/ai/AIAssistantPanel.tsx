/**
 * Nusantara Video Studio - AI Assistant Sidebar Panel
 * Phase 7: AI-Assisted Editing
 *
 * Professional editing assistant panel providing Media Selection,
 * Available AI Tools with real status badges, and quick job summaries.
 */

import React from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { AICapability } from '../../types/ai';
import {
  Film,
  Scissors,
  Volume2,
  Mic,
  Maximize,
  Sparkles,
  Layers,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ToolItem {
  id: AICapability | 'smart-cut';
  label: string;
  icon: React.ReactNode;
  badge: 'Ready' | 'Installed' | 'Not Installed' | 'Provider Required';
  description: string;
}

export const AIAssistantPanel: React.FC = () => {
  const selectedTool = useAIStore((s) => s.selectedTool);
  const setSelectedTool = useAIStore((s) => s.setSelectedTool);
  const selectedMediaId = useAIStore((s) => s.selectedMediaId);
  const setSelectedMediaId = useAIStore((s) => s.setSelectedMediaId);
  const jobs = useAIStore((s) => s.jobs);

  const mediaList = useProjectStore((s) => s.currentProject.media);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const selectedClipIds = useSelectionStore((s) => s.selectedClipIds);

  // Active clip identification
  const activeClip = React.useMemo(() => {
    if (selectedClipIds.length > 0) {
      for (const t of tracks) {
        const found = t.clips.find((c) => c.id === selectedClipIds[0]);
        if (found) return found;
      }
    }
    // Fallback to first video clip
    for (const t of tracks) {
      if (t.clips.length > 0) return t.clips[0];
    }
    return null;
  }, [tracks, selectedClipIds]);

  const activeMedia = React.useMemo(() => {
    if (selectedMediaId) {
      return mediaList.find((m) => m.id === selectedMediaId);
    }
    if (activeClip?.mediaId) {
      return mediaList.find((m) => m.id === activeClip.mediaId);
    }
    return mediaList[0] || null;
  }, [mediaList, selectedMediaId, activeClip]);

  const tools: ToolItem[] = [
    {
      id: 'scene-detection',
      label: 'Detect Scenes',
      icon: <Film className="w-3.5 h-3.5 text-blue-400" />,
      badge: 'Ready',
      description: 'Analisis visual frame difference untuk mendeteksi batas pergantian scene.',
    },
    {
      id: 'silence-detection',
      label: 'Detect Silence',
      icon: <Volume2 className="w-3.5 h-3.5 text-cyan-400" />,
      badge: 'Ready',
      description: 'Deteksi interval jeda audio (RMS dB) untuk mempercepat rough-cut.',
    },
    {
      id: 'smart-cut',
      label: 'Smart Cut Assistant',
      icon: <Scissors className="w-3.5 h-3.5 text-amber-400" />,
      badge: 'Ready',
      description: 'Kombinasi silence & scene detection untuk membuat usulan potongan.',
    },
    {
      id: 'transcription',
      label: 'Transcribe',
      icon: <Mic className="w-3.5 h-3.5 text-emerald-400" />,
      badge: 'Not Installed',
      description: 'Ekstraksi speech-to-text menggunakan model Whisper lokal/cloud.',
    },
    {
      id: 'smart-reframe',
      label: 'Smart Reframe',
      icon: <Maximize className="w-3.5 h-3.5 text-purple-400" />,
      badge: 'Ready',
      description: 'Otomatisasi cropping aspek rasio (16:9 → 9:16, 1:1, 4:5).',
    },
    {
      id: 'audio-cleanup',
      label: 'Clean Audio',
      icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" />,
      badge: 'Ready',
      description: 'Filter rumble 80Hz, mains hum 50/60Hz, dan normalisasi loudness.',
    },
    {
      id: 'object-detection',
      label: 'Detect Objects',
      icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
      badge: 'Provider Required',
      description: 'Deteksi objek (orang, kendaraan, perangkat) membutuhkan model ONNX/Cloud.',
    },
    {
      id: 'face-detection',
      label: 'Detect Faces',
      icon: <Smile className="w-3.5 h-3.5 text-yellow-400" />,
      badge: 'Provider Required',
      description: 'Deteksi wajah subjek untuk tracking dan centering crop.',
    },
  ];

  return (
    <div className="w-80 bg-[#12151f] border-r border-[#202636] flex flex-col h-full select-none">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#202636] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-bold text-white tracking-wide uppercase">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
          <ShieldCheck className="w-2.5 h-2.5" />
          Local Safe
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Media Selector Section */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Media Source
          </label>
          <div className="bg-[#181c28] border border-[#273042] rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                {activeClip ? activeClip.name : activeMedia?.name || 'Tidak ada media'}
              </span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-500/20">
                {activeClip ? 'Timeline Clip' : 'Media Item'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>Durasi: {activeClip ? `${activeClip.duration.toFixed(1)}s` : activeMedia ? `${(activeMedia.duration || 0).toFixed(1)}s` : '0s'}</span>
              <span>Tipe: {activeClip?.type || activeMedia?.type || 'video'}</span>
            </div>

            {/* Quick Switcher Dropdown */}
            {mediaList.length > 1 && (
              <select
                value={selectedMediaId || activeMedia?.id || ''}
                onChange={(e) => setSelectedMediaId(e.target.value)}
                className="w-full mt-1 bg-[#10131c] border border-[#232b3d] text-[11px] text-slate-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              >
                {mediaList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({(m.duration || 0).toFixed(1)}s)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Available Tools */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Available Tools
          </label>
          <div className="space-y-1">
            {tools.map((t) => {
              const isSelected = selectedTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTool(t.id)}
                  className={`w-full text-left p-2 rounded-lg transition-all border flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500/60 text-white shadow-xs'
                      : 'bg-[#151824] hover:bg-[#1b2030] border-transparent text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {t.icon}
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{t.label}</span>
                      <span className="text-[9px] text-slate-400 line-clamp-1">{t.description}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                      t.badge === 'Ready' || t.badge === 'Installed'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Jobs Summary */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              AI Jobs
            </label>
            <span className="text-[9px] text-slate-500 font-mono">Real-time Queue</span>
          </div>

          <div className="bg-[#151824] border border-[#22293a] rounded-lg p-2 space-y-2">
            {jobs.length === 0 ? (
              <div className="text-[10px] text-slate-500 italic py-1">Tidak ada tugas aktif</div>
            ) : (
              jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 capitalize">{job.type.replace('-', ' ')}</span>
                  {job.status === 'running' && (
                    <span className="text-blue-400 font-mono text-[10px]">{job.progress}%</span>
                  )}
                  {job.status === 'completed' && (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Done
                    </span>
                  )}
                  {job.status === 'queued' && (
                    <span className="text-amber-400 font-mono text-[10px] flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Queued
                    </span>
                  )}
                  {job.status === 'failed' && (
                    <span className="text-rose-400 font-mono text-[10px]">Error</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
