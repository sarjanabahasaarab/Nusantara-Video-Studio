/**
 * Nusantara Video Studio - System Diagnostics & Logs Modal
 * Phase 10: Production Readiness & Diagnostics (Requirement 12)
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import { diagnosticsService, ComprehensiveDiagnosticReport } from '../../services/diagnosticsService';
import {
  Activity,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  HardDrive,
  FileText,
  ShieldCheck,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export const DiagnosticsModal: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const notify = useUIStore((s) => s.notify);

  const isOpen = activeDialog === 'diagnostics';

  const [report, setReport] = useState<ComprehensiveDiagnosticReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'ffmpeg' | 'storage' | 'logs'>('system');

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await diagnosticsService.getComprehensiveReport();
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const handleExport = async () => {
    await diagnosticsService.exportDiagnosticsJson();
    notify('Laporan Diagnostik Diekspor', 'File JSON diagnostik yang disanitasi telah diunduh.', 'success');
  };

  const handleClearCache = async () => {
    const ok = await diagnosticsService.clearCache();
    if (ok) {
      notify('Cache Dibersihkan', 'Cache browser dan aset sementara berhasil dihapus.', 'info');
      refreshData();
    }
  };

  const handleClearLogs = () => {
    diagnosticsService.clearLogs();
    notify('Log Dibersihkan', 'Daftar riwayat diagnostik sementara telah dikosongkan.', 'info');
    refreshData();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title="Diagnostik Sistem & Log Studio"
      subtitle="Informasi teknis dan pemantauan kesehatan perangkat keras"
      maxWidth="max-w-3xl"
    >
      <div className="flex flex-col gap-4 select-none min-h-[460px]">
        {/* Navigation Tabs & Actions */}
        <div className="flex items-center justify-between border-b border-[#212634] pb-2">
          <div className="flex gap-2">
            {[
              { id: 'system', label: 'Sistem & Runtime', icon: Cpu },
              { id: 'ffmpeg', label: 'FFmpeg & Encoder', icon: Terminal },
              { id: 'storage', label: 'Penyimpanan & Cache', icon: HardDrive },
              { id: 'logs', label: 'Log & Riwayat Error', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161a25]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              disabled={loading}
              className="p-1.5 rounded bg-[#181d29] hover:bg-[#22293a] text-slate-300 text-xs flex items-center gap-1"
              title="Perbarui data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laporan</span>
            </button>
          </div>
        </div>

        {/* Tab 1: System */}
        {activeTab === 'system' && report && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#12151e] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
              <span className="font-semibold text-white">Identitas Aplikasi</span>
              <div className="flex justify-between border-b border-[#1d2332] pb-1">
                <span className="text-slate-400">Nama:</span>
                <span className="text-slate-200 font-medium">{report.application.name}</span>
              </div>
              <div className="flex justify-between border-b border-[#1d2332] pb-1">
                <span className="text-slate-400">Versi:</span>
                <span className="text-blue-400 font-mono font-bold">{report.application.version}</span>
              </div>
              <div className="flex justify-between border-b border-[#1d2332] pb-1">
                <span className="text-slate-400">Build Type:</span>
                <span className="text-emerald-400 font-medium">{report.application.buildType}</span>
              </div>
              <div className="flex justify-between border-b border-[#1d2332] pb-1">
                <span className="text-slate-400">Target OS:</span>
                <span className="text-slate-200">{report.application.targetPlatform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Schema Version:</span>
                <span className="text-purple-400 font-mono">v{report.application.schemaVersion}</span>
              </div>
            </div>

            <div className="bg-[#12151e] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
              <span className="font-semibold text-white">Perangkat &amp; Platform</span>
              <div className="flex justify-between border-b border-[#1d2332] pb-1">
                <span className="text-slate-400">CPU Cores:</span>
                <span className="text-slate-200 font-mono">{report.system.cpuCores} Threads</span>
              </div>
              <div className="flex justify-between border-b border-[#1d2332] pb-1">
                <span className="text-slate-400">Sistem Operasi:</span>
                <span className="text-slate-200">{report.system.platform}</span>
              </div>
              <div className="flex justify-between border-b border-[#1d2332] pb-1">
                <span className="text-slate-400">Waktu Aktif (Uptime):</span>
                <span className="text-slate-200 font-mono">{report.application.uptimeSeconds} detik</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Jaringan:</span>
                <span className={report.system.online ? 'text-emerald-400' : 'text-amber-400'}>
                  {report.system.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="col-span-2 bg-[#12151e] border border-[#212738] p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">Privasi &amp; Redaksi Informasi Sensitif</div>
                  <div className="text-[11px] text-slate-400">
                    Semua laporan diagnostik yang diekspor otomatis menghapus token otentikasi, API keys, dan nama pengguna direktori lokal.
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                Aman untuk Dilaporkan
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: FFmpeg */}
        {activeTab === 'ffmpeg' && report && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="bg-[#12151e] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">Subsistem FFmpeg &amp; FFprobe</span>
                {report.ffmpeg.available ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Berfungsi Penuh
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Tidak Terdeteksi
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>Versi FFmpeg: <span className="font-mono text-blue-400">{report.ffmpeg.version || 'Tersedia'}</span></div>
                <div>Versi FFprobe: <span className="font-mono text-emerald-400">{report.ffmpeg.probeVersion || 'Tersedia'}</span></div>
                <div className="col-span-2 text-slate-400">
                  Konfigurasi Path: <span className="font-mono text-slate-300">{report.ffmpeg.configuredPath}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#12151e] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
                <span className="font-semibold text-white">Codec Video Terverifikasi</span>
                <div className="flex flex-wrap gap-1.5">
                  {report.ffmpeg.detectedCodecs.video.map((v, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#1c2230] text-slate-200 font-mono text-[10px]">
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#12151e] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
                <span className="font-semibold text-white">Akselerasi Kartu Grafis (Hardware)</span>
                <div className="flex flex-col gap-1 text-[11px]">
                  {Object.entries(report.ffmpeg.detectedCodecs.hardwareEncoders).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center border-b border-[#1c2230] pb-0.5">
                      <span className="font-mono uppercase text-slate-300">{k}</span>
                      <span className={v ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                        {v ? 'Aktif' : 'Tidak Ada'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Storage */}
        {activeTab === 'storage' && report && (
          <div className="flex flex-col gap-3 text-xs">
            <div className="bg-[#12151e] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
              <span className="font-semibold text-white">Penyimpanan &amp; Alokasi Memori</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="border border-[#1d2332] p-2.5 rounded-lg bg-[#151924]">
                  <div className="text-slate-400">Direktori Proyek:</div>
                  <div className="font-mono text-white truncate mt-0.5">{report.storage.projectsDirectory}</div>
                </div>
                <div className="border border-[#1d2332] p-2.5 rounded-lg bg-[#151924]">
                  <div className="text-slate-400">Direktori Cache:</div>
                  <div className="font-mono text-white truncate mt-0.5">{report.storage.cacheDirectory}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="text-slate-300 font-medium">Pembersihan Cache Studio</div>
                  <div className="text-[10px] text-slate-400">Hapus cache waveform dan visualisasi sementara untuk menghemat ruang disk.</div>
                </div>
                <button
                  onClick={handleClearCache}
                  className="px-3 py-1.5 bg-[#232a3a] hover:bg-[#2d374d] text-slate-200 rounded text-xs font-medium flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Bersihkan Cache
                </button>
              </div>
            </div>

            <div className="bg-[#12151e] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
              <span className="font-semibold text-white">Statistik Proyek yang Sedang Dibuka</span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-[#151924] p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Total Media</div>
                  <div className="text-base font-bold text-white font-mono">{report.projectState.mediaCount}</div>
                </div>
                <div className="bg-[#151924] p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Track Aktif</div>
                  <div className="text-base font-bold text-blue-400 font-mono">{report.projectState.tracksCount}</div>
                </div>
                <div className="bg-[#151924] p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Total Klip</div>
                  <div className="text-base font-bold text-emerald-400 font-mono">{report.projectState.clipsCount}</div>
                </div>
                <div className="bg-[#151924] p-2 rounded-lg">
                  <div className="text-slate-400 text-[10px]">Marker</div>
                  <div className="text-base font-bold text-purple-400 font-mono">{report.projectState.markersCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Logs */}
        {activeTab === 'logs' && report && (
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Riwayat Diagnostik Sesi ({report.recentLogs.length} entri):</span>
              <button
                onClick={handleClearLogs}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Kosongkan Log
              </button>
            </div>

            <div className="flex-1 max-h-[300px] overflow-y-auto bg-[#0d0f15] border border-[#1e2330] rounded-xl p-2.5 font-mono text-[11px] space-y-1.5 select-text">
              {report.recentLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-6">Tidak ada log error atau peringatan pada sesi ini.</div>
              ) : (
                report.recentLogs.map((lg, i) => (
                  <div key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 text-[10px] shrink-0">
                      {new Date(lg.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-1 rounded text-[9px] uppercase font-bold shrink-0 ${
                        lg.level === 'error'
                          ? 'bg-rose-500/20 text-rose-400'
                          : lg.level === 'warn'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {lg.level}
                    </span>
                    <span className="text-slate-300 break-all">{lg.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#212634] pt-3 mt-auto text-xs text-slate-400">
          <span>Telemetri otomatis &amp; crash upload: <strong className="text-slate-300">Dinonaktifkan (Privasi Lokal)</strong></span>
          <button
            onClick={closeDialog}
            className="px-4 py-1.5 bg-[#1e2433] hover:bg-[#283044] text-slate-200 rounded font-medium"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
};
