/**
 * Nusantara Video Studio - Track Header
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Controls track state: Lock (🔒), Hide/Show (👁), Mute (🔊), Solo, Rename, and Delete.
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
  const toggleSolo = useTimelineStore((s) => s.toggleTrackSolo);
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
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleFinishEditing}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFinishEditing();
                if (e.key === 'Escape') {
                  setTempName(track.name);
                  setIsEditingName(false);
                }
              }}
              className="bg-[#0b0d13] border border-blue-500 rounded px-1 text-[11px] text-white focus:outline-none w-28"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditingName(true)}
              className="text-[11px] font-semibold text-slate-200 truncate cursor-text"
              title="Double click untuk rename track"
            >
              {track.name}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Hapus track "${track.name}" beserta seluruh isinya?`)) {
              deleteTrack(track.id);
            }
          }}
          className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition-colors"
          title="Hapus Track"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom: Track Action Badges & Buttons */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          {/* Lock Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLock(track.id);
            }}
            className={`p-1 rounded transition-colors ${
              track.locked
                ? 'bg-amber-950/60 text-amber-400 border border-amber-600/40'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1f2b]'
            }`}
            title={track.locked ? 'Track Terkunci (Unlock)' : 'Kunci Track (Lock)'}
          >
            {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>

          {/* Hide/Show for Video or Mute for Audio */}
          {track.type === 'video' ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleHidden(track.id);
              }}
              className={`p-1 rounded transition-colors ${
                track.hidden
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-600/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1f2b]'
              }`}
              title={track.hidden ? 'Tampilkan Video Track' : 'Sembunyikan Video Track'}
            >
              {track.hidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute(track.id);
              }}
              className={`p-1 rounded transition-colors ${
                track.muted
                  ? 'bg-rose-950/60 text-rose-400 border border-rose-600/40'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1f2b]'
              }`}
              title={track.muted ? 'Unmute Audio Track' : 'Mute Audio Track'}
            >
              {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          )}

          {/* Solo Button (Requirement 34) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSolo(track.id);
            }}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
              track.solo
                ? 'bg-amber-500 text-black shadow-xs'
                : 'text-slate-500 hover:text-slate-300 hover:bg-[#1a1f2b]'
            }`}
            title="Solo Track (hanya putar track ini)"
          >
            S
          </button>
        </div>

        {/* Clip count indicator */}
        <span className="text-[10px] text-slate-500 font-mono">
          {track.clips.length} {track.clips.length === 1 ? 'clip' : 'clips'}
        </span>
      </div>
    </div>
  );
};
