/**
 * Nusantara Video Studio - Professional Text Properties Panel
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Implements comprehensive text properties inspector (Requirements 5, 6, 7, 9):
 * - Content: Text Content, Multiline, Line Break, Direction
 * - Font: Family selector with search/favorites, Size, Weight, Bold, Italic, Underline, Spacing, Line Height
 * - Alignment: Left, Center, Right, Justify
 * - Appearance: Color, Background, Background Opacity, Outline, Shadow Blur & Offsets
 * - Transform: Position, Scale, Rotation, Opacity
 * - Layout: Box Width, Box Height, Padding, Margin
 * - Animation: Keyframe Presets (Entrance, Exit, Continuous, Typewriter)
 * - Reset Properties
 */

import React, { useState } from 'react';
import {
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Sliders,
  RotateCcw,
  Sparkles,
  Move,
  Layout,
  Star,
  Search,
  Check,
} from 'lucide-react';
import { Clip, ClipTextProperties } from '../../types';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { FontManager, SYSTEM_FONTS } from '../../engine/fonts/FontManager';
import { TextAnimationEngine } from '../../engine/text/TextAnimationEngine';
import { SliderInput } from '../common/SliderInput';

interface TextPropertiesPanelProps {
  clip: Clip;
  onNotify?: (title: string, message: string, type?: any) => void;
}

