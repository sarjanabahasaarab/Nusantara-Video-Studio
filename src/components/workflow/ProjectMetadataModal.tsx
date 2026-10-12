/**
 * Nusantara Video Studio - Project Metadata Modal
 * Phase 8: Professional Editing Workflow (Requirement 6)
 *
 * Provides inspection and editing for extended professional project metadata:
 * client, production, notes, copyright, keywords, author, description, specs.
 */

import React, { useState } from 'react';
import {
  FileText,
  User,
  Building,
  Film,
  Calendar,
  Tag,
  Copyright,
  FileSpreadsheet,
  X,
  Save,
  Check,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { ProjectMetadata } from '../../types/workflow';

interface ProjectMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectMetadataModal: React.FC<ProjectMetadataModalProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const notify = useUIStore((s) => s.notify);

  const existingMeta: Partial<ProjectMetadata> = (currentProject as any).projectMetadata || {};

  const [formData, setFormData] = useState({
    name: currentProject.name || '',
    description: existingMeta.description || '',
    author: existingMeta.author || '',
    client: existingMeta.client || '',
    production: existingMeta.production || '',
    notes: existingMeta.notes || '',
    copyright: existingMeta.copyright || `© ${new Date().getFullYear()} Nusantara Studio`,
    keywords: (existingMeta.keywords || []).join(', '),
  });

  if (!isOpen) return null;

  const handleSave = () => {
    const keywordsArray = formData.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const updatedMetadata: ProjectMetadata = {
      id: currentProject.id,
      name: formData.name.trim() || currentProject.name,
      description: formData.description.trim(),
      author: formData.author.trim(),
      createdAt: currentProject.createdAt,
      modifiedAt: new Date().toISOString(),
      applicationVersion: '0.8.0',
      schemaVersion: 6,
      frameRate: currentProject.settings.fps || 30,
      width: currentProject.settings.width || 1920,
      height: currentProject.settings.height || 1080,
      aspectRatio: currentProject.settings.aspectRatio || '16:9',
      client: formData.client.trim(),
      production: formData.production.trim(),
      notes: formData.notes.trim(),
      copyright: formData.copyright.trim(),
      keywords: keywordsArray,
    };

    useProjectStore.setState((state) => ({
      currentProject: {
        ...state.currentProject,
        name: updatedMetadata.name,
        projectMetadata: updatedMetadata,
      } as any,
      isDirty: true,
    }));

    notify('Metadata Disimpan', 'Metadata proyek profesional berhasil diperbarui.', 'success', 2000);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151c] border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161a23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">Project Metadata</h2>
              <p className="text-xs text-slate-400">Informasi hak cipta, klien, rumah produksi, dan metadata arsip</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Technical Specs Read-Only Header */}
          <div className="grid grid-cols-4 gap-2.5 p-3 rounded-lg bg-[#181d28] border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Resolusi</span>
              <p className="font-semibold text-slate-200 mt-0.5">
                {currentProject.settings.width || 1920} × {currentProject.settings.height || 1080}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Frame Rate</span>
              <p className="font-semibold text-slate-200 mt-0.5">{currentProject.settings.fps || 30} FPS</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Aspect Ratio</span>
              <p className="font-semibold text-slate-200 mt-0.5">{currentProject.settings.aspectRatio || '16:9'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase">Versi Schema</span>
              <p className="font-semibold text-cyan-400 mt-0.5">v0.8.0 (Schema 6)</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Nama Proyek</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Author / Editor</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Nama editor..."
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Klien (Client)</label>
              <input
                type="text"
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                placeholder="Nama perusahaan / klien..."
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Rumah Produksi (Production)</label>
              <input
                type="text"
                value={formData.production}
                onChange={(e) => setFormData({ ...formData, production: e.target.value })}
                placeholder="Studio / Production House..."
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Deskripsi Proyek</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi ringkas proyek video..."
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Hak Cipta (Copyright)</label>
              <input
                type="text"
                value={formData.copyright}
                onChange={(e) => setFormData({ ...formData, copyright: e.target.value })}
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Kata Kunci / Tag (Pisahkan koma)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="commercial, 4k, color graded..."
                className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Catatan Produksi (Production Notes)</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan untuk tim paska produksi..."
              className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#161a23] flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">ID: {currentProject.id}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition shadow-lg shadow-cyan-500/20"
            >
              <Save size={14} />
              Simpan Metadata
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
