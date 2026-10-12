/**
 * Nusantara Video Studio - Professional Export Dialog
 * Phase 9: Professional Rendering & Export Engine (Requirements 7-37, 52-61)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Film,
  X,
  Tv,
  CheckCircle2,
  AlertTriangle,
  Play,
  ListPlus,
  Sliders,
  Cpu,
  Layers,
  FileText,
  Volume2,
  HardDrive,
  FolderOpen,
  Sparkles,
  Info,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import {
  RenderSettings,
  RenderCapabilities,
  RenderPreflightResult,
  RenderPreset,
  RenderContainerFormat,
  VideoCodec,
  AudioCodec,
  QualityPreset,
} from '../../types/render';
import { RenderCapabilitiesService } from '../../render/RenderCapabilities';
import { RenderSettingsManager, DEFAULT_RENDER_SETTINGS } from '../../render/RenderSettings';
import { RenderPresetManager, BUILT_IN_PRESETS } from '../../render/RenderPreset';
import { RenderValidator } from '../../render/RenderValidator';
import { RenderEngine } from '../../render/RenderEngine';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose }) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const notify = useUIStore((s) => s.notify);
  const openDialog = useUIStore((s) => s.openDialog);

  const [capabilities, setCapabilities] = useState<RenderCapabilities | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-yt-1080p');
  const [allPresets, setAllPresets] = useState<RenderPreset[]>(BUILT_IN_PRESETS);

  const [settings, setSettings] = useState<RenderSettings>(() => {
    return RenderSettingsManager.getLastSettings(currentProject);
  });

  const [preflight, setPreflight] = useState<RenderPreflightResult | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'subtitle' | 'preflight'>('video');
  const [showFpsWarning, setShowFpsWarning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Load capabilities & presets on open
  useEffect(() => {
    if (isOpen) {
      RenderCapabilitiesService.getInstance()
        .getCapabilities()
        .then((caps) => setCapabilities(caps));

      setAllPresets(RenderPresetManager.getAllPresets());

      const initial = RenderSettingsManager.getLastSettings(currentProject);
      // Auto-generate safe default output path if empty
      if (!initial.outputPath) {
        initial.outputPath = `/exports/${RenderSettingsManager.generateFilename(
          '{project}_{resolution}_{date}.mp4',
          {
            projectName: currentProject.name || 'Proyek Video',
            resolution: `${initial.width}x${initial.height}`,
            presetName: initial.qualityPreset,
            extension: `.${initial.format}`,
          }
        )}`;
      }
      setSettings(initial);
    }
  }, [isOpen, currentProject]);

  // Run preflight check whenever settings change
  useEffect(() => {
    if (isOpen && currentProject) {
      RenderValidator.validatePreflight(currentProject, settings).then((res) => {
        setPreflight(res);
      });
    }
  }, [isOpen, settings, currentProject]);

  // Handle Preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = allPresets.find((p) => p.id === presetId);
    if (!preset) return;

    setSettings((prev) => {
      const merged = { ...prev, ...preset.settings };
      return RenderSettingsManager.applyQualityPreset(
        merged,
        preset.settings.qualityPreset || 'high'
      );
    });

    notify('Preset Diterapkan', `Pengaturan render diperbarui: ${preset.name}`, 'info', 1800);
  };

  // Handle Quality preset button click
  const handleQualityPresetChange = (q: QualityPreset) => {
    setSettings((prev) => RenderSettingsManager.applyQualityPreset(prev, q));
  };

  // Check FPS mismatch warning (Requirement 14, 15)
  const handleFpsChange = (newFps: number) => {
    const projectFps = currentProject.settings.fps || 30;
    if (newFps !== projectFps) {
      setShowFpsWarning(true);
    } else {
      setShowFpsWarning(false);
    }
    setSettings((prev) => ({ ...prev, fps: newFps }));
  };

  const handleExportNow = async () => {
    if (!preflight?.canProceed) {
      notify('Preflight Gagal', 'Harap periksa masalah kritis pada tab Preflight.', 'error', 3000);
      setActiveTab('preflight');
      return;
    }

    try {
      setIsExporting(true);
      RenderSettingsManager.saveSettings(settings);

      const job = await RenderEngine.prepareAndQueueRender(
        currentProject,
        settings,
        currentProject.name
      );

      notify('Render Dimulai', `Klip dimasukkan ke antrean render: ${job.id}`, 'success', 2500);
      onClose();
      openDialog('renderQueue');
    } catch (err: any) {
      notify('Gagal Memulai Render', err.message || 'Terjadi kesalahan sistem.', 'error', 3500);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddToQueue = async () => {
    try {
      setIsExporting(true);
      RenderSettingsManager.saveSettings(settings);

      await RenderEngine.prepareAndQueueRender(
        currentProject,
        settings,
        `${currentProject.name} (Antrean)`
      );

      notify('Ditambahkan ke Antrean', 'Tugas berhasil didaftarkan ke Render Queue.', 'success', 2000);
      onClose();
      openDialog('renderQueue');
    } catch (err: any) {
      notify('Gagal Mendaftarkan Antrean', err.message, 'error', 3000);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  const projectFps = currentProject.settings.fps || 30;
  const projectWidth = currentProject.settings.width || 1920;
  const projectHeight = currentProject.settings.height || 1080;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Film size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100 tracking-wide">
                  Export Video & Render Engine
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                  v0.9.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pipa ekspor profesional dengan akselerasi perangkat keras dan validasi preflight
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openDialog('renderQueue')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
              title="Buka Antrean Render"
            >
              <ListPlus size={14} className="text-blue-400" />
              <span>Antrean Render</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preset Selector Banner */}
        <div className="px-6 py-2.5 bg-[#121620] border-b border-slate-800/60 flex items-center justify-between gap-4 overflow-x-auto text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <Sparkles size={14} className="text-amber-400" />
            <span className="font-semibold text-slate-300">Preset Ekspor:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {allPresets.map((p) => {
              const isActive = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/30'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 border-b border-slate-800/80 bg-[#131722] gap-1 text-xs font-medium">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
              activeTab === 'video'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film size={15} />
            <span>Pengaturan Video</span>
          </button>
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
              activeTab === 'audio'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Volume2 size={15} />
            <span>Audio & Normalisasi</span>
          </button>
          <button
            onClick={() => setActiveTab('subtitle')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ${
              activeTab === 'subtitle'
                ? 'border-blue-500 text-blue-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={15} />
            <span>Subtitle & Range</span>
          </button>
          <button
            onClick={() => setActiveTab('preflight')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 transition ml-auto ${
              activeTab === 'preflight'
                ? 'border-amber-500 text-amber-400 font-semibold'
                : preflight?.issues.some((i) => i.severity === 'error')
                ? 'border-rose-500 text-rose-400 font-semibold animate-pulse'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert size={15} />
            <span>
              Preflight (
              {preflight?.issues.length ?? 0})
            </span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* TAB 1: VIDEO SETTINGS */}
          {activeTab === 'video' && (
            <div className="space-y-6">
              {/* FPS Mismatch Warning Banner */}
              {showFpsWarning && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <p className="font-semibold">Peringatan Frame Rate</p>
                    <p className="text-[11px] opacity-90 mt-0.5">
                      Output frame rate ({settings.fps} fps) berbeda dari frame rate proyek ({projectFps} fps).
                      Hal ini dapat memengaruhi timing motion dan interpolasi frame.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid 1: Container, Codec, Hardware */}
              <div className="grid grid-cols-3 gap-4">
                {/* Format Container */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Format Container
                  </label>
                  <select
                    value={settings.format}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        format: e.target.value as RenderContainerFormat,
                        // reset codec if incompatible
                        videoCodec: e.target.value === 'webm' ? 'vp9' : 'h264',
                      })
                    }
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="mp4">MP4 (.mp4) — Paling Kompatibel</option>
                    <option value="mov">MOV (.mov) — Apple QuickTime Master</option>
                    <option value="webm">WebM (.webm) — Web Streaming & Alpha</option>
                  </select>
                </div>

                {/* Video Codec */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Video Codec
                  </label>
                  <select
                    value={settings.videoCodec}
                    onChange={(e) =>
                      setSettings({ ...settings, videoCodec: e.target.value as VideoCodec })
                    }
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {settings.format === 'webm' ? (
                      <>
                        <option value="vp9">VP9 (Google Open Video)</option>
                        <option value="av1">AV1 (Next-Gen Open)</option>
                      </>
                    ) : (
                      <>
                        <option value="h264">H.264 / AVC (Default Studio)</option>
                        <option value="h265">H.265 / HEVC (Kompresi 4K Efisien)</option>
                        <option value="av1">AV1 (AOMedia Ultra-Efficient)</option>
                        {settings.format === 'mov' && (
                          <option value="prores">Apple ProRes 422 / 4444</option>
                        )}
                      </>
                    )}
                  </select>
                </div>

                {/* Hardware Acceleration */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Akselerasi Perangkat Keras</span>
                    <span className="text-[10px] text-blue-400 font-mono">
                      {capabilities?.hardwareEncoders.nvenc
                        ? 'NVENC Terdeteksi'
                        : capabilities?.hardwareEncoders.qsv
                        ? 'QSV Terdeteksi'
                        : 'CPU Ready'}
                    </span>
                  </label>
                  <select
                    value={settings.hardwareAcceleration}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        hardwareAcceleration: e.target.value as any,
                      })
                    }
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="auto">Otomatis (GPU dengan fallback CPU)</option>
                    <option value="nvenc">NVIDIA NVENC</option>
                    <option value="qsv">Intel Quick Sync Video (QSV)</option>
                    <option value="amf">AMD AMF</option>
                    <option value="cpu">Software CPU Encoding (Stabil & Akurat)</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Resolution & Frame Rate */}
              <div className="grid grid-cols-3 gap-4">
                {/* Resolution Preset */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Resolusi Output</span>
                    <span className="text-[10px] text-slate-400">
                      Proyek: {projectWidth}×{projectHeight}
                    </span>
                  </label>
                  <select
                    value={`${settings.width}x${settings.height}`}
                    onChange={(e) => {
                      const [w, h] = e.target.value.split('x').map(Number);
                      setSettings({ ...settings, width: w, height: h });
                    }}
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="3840x2160">3840 × 2160 (4K Ultra HD)</option>
                    <option value="2560x1440">2560 × 1440 (2K QHD)</option>
                    <option value="1920x1080">1920 × 1080 (1080p Full HD)</option>
                    <option value="1280x720">1280 × 720 (720p HD)</option>
                    <option value="854x480">854 × 480 (480p SD)</option>
                    <option value="1080x1920">1080 × 1920 (9:16 Vertikal Reels)</option>
                    <option value="1080x1080">1080 × 1080 (1:1 Persegi)</option>
                  </select>
                </div>

                {/* Frame Rate */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Frame Rate (FPS)</span>
                    <span className="text-[10px] text-slate-400">Proyek: {projectFps} fps</span>
                  </label>
                  <select
                    value={settings.fps}
                    onChange={(e) => handleFpsChange(Number(e.target.value))}
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value={projectFps}>Sesuai Proyek ({projectFps} fps)</option>
                    <option value="23.976">23.976 fps (Cinematic Film)</option>
                    <option value="24">24 fps (Standard Film)</option>
                    <option value="25">25 fps (PAL Broadcast)</option>
                    <option value="29.97">29.97 fps (NTSC Broadcast)</option>
                    <option value="30">30 fps (Web / Video)</option>
                    <option value="50">50 fps (High Motion PAL)</option>
                    <option value="59.94">59.94 fps (High Motion NTSC)</option>
                    <option value="60">60 fps (Smooth Gaming / Web)</option>
                  </select>
                </div>

                {/* Quality Profile */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">
                    Tingkat Kualitas
                  </label>
                  <div className="grid grid-cols-5 gap-1">
                    {(['draft', 'standard', 'high', 'very-high', 'master'] as QualityPreset[]).map(
                      (q) => {
                        const isQActive = settings.qualityPreset === q;
                        return (
                          <button
                            key={q}
                            type="button"
                            onClick={() => handleQualityPresetChange(q)}
                            className={`py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider transition ${
                              isQActive
                                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                                : 'bg-[#181d28] text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {q === 'very-high' ? 'Ultra' : q}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* Bitrate & Rate Control */}
              <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Kontrol Bitrate & CRF</span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="bitrateMode"
                        checked={settings.bitrateMode === 'auto'}
                        onChange={() => setSettings({ ...settings, bitrateMode: 'auto' })}
                        className="accent-blue-500"
                      />
                      <span>Auto</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="bitrateMode"
                        checked={settings.bitrateMode === 'vbr'}
                        onChange={() => setSettings({ ...settings, bitrateMode: 'vbr' })}
                        className="accent-blue-500"
                      />
                      <span>VBR</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="bitrateMode"
                        checked={settings.bitrateMode === 'crf'}
                        onChange={() => setSettings({ ...settings, bitrateMode: 'crf' })}
                        className="accent-blue-500"
                      />
                      <span>CRF (Visual Lossless)</span>
                    </label>
                  </div>
                </div>

                {settings.bitrateMode === 'crf' ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Nilai CRF (Semakin rendah = kualitas semakin tinggi)</span>
                      <span className="font-mono font-bold text-blue-400">{settings.crf || 22}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="32"
                      value={settings.crf || 22}
                      onChange={(e) => setSettings({ ...settings, crf: Number(e.target.value) })}
                      className="w-full accent-blue-500"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Target Bitrate Video</span>
                      <span className="font-mono font-bold text-blue-400">
                        {settings.targetBitrateMbps || 12} Mbps
                      </span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="80"
                      value={settings.targetBitrateMbps || 12}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          targetBitrateMbps: Number(e.target.value),
                          maxBitrateMbps: Math.round(Number(e.target.value) * 1.3),
                        })
                      }
                      className="w-full accent-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Advanced Flags: Alpha Export & Proxy Rule */}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#141822] border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.exportAlpha}
                    onChange={(e) => setSettings({ ...settings, exportAlpha: e.target.checked })}
                    disabled={settings.format !== 'mov' && settings.format !== 'webm'}
                    className="mt-0.5 accent-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Ekspor Latar Belakang Transparan (Alpha)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Hanya didukung untuk container QuickTime MOV (ProRes 4444) atau WebM.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-[#141822] border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.useProxyMedia}
                    onChange={(e) => setSettings({ ...settings, useProxyMedia: e.target.checked })}
                    className="mt-0.5 accent-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Izinkan Render Menggunakan Media Proxy
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Gunakan proxy jika media resolusi penuh offline (kualitas output lebih rendah).
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO SETTINGS */}
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Audio Codec</label>
                  <select
                    value={settings.audioCodec}
                    onChange={(e) =>
                      setSettings({ ...settings, audioCodec: e.target.value as AudioCodec })
                    }
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="aac">AAC (Advanced Audio Coding — Universal)</option>
                    <option value="opus">Opus (High Fidelity Web Codec)</option>
                    <option value="pcm">PCM Linear Uncompressed (16/24-bit)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Sample Rate</label>
                  <select
                    value={settings.audioSampleRate}
                    onChange={(e) =>
                      setSettings({ ...settings, audioSampleRate: Number(e.target.value) as any })
                    }
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="48000">48 kHz (Standar Produksi Film & Video)</option>
                    <option value="44100">44.1 kHz (Standar CD Musik)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1.5">Audio Bitrate</label>
                  <select
                    value={settings.audioBitrateKbps}
                    onChange={(e) =>
                      setSettings({ ...settings, audioBitrateKbps: Number(e.target.value) as any })
                    }
                    className="w-full bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="320">320 kbps (Kualitas Master Tertinggi)</option>
                    <option value="256">256 kbps (Standar Broadcast)</option>
                    <option value="192">192 kbps (Standar Web)</option>
                    <option value="128">128 kbps (Efisiensi Bandwidth)</option>
                  </select>
                </div>
              </div>

              {/* Loudness Normalization (Requirement 23) */}
              <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <Volume2 size={16} className="text-blue-400" />
                  <span>Normalisasi Loudness (EBU R128 / ITU-R BS.1770)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Secara otomatis mengukur dan menyesuaikan volume master terintegrasi agar tidak pecah dan
                  memenuhi standar distribusi platform.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, audioNormalization: 'none' })}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      settings.audioNormalization === 'none'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <p className="font-semibold">Tanpa Normalisasi</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Mempertahankan level asli mixer</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, audioNormalization: 'lufs_14' })}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      settings.audioNormalization === 'lufs_14'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <p className="font-semibold">-14 LUFS</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Target YouTube, Spotify & Web</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, audioNormalization: 'lufs_16' })}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      settings.audioNormalization === 'lufs_16'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <p className="font-semibold">-16 LUFS</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Target Apple Podcasts / AES</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, audioNormalization: 'lufs_23' })}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      settings.audioNormalization === 'lufs_23'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <p className="font-semibold">-23 LUFS</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Standar TV & Siaran Broadcast</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBTITLES & RANGE */}
          {activeTab === 'subtitle' && (
            <div className="space-y-6">
              {/* Range Export (Requirement 33, 34) */}
              <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-200 block">Jangkauan Render (Range)</span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, rangeType: 'entire' })}
                    className={`p-3 rounded-lg border text-left transition ${
                      settings.rangeType === 'entire'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="font-semibold">Seluruh Timeline</p>
                    <p className="text-[10px] opacity-80 mt-0.5">
                      Durasi penuh: {currentProject.timeline?.duration || 0}s
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, rangeType: 'in_out' })}
                    className={`p-3 rounded-lg border text-left transition ${
                      settings.rangeType === 'in_out'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="font-semibold">Rentang In → Out</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Hanya segmen titik In sampai Out</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, rangeType: 'selected_clip' })}
                    className={`p-3 rounded-lg border text-left transition ${
                      settings.rangeType === 'selected_clip'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="font-semibold">Klip Terpilih Saja</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Ekspor satu klip aktif secara mandiri</p>
                  </button>
                </div>
              </div>

              {/* Subtitle Export (Requirement 30, 31) */}
              <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-3">
                <span className="font-semibold text-slate-200 block">
                  Format Ekspor Teks Dialog / Subtitle
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, subtitleMode: 'none' })}
                    className={`p-3 rounded-lg border text-left transition ${
                      settings.subtitleMode === 'none'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="font-semibold">Tanpa Subtitle</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Video bersih tanpa teks dialog</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, subtitleMode: 'burn_in' })}
                    className={`p-3 rounded-lg border text-left transition ${
                      settings.subtitleMode === 'burn_in'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="font-semibold">Burn-In (Tertempel di Video)</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Teks menyatu permanen pada pixel video</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, subtitleMode: 'separate_srt' })}
                    className={`p-3 rounded-lg border text-left transition ${
                      settings.subtitleMode === 'separate_srt'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-[#181d28] border-slate-800 text-slate-400'
                    }`}
                  >
                    <p className="font-semibold">File Terpisah (.srt / .vtt)</p>
                    <p className="text-[10px] opacity-80 mt-0.5">Hasilkan berkas subtitle berdampingan</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREFLIGHT AUDIT */}
          {activeTab === 'preflight' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">Status Kesiapan Render:</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                        preflight?.canProceed
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {preflight?.canProceed ? 'SIAP DIRENDER' : 'PERHATIAN KRITIS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Estimasi Frame: {preflight?.totalEstimatedFrames} frame • Durasi:{' '}
                    {preflight?.totalDurationSec.toFixed(1)} detik
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase">Kebutuhan Ruang Disk</span>
                  <p className="font-mono font-bold text-slate-200 mt-0.5">
                    ~{((preflight?.diskSpace.requiredBytes || 0) / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </div>

              {/* Preflight Issues List */}
              <div className="space-y-2">
                {preflight?.issues.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2.5">
                    <CheckCircle2 size={18} />
                    <span>Semua validasi preflight berhasil. Proyek siap dirender tanpa kendala!</span>
                  </div>
                ) : (
                  preflight?.issues.map((iss, i) => (
                    <div
                      key={i}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                        iss.severity === 'error'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          : iss.severity === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs">{iss.title}</p>
                        <p className="text-[11px] opacity-90 mt-0.5">{iss.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Output Destination Selector (Requirement 52, 53) */}
          <div className="p-4 rounded-xl bg-[#141822] border border-slate-800 space-y-2">
            <label className="block text-slate-300 font-semibold flex items-center justify-between">
              <span>Lokasi & Nama File Output</span>
              <span className="text-[10px] text-slate-400">
                Pembersih otomatis karakter ilegal Windows (\ / : * ? " &lt; &gt; |)
              </span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={settings.outputPath}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    outputPath: RenderSettingsManager.sanitizeFilename(e.target.value),
                  })
                }
                placeholder="/exports/Final_Video.mp4"
                className="flex-1 bg-[#181d28] border border-slate-700/80 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Info size={14} className="text-blue-400" />
            <span>
              Estimasi Ukuran: ~
              {((preflight?.diskSpace.requiredBytes || 0) / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Batal
            </button>

            <button
              onClick={handleAddToQueue}
              disabled={isExporting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold border border-blue-500/30 transition flex items-center gap-1.5"
            >
              <ListPlus size={15} />
              <span>Tambah ke Antrean</span>
            </button>

            <button
              onClick={handleExportNow}
              disabled={isExporting || (preflight !== null && !preflight.canProceed)}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={15} className="fill-white" />
              <span>{isExporting ? 'Menyiapkan...' : 'Ekspor Sekarang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
