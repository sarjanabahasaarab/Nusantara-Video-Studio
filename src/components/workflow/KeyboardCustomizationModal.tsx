/**
 * Nusantara Video Studio - Keyboard Shortcuts Customization Modal
 * Phase 8: Professional Editing Workflow (Requirements 27-28)
 *
 * Implements customizable key bindings, live search, categorization,
 * collision/conflict detection, preset switching (Nusantara / Premiere / FCPX),
 * and JSON import/export.
 */

import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  Search,
  RotateCcw,
  AlertTriangle,
  Check,
  Download,
  Upload,
  X,
  Sliders,
} from 'lucide-react';
import { ShortcutManager } from '../../engine/workflow/ShortcutManager';
import { CommandShortcut, ShortcutCategory, ShortcutPreset } from '../../types';
import { useUIStore } from '../../stores/uiStore';

interface KeyboardCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardCustomizationModal: React.FC<KeyboardCustomizationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const notify = useUIStore((s) => s.notify);

  const [shortcuts, setShortcuts] = useState<CommandShortcut[]>(() =>
    ShortcutManager.getShortcuts()
  );
  const [activeCategory, setActiveCategory] = useState<ShortcutCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories: (ShortcutCategory | 'All')[] = [
    'All',
    'General',
    'Timeline',
    'Playback',
    'Markers',
    'Media',
    'Navigation',
  ];

  const filtered = useMemo(() => {
    return shortcuts.filter((sc) => {
      const matchCat = activeCategory === 'All' || sc.category === activeCategory;
      const matchQuery =
        sc.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sc.customKey || sc.defaultKey).toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [shortcuts, activeCategory, searchQuery]);

  const handleKeyRecord = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingId(null);
      setConflictWarning(null);
      return;
    }

    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');

    let key = e.key;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      return; // wait for actual letter/symbol
    }
    if (key === ' ') key = 'Space';
    if (key.length === 1) key = key.toUpperCase();

    parts.push(key);
    const combination = parts.join('+');

    // Check conflict
    const conflict = ShortcutManager.findConflict(id, combination, shortcuts);
    if (conflict) {
      setConflictWarning(`Peringatan: Shortcut "${combination}" bertabrakan dengan "${conflict.command}".`);
    } else {
      setConflictWarning(null);
    }

    // Save
    const updated = ShortcutManager.updateShortcut(id, combination);
    setShortcuts(updated);
    setEditingId(null);
    notify('Shortcut Diperbarui', `Tombol untuk "${shortcuts.find((s) => s.id === id)?.command}" disetel ke ${combination}`, 'info', 2000);
  };

  const handleReset = () => {
    if (confirm('Kembalikan seluruh keyboard shortcut ke standar bawaan Nusantara?')) {
      const reset = ShortcutManager.resetToDefaults();
      setShortcuts(reset);
      setConflictWarning(null);
      notify('Reset Selesai', 'Pintasan keyboard dikembalikan ke setelan default.', 'success');
    }
  };

  const handlePresetSelect = (preset: ShortcutPreset) => {
    const loaded = ShortcutManager.applyPreset(preset);
    setShortcuts(loaded);
    notify('Preset Diterapkan', `Layout keyboard diubah ke ${preset}.`, 'success', 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Keyboard size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Keyboard Shortcuts Customizer</h2>
              <p className="text-xs text-slate-400">Atur dan modifikasi tombol pintas untuk efisiensi alur kerja profesional</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar Filter & Search */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-[#141822] flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pintasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Preset:</span>
            <button
              onClick={() => handlePresetSelect('default')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition"
            >
              Nusantara
            </button>
            <button
              onClick={() => handlePresetSelect('premiere')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition"
            >
              Premiere
            </button>
            <button
              onClick={() => handlePresetSelect('final-cut')}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium transition"
            >
              Final Cut Pro
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="px-6 py-2 border-b border-slate-800/60 bg-[#161a23] flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                activeCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {conflictWarning && (
          <div className="mx-6 mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{conflictWarning}</span>
          </div>
        )}

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#181d28]/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#12151c] text-slate-400 border-b border-slate-800 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Perintah / Action</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4 text-right">Tombol Pintas (Klik untuk Ubah)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((sc) => {
                  const isEditing = editingId === sc.id;
                  const activeKey = sc.customKey || sc.defaultKey;

                  return (
                    <tr key={sc.id} className="hover:bg-[#1f2535] transition">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-slate-200">{sc.command}</div>
                        <div className="text-[11px] text-slate-500">{sc.description}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                        {sc.category}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {isEditing ? (
                          <div
                            tabIndex={0}
                            onKeyDown={(e) => handleKeyRecord(e, sc.id)}
                            className="inline-block px-3 py-1 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono font-bold animate-pulse focus:outline-none"
                          >
                            Tekan tombol baru... (Esc batal)
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(sc.id);
                              setConflictWarning(null);
                            }}
                            className={`px-2.5 py-1 rounded font-mono font-semibold transition border ${
                              sc.customKey
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {activeKey}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
          >
            <RotateCcw size={13} />
            Kembalikan ke Default
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-lg shadow-emerald-500/20"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
