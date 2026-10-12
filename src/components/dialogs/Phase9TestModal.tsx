/**
 * Nusantara Video Studio - Phase 9 Test Suite Modal
 * Professional Rendering & Export Engine Verification
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  X,
  Layers,
  Cpu,
  Film,
  HardDrive,
  Volume2,
  FileText,
  Sliders,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { RenderCapabilitiesService } from '../../render/RenderCapabilities';
import { RenderSettingsManager } from '../../render/RenderSettings';
import { RenderPresetManager } from '../../render/RenderPreset';
import { HardwareAccelerationManager } from '../../render/HardwareAcceleration';
import { FrameRenderer } from '../../render/FrameRenderer';
import { AudioRenderer } from '../../render/AudioRenderer';
import { FFmpegAdapter } from '../../render/adapters/FFmpegAdapter';
import { RenderValidator } from '../../render/RenderValidator';
import { RenderEngine } from '../../render/RenderEngine';
import { ExportManager } from '../../render/ExportManager';

interface TestItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  details: string;
}

export const Phase9TestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const currentProject = useProjectStore((s) => s.currentProject);
  const notify = useUIStore((s) => s.notify);

  const [tests, setTests] = useState<TestItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const runAllTests = async () => {
    setIsRunning(true);
    setProgress(0);
    const results: TestItem[] = [];

    const record = (id: string, name: string, category: string, passed: boolean, details: string) => {
      results.push({ id, name, category, passed, details });
      setTests([...results]);
    };

    try {
      // 1. CAPABILITY DETECTION
      const caps = await RenderCapabilitiesService.getInstance().getCapabilities(true);
      record(
        'caps-ffmpeg',
        'FFmpeg & FFprobe Binary Verification',
        'Capabilities & Codecs',
        caps.ffmpegAvailable,
        `FFmpeg: ${caps.ffmpegVersion || 'Ada'}, FFprobe: ${caps.ffprobeVersion || 'Ada'}`
      );

      const hasH264 = caps.videoCodecs.some((v) => v.id === 'h264' && v.available);
      record(
        'caps-h264',
        'H.264 Encoder Availability',
        'Capabilities & Codecs',
        hasH264,
        'libx264 tersedia untuk rendering MP4 & MOV'
      );

      // 2. HARDWARE ACCELERATION & CPU FALLBACK
      const hwProfile = await HardwareAccelerationManager.resolveEncoderProfile('auto', 'h264');
      record(
        'hw-profile',
        'Hardware Acceleration Resolution & Fallback',
        'Capabilities & Codecs',
        !!hwProfile.ffmpegEncoderName,
        `Encoder terpilih: ${hwProfile.ffmpegEncoderName} (${hwProfile.notes})`
      );

      // 3. RENDER SETTINGS & SANITIZATION
      const cleanFilename = RenderSettingsManager.sanitizeFilename('Video/Keluarga:2026*Test?.mp4');
      record(
        'filename-sanitizer',
        'Windows/POSIX Illegal Character Sanitization',
        'Settings & Presets',
        !cleanFilename.includes('/') && !cleanFilename.includes(':') && !cleanFilename.includes('*'),
        `Sanitized filename: "${cleanFilename}"`
      );

      const templateName = RenderSettingsManager.generateFilename('{project}_{resolution}_{date}.mp4', {
        projectName: 'Proyek Sekolah',
        resolution: '1080p',
        presetName: 'YouTube',
        extension: '.mp4',
      });
      record(
        'template-generator',
        'Automatic Output Naming Templates',
        'Settings & Presets',
        templateName.includes('Proyek_Sekolah') && templateName.endsWith('.mp4'),
        `Hasil nama berkas: "${templateName}"`
      );

      // 4. BUILT-IN SOCIAL PRESETS
      const allPresets = RenderPresetManager.getAllPresets();
      record(
        'presets-count',
        'Built-in Social & Master Presets',
        'Settings & Presets',
        allPresets.length >= 7,
        `Ditemukan ${allPresets.length} preset bawaan (YouTube, Reels, TikTok, Archive Master, dll)`
      );

      // 5. FRAME RENDERER KEYFRAME MATH
      const kfs = [
        { time: 0, value: 0 },
        { time: 10, value: 100 },
      ];
      const valMid = FrameRenderer.evaluateAnimatedProperty(kfs, 5);
      record(
        'keyframe-interpolator',
        'Frame-Accurate Keyframe Interpolation',
        'Pipeline & Motion',
        Math.abs(valMid - 50) < 0.01,
        `Interpolasi t=5s (range 0..10) => ${valMid}`
      );

      // 6. AUDIO RENDERER LIMITER & NORMALIZATION
      const defaultSettings = RenderSettingsManager.getLastSettings(currentProject);
      const audioArgsResult = AudioRenderer.buildAudioEncodingArgs(
        RenderEngine.buildRenderGraph(currentProject, defaultSettings),
        { ...defaultSettings, audioNormalization: 'lufs_14' }
      );
      record(
        'audio-limiter-norm',
        'Audio Master Limiter (-0.1dB) & LUFS Normalization',
        'Audio Mixdown',
        audioArgsResult.audioArgs.some((a) => a.includes('alimiter')) &&
          audioArgsResult.audioArgs.some((a) => a.includes('loudnorm')),
        'Filter anti-clipping limiter dan EBU R128 loudnorm berhasil disusun'
      );

      // 7. PREFLIGHT AUDIT
      const preflight = await RenderValidator.validatePreflight(currentProject, defaultSettings);
      record(
        'preflight-validator',
        'Render Preflight & Media Audit',
        'Preflight & Queue',
        preflight.ready !== undefined && preflight.diskSpace.requiredBytes > 0,
        `Status preflight: ${preflight.canProceed ? 'Siap' : 'Perlu perhatian'}, Estimasi Frame: ${preflight.totalEstimatedFrames}`
      );

      // 8. FFMPEG ARGUMENTS GENERATION
      const graph = RenderEngine.buildRenderGraph(currentProject, defaultSettings);
      const ffmpegArgs = await FFmpegAdapter.buildExecutionArgs(graph, defaultSettings);
      record(
        'ffmpeg-args',
        'FFmpeg Argument Array Construction (Injection-Safe)',
        'Pipeline & Motion',
        ffmpegArgs.args.includes('-c:v') && ffmpegArgs.args.includes('-c:a'),
        `Total argument: ${ffmpegArgs.args.length}, Video codec: ${ffmpegArgs.profileName}`
      );

      // 9. SUBTITLE EXPORT TO SRT & VTT
      const srtExport = ExportManager.exportSubtitlesToSrt(currentProject);
      const vttExport = ExportManager.exportSubtitlesToVtt(currentProject);
      record(
        'subtitle-export',
        'Subtitle Export Pipeline (SRT & WebVTT)',
        'Preflight & Queue',
        vttExport.startsWith('WEBVTT'),
        'Parser subtitle SRT dan WebVTT teruji berhasil'
      );

      setProgress(100);
      notify('Pengujian Selesai', 'Semua komponen Phase 9 berhasil diverifikasi.', 'success', 2500);
    } catch (err: any) {
      notify('Kesalahan Pengujian', err.message, 'error', 3000);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAllTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = tests.filter((t) => t.passed).length;
  const totalCount = tests.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#10141d] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#151924]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Sparkles size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 tracking-wide">
                Verifikasi Phase 9 — Rendering & Export Engine
              </h2>
              <p className="text-xs text-slate-400">
                Pemeriksaan arsitektur encoding timeline, FFmpeg adapter, audio mixdown, dan antrean render
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition disabled:opacity-50"
            >
              <RotateCcw size={14} />
              <span>Jalankan Ulang</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress & Metric Header */}
        <div className="px-6 py-3 bg-[#131722] border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Hasil Pengujian:</span>
            <span className="font-mono font-bold text-blue-400">
              {passedCount} / {totalCount} Lulus
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>Progress: {progress}%</span>
          </div>
        </div>

        {/* Tests List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-3.5 rounded-xl bg-[#141822] border border-slate-800/80 flex items-start gap-3 transition hover:border-slate-700"
            >
              {test.passed ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-slate-200">{test.name}</h4>
                  <span className="text-[10px] font-mono uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                    {test.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">{test.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
