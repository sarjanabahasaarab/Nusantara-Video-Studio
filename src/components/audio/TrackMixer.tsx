/**
 * Nusantara Video Studio - Multi-Track Audio Mixer Panel
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements channel strips for each audio track:
 * - Decibel Fader (-60 to +6 dB, unity 0 dB)
 * - Panning (-1.0 Left to +1.0 Right, Center 0)
 * - Track VU Metering with Peak & Clipping LED
 * - Solo (S) & Mute (M) toggles
 * - Parametric EQ & Compressor inspection modals
 */

import React, { useState, useMemo } from 'react';
import { useAudioMixerStore } from '../../stores/audioMixerStore';
import { useProjectStore } from '../../stores/projectStore';
import { EqualizerModal } from './EqualizerModal';
import { CompressorModal } from './CompressorModal';
import { Sliders, Volume2, VolumeX, Sparkles, Layers, SlidersHorizontal } from 'lucide-react';

export const TrackMixer: React.FC = () => {
  const allTracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const tracks = useMemo(() => allTracks.filter((t) => t.type === 'audio'), [allTracks]);
  const mixerTracks = useAudioMixerStore((s) => s.tracks);
  const setTrackVolumeDb = useAudioMixerStore((s) => s.setTrackVolumeDb);
  const setTrackPan = useAudioMixerStore((s) => s.setTrackPan);
  const toggleTrackMute = useAudioMixerStore((s) => s.toggleTrackMute);
  const toggleTrackSolo = useAudioMixerStore((s) => s.toggleTrackSolo);
  const updateTrackEQ = useAudioMixerStore((s) => s.updateTrackEQ);
  const updateTrackCompressor = useAudioMixerStore((s) => s.updateTrackCompressor);

  // Modal states for active EQ / Compressor
  const [activeEQTrackId, setActiveEQTrackId] = useState<string | null>(null);
  const [activeCompTrackId, setActiveCompTrackId] = useState<string | null>(null);

  if (tracks.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-6 bg-[#0a0d14]">
        <Sliders className="w-10 h-10 mb-2 opacity-30 text-emerald-400" />
        <span className="text-xs font-semibold text-slate-300">Tidak Ada Audio Track</span>
        <p className="text-[11px] text-slate-500 mt-1">Tambahkan Audio Track di timeline untuk mixing.</p>
      </div>
    );
  }

  const activeEQTrack = activeEQTrackId ? mixerTracks[activeEQTrackId] : null;
  const activeCompTrack = activeCompTrackId ? mixerTracks[activeCompTrackId] : null;

  return (
    <div className="flex-1 flex items-stretch gap-2.5 p-3 overflow-x-auto bg-[#0a0d14] select-none text-xs">
      {tracks.map((track) => {
        const channel = mixerTracks[track.id] || {
          trackId: track.id,
          name: track.name,
          volumeDb: 0,
          pan: 0,
          mute: track.muted,
          solo: !!track.solo,
          eq: { enabled: true, bands: [] },
          compressor: { enabled: false, threshold: -18, ratio: 3.5, attack: 0.02, release: 0.15, knee: 6, makeupGain: 2 },
          meterLevel: { left: 0, right: 0, peakLeft: -60, peakRight: -60, clipping: false },
        };

        const vol = channel.volumeDb;
        const meter = channel.meterLevel;
        const pct = Math.max(0, Math.min(100, ((meter.peakLeft + 60) / 66) * 100));

        return (
          <div
            key={track.id}
            className="w-36 bg-[#0e121a] border border-[#1e2536] rounded-xl flex flex-col justify-between p-2.5 shrink-0 shadow-md"
          >
            {/* Header: Track Name & Solo/Mute */}
            <div className="flex flex-col gap-1.5 border-b border-[#1b2230] pb-2 text-center">
              <span className="font-semibold text-white text-[11px] truncate" title={track.name}>
                {track.name}
              </span>

              {/* Solo & Mute Buttons */}
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => toggleTrackSolo(track.id)}
                  className={`w-7 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    channel.solo
                      ? 'bg-amber-500 text-black border-amber-400 font-extrabold shadow-xs'
                      : 'bg-[#151924] text-slate-400 border-[#242c3d] hover:text-white'
                  }`}
                  title="Solo Track (Hanya dengarkan track ini)"
                >
                  S
                </button>

                <button
                  onClick={() => toggleTrackMute(track.id)}
                  className={`w-7 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                    channel.mute
                      ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                      : 'bg-[#151924] text-slate-400 border-[#242c3d] hover:text-white'
                  }`}
                  title="Mute Track"
                >
                  M
                </button>
              </div>
            </div>

            {/* DSP Quick Action Buttons (EQ & Compressor) */}
            <div className="grid grid-cols-2 gap-1 py-1.5 border-b border-[#1b2230]">
              <button
                onClick={() => setActiveEQTrackId(track.id)}
                className={`py-1 rounded text-[10px] font-medium border transition-colors flex items-center justify-center gap-0.5 ${
                  channel.eq?.enabled
                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/40'
                    : 'bg-[#121620] text-slate-400 border-[#202737]'
                }`}
                title="Buka 5-Band Parametric Equalizer"
              >
                <SlidersHorizontal className="w-2.5 h-2.5" />
                <span>EQ</span>
              </button>

              <button
                onClick={() => setActiveCompTrackId(track.id)}
                className={`py-1 rounded text-[10px] font-medium border transition-colors flex items-center justify-center gap-0.5 ${
                  channel.compressor?.enabled
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/40'
                    : 'bg-[#121620] text-slate-400 border-[#202737]'
                }`}
                title="Buka Dynamics Compressor"
              >
                <Sparkles className="w-2.5 h-2.5" />
                <span>COMP</span>
              </button>
            </div>

            {/* Panning Slider (-1.0 to +1.0) */}
            <div className="flex flex-col gap-0.5 py-1.5 border-b border-[#1b2230]">
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
                <span>PAN</span>
                <span className="text-white">
                  {channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.abs(Math.round(channel.pan * 100))}` : `R${Math.round(channel.pan * 100)}`}
                </span>
              </div>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={channel.pan}
                onChange={(e) => setTrackPan(track.id, parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer h-1 bg-[#1a2130] rounded"
              />
            </div>

            {/* Fader & Meter Body */}
            <div className="flex-1 flex items-center justify-center gap-2.5 py-3">
              {/* VU Meter Bar */}
              <div className="h-36 w-3 bg-[#080a0f] border border-[#1c2230] rounded-xs p-0.5 flex flex-col justify-end overflow-hidden relative">
                <div
                  style={{ height: `${pct}%` }}
                  className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                />
              </div>

              {/* Fader Track */}
              <div className="flex flex-col items-center h-36 justify-between">
                <span className="text-[9px] font-mono text-slate-500">+6</span>
                <input
                  type="range"
                  min={-60}
                  max={6}
                  step={0.5}
                  value={vol}
                  onChange={(e) => setTrackVolumeDb(track.id, parseFloat(e.target.value))}
                  className="h-28 appearance-none bg-[#192130] rounded w-1.5 cursor-pointer accent-blue-500 [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
                />
                <span className="text-[9px] font-mono text-slate-500">-60</span>
              </div>
            </div>

            {/* Decibel Readout */}
            <div className="text-center font-mono text-[10px] text-emerald-400 bg-[#080b11] py-1 rounded border border-[#1b2230]">
              {vol > 0 ? `+${vol.toFixed(1)}` : vol <= -60 ? '-∞' : vol.toFixed(1)} dB
            </div>
          </div>
        );
      })}

      {/* Equalizer Modal Popup */}
      {activeEQTrack && (
        <EqualizerModal
          isOpen={!!activeEQTrackId}
          onClose={() => setActiveEQTrackId(null)}
          title={activeEQTrack.name}
          eq={activeEQTrack.eq}
          onChange={(updatedEQ) => updateTrackEQ(activeEQTrack.trackId, updatedEQ)}
        />
      )}

      {/* Compressor Modal Popup */}
      {activeCompTrack && (
        <CompressorModal
          isOpen={!!activeCompTrackId}
          onClose={() => setActiveCompTrackId(null)}
          title={activeCompTrack.name}
          compressor={activeCompTrack.compressor}
          onChange={(updatedComp) => updateTrackCompressor(activeCompTrack.trackId, updatedComp)}
        />
      )}
    </div>
  );
};
