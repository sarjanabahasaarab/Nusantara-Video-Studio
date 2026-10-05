/**
 * Nusantara Video Studio - Subtitle Editor Modal
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Implements professional Subtitle Editor (Requirements 11, 12, 13):
 * - Table Columns: No | Start | End | Text | Actions
 * - Add, Edit, Delete, Duplicate, Split, Merge
 * - Validation & Overlap warnings
 * - Search Subtitle, Find and Replace
 * - Clicking row moves playhead to subtitle start time
 * - Import and Export SRT/VTT
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import {
  MessageSquare,
  Plus,
  Trash2,
  CopyPlus,
  Scissors,
  Merge,
  Search,
  Replace,
  Upload,
  Download,
  AlertTriangle,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { useSubtitleStore } from '../../stores/subtitleStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { SubtitleParser } from '../../engine/subtitles/SubtitleParser';
import { SubtitleItem } from '../../types';

export const SubtitleEditorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const activeTrack = useSubtitleStore((s) => s.getActiveTrack());
  const selectedSubtitleId = useSubtitleStore((s) => s.selectedSubtitleId);
  const selectSubtitle = useSubtitleStore((s) => s.selectSubtitle);
  const addSubtitle = useSubtitleStore((s) => s.addSubtitle);
  const updateSubtitle = useSubtitleStore((s) => s.updateSubtitle);
  const deleteSubtitle = useSubtitleStore((s) => s.deleteSubtitle);
  const duplicateSubtitle = useSubtitleStore((s) => s.duplicateSubtitle);
  const splitSubtitle = useSubtitleStore((s) => s.splitSubtitle);
  const mergeSubtitleWithNext = useSubtitleStore((s) => s.mergeSubtitleWithNext);
  const validation = useSubtitleStore((s) => s.validation);

  const searchQuery = useSubtitleStore((s) => s.searchQuery);
  const setSearchQuery = useSubtitleStore((s) => s.setSearchQuery);
  const replaceText = useSubtitleStore((s) => s.replaceText);
  const setReplaceText = useSubtitleStore((s) => s.setReplaceText);
  const performFindAndReplace = useSubtitleStore((s) => s.performFindAndReplace);

  const importSubtitlesFromText = useSubtitleStore((s) => s.importSubtitlesFromText);
  const exportSubtitles = useSubtitleStore((s) => s.exportSubtitles);

  const currentTime = useTimelineStore((s) => s.currentTime);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const notify = useUIStore((s) => s.notify);

  const [localSearch, setLocalSearch] = useState('');
  const [localReplace, setLocalReplace] = useState('');

  const items = activeTrack?.items || [];
  const filteredItems = localSearch
    ? items.filter((it) => it.text.toLowerCase().includes(localSearch.toLowerCase()))
    : items;

  const handleRowClick = (item: SubtitleItem) => {
    selectSubtitle(item.id);
    setCurrentTime(item.startTime);
  };

  const handleExecuteReplace = () => {
    if (!localSearch) return;
    setSearchQuery(localSearch);
    setReplaceText(localReplace);
    const count = performFindAndReplace(false);
    notify('Find & Replace', `${count} teks subtitle berhasil diganti.`, 'success');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.srt,.vtt,.ass,.ssa,text/plain';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const ok = importSubtitlesFromText(text, 'auto');
        if (ok) {
          notify('Import Subtitle', `Berhasil mengimport "${file.name}".`, 'success');
        } else {
          notify('Gagal Import', 'Format berkas tidak valid.', 'error');
        }
      } catch (err) {
        notify('Error', String(err), 'error');
      }
    };
    input.click();
  };

  const handleExport = (format: 'srt' | 'vtt') => {
    const content = exportSubtitles(format);
    if (!content) {
      notify('Export Subtitle', 'Track subtitle kosong.', 'warning');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nusantara_subtitles.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Export Berhasil', `File subtitle .${format.toUpperCase()} telah diunduh.`, 'success');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Subtitle Track Studio" maxWidth="max-w-4xl">
      <div className="flex flex-col gap-3.5 text-xs text-slate-300">
        {/* Top Control Bar: Add, Import, Export, Validation status */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => addSubtitle(currentTime, 3, 'Teks Subtitle Baru')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah di Playhead ({currentTime.toFixed(1)}s)</span>
            </button>

            <button
              onClick={handleImport}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161a25] hover:bg-[#1e2434] border border-[#263045] text-slate-300 transition-colors"
              title="Import SRT/VTT/ASS"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import SRT/VTT</span>
            </button>

            <button
              onClick={() => handleExport('srt')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161a25] hover:bg-[#1e2434] border border-[#263045] text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export SRT</span>
            </button>

            <button
              onClick={() => handleExport('vtt')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161a25] hover:bg-[#1e2434] border border-[#263045] text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export VTT</span>
            </button>
          </div>

          {/* Validation Badge */}
          {validation.warnings.length > 0 ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-600/40 text-amber-300 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{validation.warnings.length} Peringatan Overlap</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-600/30 text-emerald-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Timing Valid ({items.length} entri)</span>
            </div>
          )}
        </div>

        {/* Find & Replace Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-[#0c0e14] border border-[#1e2433] rounded-lg">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Cari kata dalam subtitle..."
              className="w-full bg-[#131722] border border-[#222938] rounded pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative flex-1 flex items-center">
              <Replace className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={localReplace}
                onChange={(e) => setLocalReplace(e.target.value)}
                placeholder="Ganti dengan..."
                className="w-full bg-[#131722] border border-[#222938] rounded pl-8 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleExecuteReplace}
              disabled={!localSearch}
              className="px-3 py-1 rounded bg-[#1e2536] hover:bg-[#283248] disabled:opacity-30 text-blue-400 font-medium text-xs transition-colors shrink-0"
            >
              Ganti Semua
            </button>
          </div>
        </div>

        {/* Subtitle Table: Columns: No | Start | End | Text | Actions (Requirement 12) */}
        <div className="border border-[#202534] rounded-xl overflow-hidden bg-[#0c0e15] flex flex-col max-h-[380px]">
          <div className="grid grid-cols-12 bg-[#121622] px-3 py-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-[#202534]">
            <div className="col-span-1 text-center">No</div>
            <div className="col-span-2">Mulai (Start)</div>
            <div className="col-span-2">Selesai (End)</div>
            <div className="col-span-5">Teks Subtitle</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          <div className="overflow-y-auto divide-y divide-[#181d2a] flex-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const isSelected = item.id === selectedSubtitleId;
                const isOverlapping = validation.overlaps.some(
                  (ov) => ov.indexA === item.index || ov.indexB === item.index
                );

                return (
                  <div
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className={`grid grid-cols-12 px-3 py-2 items-center text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 text-white'
                        : isOverlapping
                        ? 'bg-amber-950/20 hover:bg-amber-950/30'
                        : 'hover:bg-[#131824]'
                    }`}
                  >
                    {/* No */}
                    <div className="col-span-1 text-center font-mono text-slate-500">
                      {item.index || idx + 1}
                    </div>

                    {/* Start Time Input */}
                    <div className="col-span-2 pr-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={item.startTime}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          updateSubtitle(item.id, { startTime: val });
                        }}
                        className="w-full bg-[#151924] border border-[#252c3c] rounded px-1.5 py-0.5 font-mono text-xs text-blue-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* End Time Input */}
                    <div className="col-span-2 pr-2">
                      <input
                        type="number"
                        step="0.1"
                        min={item.startTime + 0.1}
                        value={item.endTime}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const val = Math.max(item.startTime + 0.1, parseFloat(e.target.value) || item.startTime + 0.1);
                          updateSubtitle(item.id, { endTime: val });
                        }}
                        className="w-full bg-[#151924] border border-[#252c3c] rounded px-1.5 py-0.5 font-mono text-xs text-cyan-300 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Text Input */}
                    <div className="col-span-5 pr-2">
                      <input
                        type="text"
                        value={item.text}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateSubtitle(item.id, { text: e.target.value })}
                        className="w-full bg-[#151924] border border-[#252c3c] rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Actions: Split, Merge, Duplicate, Delete */}
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const mid = item.startTime + (item.endTime - item.startTime) / 2;
                          splitSubtitle(item.id, mid);
                        }}
                        title="Split Subtitle di Tengah"
                        className="p-1 rounded hover:bg-[#202738] text-slate-400 hover:text-blue-400"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          mergeSubtitleWithNext(item.id);
                        }}
                        title="Gabungkan dengan Subtitle Berikutnya"
                        className="p-1 rounded hover:bg-[#202738] text-slate-400 hover:text-purple-400"
                      >
                        <Merge className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSubtitle(item.id);
                        }}
                        title="Duplikat Subtitle"
                        className="p-1 rounded hover:bg-[#202738] text-slate-400 hover:text-emerald-400"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSubtitle(item.id);
                        }}
                        title="Hapus Subtitle"
                        className="p-1 rounded hover:bg-[#202738] text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40" />
                <p>Belum ada entri subtitle.</p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Klik "Tambah di Playhead" atau "Import SRT/VTT".
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
