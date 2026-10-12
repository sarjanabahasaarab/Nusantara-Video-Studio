/**
 * Nusantara Video Studio - Command Palette Modal
 * Phase 8: Professional Editing Workflow
 *
 * Implements instantaneous fuzzy search command palette (Ctrl+Shift+P)
 * allowing professional editors to execute any action without touching menus.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useWorkflowStore } from '../../stores/workflowStore';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { fileService } from '../../services/fileService';
import {
  Search,
  Sparkles,
  Film,
  Scissors,
  Save,
  FolderOpen,
  Plus,
  BookmarkPlus,
  Sliders,
  Tv,
  RefreshCw,
  Package,
  Layers,
  Activity,
  Keyboard,
  Link,
  Volume2,
  Palette,
} from 'lucide-react';
import { CommandPaletteAction } from '../../types';

export const CommandPaletteModal: React.FC = () => {
  const isOpen = useWorkflowStore((s) => s.isCommandPaletteOpen);
  const closePalette = useWorkflowStore((s) => s.closeCommandPalette);
  const toggleProxy = useWorkflowStore((s) => s.toggleProxy);
  const proxyEnabled = useWorkflowStore((s) => s.proxyEnabled);
  const runHealthCheck = useWorkflowStore((s) => s.runHealthCheck);

  const openDialog = useUIStore((s) => s.openDialog);
  const setActiveWorkspace = useUIStore((s) => s.setActiveWorkspace);
  const notify = useUIStore((s) => s.notify);
  const currentProject = useProjectStore((s) => s.currentProject);
  const markSaved = useProjectStore((s) => s.markSaved);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Registry of commands (Requirement 75)
  const actions: (CommandPaletteAction & { icon: React.ReactNode })[] = [
    {
      id: 'act-new-proj',
      title: 'New Project',
      category: 'File',
      shortcut: 'Ctrl+N',
      icon: <Plus className="w-4 h-4 text-blue-400" />,
      execute: () => openDialog('newProject'),
    },
    {
      id: 'act-open-proj',
      title: 'Open Project',
      category: 'File',
      shortcut: 'Ctrl+O',
      icon: <FolderOpen className="w-4 h-4 text-amber-400" />,
      execute: async () => {
        const res = await fileService.openProjectFromFile();
        if (res.project) {
          useProjectStore.getState().loadProject(res.project);
          notify('Project Loaded', `Proyek "${res.project.name}" berhasil dibuka.`, 'success');
        }
      },
    },
    {
      id: 'act-save-proj',
      title: 'Save Project',
      category: 'File',
      shortcut: 'Ctrl+S',
      icon: <Save className="w-4 h-4 text-emerald-400" />,
      execute: () => {
        fileService.saveProjectToFile(currentProject);
        markSaved();
        notify('Save Project', 'Proyek berhasil disimpan.', 'success');
      },
    },
    {
      id: 'act-save-as',
      title: 'Save As...',
      category: 'File',
      shortcut: 'Ctrl+Shift+S',
      icon: <Save className="w-4 h-4 text-emerald-400" />,
      execute: () => {
        const customName = prompt('Nama file proyek:', currentProject.name);
        if (customName) {
          fileService.saveProjectToFile(currentProject, customName);
          markSaved();
        }
      },
    },
    {
      id: 'act-toggle-proxy',
      title: proxyEnabled ? 'Toggle Proxy (Turn OFF)' : 'Toggle Proxy (Turn ON)',
      category: 'Proxy',
      shortcut: 'P',
      icon: <Tv className="w-4 h-4 text-purple-400" />,
      execute: () => toggleProxy(),
    },
    {
      id: 'act-relink-media',
      title: 'Relink Media...',
      category: 'Media',
      shortcut: 'Ctrl+R',
      icon: <Link className="w-4 h-4 text-cyan-400" />,
      execute: () => openDialog('relinkMedia' as any),
    },
    {
      id: 'act-project-archive',
      title: 'Project Archive...',
      category: 'Project',
      shortcut: 'Ctrl+Shift+A',
      icon: <Package className="w-4 h-4 text-indigo-400" />,
      execute: () => openDialog('projectArchive' as any),
    },
    {
      id: 'act-export-video',
      title: 'Export Video (MP4 / MOV / WebM)...',
      category: 'Export',
      shortcut: 'Ctrl+E',
      icon: <Film className="w-4 h-4 text-emerald-400" />,
      execute: () => openDialog('exportVideo'),
    },
    {
      id: 'act-render-queue',
      title: 'Open Render Queue...',
      category: 'Export',
      shortcut: 'Ctrl+Shift+R',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      execute: () => openDialog('renderQueue'),
    },
    {
      id: 'act-export-history',
      title: 'Open Export History...',
      category: 'Export',
      icon: <Package className="w-4 h-4 text-amber-400" />,
      execute: () => openDialog('exportHistory'),
    },
    {
      id: 'act-phase9-test',
      title: 'Run Phase 9 Verification Suite (Render & Export Engine)...',
      category: 'Testing',
      icon: <Sparkles className="w-4 h-4 text-pink-400" />,
      execute: () => openDialog('phase9Test'),
    },
    {
      id: 'act-health-check',
      title: 'Project Health Check...',
      category: 'Project',
      shortcut: 'Ctrl+H',
      icon: <Activity className="w-4 h-4 text-rose-400" />,
      execute: () => {
        runHealthCheck();
        openDialog('projectHealth' as any);
      },
    },
    {
      id: 'act-add-marker',
      title: 'Add Marker at Playhead',
      category: 'Timeline',
      shortcut: 'M',
      icon: <BookmarkPlus className="w-4 h-4 text-amber-400" />,
      execute: () => {
        const time = useProjectStore.getState().currentProject.timeline.duration * 0.1;
        useWorkflowStore.getState().addMarker(time, 'Marker Baru', 'general');
        notify('Marker', 'Marker ditambahkan pada timeline.', 'info');
      },
    },
    {
      id: 'act-show-markers',
      title: 'Show Markers Panel...',
      category: 'Timeline',
      shortcut: 'Ctrl+M',
      icon: <BookmarkPlus className="w-4 h-4 text-blue-400" />,
      execute: () => openDialog('markerPanel' as any),
    },
    {
      id: 'act-ws-editing',
      title: 'Open Workspace: Editing',
      category: 'Workspace',
      shortcut: 'Alt+1',
      icon: <Film className="w-4 h-4 text-blue-400" />,
      execute: () => setActiveWorkspace('edit'),
    },
    {
      id: 'act-ws-color',
      title: 'Open Workspace: Color Studio',
      category: 'Workspace',
      shortcut: 'Alt+2',
      icon: <Palette className="w-4 h-4 text-amber-400" />,
      execute: () => setActiveWorkspace('color'),
    },
    {
      id: 'act-ws-audio',
      title: 'Open Workspace: Audio Studio',
      category: 'Workspace',
      shortcut: 'Alt+3',
      icon: <Volume2 className="w-4 h-4 text-emerald-400" />,
      execute: () => setActiveWorkspace('audio'),
    },
    {
      id: 'act-ws-ai',
      title: 'Open Workspace: AI-Assisted Editing',
      category: 'Workspace',
      shortcut: 'Alt+4',
      icon: <Sparkles className="w-4 h-4 text-purple-400" />,
      execute: () => setActiveWorkspace('ai'),
    },
    {
      id: 'act-shortcuts',
      title: 'Open Keyboard Shortcuts...',
      category: 'Settings',
      shortcut: 'Ctrl+/',
      icon: <Keyboard className="w-4 h-4 text-slate-300" />,
      execute: () => openDialog('shortcuts'),
    },
    {
      id: 'act-perf-mon',
      title: 'Open Performance Monitor...',
      category: 'Tools',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      execute: () => openDialog('performanceMonitor' as any),
    },
    {
      id: 'act-multicam',
      title: 'Create Multicam Group...',
      category: 'Media',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      execute: () => openDialog('multicam' as any),
    },
    {
      id: 'act-cache-mgr',
      title: 'Media Cache Management...',
      category: 'Tools',
      icon: <RefreshCw className="w-4 h-4 text-blue-400" />,
      execute: () => openDialog('mediaCache' as any),
    },
  ];

  const filtered = actions.filter((act) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      act.title.toLowerCase().includes(q) ||
      act.category.toLowerCase().includes(q) ||
      (act.shortcut && act.shortcut.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[selectedIndex];
      if (target) {
        closePalette();
        target.execute();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-start justify-center pt-24 select-none animate-in fade-in duration-100"
      onClick={closePalette}
    >
      <div
        className="w-full max-w-xl bg-[#141722] border border-[#262e42] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#202738] bg-[#11131c]">
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Ketik perintah atau fitur... (cth: Proxy, Split, Relink, Health, Workspace)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-[#1c2230] border border-[#2b354a] rounded">
            ESC
          </kbd>
        </div>

        {/* Action list */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Tidak ada perintah yang cocok dengan &quot;{searchQuery}&quot;
            </div>
          ) : (
            filtered.map((act, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={act.id}
                  onClick={() => {
                    closePalette();
                    act.execute();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-white font-medium'
                      : 'text-slate-300 hover:bg-[#1a202e]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {act.icon}
                    <span>{act.title}</span>
                    <span className="text-[10px] text-slate-500 bg-[#0e1017] px-1.5 py-0.2 rounded border border-[#1f2536]">
                      {act.category}
                    </span>
                  </div>

                  {act.shortcut && (
                    <kbd className="font-mono text-[10px] text-slate-400 bg-[#181d28] px-2 py-0.5 rounded border border-[#252d3d]">
                      {act.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
