/**
 * Nusantara Video Studio - Timeline Toolbar
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Fast controls for Zoom, Snapping, Loop, Split at Playhead, Marker, and Track creation.
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
  Scissors,
  Bookmark,
} from 'lucide-react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
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
  const splitSelectedClipsAtPlayhead = useTimelineStore((s) => s.splitSelectedClipsAtPlayhead);

  const fps = useProjectStore((s) => s.currentProject.settings.fps);
  const addMarker = useProjectStore((s) => s.addMarker);
  const selectedClipIds = useSelectionStore((s) => s.selectedClipIds);
  const notify = useUIStore((s) => s.notify);

  const handleSplit = () => {
    if (selectedClipIds.length > 0) {
      splitSelectedClipsAtPlayhead();
      notify('Split Clip', 'Clip terpilih berhasil dipotong pada playhead.', 'success', 2000);
    } else {
      notify('Split Clip', 'Pilih clip pada timeline untuk dipotong pada playhead.', 'warning');
    }
  };

  const handleAddMarker = () => {
    addMarker(currentTime, `Marker at ${secondsToTimecode(currentTime, fps)}`);
    notify('Marker Ditambahkan', `Marker baru ditambahkan pada ${secondsToTimecode(currentTime, fps)}.`, 'info', 2000);
  };

  return (
    <div className="h-8 bg-[#10131a] border-b border-[#202532] px-3 flex items-center justify-between select-none text-xs">
      {/* Left: Time indicator, Editing tools, and Track addition */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400 bg-[#090b10] border border-[#1e2330] px-2 py-0.5 rounded">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{secondsToTimecode(currentTime, fps)}</span>
        </div>

        <div className="h-4 w-px bg-[#202634] mx-0.5" />

        {/* Split at Playhead Button (Ctrl+K) */}
        <button
          onClick={handleSplit}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d28] hover:bg-[#222a3b] border border-[#262f42] text-[11px] text-slate-200 transition-colors"
          title="Split Clip at Playhead (Ctrl+K)"
        >
          <Scissors className="w-3 h-3 text-blue-400" />
          <span>Split (Ctrl+K)</span>
        </button>

        {/* Add Marker Button (M) */}
        <button
          onClick={handleAddMarker}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d28] hover:bg-[#222a3b] border border-[#262f42] text-[11px] text-slate-200 transition-colors"
          title="Add Marker (M)"
        >
          <Bookmark className="w-3 h-3 text-amber-400" />
          <span>Marker (M)</span>
        </button>

        <div className="h-4 w-px bg-[#202634] mx-0.5" />

        {/* Track addition */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              addTrack('video');
              notify('Track Ditambahkan', 'Video track baru berhasil ditambahkan.', 'success', 2000);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d28] hover:bg-[#222a3b] border border-[#262f42] text-[11px] text-slate-200 transition-colors"
            title="Tambah Video Track"
          >
            <Video className="w-3 h-3 text-blue-400" />
            <span>+ Video</span>
          </button>
          <button
            onClick={() => {
              addTrack('audio');
              notify('Track Ditambahkan', 'Audio track baru berhasil ditambahkan.', 'success', 2000);
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#181d28] hover:bg-[#222a3b] border border-[#262f42] text-[11px] text-slate-200 transition-colors"
            title="Tambah Audio Track"
          >
            <Music className="w-3 h-3 text-emerald-400" />
            <span>+ Audio</span>
          </button>
        </div>
      </div>

      {/* Right: Snapping, Loop, and Zoom Controls */}
      <div className="flex items-center gap-3">
        {/* Snapping Toggle */}
        <button
          onClick={() => setSnapping(!snapping)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors text-[11px] ${
            snapping
              ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={snapping ? 'Snapping: ON (Snap ke playhead & clip)' : 'Snapping: OFF'}
        >
          <Magnet className="w-3 h-3" />
          <span>Snap</span>
        </button>

        {/* Loop Toggle */}
        <button
          onClick={() => setLoop(!loop)}
          className={`p-1 rounded transition-colors ${
            loop
              ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title={loop ? 'Loop Timeline: ON' : 'Loop Timeline: OFF'}
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-[#202634]" />

        {/* Zoom Slider & Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={zoomOut}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] transition-colors"
            title="Zoom Out (Ctrl+-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={10}
            max={250}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-20 h-1 bg-[#202638] rounded accent-blue-500 cursor-pointer"
            title={`Zoom: ${Math.round(zoom)} px/s`}
          />

          <button
            onClick={zoomIn}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] transition-colors"
            title="Zoom In (Ctrl+=)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => zoomToFit(containerWidth)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-[#1a202c] transition-colors"
            title="Zoom to Fit Timeline"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
