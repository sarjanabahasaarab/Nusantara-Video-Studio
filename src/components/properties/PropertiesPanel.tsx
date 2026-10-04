/**
 * Nusantara Video Studio - Right Properties Panel
 * Inspects and modifies selected timeline clip attributes (Transform, Audio, Speed)
 */

import React from 'react';
import { Sliders, Move, Volume2, Gauge, Layers, Info } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { SliderInput } from '../common/SliderInput';

export const PropertiesPanel: React.FC = () => {
  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const propertiesWidth = useUIStore((s) => s.propertiesWidth);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const updateClip = useTimelineStore((s) => s.updateClip);

  // Find currently selected clip across tracks
  let selectedClip = null;
  let parentTrack = null;
  for (const track of tracks) {
    const found = track.clips.find((c) => c.id === selectedClipId);
    if (found) {
      selectedClip = found;
      parentTrack = track;
      break;
    }
  }

  return (
    <aside
      style={{ width: `${propertiesWidth}px` }}
      className="bg-[#12141c] border-l border-[#212633] flex flex-col shrink-0 select-none overflow-hidden z-10"
    >
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#1f2430] bg-[#0e1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-semibold text-slate-200 tracking-wide uppercase">
            Properties
          </span>
        </div>
        {selectedClip && (
          <span className="text-[10px] text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-800/30 truncate max-w-[120px]">
            {selectedClip.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col">
        {!selectedClip ? (
          <div className="flex flex-col items-center justify-center text-center my-auto py-8">
            <div className="w-12 h-12 rounded-2xl bg-[#171a24] border border-[#242b3b] flex items-center justify-center text-slate-500 mb-3 shadow-inner">
              <Layers className="w-6 h-6 opacity-60" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">No Selection</h3>
            <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
              Pilih clip pada timeline untuk melihat properties.
            </p>
            <div className="mt-4 p-2 bg-[#0e1016] border border-[#1f2431] rounded text-[10px] text-slate-500 max-w-[210px]">
              Klik tombol <span className="text-blue-400">+ Sample Clip</span> di sidebar kiri untuk langsung mencoba inspektor properti.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-xs">
            {/* Clip Info Card */}
            <div className="p-2.5 rounded-lg bg-[#0e1017] border border-[#1e2330]">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Track:</span>
                <span className="font-medium text-slate-200">{parentTrack?.name}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-400">Start Time:</span>
                <span className="font-mono text-slate-300">{selectedClip.startTime.toFixed(2)}s</span>
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1">
                <span className="text-slate-400">Duration:</span>
                <span className="font-mono text-slate-300">{selectedClip.duration.toFixed(2)}s</span>
              </div>
            </div>

            {/* Category: Transform */}
            <div className="rounded-lg bg-[#151821] border border-[#232938] overflow-hidden">
              <div className="px-3 py-2 bg-[#191e2a] border-b border-[#242b3b] flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-semibold text-slate-200 text-[11px]">Transform</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <SliderInput
                  label="Position X"
                  value={selectedClip.transform.positionX}
                  min={-1920}
                  max={1920}
                  step={1}
                  unit="px"
                  defaultValue={0}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, positionX: 0 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, positionX: val },
                    })
                  }
                />
                <SliderInput
                  label="Position Y"
                  value={selectedClip.transform.positionY}
                  min={-1080}
                  max={1080}
                  step={1}
                  unit="px"
                  defaultValue={0}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, positionY: 0 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, positionY: val },
                    })
                  }
                />
                <SliderInput
                  label="Scale"
                  value={selectedClip.transform.scale}
                  min={0.1}
                  max={4.0}
                  step={0.05}
                  unit="x"
                  defaultValue={1.0}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, scale: 1.0 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, scale: val },
                    })
                  }
                />
                <SliderInput
                  label="Rotation"
                  value={selectedClip.transform.rotation}
                  min={-360}
                  max={360}
                  step={1}
                  unit="°"
                  defaultValue={0}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, rotation: 0 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, rotation: val },
                    })
                  }
                />
                <SliderInput
                  label="Opacity"
                  value={selectedClip.transform.opacity}
                  min={0}
                  max={1}
                  step={0.01}
                  unit=""
                  defaultValue={1.0}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, opacity: 1.0 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      transform: { ...selectedClip.transform, opacity: val },
                    })
                  }
                />
              </div>
            </div>

            {/* Category: Audio */}
            <div className="rounded-lg bg-[#151821] border border-[#232938] overflow-hidden">
              <div className="px-3 py-2 bg-[#191e2a] border-b border-[#242b3b] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-slate-200 text-[11px]">Audio</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <SliderInput
                  label="Volume"
                  value={selectedClip.audio?.volume ?? 100}
                  min={0}
                  max={150}
                  step={1}
                  unit="%"
                  defaultValue={100}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      audio: { ...(selectedClip.audio || { pan: 0, mute: false }), volume: 100 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      audio: { ...(selectedClip.audio || { pan: 0, mute: false }), volume: val },
                    })
                  }
                />
                <SliderInput
                  label="Pan (L / R)"
                  value={selectedClip.audio?.pan ?? 0}
                  min={-100}
                  max={100}
                  step={1}
                  unit=""
                  defaultValue={0}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      audio: { ...(selectedClip.audio || { volume: 100, mute: false }), pan: 0 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      audio: { ...(selectedClip.audio || { volume: 100, mute: false }), pan: val },
                    })
                  }
                />
              </div>
            </div>

            {/* Category: Speed */}
            <div className="rounded-lg bg-[#151821] border border-[#232938] overflow-hidden">
              <div className="px-3 py-2 bg-[#191e2a] border-b border-[#242b3b] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold text-slate-200 text-[11px]">Speed</span>
              </div>
              <div className="p-3 flex flex-col gap-2">
                <SliderInput
                  label="Speed Rate"
                  value={selectedClip.speed.rate}
                  min={0.25}
                  max={8.0}
                  step={0.25}
                  unit="x"
                  defaultValue={1.0}
                  onReset={() =>
                    updateClip(selectedClip.id, {
                      speed: { ...selectedClip.speed, rate: 1.0 },
                    })
                  }
                  onChange={(val) =>
                    updateClip(selectedClip.id, {
                      speed: { ...selectedClip.speed, rate: val },
                    })
                  }
                />
              </div>
            </div>

            {/* Architecture note */}
            <div className="flex items-start gap-2 p-2.5 rounded bg-[#0f1118] border border-[#212634] text-[10px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                State arsitektur properti siap dikembangkan untuk keyframing pada Phase 4 & 7.
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
