/**
 * Nusantara Video Studio - Smart Cut Assistant
 * Phase 7: AI-Assisted Editing
 *
 * Combines silence regions, visual cuts, and micro-fragments into intelligent edit suggestions.
 * Follows Principle: Does NOT apply immediately; user can Accept, Reject, or Edit decisions.
 */

import React, { useState } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { Scissors, Check, X, Edit3, Sparkles, AlertCircle } from 'lucide-react';
import { SuggestedCut } from '../../ai/AIEngine';

export const SmartCutAssistant: React.FC = () => {
  const smartCutSuggestions = useAIStore((s) => s.smartCutSuggestions);
  const detectedSilences = useAIStore((s) => s.detectedSilences);
  const detectedScenes = useAIStore((s) => s.detectedScenes);
  const applySmartCutEdits = useAIStore((s) => s.applySmartCutEdits);
  const notify = useUIStore((s) => s.notify);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);

  const [rejectedIds, setRejectedIds] = useState<string[]>([]);
  const activeSuggestions = smartCutSuggestions.filter((s) => !rejectedIds.includes(s.id));

  const handleAcceptAll = () => {
    applySmartCutEdits();
    notify('Smart Cut', 'Semua potongan yang disetujui telah diterapkan ke timeline (Undoable).', 'success');
  };

  const handleReject = (id: string) => {
    setRejectedIds((prev) => [...prev, id]);
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Intro Header */}
      <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Smart Cut Assistant (Rough Cut)</h3>
              <p className="text-xs text-slate-400">
                Saran otomatis untuk membuang jeda hening dan membagi clip berdasarkan pergantian scene.
              </p>
            </div>
          </div>

          {activeSuggestions.length > 0 && (
            <button
              onClick={handleAcceptAll}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Accept All ({activeSuggestions.length})
            </button>
          )}
        </div>
      </div>

      {/* Suggested Edits */}
      {activeSuggestions.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 flex items-center justify-between px-1">
            <span>Suggested Edits ({activeSuggestions.length})</span>
            <span className="text-[10px] text-slate-500">Pilih Accept / Reject secara mandiri</span>
          </div>

          <div className="space-y-2">
            {activeSuggestions.map((sug) => (
              <div
                key={sug.id}
                className="bg-[#151824] border border-[#22293b] rounded-lg p-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      sug.type === 'silence'
                        ? 'bg-rose-950/60 text-rose-400 border border-rose-500/30'
                        : 'bg-blue-950/60 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {sug.recommendedAction}
                  </span>

                  <div>
                    <div className="text-xs font-medium text-slate-200">{sug.reason}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Waktu: {sug.start.toFixed(2)}s - {sug.end.toFixed(2)}s (Durasi: {sug.duration.toFixed(2)}s)
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTime(sug.start)}
                    className="px-2.5 py-1 text-[11px] text-slate-300 hover:text-white bg-[#1e2536] rounded border border-[#2c364c]"
                  >
                    Preview
                  </button>
                  <button
                    onClick={() => handleReject(sug.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                    title="Reject this edit"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#242b3d] rounded-xl p-8 text-center text-slate-500 text-xs">
          <AlertCircle className="w-8 h-8 mb-2 text-slate-600" />
          <p className="font-medium text-slate-400">Tidak ada usulan potongan aktif</p>
          <p className="text-[11px] max-w-sm mt-1">
            Jalankan <strong className="text-slate-300">Detect Silence</strong> atau <strong className="text-slate-300">Detect Scenes</strong> terlebih dahulu untuk menghasilkan rekomendasi Smart Cut.
          </p>
        </div>
      )}
    </div>
  );
};
