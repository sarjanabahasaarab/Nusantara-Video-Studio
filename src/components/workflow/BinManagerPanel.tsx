/**
 * Nusantara Video Studio - Project Bins Manager Panel
 * Phase 8: Professional Editing Workflow (Requirement 7)
 *
 * Implements project bin folder organization:
 * Video, Audio, Images, Music, Voice, Graphics, Logos, Subtitles, Scenes, Exports.
 * Supports create bin, rename, delete, active bin filter, and drag-and-drop targeting.
 */

import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectBin } from '../../types';

export const BinManagerPanel: React.FC = () => {
  const bins = useWorkflowStore((s) => s.bins);
  const activeBinId = useWorkflowStore((s) => s.activeBinId);
  const setActiveBinId = useWorkflowStore((s) => s.setActiveBinId);
  const createBin = useWorkflowStore((s) => s.createBin);
  const renameBin = useWorkflowStore((s) => s.renameBin);
  const deleteBin = useWorkflowStore((s) => s.deleteBin);
  const moveMediaToBin = useWorkflowStore((s) => s.moveMediaToBin);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [isCreating, setIsCreating] = useState(false);
  const [newBinName, setNewBinName] = useState('');
  const [editingBinId, setEditingBinId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBinName.trim()) {
      createBin(newBinName.trim());
      setNewBinName('');
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (editName.trim()) {
      renameBin(id, editName.trim());
      setEditingBinId(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnBin = (e: React.DragEvent, binId: string) => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/x-media-id');
    if (mediaId) {
      moveMediaToBin(mediaId, binId);
    }
  };

  return (
    <div className="border-b border-slate-800 bg-[#12151c] p-2 text-xs">
      <div className="flex items-center justify-between px-1.5 py-1 mb-1.5 text-slate-400">
        <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Layers size={13} className="text-blue-400" />
          Project Bins
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
          title="Buat Bin Baru"
        >
          <Plus size={13} />
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="flex items-center gap-1 mb-2 px-1">
          <input
            type="text"
            placeholder="Nama Bin..."
            autoFocus
            value={newBinName}
            onChange={(e) => setNewBinName(e.target.value)}
            className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
          >
            <Check size={12} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <X size={12} />
          </button>
        </form>
      )}

      {/* Horizontal / Grid Bin Tags */}
      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
        {/* All Media (No Bin Filter) */}
        <button
          onClick={() => setActiveBinId(null)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
            activeBinId === null
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <FolderOpen size={12} />
          <span>Semua ({currentProject.media.length})</span>
        </button>

        {bins.map((bin) => {
          const isSelected = activeBinId === bin.id;
          const mediaCount = currentProject.media.filter(
            (m) => m.binId === bin.id || bin.mediaIds.includes(m.id)
          ).length;

          if (editingBinId === bin.id) {
            return (
              <div key={bin.id} className="flex items-center gap-1 bg-slate-900 px-1 py-0.5 rounded border border-slate-700">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(bin.id)}
                  className="w-16 bg-transparent text-slate-200 text-[11px] focus:outline-none"
                />
                <button onClick={() => handleRenameSubmit(bin.id)} className="text-emerald-400">
                  <Check size={11} />
                </button>
                <button onClick={() => setEditingBinId(null)} className="text-slate-400">
                  <X size={11} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={bin.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropOnBin(e, bin.id)}
              onClick={() => setActiveBinId(bin.id)}
              className={`group relative flex items-center gap-1 px-2 py-1 rounded text-[11px] cursor-pointer transition ${
                isSelected
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: bin.color || '#3b82f6' }}
              />
              <span className="truncate max-w-[90px]">{bin.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({mediaCount})</span>

              {/* Hover actions */}
              <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingBinId(bin.id);
                    setEditName(bin.name);
                  }}
                  className="hover:text-amber-300"
                  title="Ganti Nama"
                >
                  <Edit2 size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBin(bin.id);
                  }}
                  className="hover:text-rose-400"
                  title="Hapus Bin"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
