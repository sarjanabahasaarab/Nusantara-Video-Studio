/**
 * Nusantara Video Studio - Silence Detection & Removal Assistant Panel
 * Phase 7: AI-Assisted Editing
 *
 * Implements real audio RMS silence scanning and non-destructive ripple edit removal with full undo.
 */

import React, { useState } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { Volume2, Scissors, Trash2, CheckSquare, Sparkles, RefreshCw } from 'lucide-react';

export const SilenceDetectionPanel: React.FC = () => {
  const detectedSilences = useAIStore((s) => s.detectedSilences);
  const runSilenceDetection = useAIStore((s) => s.runSilenceDetection);
  const applyRemoveSilence = useAIStore((s) => s.applyRemoveSilence);
  const jobs = useAIStore((s) => s.jobs);
  const notify = useUIStore((s) => s.notify);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);

  const [thresholdDb, setThresholdDb] = useState(-35);
  const [minDuration, setMinDuration] = useState(0.5);
  const [preRoll, setPreRoll] = useState(0.08);
  const [postRoll, setPostRoll] = useState(0.08);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const mediaList = useProjectStore((s) => s.currentProject.media);
  const selectedMediaId = useAIStore((s) => s.selectedMediaId) || mediaList[0]?.id;
  const currentMedia = mediaList.find((m) => m.id === selectedMediaId);

  const activeJob = jobs.find((j) => j.type === 'silence-detection' && j.status === 'running');

  const handleStartDetection = () => {
    if (!currentMedia) {
      notify('Silence Detection', 'Pilih media video/audio terlebih dahulu.', 'warning');
      return;
    }
    runSilenceDetection(currentMedia.id, currentMedia.duration || 15);
    notify('Silence Detection', 'Menganalisis profil level volume audio (RMS dB)...', 'info', 2000);
  };

  const toggleSelectRegion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRemoveSilence = (all: boolean) => {
    applyRemoveSilence(all);
    notify(
      'Remove Silence',
      `Potongan non-destruktif diterapkan ke timeline. Dapat dibatalkan kapan saja dengan Ctrl+Z (Undo).`,
      'success',
      3000
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Header & Configuration */}
      <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Audio Silence Detection</h3>
              <p className="text-xs text-slate-400">
                Pindai keheningan dan jeda audio (dead air) secara otomatis berbasis Root Mean Square (RMS).
              </p>
            </div>
          </div>

          <button
            onClick={handleStartDetection}
            disabled={!!activeJob}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
              activeJob
                ? 'bg-cyan-600/50 text-cyan-200 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white hover:shadow-cyan-600/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {activeJob ? `Memindai (${activeJob.progress}%)` : 'Detect Silence'}
          </button>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-4 gap-3 pt-3 border-t border-[#202738] text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Threshold</span>
              <span className="font-mono text-cyan-400">{thresholdDb} dB</span>
            </div>
            <input
              type="range"
              min="-50"
              max="-20"
              step="1"
              value={thresholdDb}
              onChange={(e) => setThresholdDb(parseInt(e.target.value))}
              className="w-full accent-cyan-500 bg-[#1e2536] rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Min Duration</span>
              <span className="font-mono text-cyan-400">{minDuration.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={minDuration}
              onChange={(e) => setMinDuration(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-[#1e2536] rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Pre-roll Cushion</span>
              <span className="font-mono text-cyan-400">{preRoll.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.3"
              step="0.02"
              value={preRoll}
              onChange={(e) => setPreRoll(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-[#1e2536] rounded"
            />
          </div>

          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Post-roll Cushion</span>
              <span className="font-mono text-cyan-400">{postRoll.toFixed(2)}s</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.3"
              step="0.02"
              value={postRoll}
              onChange={(e) => setPostRoll(parseFloat(e.target.value))}
              className="w-full accent-cyan-500 bg-[#1e2536] rounded"
            />
          </div>
        </div>
      </div>

      {/* Remove Silence Assistant (Requirement 17) */}
      {detectedSilences.length > 0 && (
        <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                Silence detected: {detectedSilences.length} regions found
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih aksi di bawah ini. Potongan bersifat non-destruktif dan timeline dapat di-undo sepenuhnya.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRemoveSilence(false)}
                className="px-3 py-1.5 bg-[#1f2638] hover:bg-[#283248] text-slate-200 text-xs rounded-lg border border-[#2d374d] transition-colors"
              >
                Remove Selected ({selectedIds.length})
              </button>
              <button
                onClick={() => handleRemoveSilence(true)}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove All
              </button>
            </div>
          </div>

          {/* Region Table */}
          <div className="max-h-72 overflow-y-auto border border-[#202738] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#11141c] text-slate-400 border-b border-[#202738]">
                <tr>
                  <th className="p-2.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === detectedSilences.length}
                      onChange={(e) =>
                        setSelectedIds(e.target.checked ? detectedSilences.map((s) => s.id) : [])
                      }
                      className="rounded accent-cyan-500"
                    />
                  </th>
                  <th className="p-2.5">Region</th>
                  <th className="p-2.5">Mulai</th>
                  <th className="p-2.5">Selesai</th>
                  <th className="p-2.5">Durasi Jeda</th>
                  <th className="p-2.5 text-right">Navigasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e2536]">
                {detectedSilences.map((region, idx) => {
                  const isChecked = selectedIds.includes(region.id);
                  return (
                    <tr
                      key={region.id}
                      className={`hover:bg-[#1a2030] transition-colors ${
                        isChecked ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="p-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRegion(region.id)}
                          className="rounded accent-cyan-500"
                        />
                      </td>
                      <td className="p-2.5 font-medium text-slate-200">Silence #{idx + 1}</td>
                      <td className="p-2.5 font-mono text-slate-300">{region.start.toFixed(2)}s</td>
                      <td className="p-2.5 font-mono text-slate-300">{region.end.toFixed(2)}s</td>
                      <td className="p-2.5 font-mono text-cyan-400">-{region.duration.toFixed(2)}s</td>
                      <td className="p-2.5 text-right">
                        <button
                          onClick={() => setCurrentTime(region.start)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 underline font-mono"
                        >
                          Jump to Playhead
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detectedSilences.length === 0 && !activeJob && (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#242b3d] rounded-xl p-8 text-center text-slate-500 text-xs">
          <Volume2 className="w-8 h-8 mb-2 text-slate-600" />
          <p className="font-medium text-slate-400">Belum ada jeda audio yang dianalisis</p>
          <p className="text-[11px] max-w-sm mt-1">
            Klik tombol <strong className="text-slate-300">Detect Silence</strong> untuk mencari ruang hening pada video/audio Anda.
          </p>
        </div>
      )}
    </div>
  );
};
