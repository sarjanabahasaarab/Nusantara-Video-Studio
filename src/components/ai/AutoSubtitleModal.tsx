/**
 * Nusantara Video Studio - Auto Subtitle Generator Modal
 * Phase 7: AI-Assisted Editing
 *
 * Configures subtitle track generation from transcription segments
 * respecting line wrapping, max characters, and minimum display durations.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAIStore } from '../../stores/aiStore';
import { useUIStore } from '../../stores/uiStore';
import { Subtitles, Sparkles } from 'lucide-react';

interface AutoSubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutoSubtitleModal: React.FC<AutoSubtitleModalProps> = ({ isOpen, onClose }) => {
  const generateSubtitlesToTrack = useAIStore((s) => s.generateSubtitlesToTrack);
  const notify = useUIStore((s) => s.notify);

  const [language, setLanguage] = useState('id');
  const [maxChars, setMaxChars] = useState(42);
  const [maxLines, setMaxLines] = useState(2);
  const [minDuration, setMinDuration] = useState(1.2);

  const handleGenerate = () => {
    generateSubtitlesToTrack({
      maxCharsPerLine: maxChars,
      maxLines: maxLines,
      minDurationSec: minDuration,
    });
    notify(
      'Subtitle Generator',
      'Track Subtitle AI baru berhasil ditambahkan ke timeline dengan sinkronisasi waktu.',
      'success'
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Auto Subtitles"
      subtitle="Konversi hasil transkripsi AI ke Subtitle Track pada timeline"
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Bahasa Transkrip</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-[#0d0f15] border border-[#232b3d] rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="auto">Auto-Detect</option>
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Max Characters Per Line
            </label>
            <input
              type="number"
              min="20"
              max="80"
              value={maxChars}
              onChange={(e) => setMaxChars(parseInt(e.target.value) || 42)}
              className="w-full bg-[#0d0f15] border border-[#232b3d] rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500">Standar broadcast: 37 - 42</span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Max Lines Per Cue</label>
            <input
              type="number"
              min="1"
              max="3"
              value={maxLines}
              onChange={(e) => setMaxLines(parseInt(e.target.value) || 2)}
              className="w-full bg-[#0d0f15] border border-[#232b3d] rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
            />
            <span className="text-[10px] text-slate-500">Maksimum baris vertikal</span>
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Minimum Subtitle Duration (Detik)
          </label>
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="3.0"
            value={minDuration}
            onChange={(e) => setMinDuration(parseFloat(e.target.value) || 1.2)}
            className="w-full bg-[#0d0f15] border border-[#232b3d] rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-blue-500"
          />
          <span className="text-[10px] text-slate-500">Durasi keterbacaan mata manusia</span>
        </div>

        <div className="pt-3 border-t border-[#202738] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-400 hover:text-white bg-[#151824] rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Subtitle Track
          </button>
        </div>
      </div>
    </Modal>
  );
};
