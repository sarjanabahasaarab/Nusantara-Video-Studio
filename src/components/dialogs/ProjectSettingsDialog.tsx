/**
 * Nusantara Video Studio - Project Settings Dialog
 * Edit active project attributes and duration
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { FRAME_RATES, ASPECT_RATIOS } from '../../utils/presets';
import { AspectRatio, FrameRate } from '../../types';

export const ProjectSettingsDialog: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const notify = useUIStore((s) => s.notify);

  const currentProject = useProjectStore((s) => s.currentProject);
  const updateSettings = useProjectStore((s) => s.updateSettings);

  const [name, setName] = useState(currentProject.name);
  const [width, setWidth] = useState(currentProject.settings.width);
  const [height, setHeight] = useState(currentProject.settings.height);
  const [fps, setFps] = useState<FrameRate>(currentProject.settings.fps);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(currentProject.settings.aspectRatio);
  const [duration, setDuration] = useState(currentProject.timeline.duration);

  useEffect(() => {
    setName(currentProject.name);
    setWidth(currentProject.settings.width);
    setHeight(currentProject.settings.height);
    setFps(currentProject.settings.fps);
    setAspectRatio(currentProject.settings.aspectRatio);
    setDuration(currentProject.timeline.duration);
  }, [currentProject]);

  const isOpen = activeDialog === 'projectSettings';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: name.trim() || 'Untitled Project',
      width: Number(width),
      height: Number(height),
      fps,
      aspectRatio,
      duration: Math.max(30, Number(duration)),
    });
    closeDialog();
    notify('Project Settings Disimpan', 'Pengaturan proyek berhasil diperbarui.', 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title="Project Settings"
      subtitle={`ID: ${currentProject.id}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Width (px)
            </label>
            <input
              type="number"
              min={320}
              max={7680}
              value={width}
              onChange={(e) => setWidth(parseInt(e.target.value, 10) || 1920)}
              className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Height (px)
            </label>
            <input
              type="number"
              min={240}
              max={4320}
              value={height}
              onChange={(e) => setHeight(parseInt(e.target.value, 10) || 1080)}
              className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Frame Rate
            </label>
            <select
              value={fps}
              onChange={(e) => setFps(parseInt(e.target.value, 10) as FrameRate)}
              className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {FRAME_RATES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Aspect Ratio
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {ASPECT_RATIOS.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Timeline Max Duration (Seconds)
          </label>
          <input
            type="number"
            min={30}
            max={7200}
            step={30}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10) || 120)}
            className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Durasi saat ini: {Math.floor(duration / 60)} menit {duration % 60} detik
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222836]">
          <button
            type="button"
            onClick={closeDialog}
            className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a1f2b] text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-colors"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </Modal>
  );
};