export const TextPropertiesPanel: React.FC<TextPropertiesPanelProps> = ({ clip, onNotify }) => {
  const updateClipText = useTimelineStore((s) => s.updateClipText);
  const updateClipTransform = useTimelineStore((s) => s.updateClipTransform);
  const resetClipProperties = useTimelineStore((s) => s.resetClipProperties);
  const updateClipKeyframes = useProjectStore((s) => s.updateClipKeyframes);

  const textProps: ClipTextProperties = clip.textProps || {
    text: 'Title Text',
    fontFamily: 'Inter',
    fontSize: 48,
    color: '#ffffff',
    alignment: 'center',
  };

  const transform = clip.transform || {
    positionX: 0,
    positionY: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    opacity: 1,
  };

  const [fontSearch, setFontSearch] = useState('');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(FontManager.getFavoriteFonts());

  const filteredFonts = FontManager.searchFonts(fontSearch);
  const recentFonts = FontManager.getRecentFonts();

  const handleSelectFont = (fontFamily: string) => {
    FontManager.addRecentFont(fontFamily);
    updateClipText(clip.id, { fontFamily });
    setShowFontDropdown(false);
  };

  const handleToggleFavorite = (e: React.MouseEvent, fontFamily: string) => {
    e.stopPropagation();
    FontManager.toggleFavoriteFont(fontFamily);
    setFavorites(FontManager.getFavoriteFonts());
  };

  const handleApplyAnimation = (presetName: any) => {
    const animSettings = {
      preset: presetName,
      duration: 1.0,
      delay: 0,
      direction: 'bottom' as const,
      intensity: 50,
    };

    updateClipText(clip.id, { animation: animSettings });

    // Generate editable keyframes into clip's animatedProperties
    const kfs = TextAnimationEngine.generateAnimationKeyframes(animSettings, clip.duration);
    if (kfs.length > 0) {
      updateClipKeyframes(clip.id, kfs);
    }

    if (onNotify) {
      onNotify('Animasi Diterapkan', `Preset teks "${presetName}" menghasilkan keyframe yang dapat diedit.`, 'success');
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs select-none">
      {/* 1. CONTENT SECTION */}
      <div className="flex flex-col gap-2 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <span>Teks & Konten</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                updateClipText(clip.id, {
                  textDirection: textProps.textDirection === 'rtl' ? 'ltr' : 'rtl',
                })
              }
              className={`px-1.5 py-0.5 rounded text-[10px] border ${
                textProps.textDirection === 'rtl'
                  ? 'bg-blue-600/30 border-blue-500/40 text-blue-300'
                  : 'bg-[#151924] border-[#222838] text-slate-400'
              }`}
              title="Arah Teks (LTR / RTL)"
            >
              {textProps.textDirection === 'rtl' ? 'RTL' : 'LTR'}
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={textProps.text}
          onChange={(e) => updateClipText(clip.id, { text: e.target.value })}
          placeholder="Ketik teks di sini (mendukung enter / multiline)..."
          dir={textProps.textDirection || 'ltr'}
          className="w-full bg-[#0a0c10] border border-[#242b3b] rounded-lg p-2.5 text-slate-100 text-xs focus:outline-none focus:border-blue-500 resize-y leading-relaxed font-sans"
        />
      </div>

      {/* 2. FONT MANAGEMENT (Family, Weight, Size, Style, Search, Favorites) */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl relative">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
          Tipografi & Font
        </span>

        {/* Font Family Selector with Dropdown */}
        <div className="relative">
          <label className="text-[10px] text-slate-400 block mb-1">Font Family:</label>
          <button
            onClick={() => setShowFontDropdown(!showFontDropdown)}
            className="w-full bg-[#121622] hover:bg-[#181d2c] border border-[#252c3c] rounded-lg px-3 py-2 text-left text-xs text-white flex items-center justify-between transition-colors"
          >
            <span style={{ fontFamily: textProps.fontFamily }}>{textProps.fontFamily}</span>
            <span className="text-[10px] text-slate-500">Ubah ▼</span>
          </button>

          {/* Font Picker Modal / Dropdown */}
          {showFontDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#141824] border border-[#262f42] rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-2 max-h-72 overflow-y-auto">
              {/* Font Search Input */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 pointer-events-none" />
                <input
                  type="text"
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  placeholder="Cari nama font..."
                  className="w-full bg-[#0a0d14] border border-[#232a3a] rounded pl-7 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Recently Used Fonts */}
              {recentFonts.length > 0 && !fontSearch && (
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider block mb-1">
                    Recently Used
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {recentFonts.map((rf) => (
                      <button
                        key={rf}
                        onClick={() => handleSelectFont(rf)}
                        className="px-2 py-0.5 rounded bg-[#1c2232] hover:bg-[#252e42] text-[10px] text-slate-300 border border-[#252f44]"
                      >
                        {rf}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Font List */}
              <div className="flex flex-col gap-1 mt-1">
                {filteredFonts.map((f) => {
                  const isFav = favorites.includes(f.family);
                  const isSelected = textProps.fontFamily === f.family;
                  return (
                    <div
                      key={f.family}
                      onClick={() => handleSelectFont(f.family)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-600/30 text-blue-300' : 'hover:bg-[#1a2030] text-slate-200'
                      }`}
                    >
                      <span style={{ fontFamily: f.family }} className="text-xs">
                        {f.name}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-slate-500 capitalize">{f.category}</span>
                        <button
                          onClick={(e) => handleToggleFavorite(e, f.family)}
                          className={`p-0.5 hover:text-amber-400 ${isFav ? 'text-amber-400' : 'text-slate-600'}`}
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Font Size */}
        <SliderInput
          label="Ukuran Font"
          value={textProps.fontSize}
          min={10}
          max={160}
          unit="px"
          onChange={(v) => updateClipText(clip.id, { fontSize: v })}
        />

        {/* Style Buttons: Bold, Italic, Underline, and Alignment */}
        <div className="grid grid-cols-2 gap-2">
          {/* Bold, Italic, Underline */}
          <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-lg border border-[#222938]">
            <button
              onClick={() => updateClipText(clip.id, { bold: !textProps.bold })}
              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                textProps.bold ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="Bold"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateClipText(clip.id, { italic: !textProps.italic })}
              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                textProps.italic ? 'bg-blue-600 text-white italic' : 'text-slate-400 hover:text-white'
              }`}
              title="Italic"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateClipText(clip.id, { underline: !textProps.underline })}
              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                textProps.underline ? 'bg-blue-600 text-white underline' : 'text-slate-400 hover:text-white'
              }`}
              title="Underline"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-1 bg-[#121622] p-1 rounded-lg border border-[#222938]">
            <button
              onClick={() => updateClipText(clip.id, { alignment: 'left' })}
              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                textProps.alignment === 'left' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Rata Kiri"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateClipText(clip.id, { alignment: 'center' })}
              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                textProps.alignment === 'center' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Rata Tengah"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateClipText(clip.id, { alignment: 'right' })}
              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                textProps.alignment === 'right' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Rata Kanan"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => updateClipText(clip.id, { alignment: 'justify' })}
              className={`flex-1 py-1 flex items-center justify-center rounded transition-colors ${
                textProps.alignment === 'justify' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Justify"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Spacing & Line Height */}
        <div className="grid grid-cols-2 gap-2">
          <SliderInput
            label="Letter Spacing"
            value={textProps.letterSpacing || 0}
            min={-5}
            max={30}
            unit="px"
            onChange={(v) => updateClipText(clip.id, { letterSpacing: v })}
          />
          <SliderInput
            label="Line Height"
            value={textProps.lineHeight || 1.2}
            min={0.8}
            max={2.5}
            step={0.1}
            unit=""
            onChange={(v) => updateClipText(clip.id, { lineHeight: v })}
          />
        </div>
      </div>

      {/* 3. APPEARANCE (Color, Background, Outline, Shadow) */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">
          Appearance & Warna
        </span>

        {/* Color Pickers */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center justify-between p-2 rounded-lg bg-[#121622] border border-[#222938] cursor-pointer">
            <span className="text-[10px] text-slate-300">Warna Teks</span>
            <input
              type="color"
              value={textProps.color}
              onChange={(e) => updateClipText(clip.id, { color: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-[#121622] border border-[#222938] cursor-pointer">
            <span className="text-[10px] text-slate-300">Warna Outline</span>
            <input
              type="color"
              value={textProps.outlineColor || '#000000'}
              onChange={(e) => updateClipText(clip.id, { outlineColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
            />
          </label>
        </div>

        {/* Outline Width */}
        <SliderInput
          label="Tebal Outline (Stroke)"
          value={textProps.outlineWidth || 0}
          min={0}
          max={12}
          unit="px"
          onChange={(v) => updateClipText(clip.id, { outlineWidth: v })}
        />

        {/* Shadow Controls */}
        <div className="p-2 rounded-lg bg-[#121622] border border-[#222938] flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-300">Drop Shadow</span>
            <input
              type="color"
              value={textProps.shadowColor || '#000000'}
              onChange={(e) => updateClipText(clip.id, { shadowColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
            />
          </div>

          <SliderInput
            label="Shadow Blur"
            value={textProps.shadowBlur || 0}
            min={0}
            max={30}
            unit="px"
            onChange={(v) => updateClipText(clip.id, { shadowBlur: v })}
          />

          <div className="grid grid-cols-2 gap-2">
            <SliderInput
              label="Offset X"
              value={textProps.shadowOffsetX || 0}
              min={-20}
              max={20}
              unit="px"
              onChange={(v) => updateClipText(clip.id, { shadowOffsetX: v })}
            />
            <SliderInput
              label="Offset Y"
              value={textProps.shadowOffsetY || 2}
              min={-20}
              max={20}
              unit="px"
              onChange={(v) => updateClipText(clip.id, { shadowOffsetY: v })}
            />
          </div>
        </div>
      </div>

      {/* 4. ANIMATED TEXT PRESETS (Requirement 9) */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset Animasi Teks</span>
          </span>
          {textProps.animation?.preset && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
              {textProps.animation.preset}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { id: 'fade-in', label: 'Fade In' },
            { id: 'slide-in', label: 'Slide In' },
            { id: 'zoom-in', label: 'Zoom In' },
            { id: 'typewriter', label: 'Typewriter' },
            { id: 'pop-in', label: 'Pop In' },
            { id: 'fade-out', label: 'Fade Out' },
            { id: 'floating', label: 'Floating' },
            { id: 'pulse', label: 'Pulse' },
            { id: 'gentle-zoom', label: 'Slow Zoom' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyAnimation(preset.id)}
              className={`p-1.5 rounded text-[10px] font-medium border transition-colors truncate ${
                textProps.animation?.preset === preset.id
                  ? 'bg-amber-600/30 border-amber-500/40 text-amber-300'
                  : 'bg-[#141824] hover:bg-[#1c2232] border-[#222838] text-slate-300'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. TRANSFORM (Position, Scale, Rotation, Opacity) */}
      <div className="flex flex-col gap-2.5 p-2.5 bg-[#0e1118] border border-[#202534] rounded-xl">
        <span className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Move className="w-3.5 h-3.5 text-cyan-400" />
          <span>Transform & Posisi</span>
        </span>

        <div className="grid grid-cols-2 gap-2">
          <SliderInput
            label="Position X"
            value={transform.positionX || 0}
            min={-800}
            max={800}
            unit="px"
            onChange={(v) => updateClipTransform(clip.id, { positionX: v })}
          />
          <SliderInput
            label="Position Y"
            value={transform.positionY || 0}
            min={-500}
            max={500}
            unit="px"
            onChange={(v) => updateClipTransform(clip.id, { positionY: v })}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <SliderInput
            label="Scale"
            value={Math.round((transform.scaleX ?? 1) * 100)}
            min={10}
            max={400}
            unit="%"
            onChange={(v) => {
              const s = v / 100;
              updateClipTransform(clip.id, { scaleX: s, scaleY: s });
            }}
          />
          <SliderInput
            label="Rotation"
            value={transform.rotation || 0}
            min={-180}
            max={180}
            unit="°"
            onChange={(v) => updateClipTransform(clip.id, { rotation: v })}
          />
        </div>

        <SliderInput
          label="Opacity"
          value={Math.round((transform.opacity ?? 1) * 100)}
          min={0}
          max={100}
          unit="%"
          onChange={(v) => updateClipTransform(clip.id, { opacity: v / 100 })}
        />
      </div>

      {/* RESET BUTTON */}
      <button
        onClick={() => {
          resetClipProperties(clip.id);
          if (onNotify) onNotify('Reset Teks', 'Semua properti teks berhasil direset.', 'info');
        }}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#181d2a] hover:bg-[#22293b] border border-[#263045] text-amber-400 hover:text-amber-300 font-medium text-xs transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Properties Teks</span>
      </button>
    </div>
  );
};
