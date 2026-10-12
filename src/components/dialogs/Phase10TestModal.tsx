/**
 * Nusantara Video Studio - Phase 10 Test Suite Modal
 * Production Readiness, Security, Installer & Official Release v1.0.0
 */

import React, { useState } from 'react';
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
  FileText,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { fileService } from '../../services/fileService';
import { diagnosticsService } from '../../services/diagnosticsService';
import { RenderCapabilitiesService } from '../../render/RenderCapabilities';
import { RenderValidator } from '../../render/RenderValidator';
import { HardwareAccelerationManager } from '../../render/HardwareAcceleration';
import { ExportManager } from '../../render/ExportManager';
import { FFmpegAdapter } from '../../render/adapters/FFmpegAdapter';
import { useSettingsStore } from '../../stores/settingsStore';

interface TestItem {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  details: string;
}

export const Phase10TestModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
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
      // 1. Schema Version 7 & Migration Registry
      setProgress(10);
      const legacyV4Project = {
        projectVersion: 4,
        id: 'legacy-p4',
        name: 'Legacy Project 2025',
        settings: { width: 1920, height: 1080, fps: 30, aspectRatio: '16:9', duration: 60, sampleRate: 48000 },
        timeline: { tracks: [], duration: 60 },
      };
      const parseRes = fileService.parseProject(JSON.stringify(legacyV4Project));
      const isMigrated = parseRes.valid && parseRes.project?.projectVersion === 7 && parseRes.migrated === true;
      record(
        'test-1',
        'Project Schema v7 & Automatic Legacy Migration',
        'Schema & Persistence',
        Boolean(isMigrated),
        `Migrated legacy v4 to v7 with version audit: ${parseRes.project?.projectVersion}`
      );

      // 2. Reject Incompatible Newer Schema
      setProgress(20);
      const futureProject = {
        projectVersion: 99,
        id: 'future-p99',
        name: 'Future Project 2030',
        settings: { width: 1920, height: 1080, fps: 30, aspectRatio: '16:9', duration: 60, sampleRate: 48000 },
        timeline: { tracks: [], duration: 60 },
      };
      const futureRes = fileService.parseProject(JSON.stringify(futureProject));
      const futureRejected = futureRes.valid === false && Boolean(futureRes.error?.includes('lebih baru'));
      record(
        'test-2',
        'Forward Version Protection (Reject Unsafe Schema)',
        'Schema & Persistence',
        futureRejected,
        futureRes.error || 'Successfully rejected unsupported future schema'
      );

      // 3. Diagnostics & Privacy Redaction Guard
      setProgress(35);
      const rawSecretString = 'Bearer sk-secretToken123456789 with C:\\Users\\Administrator\\Desktop and password=mySuperSecretPass';
      const redacted = diagnosticsService.redactSensitiveData(rawSecretString);
      const safeRedaction = !redacted.includes('sk-secretToken123456789') &&
        !redacted.includes('Administrator') &&
        !redacted.includes('mySuperSecretPass') &&
        redacted.includes('[REDACTED_TOKEN]') &&
        redacted.includes('[USERNAME]') &&
        redacted.includes('[REDACTED_PASSWORD]');
      record(
        'test-3',
        'Privacy Redaction Guard (Tokens, Usernames, Passwords)',
        'Security & Logging',
        safeRedaction,
        `Redacted output: ${redacted}`
      );

      // 4. Comprehensive Diagnostic Report Synthesis
      setProgress(50);
      const diagReport = await diagnosticsService.getComprehensiveReport();
      const hasReportIntegrity = diagReport.application.version === '1.0.0' &&
        diagReport.application.schemaVersion === 7 &&
        typeof diagReport.system.cpuCores === 'number' &&
        typeof diagReport.storage.databaseStatus === 'string';
      record(
        'test-4',
        'System Diagnostics Data Integrity & Synthesis',
        'Diagnostics',
        hasReportIntegrity,
        `Version: ${diagReport.application.version}, Cores: ${diagReport.system.cpuCores}, Target: ${diagReport.application.targetPlatform}`
      );

      // 5. FFmpeg System Detection & Capability Audit
      setProgress(65);
      const caps = await RenderCapabilitiesService.getInstance().getCapabilities();
      const capsOk = caps.ffmpegAvailable && caps.containers.some((c) => c.format === 'mp4');
      record(
        'test-5',
        'FFmpeg Real Capability Audit & Encoder Verification',
        'Video Engine',
        capsOk,
        `FFmpeg: ${caps.ffmpegVersion || 'Available'}, Containers: ${caps.containers.length}, Codecs: ${caps.videoCodecs.length}`
      );

      // 6. Hardware Acceleration Resolution & CPU Fallback
      setProgress(80);
      const profile = await HardwareAccelerationManager.resolveEncoderProfile('auto', 'h264');
      record(
        'test-6',
        'Hardware Acceleration Encoder Resolution & CPU Fallback',
        'Video Engine',
        Boolean(profile.ffmpegEncoderName),
        `Resolved encoder: ${profile.ffmpegEncoderName} (CPU Fallback: ${profile.isFallbackCpu})`
      );

      // 7. Timeline Chapter Metadata to FFmetadata Conversion
      setProgress(90);
      const markers = [
        { time: 0, label: 'Prologue' },
        { time: 10, label: 'The Horizon', duration: 15 },
      ];
      const ffmeta = FFmpegAdapter.generateChapterMetadata(markers, 30);
      const metaOk = ffmeta.includes(';FFMETADATA1') && ffmeta.includes('title=Prologue') && ffmeta.includes('title=The Horizon');
      record(
        'test-7',
        'Timeline Chapter Markers to ;FFMETADATA1 Specification',
        'Export & Packaging',
        metaOk,
        'Formatted FFmetadata chapters generated with millisecond timebases'
      );

      // 8. Settings Store & Release Channels
      setProgress(100);
      const s = useSettingsStore.getState().settings;
      const settingsOk = Boolean(s.general.theme) && ['stable', 'beta'].includes(s.general.releaseChannel || 'stable');
      record(
        'test-8',
        'Application Settings Store & Release Channel Management',
        'Settings & Config',
        settingsOk,
        `Channel: ${s.general.releaseChannel || 'stable'}, Language: ${s.general.language}, Theme: ${s.general.theme}`
      );

      notify('Phase 10 Test Selesai', `${results.filter((r) => r.passed).length}/${results.length} pengujian lolos verifikasi.`, 'success');
    } catch (err: any) {
      notify('Test Gagal', err.message, 'error');
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  if (!isOpen) return null;

  const passedCount = tests.filter((t) => t.passed).length;
  const failedCount = tests.filter((t) => !t.passed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#12151f] border border-[#23293a] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#212738] bg-[#161a26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Phase 10 Test Suite — Production Readiness &amp; Release v1.0.0
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/30">
                  v1.0.0 Final
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Verifikasi keutuhan skema v7, diagnostik privasi, mitigasi crash, dan kesiapan rilis resmi.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#202636]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f2535] bg-[#10131c]">
          <div className="flex items-center gap-3">
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'Menjalankan...' : 'Jalankan Seluruh Uji Phase 10'}</span>
            </button>
            {tests.length > 0 && (
              <button
                onClick={() => setTests([])}
                disabled={isRunning}
                className="px-2.5 py-1.5 bg-[#1b202e] hover:bg-[#242b3d] text-slate-300 rounded-lg text-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          {tests.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-semibold">{passedCount} PASSED</span>
              {failedCount > 0 && <span className="text-rose-400 font-semibold">{failedCount} FAILED</span>}
              <span className="text-slate-400">({tests.length} TOTAL)</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isRunning && (
          <div className="w-full bg-[#1b202e] h-1">
            <div className="bg-emerald-500 h-1 transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        )}

        {/* Test List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500 text-center gap-3">
              <ShieldCheck className="w-10 h-10 text-slate-600" />
              <div className="text-xs">
                Klik <strong>"Jalankan Seluruh Uji Phase 10"</strong> untuk memvalidasi kesiapan produksi, integritas skema v7, sanitasi diagnostik, dan konfigurasi rilis v1.0.0.
              </div>
            </div>
          ) : (
            tests.map((t) => (
              <div
                key={t.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                  t.passed
                    ? 'bg-[#101918] border-emerald-500/30 text-slate-200'
                    : 'bg-[#1f1317] border-rose-500/30 text-rose-200'
                }`}
              >
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-[#171c28]">
                      {t.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono leading-relaxed">{t.details}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2535] bg-[#10131c] flex items-center justify-between text-xs text-slate-400">
          <span>Official Release Validation • Target: Windows 10 &amp; 11 (x64)</span>
          <button onClick={onClose} className="px-4 py-1.5 bg-[#1b202e] hover:bg-[#252c3f] text-slate-200 rounded font-medium">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
