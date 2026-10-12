/**
 * Nusantara Video Studio - Multicam Preparation Modal
 * Phase 8: Professional Editing Workflow (Requirements 24-26)
 *
 * Implements multicam angle grouping, camera angle assignment,
 * audio/timecode synchronization, and multi-angle switcher preview grid.
 */

import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Sliders,
  Check,
  Plus,
  Play,
  Volume2,
  Clock,
  X,
  Trash2,
  Video,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useUIStore } from '../../stores/uiStore';
import { MulticamGroup, MulticamSyncMethod, MediaItem } from '../../types';

interface MulticamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MulticamModal: React.FC<MulticamModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const multicamGroups = useWorkflowStore((s) => s.multicamGroups);
  const createMulticamGroup = useWorkflowStore((s) => s.createMulticamGroup);
  const syncMulticamGroup = useWorkflowStore((s) => s.syncMulticamGroup);
  const notify = useUIStore((s) => s.notify);

  const [groupName, setGroupName] = useState('Multicam Group 1');
  const [syncMethod, setSyncMethod] = useState<MulticamSyncMethod>('audio');
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [activePreviewGroupId, setActivePreviewGroupId] = useState<string | null>(
    multicamGroups[0]?.id || null
  );
  const [activeAngleIndex, setActiveAngleIndex] = useState(0);

  if (!isOpen) return null;

  const videoMedia = currentProject.media.filter(
    (m) => m.type === 'video' || m.mimeType?.startsWith('video/')
  );

  const toggleSelectMedia = (id: string) => {
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = () => {
    if (selectedMediaIds.length < 2) {
      notify('Perhatian', 'Pilih minimal 2 klip video untuk membuat Multicam Clip.', 'warning');
      return;
    }

    const items = currentProject.media.filter((m) => selectedMediaIds.includes(m.id));
    const newGroup = createMulticamGroup(groupName, items, syncMethod);
    const syncRes = syncMulticamGroup(newGroup.id);

    setActivePreviewGroupId(newGroup.id);
    setSelectedMediaIds([]);
    setGroupName(`Multicam Group ${multicamGroups.length + 2}`);
    notify(
      'Multicam Clip Dibuat',
      `Grup "${newGroup.name}" dibuat dengan ${newGroup.angles.length} sudut kamera. ${syncRes.message}`,
      'success',
      3000
    );
  };

  const activeGroup = multicamGroups.find((g) => g.id === activePreviewGroupId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Multicam Studio Preparation</h2>
              <p className="text-xs text-slate-400">Sinkronisasi multi-kamera via waveform audio, timecode, atau manual</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-12 gap-6">
          {/* Left: Create Multicam Group Form */}
          <div className="col-span-5 space-y-4 border-r border-slate-800/80 pr-6">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Buat Multicam Baru
            </h3>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Nama Grup Kamera</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Metode Sinkronisasi</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['audio', 'timecode', 'manual'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSyncMethod(method)}
                    className={`py-1.5 px-2 rounded text-center capitalize border transition ${
                      syncMethod === method
                        ? 'bg-pink-600/20 border-pink-500 text-pink-300 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Selection Checklist */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                Pilih Klip Kamera ({selectedMediaIds.length} dipilih)
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded bg-slate-950 border border-slate-800">
                {videoMedia.length === 0 ? (
                  <p className="text-[11px] text-slate-500 py-4 text-center">
                    Tidak ada video di Media Library. Import media terlebih dahulu.
                  </p>
                ) : (
                  videoMedia.map((m) => {
                    const isSelected = selectedMediaIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleSelectMedia(m.id)}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer text-xs transition ${
                          isSelected
                            ? 'bg-pink-500/15 border border-pink-500/40 text-slate-100'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-pink-500 focus:ring-0"
                        />
                        <span className="truncate flex-1 font-mono text-[11px]">{m.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={selectedMediaIds.length < 2}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-medium transition shadow-lg shadow-pink-500/20 disabled:opacity-50"
            >
              <Plus size={14} />
              Bentuk Multicam Group
            </button>
          </div>

          {/* Right: Existing Multicam Groups & 4-Up Angle Switcher Preview */}
          <div className="col-span-7 space-y-4">
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Preview Sudut Kamera Multicam</span>
              <span className="text-[11px] text-slate-400 font-normal">
                {multicamGroups.length} Grup Terdaftar
              </span>
            </h3>

            {activeGroup ? (
              <div className="space-y-3">
                {/* 4-Up Grid Preview */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {activeGroup.angles.map((angle, idx) => {
                    const media = currentProject.media.find((m) => m.id === angle.mediaId);
                    const isCutActive = activeAngleIndex === idx;

                    return (
                      <div
                        key={angle.id}
                        onClick={() => setActiveAngleIndex(idx)}
                        className={`relative aspect-video rounded overflow-hidden cursor-pointer border-2 transition group ${
                          isCutActive ? 'border-pink-500 shadow-md shadow-pink-500/30' : 'border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {media?.url ? (
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full bg-[#161a23] flex items-center justify-center text-slate-500">
                            <Video size={24} />
                          </div>
                        )}

                        {/* Angle Overlay Badge */}
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-white flex items-center gap-1">
                          <span className={isCutActive ? 'text-pink-400' : 'text-slate-400'}>
                            {idx + 1}
                          </span>
                          <span>{angle.name}</span>
                        </div>

                        {/* Cut Active Indicator */}
                        {isCutActive && (
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-pink-600 text-[10px] font-bold text-white uppercase tracking-wider">
                            PROGRAM
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 rounded-lg bg-[#181d28] border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-200">{activeGroup.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Sync: <span className="text-pink-400 capitalize">{activeGroup.syncMethod}</span> • Sudut Terpilih: Sudut {activeAngleIndex + 1}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      notify('Multicam Diterapkan', `Sudut ${activeAngleIndex + 1} dipilih ke timeline.`, 'success', 2000);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded bg-pink-600 hover:bg-pink-500 text-white font-medium"
                  >
                    Terapkan Cut
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                <Camera size={40} className="mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs text-slate-400">Belum ada Multicam Group aktif</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pilih klip di panel kiri untuk membuat sinkronisasi sudut kamera
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Multicam Engine menyelaraskan offset waktu secara otomatis tanpa mengubah file sumber.
          </span>
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
