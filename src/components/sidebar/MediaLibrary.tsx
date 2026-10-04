/**
 * Nusantara Video Studio - Media Library Component
 * Phase 2: Media Library & Media Import
 *
 * Full-featured media asset manager supporting Grid/List view,
 * native file picker, multi-file drag & drop, real-time search,
 * categorization tabs, sorting, context menus, and offline detection.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  Film,
  Music,
  Image as ImageIcon,
  AlertTriangle,
  MoreVertical,
  Play,
  Info,
  Trash2,
  FolderOpen,
  Link,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { useMediaStore } from '../../stores/mediaStore';
import { useUIStore } from '../../stores/uiStore';
import { mediaService } from '../../services/mediaService';
import { formatBytes, formatDuration } from '../../utils/timecode';
import { MediaFilterType, MediaItem, MediaSortField } from '../../types';

export const MediaLibrary: React.FC = () => {
  const items = useMediaStore((s) => s.items);
  const getMedia = useMediaStore((s) => s.getMedia);
  const selectedMediaId = useMediaStore((s) => s.selectedMediaId);
  const selectMedia = useMediaStore((s) => s.selectMedia);
  const removeMedia = useMediaStore((s) => s.removeMedia);
  const searchQuery = useMediaStore((s) => s.searchQuery);
  const filterType = useMediaStore((s) => s.filterType);
  const setFilterType = useMediaStore((s) => s.filterMedia);
  const sortField = useMediaStore((s) => s.sortField);
  const sortOrder = useMediaStore((s) => s.sortOrder);
  const sortMedia = useMediaStore((s) => s.sortMedia);
  const viewMode = useMediaStore((s) => s.viewMode);
  const setViewMode = useMediaStore((s) => s.setViewMode);
  const renameMedia = useMediaStore((s) => s.renameMedia);
  const setPreviewMedia = useMediaStore((s) => s.setPreviewMedia);
  const setPropertiesMedia = useMediaStore((s) => s.setPropertiesMedia);
  const setRelinkTarget = useMediaStore((s) => s.setRelinkTarget);
  const setImportProgress = useMediaStore((s) => s.setImportProgress);
  const loadStoredMedia = useMediaStore((s) => s.loadStoredMedia);

  const notify = useUIStore((s) => s.notify);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: MediaItem | null;
  }>({ visible: false, x: 0, y: 0, item: null });

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  // Load persistent media items on mount
  useEffect(() => {
    loadStoredMedia();
  }, [loadStoredMedia]);

  // Close context and sort menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, item: null });
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [contextMenu.visible]);

  // Handle batch file processing
  const handleProcessFiles = async (files: File[]) => {
    if (files.length === 0) return;

    setImportProgress({
      active: true,
      current: 0,
      total: files.length,
      filename: files[0]?.name || '',
      percentage: 0,
    });

    try {
      const result = await mediaService.processFiles(
        files,
        items,
        (current, total, filename, percentage) => {
          setImportProgress({ active: true, current, total, filename, percentage });
        }
      );

      // Add to store
      if (result.imported.length > 0) {
        await useMediaStore.getState().addMultipleMedia(result.imported);
        notify(
          'Media Diimport',
          `✓ ${result.imported.length} media berhasil diimport ke project.`,
          'success',
          3000
        );
      }

      // Handle duplicate warnings
      if (result.duplicates.length > 0) {
        notify(
          'Duplikat Ditemukan',
          `⚠ ${result.duplicates.length} file sudah ada di project (${result.duplicates.slice(0, 2).join(', ')}...).`,
          'warning',
          3500
        );
      }

      // Handle unsupported format errors
      if (result.errors.length > 0) {
        notify(
          'Format Tidak Didukung',
          `✕ ${result.errors[0].name}: ${result.errors[0].reason}`,
          'error',
          4000
        );
      }
    } catch (err) {
      console.error('[MediaLibrary] Import failure:', err);
      notify('Gagal Import', err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setImportProgress({ active: false });
    }
  };

  // Trigger file picker
  const handleImportClick = async () => {
    const files = await mediaService.openFileDialog();
    if (files.length > 0) {
      await handleProcessFiles(files);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await handleProcessFiles(files);
    }
  };

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent, item: MediaItem) => {
    e.preventDefault();
    e.stopPropagation();
    selectMedia(item.id);
    setContextMenu({
      visible: true,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 220),
      item,
    });
  };

  // Context Menu Actions
  const handlePreviewAction = (item: MediaItem) => {
    setPreviewMedia(item);
  };

  const handleAddToTimeline = () => {
    notify(
      'Add to Timeline',
      'Timeline editing dan penempatan klip penuh akan tersedia pada Phase 3.',
      'info',
      3500
    );
  };

  const handleRenameAction = (item: MediaItem) => {
    const newName = prompt('Ubah nama media:', item.name);
    if (newName && newName.trim() && newName.trim() !== item.name) {
      renameMedia(item.id, newName.trim());
      notify('Media Diubah', `Nama media diperbarui menjadi "${newName.trim()}".`, 'success');
    }
  };

  const handleShowInExplorer = async (item: MediaItem) => {
    await mediaService.showInExplorer(item);
    notify(
      'Lokasi File',
      `Path file: ${item.path} (disalin ke clipboard / dibuka di explorer).`,
      'info',
      3000
    );
  };

  const handleRemoveAction = async (item: MediaItem) => {
    if (confirm(`Hapus "${item.name}" dari project?`)) {
      await removeMedia(item.id);
      notify('Media Dihapus', `"${item.name}" dihapus dari project.`, 'info');
    }
  };

  const handleRelinkAction = (item: MediaItem) => {
    setRelinkTarget(item);
  };

  const handlePropertiesAction = (item: MediaItem) => {
    setPropertiesMedia(item);
  };

  const filteredMedia = getMedia();

  // Category counts
  const countAll = items.length;
  const countVideo = items.filter((i) => i.type === 'video').length;
  const countAudio = items.filter((i) => i.type === 'audio').length;
  const countImage = items.filter((i) => i.type === 'image').length;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col overflow-hidden relative select-none transition-colors ${
        isDraggingOver ? 'bg-blue-950/20 ring-2 ring-inset ring-blue-500/80' : 'bg-[#10121a]'
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-blue-950/60 backdrop-blur-xs border-2 border-dashed border-blue-400 z-50 flex flex-col items-center justify-center pointer-events-none p-4 text-center">
          <Upload className="w-10 h-10 text-blue-400 animate-bounce mb-2" />
          <p className="text-xs font-semibold text-white">Lepaskan file media di sini</p>
          <p className="text-[11px] text-blue-200 mt-0.5">
            Dukung Video (.mp4, .mov, .mkv, .avi, .webm), Audio (.mp3, .wav), Gambar (.png, .jpg)
          </p>
        </div>
      )}

      {/* Top Header & Fast Actions */}
      <div className="p-2.5 border-b border-[#1f2430] bg-[#0d0f15] flex flex-col gap-2">
        <div className="flex items-center justify-between gap-1.5">
          {/* Import Media Button */}
          <button
            onClick={handleImportClick}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            title="Import Video, Audio, atau Gambar dari Komputer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Media</span>
          </button>

          {/* View Mode Toggle: Grid / List */}
          <div className="flex items-center bg-[#181d28] border border-[#242b3b] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View (Thumbnail)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View (Informasi Rinci)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sort Dropdown Button */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className="p-1.5 bg-[#181d28] hover:bg-[#202737] border border-[#242b3b] text-slate-300 rounded-lg text-xs transition-colors flex items-center gap-1"
              title={`Urutkan: ${sortField} (${sortOrder})`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {isSortMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#161a24] border border-[#273042] rounded-lg shadow-2xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Urutkan Berdasarkan
                </div>
                {(
                  [
                    { field: 'name', label: 'Nama File' },
                    { field: 'createdAt', label: 'Tanggal Ditambahkan' },
                    { field: 'duration', label: 'Durasi' },
                    { field: 'size', label: 'Ukuran File' },
                    { field: 'type', label: 'Tipe Media' },
                  ] as { field: MediaSortField; label: string }[]
                ).map((s) => (
                  <button
                    key={s.field}
                    onClick={() => {
                      sortMedia(s.field);
                      setIsSortMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
                      sortField === s.field
                        ? 'bg-blue-600/20 text-blue-400 font-semibold'
                        : 'text-slate-300 hover:bg-[#1f2635]'
                    }`}
                  >
                    <span>{s.label}</span>
                    {sortField === s.field && (
                      <span className="text-[10px] font-mono text-blue-400 uppercase">
                        {sortOrder}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Search Box */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => useMediaStore.getState().searchMedia(e.target.value)}
            placeholder="Search media..."
            className="w-full bg-[#0a0c10] border border-[#222836] rounded-md pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filters: All | Video | Audio | Image with Badges */}
        <div className="grid grid-cols-4 gap-1 pt-0.5">
          {(
            [
              { id: 'all', label: 'All', count: countAll },
              { id: 'video', label: 'Video', count: countVideo },
              { id: 'audio', label: 'Audio', count: countAudio },
              { id: 'image', label: 'Image', count: countImage },
            ] as { id: MediaFilterType; label: string; count: number }[]
          ).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`flex items-center justify-center gap-1 py-1 rounded-md text-[10px] transition-all ${
                filterType === f.id
                  ? 'bg-blue-600/25 border border-blue-500/50 text-blue-400 font-semibold'
                  : 'bg-[#141720] border border-[#202533] text-slate-400 hover:text-slate-200 hover:bg-[#191e2b]'
              }`}
            >
              <span>{f.label}</span>
              <span className="px-1 py-0.2 bg-[#090b10] rounded text-[9px] text-slate-400 font-mono">
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Media Items View Area */}
      <div className="flex-1 overflow-y-auto p-2.5">
        {filteredMedia.length === 0 ? (
          // Empty State (Requirement 25)
          <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#151923] border border-[#242b3b] flex items-center justify-center text-slate-500 mb-3 shadow-inner">
              <Film className="w-8 h-8 opacity-60 text-slate-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-200 mb-1">No Media</h3>
            <p className="text-[11px] text-slate-400 max-w-[220px] mb-4 leading-relaxed">
              {searchQuery
                ? `Tidak ada media yang cocok dengan "${searchQuery}".`
                : 'Belum ada media di project.'}
            </p>

            <button
              onClick={handleImportClick}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Media</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-2">
              atau Drag & Drop video, audio, atau gambar ke sini.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View (Requirement 3)
          <div className="grid grid-cols-2 gap-2">
            {filteredMedia.map((item) => {
              const isSelected = selectedMediaId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => selectMedia(item.id)}
                  onDoubleClick={() => handlePreviewAction(item)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={`group relative rounded-lg border p-1.5 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#182133] border-blue-500 ring-1 ring-blue-500 shadow-md'
                      : 'bg-[#141720] border-[#222735] hover:border-[#323b50] hover:bg-[#181d29]'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video rounded bg-black overflow-hidden flex items-center justify-center border border-white/5">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        {item.type === 'video' ? (
                          <Film className="w-6 h-6 text-blue-400 opacity-60" />
                        ) : item.type === 'audio' ? (
                          <Music className="w-6 h-6 text-emerald-400 opacity-60" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-purple-400 opacity-60" />
                        )}
                        <span className="text-[8px] font-mono text-slate-400 mt-1">NO PREVIEW</span>
                      </div>
                    )}

                    {/* Play Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Play className="w-5 h-5 text-white drop-shadow-md fill-current" />
                    </div>

                    {/* Media Type Badge */}
                    <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[8px] font-bold text-white uppercase font-mono tracking-wider flex items-center gap-0.5">
                      {item.type === 'video' ? (
                        <Film className="w-2.5 h-2.5 text-blue-400" />
                      ) : item.type === 'audio' ? (
                        <Music className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <ImageIcon className="w-2.5 h-2.5 text-purple-400" />
                      )}
                      <span>{item.extension.toUpperCase()}</span>
                    </div>

                    {/* Duration / Resolution Badge */}
                    {item.duration !== undefined && item.duration > 0 && (
                      <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 font-mono text-[9px] text-white">
                        {formatDuration(item.duration)}
                      </div>
                    )}

                    {/* Offline Warning Badge */}
                    {item.isOffline && (
                      <div
                        className="absolute inset-0 bg-rose-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-rose-300 p-1"
                        title="File tidak ditemukan (Offline)"
                      >
                        <AlertTriangle className="w-5 h-5 text-rose-400 mb-0.5" />
                        <span className="text-[9px] font-bold">OFFLINE</span>
                      </div>
                    )}
                  </div>

                  {/* Title & Metadata Details */}
                  <div className="mt-1.5 flex flex-col gap-0.5">
                    <span
                      className="text-[11px] font-medium text-slate-200 truncate leading-tight group-hover:text-blue-300"
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                      <span>{formatBytes(item.size)}</span>
                      {item.width && item.height ? (
                        <span>{item.width}×{item.height}</span>
                      ) : item.sampleRate ? (
                        <span>{(item.sampleRate / 1000).toFixed(1)}kHz</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List View (Requirement 3)
          <div className="flex flex-col divide-y divide-[#1e2330] border border-[#212735] rounded-lg overflow-hidden bg-[#13161f]">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-2.5 py-1.5 bg-[#0f1118] text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              <span className="col-span-5">Name</span>
              <span className="col-span-2 text-center">Type</span>
              <span className="col-span-2 text-right">Duration</span>
              <span className="col-span-3 text-right">Size</span>
            </div>

            {/* Rows */}
            {filteredMedia.map((item) => {
              const isSelected = selectedMediaId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => selectMedia(item.id)}
                  onDoubleClick={() => handlePreviewAction(item)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                  className={`grid grid-cols-12 items-center px-2.5 py-1.5 text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-600/25 text-white'
                      : 'hover:bg-[#181d29] text-slate-300'
                  }`}
                >
                  {/* Name & Thumbnail */}
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    <div className="w-6 h-4 rounded bg-black shrink-0 overflow-hidden border border-white/10 flex items-center justify-center">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[7px] text-slate-500 font-mono">N/A</span>
                      )}
                    </div>
                    <span className="truncate font-medium text-[11px]" title={item.name}>
                      {item.name}
                    </span>
                    {item.isOffline && (
                      <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
                        OFFLINE
                      </span>
                    )}
                  </div>

                  {/* Type */}
                  <span className="col-span-2 text-center text-[10px] font-mono text-slate-400 uppercase">
                    {item.extension}
                  </span>

                  {/* Duration */}
                  <span className="col-span-2 text-right text-[10px] font-mono text-slate-300">
                    {item.duration ? formatDuration(item.duration) : '-'}
                  </span>

                  {/* Size & Context trigger */}
                  <div className="col-span-3 flex items-center justify-end gap-1.5 text-[10px] font-mono text-slate-400">
                    <span>{formatBytes(item.size)}</span>
                    <button
                      onClick={(e) => handleContextMenu(e, item)}
                      className="p-0.5 text-slate-500 hover:text-slate-200"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right-click Context Menu (Requirement 16) */}
      {contextMenu.visible && contextMenu.item && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed bg-[#171b26] border border-[#273042] rounded-xl shadow-2xl py-1 z-50 min-w-[190px] text-xs animate-in fade-in zoom-in-95 duration-75 select-none"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 border-b border-[#222938] truncate max-w-[180px]">
            {contextMenu.item.name}
          </div>

          <button
            onClick={() => handlePreviewAction(contextMenu.item!)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          <button
            onClick={handleAddToTimeline}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-400 hover:bg-blue-600/20 hover:text-blue-300 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Add to Timeline</span>
          </button>

          <button
            onClick={() => handleRenameAction(contextMenu.item!)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Rename</span>
          </button>

          <button
            onClick={() => handleShowInExplorer(contextMenu.item!)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Show in Explorer</span>
          </button>

          <button
            onClick={() => handleRelinkAction(contextMenu.item!)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-amber-300 hover:bg-amber-950/40 transition-colors"
          >
            <Link className="w-3.5 h-3.5" />
            <span>Relink Media</span>
          </button>

          <button
            onClick={() => handlePropertiesAction(contextMenu.item!)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-200 hover:bg-blue-600/20 hover:text-blue-400 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Properties</span>
          </button>

          <div className="my-1 border-t border-[#222938]" />

          <button
            onClick={() => handleRemoveAction(contextMenu.item!)}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove from Project</span>
          </button>
        </div>
      )}
    </div>
  );
};
