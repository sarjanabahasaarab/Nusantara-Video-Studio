/**
 * Nusantara Video Studio - Transitions Sidebar Tab
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Provides a responsive visual browser for 11 video transitions
 * (Cross Dissolve, Fade, Dip to Black/White, Wipes, Push, Slide, Zoom),
 * with drag-to-timeline and one-click apply to selected clips.
 */

import React, { useState } from 'react';
import {
  TRANSITION_DEFINITIONS,
  TransitionDefinition,
  TransitionEngine,
} from '../../engine/transitions/TransitionEngine';
import { useProjectStore } from '../../stores/projectStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useUIStore } from '../../stores/uiStore';
import { Layers, Plus, Sparkles, Sliders } from 'lucide-react';
import { TransitionType } from '../../types';

export const TransitionsSidebar: React.FC = () => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'dissolve' | 'wipe' | 'motion' | 'dip'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedClipId = useSelectionStore((s) => s.selectedClipId);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const addTransition = useProjectStore((s) => s.addTransition);
  const notify = useUIStore((s) => s.notify);

  const filtered = TRANSITION_DEFINITIONS.filter((d) => {
    const matchesCat = filterCategory === 'all' || d.category === filterCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDragStart = (e: React.DragEvent, def: TransitionDefinition) => {
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        type: 'transition',
        transitionType: def.type,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleApplyToSelected = (def: TransitionDefinition) => {
    if (!selectedClipId) {
      notify('Pilih Clip', 'Pilih clip di timeline terlebih dahulu untuk dipasangi transisi.', 'info', 2500);
      return;
    }

    // Find the track and index of selected clip
    let foundTrack = null;
    let foundIndex = -1;

    for (const t of tracks) {
      const idx = t.clips.findIndex((c) => c.id === selectedClipId);
      if (idx !== -1) {
        foundTrack = t;
        foundIndex = idx;
        break;
      }
    }

    if (!foundTrack || foundIndex === -1) {
      notify('Clip Tidak Ditemukan', 'Clip tidak berada dalam track aktif.', 'warning');
      return;
    }

    // Try adjacent clips (prefer forward to next clip, or backward from prev clip)
    let c1 = null;
    let c2 = null;

    if (foundIndex < foundTrack.clips.length - 1) {
      c1 = foundTrack.clips[foundIndex];
      c2 = foundTrack.clips[foundIndex + 1];
    } else if (foundIndex > 0) {
      c1 = foundTrack.clips[foundIndex - 1];
      c2 = foundTrack.clips[foundIndex];
    }

    if (!c1 || !c2) {
      notify(
        'Perlu 2 Clip Berturutan',
        'Transisi membutuhkan minimal 2 clip bersebelahan pada track yang sama.',
        'warning',
        3000
      );
      return;
    }

    const tr = TransitionEngine.createTransition(def.type, c1, c2);
    if (!tr) {
      notify(
        'Handle Media Kurang',
        'Durasi clip tidak cukup untuk transisi ini. Geser atau perpendek transisi.',
        'warning',
        3000
      );
      return;
    }

    addTransition(tr);
    notify('Transisi Dipasang', `Transisi "${def.name}" dipasang antara ${c1.name} dan ${c2.name}.`, 'success');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none bg-[#0e1017]">
      {/* Category Pills Filter */}
      <div className="p-2 border-b border-[#1f2430] flex items-center gap-1 overflow-x-auto no-scrollbar">
        {(['all', 'dissolve', 'dip', 'wipe', 'motion'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2 py-0.5 rounded text-[10px] capitalize shrink-0 font-medium transition-colors ${
              filterCategory === cat
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-[#161a24] text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat === 'all' ? 'All (11)' : cat}
          </button>
        ))}
      </div>

      {/* Transitions Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2.5">
        {filtered.map((def) => {
          return (
            <div
              key={def.type}
              draggable
              onDragStart={(e) => handleDragStart(e, def)}
              className="group relative bg-[#131620] hover:bg-[#181d2a] border border-[#212736] hover:border-purple-500/50 rounded-xl p-2.5 flex flex-col justify-between cursor-grab active:cursor-grabbing transition-all shadow-sm"
            >
              {/* Preview Thumbnail Graphic */}
              <div className="h-16 w-full rounded-lg bg-gradient-to-tr from-purple-950/60 via-[#1a1f2e] to-indigo-950/60 border border-purple-800/30 flex items-center justify-center relative overflow-hidden mb-2 group-hover:scale-[1.02] transition-transform">
                <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-400/30 flex items-center justify-center text-purple-300">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="absolute top-1 right-1.5 text-[8px] font-mono text-purple-300 font-semibold bg-black/60 px-1 rounded">
                  {def.defaultDuration}s
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h4 className="text-[11px] font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors">
                  {def.name}
                </h4>
                <p className="text-[9px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                  {def.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleApplyToSelected(def)}
                className="mt-2 w-full py-1 rounded bg-[#1c2232] hover:bg-purple-600 text-slate-300 hover:text-white border border-[#273044] hover:border-purple-500 text-[10px] font-medium flex items-center justify-center gap-1 transition-colors"
                title="Terapkan ke batas clip terpilih di timeline"
              >
                <Plus className="w-3 h-3" />
                <span>Apply</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="p-2 border-t border-[#1f2430] bg-[#0c0d13] text-[10px] text-slate-400 flex items-center justify-between">
        <span>Tarik ke timeline atau klik <b>Apply</b></span>
        <span className="text-purple-400 font-mono font-medium">Phase 4</span>
      </div>
    </div>
  );
};
