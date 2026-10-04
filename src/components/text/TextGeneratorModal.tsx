/**
 * Nusantara Video Studio - Text Generator Modal
 * Phase 3: Professional Timeline & Capture Engine
 *
 * Provides templates and styling for Titles, Subtitles, Captions, and Lower Thirds
 * with live preview and immediate timeline placement.
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { Type, Sparkles, AlignLeft, AlignCenter, AlignRight, Bold, Italic } from 'lucide-react';
import { Clip, ClipTextProperties } from '../../types';

interface TextPreset {
  id: 'title' | 'subtitle' | 'caption' | 'lower-third';
  label: string;
  defaultText: string;
  fontSize: number;
  color: string;
  backgroundColor: string;
  alignment: 'left' | 'center' | 'right';
  outlineWidth?: number;
  outlineColor?: string;
  shadowBlur?: number;
  shadowColor?: string;
  positionY?: number;
}

const PRESETS: TextPreset[] = [
  {
    id: 'title',
    label: 'Main Title',
    defaultText: 'NUSANTARA VIDEO STUDIO',
    fontSize: 52,
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignment: 'center',
    outlineWidth: 2,
    outlineColor: '#0284c7',
    shadowBlur: 14,
    shadowColor: '#000000',
    positionY: 0,
  },
  {
    id: 'lower-third',
    label: 'Lower Third',
    defaultText: 'Kreator Konten Nusantara\nEditor & Visual Director',
    fontSize: 28,
    color: '#38bdf8',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignment: 'left',
    outlineWidth: 0,
    shadowBlur: 6,
    shadowColor: '#000000',
    positionY: 340,
  },
  {
    id: 'subtitle',
    label: 'Subtitle',
    defaultText: 'Selamat datang di Nusantara Video Studio.',
    fontSize: 32,
    color: '#facc15',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignment: 'center',
    outlineWidth: 2,
    outlineColor: '#000000',
    positionY: 380,
  },
  {
    id: 'caption',
    label: 'Caption Box',
    defaultText: 'Lokasi: Candi Borobudur, Magelang, Jawa Tengah',
    fontSize: 22,
    color: '#e2e8f0',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    alignment: 'center',
    positionY: -360,
  },
];

export const TextGeneratorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<'title' | 'subtitle' | 'caption' | 'lower-third'>('title');
  const [text, setText] = useState('NUSANTARA VIDEO STUDIO');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontSize, setFontSize] = useState(52);
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('rgba(0, 0, 0, 0.4)');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [duration, setDuration] = useState(6);

  const addClipToTrack = useTimelineStore((s) => s.addClipToTrack);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);
  const notify = useUIStore((s) => s.notify);

  const handleApplyPreset = (p: TextPreset) => {
    setSelectedPresetId(p.id);
    setText(p.defaultText);
    setFontSize(p.fontSize);
    setColor(p.color);
    setBgColor(p.backgroundColor);
    setAlignment(p.alignment);
  };

  const handleAddTextToTimeline = () => {
    // Prefer V5 (Titles) or any video track
    const targetTrack =
      tracks.find((t) => t.id === 'track-v5') ||
      tracks.find((t) => t.type === 'video') ||
      tracks[0];
    if (!targetTrack) return;

    const preset = PRESETS.find((p) => p.id === selectedPresetId);

    const textProps: ClipTextProperties = {
      text,
      fontFamily,
      fontSize,
      bold,
      italic,
      color,
      backgroundColor: bgColor,
      alignment,
      outlineWidth: preset?.outlineWidth || 0,
      outlineColor: preset?.outlineColor,
      shadowBlur: preset?.shadowBlur || 8,
      shadowColor: preset?.shadowColor || '#000000',
      textPreset: selectedPresetId,
    };

    const newClip: Clip = {
      id: `clip-text-${Date.now()}`,
      trackId: targetTrack.id,
      name: `Text: ${text.slice(0, 20)}...`,
      type: 'text',
      startTime: currentTime,
      duration: Math.max(1, duration),
      sourceStartTime: 0,
      sourceDuration: duration,
      color: '#d97706',
      transform: {
        positionX: 0,
        positionY: preset?.positionY || 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
      },
      textProps,
      speed: { rate: 1, reverse: false },
    };

    addClipToTrack(targetTrack.id, newClip);
    notify('Teks Ditambahkan', `Teks berhasil ditaruh di track ${targetTrack.name}.`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Text & Title Generator"
      subtitle="Buat judul, lower third, subtitle, atau caption untuk timeline"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-4 text-xs select-none">
        {/* Preset Selector */}
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                selectedPresetId === p.id
                  ? 'bg-amber-600/25 border-amber-500 text-amber-300 font-semibold'
                  : 'bg-[#131622] border-[#222838] text-slate-300 hover:bg-[#181d2c]'
              }`}
            >
              <Type className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Live Preview Display */}
        <div className="relative h-44 bg-black rounded-lg border border-[#272e40] flex items-center justify-center p-4 overflow-hidden shadow-inner">
          <div
            style={{
              fontFamily,
              fontSize: `${Math.round(fontSize * 0.65)}px`,
              fontWeight: bold ? 'bold' : 'normal',
              fontStyle: italic ? 'italic' : 'normal',
              color,
              backgroundColor: bgColor,
              textAlign: alignment,
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
            className="px-4 py-2 rounded max-w-full break-words whitespace-pre-wrap leading-tight"
          >
            {text || 'Ketik teks di sini...'}
          </div>
        </div>

        {/* Text Area & Parameters */}
        <div className="flex flex-col gap-3 p-3 bg-[#11141c] border border-[#202534] rounded-lg">
          <div className="flex flex-col gap-1">
            <span className="text-slate-400 font-medium text-[11px]">Konten Teks:</span>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-[#0a0c10] border border-[#242b3b] rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              placeholder="Masukkan teks..."
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Font Family */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px]">Font:</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="bg-[#0a0c10] border border-[#242b3b] rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="Inter">Inter</option>
                <option value="'Plus Jakarta Sans'">Plus Jakarta Sans</option>
                <option value="Impact">Impact</option>
                <option value="Georgia">Georgia</option>
                <option value="monospace">Courier (Monospace)</option>
              </select>
            </div>

            {/* Font Size & Duration */}
            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px]">Ukuran Font ({fontSize}px):</span>
              <input
                type="range"
                min={16}
                max={96}
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                className="accent-blue-500 h-1.5 bg-[#202738] rounded cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-slate-400 text-[10px]">Durasi Clip ({duration}s):</span>
              <input
                type="range"
                min={1}
                max={30}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="accent-amber-500 h-1.5 bg-[#202738] rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Styling Buttons & Colors */}
          <div className="flex items-center justify-between pt-1 border-t border-[#1e2330]">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setBold(!bold)}
                className={`p-1.5 rounded border ${
                  bold ? 'bg-blue-600/30 border-blue-500 text-blue-400' : 'bg-[#151924] border-[#222938] text-slate-400'
                }`}
                title="Tebal (Bold)"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setItalic(!italic)}
                className={`p-1.5 rounded border ${
                  italic ? 'bg-blue-600/30 border-blue-500 text-blue-400' : 'bg-[#151924] border-[#222938] text-slate-400'
                }`}
                title="Miring (Italic)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-[#262c3b] mx-1" />

              <button
                type="button"
                onClick={() => setAlignment('left')}
                className={`p-1.5 rounded border ${
                  alignment === 'left' ? 'bg-blue-600/30 border-blue-500 text-blue-400' : 'bg-[#151924] border-[#222938] text-slate-400'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('center')}
                className={`p-1.5 rounded border ${
                  alignment === 'center' ? 'bg-blue-600/30 border-blue-500 text-blue-400' : 'bg-[#151924] border-[#222938] text-slate-400'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setAlignment('right')}
                className={`p-1.5 rounded border ${
                  alignment === 'right' ? 'bg-blue-600/30 border-blue-500 text-blue-400' : 'bg-[#151924] border-[#222938] text-slate-400'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Color Inputs */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <span className="text-[10px]">Warna:</span>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
                />
              </label>

              <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                <span className="text-[10px]">Background:</span>
                <input
                  type="color"
                  value={bgColor.startsWith('#') ? bgColor : '#000000'}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#202534]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleAddTextToTimeline}
            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold shadow flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Masukkan ke Timeline</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
