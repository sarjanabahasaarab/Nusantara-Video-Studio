/**
 * Nusantara Video Studio - Master Audio Bus Channel Strip
 * Phase 6: Professional Color & Audio Studio
 *
 * Implements master output section:
 * - Master dB Fader (-60 to +6 dB, unity 0 dB)
 * - Dual Left/Right VU Level Meters with peak hold
 * - Anti-Clipping Master Limiter (Ceiling, Release)
 * - Master Mute & Clipping Indicator with reset button
 */

import React from 'react';
import { useAudioMixerStore } from '../../stores/audioMixerStore';
import { Volume2, VolumeX, ShieldCheck, AlertTriangle, RotateCcw } from 'lucide-react';

export const MasterBus: React.FC = () => {
  const masterBus = useAudioMixerStore((s) => s.masterBus);
  const setMasterVolumeDb = useAudioMixerStore((s) => s.setMasterVolumeDb);
  const toggleMasterMute = useAudioMixerStore((s) => s.toggleMasterMute);
  const updateMasterLimiter = useAudioMixerStore((s) => s.updateMasterLimiter);
  const resetClipping = useAudioMixerStore((s) => s.resetClipping);

  const vol = masterBus.volumeDb;
  const isMuted = masterBus.mute;
  const meter = masterBus.meterLevel;

  // Height of meter bar (0 to 100%)
  const leftPct = Math.max(0, Math.min(100, ((meter.peakLeft + 60) / 66) * 100));
  const rightPct = Math.max(0, Math.min(100, ((meter.peakRight + 60) / 66) * 100));

  return (
    <div className="w-44 bg-[#0e121a] border-l border-[#212838] flex flex-col justify-between p-3 select-none text-xs shrink-0 shadow-xl">
      {/* Strip Header */}
      <div className="flex flex-col gap-1 border-b border-[#1d2433] pb-2 text-center">
        <span className="font-bold text-white text-xs tracking-wider uppercase">MASTER OUT</span>
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-600/30">
            {vol > 0 ? `+${vol.toFixed(1)}` : vol <= -60 ? '-∞' : vol.toFixed(1)} dB
          </span>
        </div>
      </div>

      {/* Meter & Vertical Fader Row */}
      <div className="flex-1 flex items-center justify-center gap-3 py-4">
        {/* Dual VU Meter Bars (Left & Right) */}
        <div className="flex items-end gap-1 h-44 w-7 bg-[#080a0f] border border-[#1c2230] rounded p-0.5 relative">
          {/* 0 dB Clip Line */}
          <div className="absolute top-[9%] left-0 right-0 h-[1px] bg-rose-500/80 z-10" />
          <div className="absolute top-[28%] left-0 right-0 h-[1px] bg-amber-400/50 z-10" />

          {/* Left Channel */}
          <div className="flex-1 h-full flex flex-col justify-end bg-[#10141f] rounded-xs overflow-hidden">
            <div
              style={{ height: `${leftPct}%` }}
              className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
            />
          </div>

          {/* Right Channel */}
          <div className="flex-1 h-full flex flex-col justify-end bg-[#10141f] rounded-xs overflow-hidden">
            <div
              style={{ height: `${rightPct}%` }}
              className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
            />
          </div>
        </div>

        {/* Vertical Decibel Slider Fader */}
        <div className="flex flex-col items-center h-44 justify-between">
          <span className="text-[9px] font-mono text-slate-500">+6</span>
          <input
            type="range"
            min={-60}
            max={6}
            step={0.5}
            value={vol}
            onChange={(e) => setMasterVolumeDb(parseFloat(e.target.value))}
            className="h-32 appearance-none bg-[#192130] rounded w-1.5 cursor-pointer accent-blue-500 [writing-mode:bt-lr] [-webkit-appearance:slider-vertical]"
          />
          <span className="text-[9px] font-mono text-slate-500">-60</span>
        </div>
      </div>

      {/* Clipping Warning / Reset Peak */}
      <div className="flex flex-col gap-2 border-t border-[#1d2433] pt-2">
        <div
          onClick={() => resetClipping()}
          className={`p-1.5 rounded flex items-center justify-between cursor-pointer transition-colors ${
            meter.clipping
              ? 'bg-rose-950/60 border border-rose-600/50 text-rose-300'
              : 'bg-[#121622] border border-[#202737] text-slate-400'
          }`}
          title="Klik untuk Reset Indikator Peak Clipping"
        >
          <div className="flex items-center gap-1.5">
            {meter.clipping ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <span className="text-[10px] font-mono font-semibold">
              {meter.clipping ? 'CLIP!' : 'PEAK OK'}
            </span>
          </div>
          <RotateCcw className="w-3 h-3 text-slate-500 hover:text-white" />
        </div>

        {/* Master Limiter Protection */}
        <div className="flex items-center justify-between p-1.5 bg-[#121622] border border-[#202737] rounded">
          <span className="text-[10px] text-slate-400 font-semibold">Limiter (-0.1dB)</span>
          <button
            onClick={() =>
              updateMasterLimiter({
                enabled: !masterBus.limiter.enabled,
              })
            }
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-colors ${
              masterBus.limiter.enabled
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-600/40'
                : 'bg-[#181d2a] text-slate-500 border-[#252f40]'
            }`}
          >
            {masterBus.limiter.enabled ? 'PROTECT' : 'OFF'}
          </button>
        </div>

        {/* Master Mute Button */}
        <button
          onClick={toggleMasterMute}
          className={`w-full py-1.5 rounded flex items-center justify-center gap-1.5 font-semibold text-xs border transition-colors ${
            isMuted
              ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
              : 'bg-[#161a25] hover:bg-[#1d2332] text-slate-300 border-[#263045]'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'UNMUTE MASTER' : 'MUTE MASTER'}</span>
        </button>
      </div>
    </div>
  );
};
