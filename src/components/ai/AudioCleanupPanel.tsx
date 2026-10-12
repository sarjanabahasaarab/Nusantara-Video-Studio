/**
 * Nusantara Video Studio - Audio Cleanup Panel
 * Phase 7: AI-Assisted Editing
 *
 * Implements DSP audio enhancement:
 * - High-pass rumble filter (80 Hz)
 * - AC Mains hum removal notch (50 Hz / 60 Hz)
 * - Noise floor reduction
 * - Broadcast loudness normalization
 */

import React, { useState } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { Sparkles, Volume2, Check, Sliders } from 'lucide-react';

export const AudioCleanupPanel: React.FC = () => {
  const cleanupResult = useAIStore((s) => s.cleanupResult);
  const runAudioCleanup = useAIStore((s) => s.runAudioCleanup);
  const applyAudioCleanupToClip = useAIStore((s) => s.applyAudioCleanupToClip);
  const notify = useUIStore((s) => s.notify);

  const [removeHum, setRemoveHum] = useState(true);
  const [humFrequency, setHumFrequency] = useState<50 | 60>(50);
  const [noiseReductionDb, setNoiseReductionDb] = useState(-12);
  const [normalizeLoudness, setNormalizeLoudness] = useState(true);

  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const firstClip = tracks.flatMap((t) => t.clips).find((c) => c.type === 'video' || c.type === 'audio');

  const handleAnalyze = () => {
    if (!firstClip) {
      notify('Audio Cleanup', 'Pilih clip audio/video pada timeline terlebih dahulu.', 'warning');
      return;
    }
    runAudioCleanup(firstClip.id, {
      removeHum,
      humFrequency,
      noiseReductionDb,
    });
    notify('Audio Cleanup', 'Menganalisis spektrum frekuensi audio dan noise floor...', 'info', 1500);
  };

  const handleApply = () => {
    if (!firstClip) return;
    applyAudioCleanupToClip(firstClip.id);
    notify(
      'Audio Cleanup Applied',
      `Profil pembersihan audio diterapkan pada clip "${firstClip.name}". Non-destruktif (Undoable).`,
      'success'
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Audio Cleanup & Enhancement</h3>
              <p className="text-xs text-slate-400">
                Pembersihan noise audio non-destruktif menggunakan filter high-pass, notch mains, dan normalisasi.
              </p>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analyze & Build Profile
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#202738] text-xs">
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="rounded accent-rose-500"
              />
              <span>High-Pass Rumble Filter (&lt; 80 Hz)</span>
            </label>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={removeHum}
                  onChange={(e) => setRemoveHum(e.target.checked)}
                  className="rounded accent-rose-500"
                />
                <span>Mains Hum Filter (Dengung Listrik AC)</span>
              </label>

              {removeHum && (
                <div className="flex items-center gap-2 pl-6">
                  <button
                    onClick={() => setHumFrequency(50)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      humFrequency === 50 ? 'bg-rose-600 text-white' : 'bg-[#181d2a] text-slate-400'
                    }`}
                  >
                    50 Hz (ID / EU)
                  </button>
                  <button
                    onClick={() => setHumFrequency(60)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      humFrequency === 60 ? 'bg-rose-600 text-white' : 'bg-[#181d2a] text-slate-400'
                    }`}
                  >
                    60 Hz (US)
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Spectral Noise Reduction</span>
                <span className="font-mono text-rose-400">{noiseReductionDb} dB</span>
              </div>
              <input
                type="range"
                min="-24"
                max="-3"
                step="1"
                value={noiseReductionDb}
                onChange={(e) => setNoiseReductionDb(parseInt(e.target.value))}
                className="w-full accent-rose-500 bg-[#1e2536] rounded"
              />
            </div>

            <label className="flex items-center gap-2 text-slate-300">
              <input
                type="checkbox"
                checked={normalizeLoudness}
                onChange={(e) => setNormalizeLoudness(e.target.checked)}
                className="rounded accent-rose-500"
              />
              <span>Broadcast Normalization (-14 LUFS / -1 dB Peak)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results & Apply */}
      {cleanupResult && (
        <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-rose-400">Audio Cleanup Profile Ready</div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {cleanupResult.appliedFilters.join(' • ')}
              </p>
            </div>

            <button
              onClick={handleApply}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Audio Cleanup to Clip
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-[#0f121a] border border-[#202738] rounded-lg p-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">High-Pass Cutoff</span>
              <span className="font-mono text-slate-200">{cleanupResult.highPassCutoffHz} Hz</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Noise Reduction</span>
              <span className="font-mono text-slate-200">{cleanupResult.noiseReductionDb} dB</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Calculated Peak Gain</span>
              <span className="font-mono text-rose-400">
                {cleanupResult.peakDbGain >= 0 ? '+' : ''}
                {cleanupResult.peakDbGain} dB
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
