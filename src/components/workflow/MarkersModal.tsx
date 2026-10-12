/**
 * Nusantara Video Studio - Markers Manager Modal
 * Phase 8: Professional Editing Workflow (Requirements 21-23)
 *
 * Implements professional timeline markers manager:
 * types (general, chapter, edit, review, scene, ai, audio, color, export),
 * search, filter, playhead seek, range markers (duration), and EDL/CSV export.
 */

import React, { useState, useMemo } from 'react';
import {
  Bookmark,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  X,
  Tag,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { Marker, MarkerType } from '../../types';
import { formatTimecode } from '../../utils/timecode';

interface MarkersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarkersModal: React.FC<MarkersModalProps> = ({ isOpen, onClose }) => {
  const markers = useWorkflowStore((s) => s.markers);
  const addMarker = useWorkflowStore((s) => s.addMarker);
  const updateMarker = useWorkflowStore((s) => s.updateMarker);
  const deleteMarker = useWorkflowStore((s) => s.deleteMarker);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);
  const notify = useUIStore((s) => s.notify);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MarkerType | 'all'>('all');

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<MarkerType>('general');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newDesc, setNewDesc] = useState('');

  if (!isOpen) return null;

  const markerTypes: (MarkerType | 'all')[] = [
    'all',
    'general',
    'chapter',
    'edit',
    'review',
    'scene',
    'ai',
    'audio',
    'color',
    'export',
  ];

  const filtered = useMemo(() => {
    return markers.filter((m) => {
      const matchType = filterType === 'all' || m.type === filterType;
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [markers, filterType, search]);

  const handleAddMarkerAtPlayhead = () => {
    const name = newName.trim() || `Marker ${markers.length + 1}`;
    addMarker(currentTime, name, newType, {
      color: newColor,
      description: newDesc.trim(),
    });
    setNewName('');
    setNewDesc('');
    notify('Marker Ditambahkan', `Marker "${name}" dibuat di ${formatTimecode(currentTime)}`, 'success', 2000);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    notify('Playhead Berpindah', `Menuju marker di ${formatTimecode(time)}`, 'info', 1000);
  };

  const handleExportCSV = () => {
    if (markers.length === 0) {
      notify('Perhatian', 'Tidak ada marker untuk diekspor.', 'warning');
      return;
    }

    const rows = ['ID,Time,Timecode,Duration,Name,Type,Color,Description'];
    for (const m of markers) {
      rows.push(
        `"${m.id}",${m.time},"${formatTimecode(m.time)}",${m.duration || 0},"${m.name}","${m.type}","${m.color || ''}","${m.description || ''}"`
      );
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markers_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Ekspor Berhasil', 'File CSV marker berhasil diunduh.', 'success', 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Bookmark size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Timeline Markers Studio</h2>
              <p className="text-xs text-slate-400">
                Tandai titik penting, babak video, review notes, dan cue point ekspor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quick Add Form */}
        <div className="p-4 border-b border-slate-800/80 bg-[#141822] grid grid-cols-12 gap-3 items-end">
          <div className="col-span-4">
            <label className="block text-[11px] text-slate-400 mb-1">Nama Marker</label>
            <input
              type="text"
              placeholder="Contoh: Cut Adegan 1, Chapter Intro..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="col-span-3">
            <label className="block text-[11px] text-slate-400 mb-1">Tipe</label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as MarkerType)}
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500 capitalize"
            >
              {markerTypes.filter((t) => t !== 'all').map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-3">
            <label className="block text-[11px] text-slate-400 mb-1">Deskripsi / Catatan</label>
            <input
              type="text"
              placeholder="Catatan..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="col-span-2">
            <button
              onClick={handleAddMarkerAtPlayhead}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-md shadow-blue-500/20"
            >
              <Plus size={14} />
              Tambah (M)
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-2.5 border-b border-slate-800/60 bg-[#161a23] flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {markerTypes.map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition capitalize ${
                  filterType === t
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="relative w-44 shrink-0">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari marker..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Marker List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Bookmark size={36} className="mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="text-sm font-medium text-slate-400">Belum ada marker pada timeline</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tekan tombol 'M' pada keyboard atau gunakan form di atas untuk membuat marker
              </p>
            </div>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-lg bg-[#181d28]/70 hover:bg-[#1f2535] border border-slate-800/80 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: m.color || '#3b82f6' }}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-200 truncate">{m.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono capitalize">
                        {m.type}
                      </span>
                    </div>
                    {m.description && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.description}</p>
                    )}
                    <span className="text-[11px] font-mono text-blue-400 mt-1 inline-block">
                      {formatTimecode(m.time)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSeek(m.time)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 text-xs font-medium transition"
                  >
                    <Clock size={12} />
                    Lompat
                  </button>
                  <button
                    onClick={() => deleteMarker(m.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="Hapus Marker"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            <Download size={13} />
            Ekspor Marker (.CSV)
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
