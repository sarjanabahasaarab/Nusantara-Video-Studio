/**
 * Nusantara Video Studio - Smart Reframe Panel
 * Phase 7: AI-Assisted Editing
 *
 * Automates landscape to portrait (9:16), square (1:1), or 4:5 reframing
 * by calculating non-destructive scaling and crop pan values.
 */

import React, { useState } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { Maximize, Smartphone, Square, Tv, Sparkles, Check } from 'lucide-react';

export const SmartReframePanel: React.FC = () => {
  const reframeResult = useAIStore((s) => s.reframeResult);
  const runSmartReframe = useAIStore((s) => s.runSmartReframe);
  const applySmartReframeToClip = useAIStore((s) => s.applySmartReframeToClip);
  const notify = useUIStore((s) => s.notify);

  const [targetRatio, setTargetRatio] = useState<'16:9' | '9:16' | '1:1' | '4:5'>('9:16');

  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const firstClip = tracks[0]?.clips[0];

  const handleCompute = () => {
    if (!firstClip) {
      notify('Smart Reframe', 'Pilih clip pada timeline terlebih dahulu.', 'warning');
      return;
    }
    runSmartReframe(firstClip.id, targetRatio);
    notify('Smart Reframe', `Menghitung framing untuk rasio ${targetRatio}...`, 'info', 1500);
  };

  const handleApply = () => {
    if (!firstClip) return;
    applySmartReframeToClip(firstClip.id);
    notify(
      'Smart Reframe Applied',
      `Transformasi crop rasio ${targetRatio} diterapkan ke clip "${firstClip.name}". Non-destruktif (Undoable).`,
      'success'
    );
  };

  const ratioCards: { id: '16:9' | '9:16' | '1:1' | '4:5'; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: '9:16',
      label: '9:16 (Vertical)',
      icon: <Smartphone className="w-5 h-5 text-purple-400" />,
      desc: 'TikTok, Instagram Reels, YouTube Shorts (1080×1920)',
    },
    {
      id: '1:1',
      label: '1:1 (Square)',
      icon: <Square className="w-5 h-5 text-blue-400" />,
      desc: 'Instagram Feed, LinkedIn Post (1080×1080)',
    },
    {
      id: '4:5',
      label: '4:5 (Social Portrait)',
      icon: <Smartphone className="w-5 h-5 text-cyan-400" />,
      desc: 'Instagram Portrait Feed (1080×1350)',
    },
    {
      id: '16:9',
      label: '16:9 (Landscape)',
      icon: <Tv className="w-5 h-5 text-emerald-400" />,
      desc: 'Standard widescreen YouTube & Cinema (1920×1080)',
    },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Maximize className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Smart Reframe</h3>
              <p className="text-xs text-slate-400">
                Ubah format orientasi video secara cerdas dengan mempertahankan subjek di tengah frame.
              </p>
            </div>
          </div>

          <button
            onClick={handleCompute}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Calculate Reframe
          </button>
        </div>

        {/* Ratio Selection Cards */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-[#202738]">
          {ratioCards.map((rc) => (
            <button
              key={rc.id}
              onClick={() => setTargetRatio(rc.id)}
              className={`p-3 rounded-lg border text-left flex flex-col gap-2 transition-all ${
                targetRatio === rc.id
                  ? 'bg-purple-600/20 border-purple-500 text-white'
                  : 'bg-[#10131c] border-[#22293b] text-slate-400 hover:text-slate-200 hover:bg-[#161a26]'
              }`}
            >
              <div className="flex items-center justify-between">
                {rc.icon}
                <span className="text-[10px] font-mono font-semibold">{rc.id}</span>
              </div>
              <div>
                <div className="text-xs font-semibold">{rc.label}</div>
                <div className="text-[9px] text-slate-500 line-clamp-1">{rc.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Calculated Results & Apply Action */}
      {reframeResult && (
        <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-purple-400">
                Calculated Framing for {reframeResult.targetAspectRatio}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Nilai skala komputasi: {reframeResult.recommendedScale}x | Pan X: {reframeResult.cropPanX}%
              </p>
            </div>

            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Smart Reframe to Clip
            </button>
          </div>

          <div className="bg-[#0f121a] border border-[#202738] rounded-lg p-4 flex items-center justify-center">
            {/* Visual aspect ratio wireframe preview */}
            <div
              className={`border-2 border-purple-500 bg-purple-950/20 rounded flex items-center justify-center text-xs font-mono text-purple-300 transition-all ${
                reframeResult.targetAspectRatio === '9:16'
                  ? 'w-24 h-44'
                  : reframeResult.targetAspectRatio === '1:1'
                  ? 'w-36 h-36'
                  : reframeResult.targetAspectRatio === '4:5'
                  ? 'w-28 h-36'
                  : 'w-48 h-28'
              }`}
            >
              {reframeResult.targetAspectRatio} ({reframeResult.recommendedScale}x)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
