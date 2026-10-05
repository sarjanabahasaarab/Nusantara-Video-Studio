/**
 * Nusantara Video Studio - Professional Text, Subtitle & Graphics Studio Sidebar
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Implements 8 dedicated tool categories (Requirement 4):
 * 1. Text
 * 2. Titles
 * 3. Subtitles
 * 4. Captions
 * 5. Lower Thirds
 * 6. Graphics
 * 7. Templates
 * 8. Credits
 */

import React, { useState } from 'react';
import {
  Type,
  Heading1,
  MessageSquare,
  Captions,
  AlignLeft,
  Shapes,
  LayoutTemplate,
  ScrollText,
  Plus,
  Search,
  Upload,
  Download,
  Trash2,
  Sparkles,
  FileText,
  Square,
  Circle,
  Play,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { useSubtitleStore } from '../../stores/subtitleStore';
import { useMediaStore } from '../../stores/mediaStore';
import { TemplateLibrary, TextTemplate, TemplateCategory } from '../../engine/templates/TemplateLibrary';
import { ShapeType } from '../../types';

export type TextStudioCategory =
  | 'text'
  | 'titles'
  | 'subtitles'
  | 'captions'
  | 'lower-thirds'
  | 'graphics'
  | 'templates'
  | 'credits';

export const TextStudioSidebar: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<TextStudioCategory>('titles');
  const [searchQuery, setSearchQuery] = useState('');

  const addTextClip = useTimelineStore((s) => s.addTextClip);
  const addShapeClip = useTimelineStore((s) => s.addShapeClip);
  const addLogoClip = useTimelineStore((s) => s.addLogoClip);
  const currentTime = useTimelineStore((s) => s.currentTime);
  const notify = useUIStore((s) => s.notify);

  const mediaItems = useMediaStore((s) => s.items);

  // Subtitle store
  const activeSubtitleTrack = useSubtitleStore((s) => s.getActiveTrack());
  const addSubtitle = useSubtitleStore((s) => s.addSubtitle);
  const exportSubtitles = useSubtitleStore((s) => s.exportSubtitles);
  const importSubtitlesFromText = useSubtitleStore((s) => s.importSubtitlesFromText);
  const subtitleValidation = useSubtitleStore((s) => s.validation);

  // Template library
  const allTemplates = TemplateLibrary.getAllTemplates();
  const userTemplates = TemplateLibrary.getUserTemplates();

  const handleApplyTemplate = (tmpl: TextTemplate) => {
    const clip = addTextClip(undefined, tmpl.textProps, tmpl.name);
    if (tmpl.transform) {
      useTimelineStore.getState().updateClipTransform(clip.id, tmpl.transform);
    }
    notify(
      'Template Diterapkan',
      `Template "${tmpl.name}" berhasil ditambahkan ke timeline pada playhead.`,
      'success'
    );
  };

  const handleAddQuickText = (preset: 'title' | 'sub' | 'body') => {
    if (preset === 'title') {
      addTextClip(undefined, {
        text: 'JUDUL UTAMA',
        fontFamily: 'Montserrat',
        fontSize: 54,
        fontWeight: 700,
        color: '#ffffff',
        alignment: 'center',
        shadowBlur: 10,
        shadowColor: '#000000',
      }, 'Judul Utama');
    } else if (preset === 'sub') {
      addTextClip(undefined, {
        text: 'Subjudul atau Keterangan',
        fontFamily: 'Inter',
        fontSize: 32,
        fontWeight: 500,
        color: '#94a3b8',
        alignment: 'center',
      }, 'Subjudul');
    } else {
      addTextClip(undefined, {
        text: 'Ketikkan paragraf teks di sini...',
        fontFamily: 'Roboto',
        fontSize: 24,
        fontWeight: 400,
        color: '#e2e8f0',
        alignment: 'left',
      }, 'Teks Paragraf');
    }
    notify('Teks Ditambahkan', 'Teks berhasil ditempatkan di timeline.', 'success');
  };

  const handleAddShape = (shapeType: ShapeType) => {
    addShapeClip(undefined, shapeType);
    notify('Bentuk Grafis', `Shape ${shapeType} berhasil ditambahkan ke timeline overlay.`, 'success');
  };

  const handleImportSubtitles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.srt,.vtt,.ass,.ssa,text/plain';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const ok = importSubtitlesFromText(text, 'auto');
        if (ok) {
          notify(
            'Subtitle Diimport',
            `File "${file.name}" berhasil diparse dan dimasukkan ke subtitle track.`,
            'success'
          );
        } else {
          notify('Gagal Import Subtitle', 'Format subtitle tidak valid atau kosong.', 'error');
        }
      } catch (err) {
        notify('Gagal Membaca File', String(err), 'error');
      }
    };
    input.click();
  };

  const handleExportSubtitles = (fmt: 'srt' | 'vtt') => {
    const content = exportSubtitles(fmt);
    if (!content) {
      notify('Export Subtitle', 'Belum ada entri subtitle untuk diekspor.', 'warning');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nusantara_subtitles.${fmt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    notify('Export Berhasil', `Subtitle berhasil diekspor sebagai .${fmt.toUpperCase()}`, 'success');
  };

  const categories: { id: TextStudioCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'titles', label: 'Titles', icon: <Heading1 className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'subtitles', label: 'Subtitles', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { id: 'captions', label: 'Captions', icon: <Captions className="w-3.5 h-3.5" /> },
    { id: 'lower-thirds', label: 'Lower Thirds', icon: <AlignLeft className="w-3.5 h-3.5" /> },
    { id: 'graphics', label: 'Graphics', icon: <Shapes className="w-3.5 h-3.5" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-3.5 h-3.5" /> },
    { id: 'credits', label: 'Credits', icon: <ScrollText className="w-3.5 h-3.5" /> },
  ];

  // Filter templates by active category and search
  const filteredTemplates = allTemplates.filter((t) => {
    const matchesCat =
      activeCategory === 'titles'
        ? t.category === 'basic-titles' || t.category === 'modern-titles'
        : activeCategory === 'lower-thirds'
        ? t.category === 'lower-thirds'
        : activeCategory === 'captions'
        ? t.category === 'social-media'
        : activeCategory === 'credits'
        ? t.category === 'credits'
        : activeCategory === 'templates'
        ? true
        : false;

    if (!matchesCat) return false;
    if (!searchQuery) return true;
    return (
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#10131a] text-slate-300">
      {/* Search Bar */}
      <div className="p-2 border-b border-[#1c212d] bg-[#0c0e14]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari teks, template, atau bentuk..."
            className="w-full bg-[#151923] border border-[#232938] rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Category Pills Navigation (8 categories) */}
      <div className="grid grid-cols-4 gap-1 p-2 border-b border-[#1c212d] bg-[#0e1017]">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded text-[10px] font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-[#151922] text-slate-400 hover:text-slate-200 hover:bg-[#1b212e]'
            }`}
          >
            {cat.icon}
            <span className="truncate">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Category: TEXT (Quick Basic Typography) */}
        {activeCategory === 'text' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Quick Text Layers
              </span>
              <button
                onClick={() => useUIStore.getState().openDialog('textGenerator')}
                className="text-[10px] text-blue-400 hover:text-blue-300 underline"
              >
                Text Generator
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => handleAddQuickText('title')}
                className="p-3 rounded-lg bg-[#141824] hover:bg-[#1b2131] border border-[#212738] flex items-center justify-between transition-all group text-left"
              >
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400">Header Title</h4>
                  <p className="text-[10px] text-slate-400">Montserrat 54px Bold, Shadow</p>
                </div>
                <Plus className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100" />
              </button>

              <button
                onClick={() => handleAddQuickText('sub')}
                className="p-3 rounded-lg bg-[#141824] hover:bg-[#1b2131] border border-[#212738] flex items-center justify-between transition-all group text-left"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400">Subtitle Line</h4>
                  <p className="text-[10px] text-slate-400">Inter 32px Medium</p>
                </div>
                <Plus className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100" />
              </button>

              <button
                onClick={() => handleAddQuickText('body')}
                className="p-3 rounded-lg bg-[#141824] hover:bg-[#1b2131] border border-[#212738] flex items-center justify-between transition-all group text-left"
              >
                <div>
                  <h4 className="text-xs font-normal text-slate-300 group-hover:text-blue-400">Body Paragraph</h4>
                  <p className="text-[10px] text-slate-400">Roboto 24px Regular</p>
                </div>
                <Plus className="w-4 h-4 text-blue-400 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        )}

        {/* Category: SUBTITLES (Track & Entries Manager) */}
        {activeCategory === 'subtitles' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Subtitle Track ({activeSubtitleTrack?.items.length || 0} entries)
              </span>
              {subtitleValidation.warnings.length > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{subtitleValidation.warnings.length} overlap</span>
                </span>
              )}
            </div>

            {/* Subtitle Track Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addSubtitle(currentTime, 3, 'Teks Subtitle Baru')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Subtitle @ Playhead</span>
              </button>

              <button
                onClick={() => useUIStore.getState().openDialog('subtitleEditor')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[#181d2a] hover:bg-[#22293b] border border-[#263045] text-slate-200 font-medium text-[11px] transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Buka Editor List</span>
              </button>
            </div>

            {/* Import / Export SRT & VTT */}
            <div className="p-3 bg-[#0d0f15] border border-[#1f2535] rounded-xl flex flex-col gap-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Format SRT / VTT / ASS
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={handleImportSubtitles}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[#161a25] hover:bg-[#1e2434] border border-[#232b3d] text-slate-300 text-[10px] transition-colors"
                  title="Import file SRT, WebVTT, atau ASS"
                >
                  <Upload className="w-3 h-3 text-cyan-400" />
                  <span>Import</span>
                </button>
                <button
                  onClick={() => handleExportSubtitles('srt')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[#161a25] hover:bg-[#1e2434] border border-[#232b3d] text-slate-300 text-[10px] transition-colors"
                  title="Export track subtitle aktif ke format SRT"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>SRT</span>
                </button>
                <button
                  onClick={() => handleExportSubtitles('vtt')}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-[#161a25] hover:bg-[#1e2434] border border-[#232b3d] text-slate-300 text-[10px] transition-colors"
                  title="Export track subtitle aktif ke format WebVTT"
                >
                  <Download className="w-3 h-3 text-amber-400" />
                  <span>VTT</span>
                </button>
              </div>
            </div>

            {/* Recent Subtitle Items Preview */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Daftar Subtitle (Klik untuk loncat)
              </span>
              {activeSubtitleTrack && activeSubtitleTrack.items.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
                  {activeSubtitleTrack.items.slice(0, 15).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => useTimelineStore.getState().setCurrentTime(item.startTime)}
                      className="p-2 rounded bg-[#141824] hover:bg-[#1b2131] border border-[#202738] flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div className="truncate max-w-[170px]">
                        <span className="text-blue-400 font-mono text-[10px] mr-1.5">
                          {item.startTime.toFixed(1)}s:
                        </span>
                        <span className="text-slate-200">{item.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(item.endTime - item.startTime).toFixed(1)}s
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs border border-dashed border-[#202738] rounded-lg">
                  Belum ada subtitle. Klik "+ Subtitle @ Playhead" atau import SRT/VTT.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category: GRAPHICS (Shape Builder & Logo Overlays) */}
        {activeCategory === 'graphics' && (
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Shape Graphics (Bentuk Vektor)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddShape('rectangle')}
                className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#212738] flex flex-col items-center gap-1.5 text-center transition-all group"
              >
                <div className="w-10 h-7 border-2 border-blue-400 bg-blue-500/20 rounded-none" />
                <span className="text-[11px] font-medium text-slate-200 group-hover:text-blue-400">
                  Rectangle
                </span>
              </button>

              <button
                onClick={() => handleAddShape('rounded-rectangle')}
                className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#212738] flex flex-col items-center gap-1.5 text-center transition-all group"
              >
                <div className="w-10 h-7 border-2 border-indigo-400 bg-indigo-500/20 rounded-md" />
                <span className="text-[11px] font-medium text-slate-200 group-hover:text-indigo-400">
                  Rounded Rect
                </span>
              </button>

              <button
                onClick={() => handleAddShape('circle')}
                className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#212738] flex flex-col items-center gap-1.5 text-center transition-all group"
              >
                <div className="w-8 h-8 border-2 border-pink-400 bg-pink-500/20 rounded-full" />
                <span className="text-[11px] font-medium text-slate-200 group-hover:text-pink-400">
                  Circle
                </span>
              </button>

              <button
                onClick={() => handleAddShape('ellipse')}
                className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#212738] flex flex-col items-center gap-1.5 text-center transition-all group"
              >
                <div className="w-10 h-6 border-2 border-purple-400 bg-purple-500/20 rounded-full" />
                <span className="text-[11px] font-medium text-slate-200 group-hover:text-purple-400">
                  Ellipse
                </span>
              </button>

              <button
                onClick={() => handleAddShape('line')}
                className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#212738] flex flex-col items-center gap-1.5 text-center transition-all group"
              >
                <div className="w-10 h-0.5 bg-amber-400 my-3" />
                <span className="text-[11px] font-medium text-slate-200 group-hover:text-amber-400">
                  Line
                </span>
              </button>

              <button
                onClick={() => handleAddShape('arrow')}
                className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#212738] flex flex-col items-center gap-1.5 text-center transition-all group"
              >
                <div className="w-10 h-4 flex items-center justify-center text-amber-400 font-bold">
                  ➔
                </div>
                <span className="text-[11px] font-medium text-slate-200 group-hover:text-amber-400">
                  Arrow
                </span>
              </button>

              <button
                onClick={() => handleAddShape('triangle')}
                className="p-2.5 rounded-lg bg-[#141824] hover:bg-[#1c2232] border border-[#212738] flex flex-col items-center gap-1.5 text-center transition-all group col-span-2"
              >
                <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] border-b-emerald-400" />
                <span className="text-[11px] font-medium text-slate-200 group-hover:text-emerald-400">
                  Triangle
                </span>
              </button>
            </div>

            {/* Logo Overlay from Media Library */}
            <div className="mt-2 pt-2 border-t border-[#1e2433]">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Logo Overlay (Watermark)
              </span>

              {mediaItems.filter((m) => m.type === 'image').length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {mediaItems
                    .filter((m) => m.type === 'image')
                    .map((img) => (
                      <button
                        key={img.id}
                        onClick={() => addLogoClip(undefined, img.id, img.blobUrl)}
                        className="p-2 rounded bg-[#141824] hover:bg-[#1b2131] border border-[#212738] flex flex-col items-center gap-1 text-center group"
                      >
                        <img
                          src={img.blobUrl || img.thumbnail}
                          alt={img.name}
                          className="w-12 h-10 object-contain rounded"
                        />
                        <span className="text-[10px] text-slate-300 truncate max-w-[90px] group-hover:text-blue-400">
                          {img.name}
                        </span>
                      </button>
                    ))}
                </div>
              ) : (
                <div className="p-3 text-center text-slate-500 text-[11px] bg-[#0c0e14] border border-[#1e2433] rounded-lg">
                  Import gambar/logo transparan di panel Media untuk dijadikan Watermark Overlay.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category: TITLES, LOWER THIRDS, CAPTIONS, CREDITS, TEMPLATES */}
        {(activeCategory === 'titles' ||
          activeCategory === 'lower-thirds' ||
          activeCategory === 'captions' ||
          activeCategory === 'credits' ||
          activeCategory === 'templates') && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                {activeCategory === 'titles'
                  ? 'Title Presets'
                  : activeCategory === 'lower-thirds'
                  ? 'Lower Third Builders'
                  : activeCategory === 'captions'
                  ? 'Social Captions'
                  : activeCategory === 'credits'
                  ? 'Film Credits'
                  : 'All Templates'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {filteredTemplates.length} templates
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-3 rounded-xl bg-[#131722] hover:bg-[#191f2e] border border-[#202738] hover:border-blue-500/40 flex flex-col gap-1.5 transition-all group cursor-pointer"
                  onClick={() => handleApplyTemplate(tmpl)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {tmpl.name}
                    </h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-500/20 font-mono">
                      {tmpl.duration}s
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                    {tmpl.description}
                  </p>

                  {/* Stylized Preview Badge */}
                  <div
                    style={{
                      fontFamily: tmpl.textProps.fontFamily,
                      color: tmpl.textProps.color,
                      backgroundColor: tmpl.textProps.backgroundColor || 'rgba(0,0,0,0.5)',
                    }}
                    className="mt-1 px-2 py-1 rounded text-center text-[11px] font-semibold truncate border border-white/10 select-none"
                  >
                    {tmpl.textProps.text.split('\n')[0]}
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-[#1c2230]">
                    <span className="text-[9px] text-slate-500 capitalize">
                      {tmpl.category.replace('-', ' ')}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyTemplate(tmpl);
                      }}
                      className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Terapkan</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
