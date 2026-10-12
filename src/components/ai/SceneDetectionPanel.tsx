/**
 * Nusantara Video Studio - Scene Detection Panel
 * Phase 7: AI-Assisted Editing
 *
 * Implements real frame difference visual scene detection runner,
 * visual thumbnail grid, and timeline marker & subclip generation.
 */

import React, { useState } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { Film, Play, BookmarkPlus, FolderPlus, Sparkles, Check } from 'lucide-react';

export const SceneDetectionPanel: React.FC = () => {
  const detectedScenes = useAIStore((s) => s.detectedScenes);
  const runSceneDetection = useAIStore((s) => s.runSceneDetection);
  const addScenesAsMarkers = useAIStore((s) => s.addScenesAsMarkers);
  const createSubclipsFromScenes = useAIStore((s) => s.createSubclipsFromScenes);
  const jobs = useAIStore((s) => s.jobs);
  const notify = useUIStore((s) => s.notify);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);

  const [threshold, setThreshold] = useState(0.28);
  const mediaList = useProjectStore((s) => s.currentProject.media);
  const selectedMediaId = useAIStore((s) => s.selectedMediaId) || mediaList[0]?.id;
  const currentMedia = mediaList.find((m) => m.id === selectedMediaId);

  const activeJob = jobs.find((j) => j.type === 'scene-detection' && j.status === 'running');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartDetection = () => {
    if (!currentMedia) {
      notify('Scene Detection', 'Pilih media video terlebih dahulu.', 'warning');
      return;
    }
    runSceneDetection(currentMedia.id, currentMedia.blobUrl || currentMedia.path, currentMedia.duration || 15);
    notify('Scene Detection', 'Memulai analisis frame difference visual di background...', 'info', 2000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Header & Controls */}
      <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Visual Scene Detection</h3>
              <p className="text-xs text-slate-400">
                Deteksi batas perpindahan shot kamera menggunakan komputasi selisih piksel (RGB delta).
              </p>
            </div>
          </div>

          <button
            onClick={handleStartDetection}
            disabled={!!activeJob}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
              activeJob
                ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white hover:shadow-blue-600/30'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {activeJob ? `Menganalisis (${activeJob.progress}%)` : 'Detect Scenes'}
          </button>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#202738] text-xs">
          <div>
            <div className="flex justify-between text-slate-300 mb-1">
              <span>Sensitivity Threshold</span>
              <span className="font-mono text-blue-400">{Math.round(threshold * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.50"
              step="0.01"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-blue-500 bg-[#1e2536] rounded"
            />
            <span className="text-[10px] text-slate-500">
              Nilai lebih rendah mendeteksi potongan lebih halus; nilai lebih tinggi hanya potongan drastis.
            </span>
          </div>

          <div className="flex flex-col justify-end text-[11px] text-slate-400">
            <span>Metode: Frame Luminance Difference Engine</span>
            <span>Non-destruktif: File media asli tidak diubah</span>
          </div>
        </div>
      </div>

      {/* Results Header & Batch Actions */}
      {detectedScenes.length > 0 && (
        <div className="flex items-center justify-between bg-[#151824] border border-[#22293b] rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-white">{detectedScenes.length} Scene Terdeteksi</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 font-mono">
              Total durasi: {detectedScenes[detectedScenes.length - 1].end.toFixed(1)}s
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                addScenesAsMarkers();
                notify('Markers', `${detectedScenes.length} marker scene ditambahkan ke timeline.`, 'success');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1e2536] hover:bg-[#283248] text-slate-200 text-xs rounded-lg border border-[#2d374d] transition-colors"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-blue-400" />
              Add scenes as markers
            </button>
            <button
              onClick={() => {
                createSubclipsFromScenes();
                notify('Media Library', `${detectedScenes.length} subclip scene baru dibuat di Media Library.`, 'success');
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#1e2536] hover:bg-[#283248] text-slate-200 text-xs rounded-lg border border-[#2d374d] transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
              Create subclips from scenes
            </button>
          </div>
        </div>
      )}

      {/* Scene Grid Cards */}
      <div className="grid grid-cols-3 gap-3">
        {detectedScenes.map((scene, idx) => (
          <div
            key={scene.id}
            onClick={() => setCurrentTime(scene.start)}
            className="group bg-[#151824] hover:bg-[#1a1f2e] border border-[#22293b] hover:border-blue-500/50 rounded-lg p-2.5 cursor-pointer transition-all flex flex-col gap-2"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-[#0d0f15] rounded overflow-hidden relative flex items-center justify-center border border-[#1d2332]">
              {scene.thumbnail ? (
                <img
                  src={scene.thumbnail}
                  alt={`Scene ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Film className="w-6 h-6 text-slate-600" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200">
                Scene {String(idx + 1).padStart(2, '0')}
              </span>
              <span className="font-mono text-blue-400 text-[11px]">
                {formatTime(scene.start)} - {formatTime(scene.end)}
              </span>
            </div>

            <div className="text-[10px] text-slate-500 flex justify-between">
              <span>Durasi: {(scene.end - scene.start).toFixed(1)}s</span>
              <span>Confidence: {Math.round((scene.confidence || 0.9) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>

      {detectedScenes.length === 0 && !activeJob && (
        <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-[#242b3d] rounded-xl p-8 text-center text-slate-500 text-xs">
          <Film className="w-8 h-8 mb-2 text-slate-600" />
          <p className="font-medium text-slate-400">Belum ada scene yang dianalisis</p>
          <p className="text-[11px] max-w-sm mt-1">
            Klik tombol <strong className="text-slate-300">Detect Scenes</strong> di atas untuk memindai perubahan frame visual pada klip aktif.
          </p>
        </div>
      )}
    </div>
  );
};
