/**
 * Nusantara Video Studio - Track Header
 * Controls track state (lock, mute, hide, delete, rename)
 */

import React, { useState } from 'react';
import {
  Video,
  Music,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Trash2,
} from 'lucide-react';
import { Track } from '../../types';
import { useTimelineStore } from '../../stores/timelineStore';
import { useSelectionStore } from '../../stores/selectionStore';

interface TrackHeaderProps {
  track: Track;
}

export const TrackHeader: React.FC<TrackHeaderProps> = ({ track }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(track.name);

  const toggleLock = useTimelineStore((s) => s.toggleTrackLock);
  const toggleMute = useTimelineStore((s) => s.toggleTrackMute);
  const toggleHidden = useTimelineStore((s) => s.toggleTrackHidden);
  const deleteTrack = useTimelineStore((s) => s.deleteTrack);
  const renameTrack = useTimelineStore((s) => s.renameTrack);

  const selectedTrackId = useSelectionStore((s) => s.selectedTrackId);
  const selectTrack = useSelectionStore((s) => s.selectTrack);

  const isSelected = selectedTrackId === track.id;

  const handleFinishEditing = () => {
    if (tempName.trim()) {
      renameTrack(track.id, tempName.trim());
    } else {
      setTempName(track.name);
    }
    setIsEditingName(false);
  };

  return (
    <div
      onClick={() => selectTrack(track.id)}
      className={`w-52 h-16 border-r border-b border-[#212634] px-2.5 py-1.5 flex flex-col justify-between shrink-0 select-none transition-colors ${
        isSelected
          ? 'bg-[#1b212e] border-l-2 border-l-blue-500'
          : 'bg-[#12141c] hover:bg-[#151822]'
      }`}
    >
      {/* Top: Track Type & Name */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {track.type === 'video' ? (
            <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          ) : (
            <Music className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          )}

          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              autoFocus
              onBlur={handleFinishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEditing();
                if (e.key === 'Escape') {
                  setTempName(track.name);
                  setIsEditingName(false);
                }
              }}
              onChange={(e) => setTempName(e.target.value)}
              className="bg-[#0b0c10] border border-blue-500 rounded px-1 py-0.5 text-[11px] text-white w-28 focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditingName(true)}
              title="Double click to rename track"
              className="text-[11px] font-medium text-slate-200 truncate cursor-text"
            >
              {track.name}
            </span>
          )}
        </div>

        {/* Delete Track button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Hapus track "${track.name}"?`)) {
              deleteTrack(track.id);
            }
          }}
          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-[#202532] transition-colors"
          title="Hapus Track"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom: Track Action Controls */}
      <div className="flex items-center justify-between pt-1 border-t border-[#1b202c]">
        <div className="flex items-center gap-1">
          {/* Lock / Unlock */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLock(track.id);
            }}
            className={`p-1 rounded text-[10px] transition-colors ${
              track.locked
                ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={track.locked ? 'Unlock Track' : 'Lock Track'}
          >
            {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>

          {/* Video: Hide / Show */}
          {track.type === 'video' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleHidden(track.id);
              }}
              className={`p-1 rounded text-[10px] transition-colors ${
                track.hidden
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={track.hidden ? 'Show Track in Preview' : 'Hide Track in Preview'}
            >
              {track.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}

          {/* Audio: Mute / Unmute */}
          {track.type === 'audio' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute(track.id);
              }}
              className={`p-1 rounded text-[10px] transition-colors ${
                track.muted
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title={track.muted ? 'Unmute Track' : 'Mute Track'}
            >
              {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          )}
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
};
