/**
 * Nusantara Video Studio - Left Sidebar Panel
 * Tabs: Media, Audio, Text, Transition, Effects, Filters
 */

import React from 'react';
import {
  Film,
  Music,
  Type,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Upload,
  Search,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { useUIStore, SidebarTab } from '../../stores/uiStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useProjectStore } from '../../stores/projectStore';
import { Clip } from '../../types';
import { MediaLibrary } from './MediaLibrary';

export const Sidebar: React.FC = () => {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const activeTab = useUIStore((s) => s.activeSidebarTab);
  const setActiveTab = useUIStore((s) => s.setActiveSidebarTab);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const notify = useUIStore((s) => s.notify);

  const addClipToTrack = useTimelineStore((s) => s.addClipToTrack);
  const tracks = useProjectStore((s) => s.currentProject.timeline.tracks);

  const handleImportMedia = () => {
    notify('Media Import', 'Media import akan tersedia pada Phase 2.', 'info', 3000);
  };

  // Helper to add a demo sample clip to timeline in Phase 1 so user can test properties, selection, playhead, split, etc.
  const handleAddSampleClip = (type: 'video' | 'audio' | 'text') => {
    const targetTrack = tracks.find((t) => (type === 'audio' ? t.type === 'audio' : t.type === 'video')) || tracks[0];
    if (!targetTrack) return;

    const clipId = `demo-${type}-${Date.now().toString(36)}`;
    const base = {
      id: clipId,
      trackId: targetTrack.id,
      startTime: 5,
      duration: 15,
      sourceStartTime: 0,
      sourceDuration: 15,
      transform: {
        positionX: 0,
        positionY: 0,
        scale: 1,
        rotation: 0,
        opacity: 1,
      },
      audio: {
        volume: 80,
        pan: 0,
        mute: false,
      },
      speed: {
        rate: 1,
        reverse: false,
      },
    };

    let sampleClip: Clip;
    if (type === 'video') {
      sampleClip = {
        ...base,
        name: 'Nusantara_Landscape_4K.mp4',
        type: 'video',
        color: '#2563eb',
      };
    } else if (type === 'audio') {
      sampleClip = {
        ...base,
        name: 'Gamelan_Ambient_Theme.wav',
        type: 'audio',
        color: '#059669',
      };
    } else {
      sampleClip = {
        ...base,
        name: 'Title Text Layer',
        type: 'text',
        color: '#d97706',
        text: 'Nusantara Video Studio',
        fontFamily: 'Inter',
        fontSize: 48,
        alignment: 'center',
      };
    }

    addClipToTrack(targetTrack.id, sampleClip);
    notify('Demo Clip Ditambahkan', `Clip contoh "${sampleClip.name}" berhasil ditaruh di track ${targetTrack.name}.`, 'success');
  };

  const tabs: { id: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { id: 'media', label: 'Media', icon: <Film className="w-4 h-4" /> },
    { id: 'audio', label: 'Audio', icon: <Music className="w-4 h-4" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { id: 'transition', label: 'Transition', icon: <Layers className="w-4 h-4" /> },
    { id: 'effects', label: 'Effects', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'filters', label: 'Filters', icon: <SlidersHorizontal className="w-4 h-4" /> },
  ];

  if (!sidebarOpen) {
    return (
      <div className="w-10 bg-[#11131a] border-r border-[#202531] flex flex-col items-center py-2 shrink-0 select-none z-10">
        <button
          onClick={toggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-[#1c212d] rounded transition-colors"
          title="Buka Sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="flex flex-col gap-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-2 rounded text-slate-400 hover:text-slate-200 transition-colors ${
                activeTab === tab.id ? 'bg-blue-600/30 text-blue-400' : ''
              }`}
              title={tab.label}
            >
              {tab.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="bg-[#12141c] border-r border-[#212633] flex flex-col shrink-0 select-none overflow-hidden z-10"
    >
      {/* Sidebar Header & Tab Rail */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1f2430] bg-[#0e1017]">
        <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
          Library & Tools
        </span>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1d222e] transition-colors"
          title="Sembunyikan Sidebar"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="grid grid-cols-6 border-b border-[#1f2430] bg-[#101219]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-2 text-[10px] gap-1 transition-all ${
              activeTab === tab.id
                ? 'text-blue-400 border-b-2 border-blue-500 bg-[#161a24] font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#141720]'
            }`}
            title={tab.label}
          >
            {tab.icon}
            <span className="truncate max-w-[48px]">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Render full-featured Media Library when activeTab is 'media' */}
      {activeTab === 'media' ? (
        <MediaLibrary />
      ) : (
        <>
          {/* Search Bar for other tabs */}
          <div className="p-2 border-b border-[#1c212c]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={`Cari di ${tabs.find((t) => t.id === activeTab)?.label}...`}
                className="w-full bg-[#0a0c10] border border-[#232938] rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Tab Content Body for other tabs */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
            {activeTab === 'audio' && (
          <div className="flex flex-col items-center justify-center text-center my-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/30 border border-emerald-800/30 flex items-center justify-center text-emerald-400 mb-3">
              <Music className="w-7 h-7" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">Audio Library</h3>
            <p className="text-[11px] text-slate-400 max-w-[210px] mb-4 leading-relaxed">
              BGM, sound effects, voiceover, dan track audio akan tersedia pada Phase 8.
            </p>
            <button
              onClick={() => handleAddSampleClip('audio')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2230] hover:bg-[#252d3f] border border-[#2b3447] text-slate-300 text-[11px] transition-colors"
            >
              <PlusCircle className="w-3 h-3 text-emerald-400" />
              <span>+ Sample Audio Clip</span>
            </button>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="flex flex-col items-center justify-center text-center my-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-950/30 border border-amber-800/30 flex items-center justify-center text-amber-400 mb-3">
              <Type className="w-7 h-7" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">Text & Subtitle</h3>
            <p className="text-[11px] text-slate-400 max-w-[210px] mb-4 leading-relaxed">
              Template judul, Lower Thirds, subtitle editor, dan font styling akan hadir pada Phase 5.
            </p>
            <button
              onClick={() => handleAddSampleClip('text')}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1c2230] hover:bg-[#252d3f] border border-[#2b3447] text-slate-300 text-[11px] transition-colors"
            >
              <PlusCircle className="w-3 h-3 text-amber-400" />
              <span>+ Sample Title Clip</span>
            </button>
          </div>
        )}

        {activeTab === 'transition' && (
          <div className="flex flex-col items-center justify-center text-center my-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/30 border border-purple-800/30 flex items-center justify-center text-purple-400 mb-3">
              <Layers className="w-7 h-7" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">Transitions</h3>
            <p className="text-[11px] text-slate-400 max-w-[210px] mb-2 leading-relaxed">
              Dissolve, Fade to Black, Whip Pan, Wipe, dan 3D Transitions akan aktif pada Phase 6.
            </p>
          </div>
        )}

        {activeTab === 'effects' && (
          <div className="flex flex-col items-center justify-center text-center my-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-pink-950/30 border border-pink-800/30 flex items-center justify-center text-pink-400 mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">Video Effects</h3>
            <p className="text-[11px] text-slate-400 max-w-[210px] mb-2 leading-relaxed">
              Blur, Sharpen, Glow, Chroma Key (Green Screen), dan Distortion akan aktif pada Phase 6 & 7.
            </p>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="flex flex-col items-center justify-center text-center my-auto py-6">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950/30 border border-cyan-800/30 flex items-center justify-center text-cyan-400 mb-3">
              <SlidersHorizontal className="w-7 h-7" />
            </div>
            <h3 className="text-xs font-semibold text-slate-200 mb-1">LUTs & Filters</h3>
            <p className="text-[11px] text-slate-400 max-w-[210px] mb-2 leading-relaxed">
              Cinematic LUTs, Vintage, Film Noir, dan Color Grading presets akan hadir pada Phase 6.
            </p>
          </div>
        )}

        {/* Phase Roadmap Note */}
        <div className="p-2.5 rounded-lg bg-[#0e1017] border border-[#1e2330] text-[10px] text-slate-400">
          <div className="font-semibold text-slate-300 mb-0.5">Phase 2 Media Library</div>
          <p>Media Library aktif dan siap menerima import video, audio, dan gambar.</p>
        </div>
      </div>
    </>
  )}
</aside>
  );
};
