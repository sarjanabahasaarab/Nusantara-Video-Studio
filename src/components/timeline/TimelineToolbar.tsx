/**
 * Nusantara Video Studio - Timeline Toolbar
 * Track addition, zoom controls, snapping, loop, and timeline duration
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Magnet,
  Repeat,
  Video,
  Music,
  Clock,
} from 'lucide-react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { secondsToTimecode } from '../../utils/timecode';

interface TimelineToolbarProps {
  containerWidth: number;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({ containerWidth }) => {
  const currentTime = useTimelineStore((s) => s.currentTime);
  const zoom = useTimelineStore((s) => s.zoom);
  const setZoom = useTimelineStore((s) => s.setZoom);
  const zoomIn = useTimelineStore((s) => s.zoomIn);
  const zoomOut = useTimelineStore((s) => s.zoomOut);
  const zoomToFit = useTimelineStore((s) => s.zoomToFit);
  const snapping = useTimelineStore((s) => s.snapping);
  const setSnapping = useTimelineStore((s) => s.setSnapping);
  const loop = useTimelineStore((s) => s.loop);
  const setLoop = useTimelineStore((s) => s.setLoop);
  const addTrack = useTimelineStore((s) => s.addTrack);

  const fps = useProjectStore((s) => s.currentProject.settings.fps);

  return (
    <div className="h-8 bg-[#10131a] border-b border-[#202532] px-3 flex items-center justify-between select-none text-xs">
      {/* Left: Time indicator & Add Track Buttons */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400 bg-[#090b10] border border-[#1e2330] px-2 py-0.5 rounded">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{secondsToTimecode(currentTime, fps)}</span>
        </div>

        <div className="h-4 w-px bg-[#202634]" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => addTrack('video')}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d28] hover:bg-[#222a3b] border border-[#262f42] text-[11px] text-slate-200 transition-colors"
            title="Tambah Video Track"
          >
            <Video className="w-3 h-3 text-blue-400" />
            <span>+ Video Track</span>
          </button>
          <button
            onClick={() => addTrack('audio')}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d28] hover:bg-[#222a3b] border border-[#262f42] text-[11px] text-slate-200 transition-colors"
            title="Tambah Audio Track"
          >
            <Music className="w-3 h-3 text-emerald-400" />
            <span>+ Audio Track</span>
          </button>
        </div>
      </div>

      {/* Right: Snapping, Loop, & Timeline Zoom */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSnapping(!snapping)}
          className={`p-1 rounded text-xs transition-colors ${
            snapping
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={snapping ? 'Snapping: ON' : 'Snapping: OFF'}
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setLoop(!loop)}
          className={`p-1 rounded text-xs transition-colors ${
            loop
              ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={loop ? 'Loop Playback: ON' : 'Loop Playback: OFF'}
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#202634] mx-1" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={10}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-20 h-1 bg-[#232938] rounded appearance-none cursor-pointer accent-blue-500"
            title={`Zoom: ${Math.round(zoom)}px/s`}
          />

          <button
            onClick={zoomIn}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
            title="Zoom In (Ctrl+=)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => zoomToFit(containerWidth)}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1a1f2b] transition-colors"
            title="Zoom to Fit Entire Timeline"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
