/**
 * Nusantara Video Studio - New Project Dialog
 * Configures new project name, resolution presets, fps, and aspect ratio.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { RESOLUTION_PRESETS, FRAME_RATES, ASPECT_RATIOS } from '../../utils/presets';
import { AspectRatio, FrameRate, ResolutionPreset } from '../../types';
import { Film, Sparkles } from 'lucide-react';

export const NewProjectDialog: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const notify = useUIStore((s) => s.notify);

  const defaultSettings = useSettingsStore((s) => s.settings.project);
  const createNewProject = useProjectStore((s) => s.createNewProject);

  const [projectName, setProjectName] = useState('Untitled Project');
  const [selectedPreset, setSelectedPreset] = useState<ResolutionPreset>(
    defaultSettings.defaultResolution
  );
  const [selectedFps, setSelectedFps] = useState<FrameRate>(defaultSettings.defaultFps);
  const [selectedAspect, setSelectedAspect] = useState<AspectRatio>(
    defaultSettings.defaultAspectRatio
  );

  const isOpen = activeDialog === 'newProject';

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const presetObj = RESOLUTION_PRESETS.find((r) => r.preset === selectedPreset);
    const width = presetObj?.width || 1920;
    const height = presetObj?.height || 1080;

    createNewProject({
      name: projectName.trim() || 'Untitled Project',
      width,
      height,
      fps: selectedFps,
      aspectRatio: selectedAspect,
      duration: 180, // 3 minutes timeline
    });

    closeDialog();
    notify('Proyek Baru Dibuat', `Proyek "${projectName}" berhasil diinisialisasi.`, 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title="Create New Project"
      subtitle="Atur parameter format timeline dan resolusi canvas"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleCreate} className="flex flex-col gap-4">
        {/* Project Name */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Untitled Project"
            className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            autoFocus
          />
        </div>

        {/* Resolution Preset */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Resolution Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RESOLUTION_PRESETS.map((res) => (
              <button
                type="button"
                key={res.preset}
                onClick={() => setSelectedPreset(res.preset)}
                className={`p-2 rounded-lg border text-left text-xs transition-all ${
                  selectedPreset === res.preset
                    ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-medium ring-1 ring-blue-500'
                    : 'border-[#222836] bg-[#10131a] text-slate-300 hover:bg-[#161a24]'
                }`}
              >
                <div className="font-semibold">{res.label.split(' ')[0]}</div>
                <div className="text-[10px] text-slate-400">{res.width} × {res.height}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Frame Rate (FPS) */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Frame Rate (FPS)
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {FRAME_RATES.map((fps) => (
              <button
                type="button"
                key={fps.value}
                onClick={() => setSelectedFps(fps.value)}
                className={`py-1.5 rounded-lg border text-center text-xs transition-all ${
                  selectedFps === fps.value
                    ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-bold'
                    : 'border-[#222836] bg-[#10131a] text-slate-300 hover:bg-[#161a24]'
                }`}
              >
                {fps.value}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {ASPECT_RATIOS.map((aspect) => (
              <button
                type="button"
                key={aspect.value}
                onClick={() => setSelectedAspect(aspect.value)}
                className={`py-1.5 rounded-lg border text-center text-xs transition-all ${
                  selectedAspect === aspect.value
                    ? 'border-blue-500 bg-blue-950/40 text-blue-300 font-bold'
                    : 'border-[#222836] bg-[#10131a] text-slate-300 hover:bg-[#161a24]'
                }`}
              >
                {aspect.value}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
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
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Buat Proyek</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
