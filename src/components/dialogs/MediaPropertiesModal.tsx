/**
 * Nusantara Video Studio - Media Properties Modal
 * Phase 2: Media Library & Media Import
 *
 * Detailed metadata inspector for media items (Resolution, FPS, Codec, Audio info, File Path, Offline status)
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { useMediaStore } from '../../stores/mediaStore';
import { useUIStore } from '../../stores/uiStore';
import { mediaService } from '../../services/mediaService';
import { formatBytes, formatDuration } from '../../utils/timecode';
import {
  FileText,
  Copy,
  FolderOpen,
  Link,
  AlertTriangle,
  CheckCircle2,
  Film,
  Music,
  Image as ImageIcon,
} from 'lucide-react';

export const MediaPropertiesModal: React.FC = () => {
  const propertiesItem = useMediaStore((s) => s.propertiesMediaItem);
  const setPropertiesMedia = useMediaStore((s) => s.setPropertiesMedia);
  const setRelinkTarget = useMediaStore((s) => s.setRelinkTarget);
  const notify = useUIStore((s) => s.notify);

  if (!propertiesItem) return null;

  const handleCopyPath = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(propertiesItem.path);
      notify('Disalin', 'Path file berhasil disalin ke clipboard.', 'success', 2000);
    }
  };

  const handleShowInExplorer = async () => {
    await mediaService.showInExplorer(propertiesItem);
    notify('Lokasi File', `Path: ${propertiesItem.path}`, 'info', 2500);
  };

  const handleRelink = () => {
    const item = propertiesItem;
    setPropertiesMedia(null);
    setRelinkTarget(item);
  };

  return (
    <Modal
      isOpen={true}
      onClose={() => setPropertiesMedia(null)}
      title="Media Properties"
      subtitle={propertiesItem.name}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Header Summary */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#141722] border border-[#232938]">
          <div className="w-12 h-12 rounded-lg bg-black border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
            {propertiesItem.thumbnail ? (
              <img src={propertiesItem.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : propertiesItem.type === 'video' ? (
              <Film className="w-6 h-6 text-blue-400" />
            ) : propertiesItem.type === 'audio' ? (
              <Music className="w-6 h-6 text-emerald-400" />
            ) : (
              <ImageIcon className="w-6 h-6 text-purple-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate text-sm">{propertiesItem.name}</h4>
            <div className="flex items-center gap-2 mt-0.5 text-slate-400 font-mono text-[11px]">
              <span className="uppercase font-bold text-blue-400">{propertiesItem.type}</span>
              <span>•</span>
              <span>{formatBytes(propertiesItem.size)}</span>
              {propertiesItem.duration ? (
                <>
                  <span>•</span>
                  <span>{formatDuration(propertiesItem.duration)}</span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Offline Status Warning Bar if offline */}
        {propertiesItem.isOffline ? (
          <div className="p-3 bg-rose-950/50 border border-rose-600/40 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">STATUS: OFFLINE</span>
                <p className="text-[10px] text-rose-400">Berkas tidak ditemukan pada lokasi asli.</p>
              </div>
            </div>
            <button
              onClick={handleRelink}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <Link className="w-3 h-3" />
              <span>Relink File</span>
            </button>
          </div>
        ) : (
          <div className="px-3 py-1.5 bg-emerald-950/30 border border-emerald-600/30 rounded-lg flex items-center gap-2 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Media Online & Tersedia</span>
          </div>
        )}

        {/* Metadata Details Table */}
        <div className="border border-[#222836] rounded-lg overflow-hidden bg-[#10131b] divide-y divide-[#1b202c]">
          <div className="grid grid-cols-3 px-3 py-2">
            <span className="text-slate-400 font-medium">Format / Extension</span>
            <span className="col-span-2 font-mono text-slate-200 uppercase">
              {propertiesItem.extension} {propertiesItem.mimeType && `(${propertiesItem.mimeType})`}
            </span>
          </div>

          <div className="grid grid-cols-3 px-3 py-2">
            <span className="text-slate-400 font-medium">File Size</span>
            <span className="col-span-2 font-mono text-slate-200">
              {formatBytes(propertiesItem.size)} ({propertiesItem.size.toLocaleString()} bytes)
            </span>
          </div>

          {propertiesItem.duration !== undefined && (
            <div className="grid grid-cols-3 px-3 py-2">
              <span className="text-slate-400 font-medium">Duration</span>
              <span className="col-span-2 font-mono text-slate-200">
                {formatDuration(propertiesItem.duration)} ({propertiesItem.duration.toFixed(2)} seconds)
              </span>
            </div>
          )}

          {propertiesItem.width && propertiesItem.height && (
            <div className="grid grid-cols-3 px-3 py-2">
              <span className="text-slate-400 font-medium">Resolution</span>
              <span className="col-span-2 font-mono text-slate-200">
                {propertiesItem.width} × {propertiesItem.height} (
                {(propertiesItem.width / propertiesItem.height).toFixed(2)}:1)
              </span>
            </div>
          )}

          {propertiesItem.fps && (
            <div className="grid grid-cols-3 px-3 py-2">
              <span className="text-slate-400 font-medium">Frame Rate</span>
              <span className="col-span-2 font-mono text-slate-200">{propertiesItem.fps} FPS</span>
            </div>
          )}

          {propertiesItem.codec && (
            <div className="grid grid-cols-3 px-3 py-2">
              <span className="text-slate-400 font-medium">Video Codec</span>
              <span className="col-span-2 font-mono text-slate-200">{propertiesItem.codec}</span>
            </div>
          )}

          {propertiesItem.sampleRate && (
            <div className="grid grid-cols-3 px-3 py-2">
              <span className="text-slate-400 font-medium">Audio Sample Rate</span>
              <span className="col-span-2 font-mono text-slate-200">
                {propertiesItem.sampleRate} Hz ({(propertiesItem.sampleRate / 1000).toFixed(1)} kHz)
              </span>
            </div>
          )}

          {propertiesItem.channels && (
            <div className="grid grid-cols-3 px-3 py-2">
              <span className="text-slate-400 font-medium">Audio Channels</span>
              <span className="col-span-2 font-mono text-slate-200">
                {propertiesItem.channels === 1 ? '1 (Mono)' : `${propertiesItem.channels} (Stereo / Multi-channel)`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 px-3 py-2">
            <span className="text-slate-400 font-medium">Date Imported</span>
            <span className="col-span-2 text-slate-300">
              {new Date(propertiesItem.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-3 px-3 py-2">
            <span className="text-slate-400 font-medium">Media ID</span>
            <span className="col-span-2 font-mono text-[10px] text-slate-500 break-all">
              {propertiesItem.id}
            </span>
          </div>
        </div>

        {/* File Path Bar */}
        <div className="p-3 bg-[#0d0f15] border border-[#202534] rounded-lg flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              File Location
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyPath}
                className="px-2 py-0.5 rounded bg-[#191d29] hover:bg-[#222838] border border-[#273042] text-[10px] text-slate-300 flex items-center gap-1 transition-colors"
                title="Salin path ke clipboard"
              >
                <Copy className="w-3 h-3" />
                <span>Salin Path</span>
              </button>
              <button
                onClick={handleShowInExplorer}
                className="px-2 py-0.5 rounded bg-[#191d29] hover:bg-[#222838] border border-[#273042] text-[10px] text-slate-300 flex items-center gap-1 transition-colors"
                title="Buka di Windows Explorer"
              >
                <FolderOpen className="w-3 h-3" />
                <span>Show in Explorer</span>
              </button>
            </div>
          </div>
          <code className="text-[10px] font-mono text-slate-300 bg-[#07080b] p-2 rounded border border-[#1b1f2b] break-all select-all">
            {propertiesItem.path}
          </code>
        </div>
      </div>
    </Modal>
  );
};
