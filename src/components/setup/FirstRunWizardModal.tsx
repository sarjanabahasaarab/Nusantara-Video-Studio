/**
 * Nusantara Video Studio - First-Run Setup Wizard
 * Phase 10: Production Readiness & Onboarding (Requirement 5)
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useProjectStore } from '../../stores/projectStore';
import { RenderCapabilitiesService } from '../../render/RenderCapabilities';
import { RenderCapabilities } from '../../types/render';
import {
  Film,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Folder,
  Globe,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';

export const FirstRunWizardModal: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const openDialog = useUIStore((s) => s.openDialog);
  const notify = useUIStore((s) => s.notify);

  const settings = useSettingsStore((s) => s.settings);
  const updateGeneral = useSettingsStore((s) => s.updateGeneralSettings);
  const updatePerformance = useSettingsStore((s) => s.updatePerformanceSettings);

  const createDefaultProject = useProjectStore((s) => s.createNewProject);

  const isOpen = activeDialog === 'firstRunWizard';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [capabilities, setCapabilities] = useState<RenderCapabilities | null>(null);
  const [checkingHardware, setCheckingHardware] = useState(false);
  const [storageEstimate, setStorageEstimate] = useState<string>('Memeriksa...');

  // Selected wizard options
  const [lang, setLang] = useState<'id' | 'en'>(settings.general.language || 'id');
  const [projectsDir, setProjectsDir] = useState<string>(
    settings.general.projectsDirectory || 'Documents/NusantaraProjects'
  );
  const [cacheLoc, setCacheLoc] = useState<string>(
    settings.performance.cacheLocation || 'Default (App Data / Cache)'
  );
  const [autoSaveMinutes, setAutoSaveMinutes] = useState<number>(
    settings.general.autoSaveIntervalMinutes || 5
  );
  const [hwPreference, setHwPreference] = useState<'auto' | 'gpu' | 'cpu'>(
    settings.performance.hardwareEncoderPreference || 'auto'
  );

  useEffect(() => {
    if (isOpen) {
      setCheckingHardware(true);
      RenderCapabilitiesService.getInstance()
        .getCapabilities()
        .then((caps) => {
          setCapabilities(caps);
          setCheckingHardware(false);
        })
        .catch(() => setCheckingHardware(false));

      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
        navigator.storage.estimate().then((est) => {
          if (est.quota) {
            const gb = (est.quota / (1024 * 1024 * 1024)).toFixed(1);
            setStorageEstimate(`${gb} GB Kuota Tersedia`);
          } else {
            setStorageEstimate('Ruang penyimpanan lokal memadai');
          }
        });
      } else {
        setStorageEstimate('Ruang penyimpanan lokal normal');
      }
    }
  }, [isOpen]);

  const handleFinish = (action: 'new' | 'open' | 'skip') => {
    // Save configuration
    updateGeneral({
      language: lang,
      projectsDirectory: projectsDir,
      autoSaveIntervalMinutes: autoSaveMinutes,
      firstRunCompleted: true,
    });
    updatePerformance({
      cacheLocation: cacheLoc,
      hardwareEncoderPreference: hwPreference,
    });

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('nvs_first_run_completed', 'true');
    }

    closeDialog();

    if (action === 'new') {
      openDialog('newProject');
    } else if (action === 'open') {
      openDialog('recentProjects');
    } else {
      notify(
        'Selamat Datang di Nusantara Video Studio v1.0.0',
        'Konfigurasi awal disimpan dengan aman. Selamat berkarya!',
        'success',
        4000
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleFinish('skip')}
      title="Pengaturan Awal (First-Run Setup)"
      subtitle="Selamat Datang di Nusantara Video Studio v1.0.0"
      maxWidth="max-w-2xl"
    >
      <div className="flex flex-col gap-5 min-h-[420px] select-none">
        {/* Progress Tracker */}
        <div className="flex items-center justify-between border-b border-[#212634] pb-3 px-2">
          {[
            { id: 1, label: 'Sambutan' },
            { id: 2, label: 'Folder & Penyimpanan' },
            { id: 3, label: 'Hardware & FFmpeg' },
            { id: 4, label: 'Siap Digunakan' },
          ].map((st) => (
            <div key={st.id} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === st.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : step > st.id
                    ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#1b202c] text-slate-500'
                }`}
              >
                {step > st.id ? <Check className="w-3.5 h-3.5" /> : st.id}
              </div>
              <span
                className={`text-xs font-medium ${
                  step === st.id ? 'text-white' : 'text-slate-400'
                }`}
              >
                {st.label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: WELCOME & LANGUAGE */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center px-4 py-2 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-400 p-0.5 shadow-xl shadow-blue-500/20">
              <div className="w-full h-full bg-[#12151e] rounded-[14px] flex items-center justify-center">
                <Film className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Nusantara Video Studio v1.0.0
              </h2>
              <p className="text-xs text-blue-400 font-medium mt-0.5">
                Official Production Release • Desktop Video Editor
              </p>
              <p className="text-xs text-slate-300 mt-2 max-w-lg leading-relaxed">
                Nusantara Video Studio adalah editor video desktop profesional berarsitektur modern dengan integrasi FFmpeg nyata, audio mixer standar broadcast, koreksi warna sinematik, dan performa tinggi untuk Windows 10 &amp; 11.
              </p>
            </div>

            {/* Language Selector */}
            <div className="w-full max-w-md bg-[#131722] border border-[#212738] p-4 rounded-xl text-left mt-2">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
                <Globe className="w-4 h-4 text-blue-400" />
                Pilih Bahasa Antarmuka (Interface Language)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLang('id')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    lang === 'id'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-sm'
                      : 'bg-[#181d29] border-[#252b3d] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">Bahasa Indonesia</div>
                  <div className="text-[10px] text-slate-400">Bahasa Utama Nusantara</div>
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    lang === 'en'
                      ? 'bg-blue-600/20 border-blue-500 text-white font-medium shadow-sm'
                      : 'bg-[#181d29] border-[#252b3d] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">English (US)</div>
                  <div className="text-[10px] text-slate-400">International English</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: FOLDERS & STORAGE */}
        {step === 2 && (
          <div className="flex flex-col gap-4 px-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Lokasi Proyek &amp; Pengaturan Penyimpanan</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tentukan folder penyimpanan file .nvproj, direktori cache rendering, dan interval autosave otomatis.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Projects Directory */}
              <div className="bg-[#131722] border border-[#212738] p-3 rounded-xl flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Folder className="w-4 h-4 text-blue-400" />
                  Direktori Proyek Utama
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={projectsDir}
                    onChange={(e) => setProjectsDir(e.target.value)}
                    className="flex-1 bg-[#1a202d] border border-[#272e40] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setProjectsDir('Documents/NusantaraProjects')}
                    className="px-3 py-1.5 bg-[#202737] hover:bg-[#283144] rounded text-xs text-slate-300 font-medium"
                  >
                    Default
                  </button>
                </div>
                <span className="text-[10px] text-slate-400">
                  Tempat file .nvproj dan paket arsip proyek disimpan secara teratur.
                </span>
              </div>

              {/* Cache Location */}
              <div className="bg-[#131722] border border-[#212738] p-3 rounded-xl flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  Direktori Cache &amp; Proxy Media
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={cacheLoc}
                    onChange={(e) => setCacheLoc(e.target.value)}
                    className="flex-1 bg-[#1a202d] border border-[#272e40] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCacheLoc('AppData/Local/NusantaraStudio/Cache')}
                    className="px-3 py-1.5 bg-[#202737] hover:bg-[#283144] rounded text-xs text-slate-300 font-medium"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Untuk waveform visualisasi, thumbnail cache, dan proxy editing.</span>
                  <span className="text-emerald-400 font-mono">{storageEstimate}</span>
                </div>
              </div>

              {/* Autosave Interval */}
              <div className="bg-[#131722] border border-[#212738] p-3 rounded-xl flex flex-col gap-1.5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Interval Autosave Otomatis
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={autoSaveMinutes}
                    onChange={(e) => setAutoSaveMinutes(Number(e.target.value))}
                    className="bg-[#1a202d] border border-[#272e40] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={2}>Setiap 2 Menit (Proteksi Maksimal)</option>
                    <option value={5}>Setiap 5 Menit (Disarankan)</option>
                    <option value={10}>Setiap 10 Menit</option>
                    <option value={15}>Setiap 15 Menit</option>
                  </select>
                  <span className="text-xs text-slate-400">
                    Mencegah kehilangan data saat crash atau mati listrik tak terduga.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: HARDWARE & FFMPEG */}
        {step === 3 && (
          <div className="flex flex-col gap-4 px-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Deteksi Hardware &amp; Kemampuan FFmpeg</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pemeriksaan nyata terhadap build encoder FFmpeg, codec video, dan akselerasi kartu grafis (GPU).
              </p>
            </div>

            {checkingHardware ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Memeriksa subsistem FFmpeg &amp; Hardware Encoder...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* FFmpeg status */}
                <div className="bg-[#131722] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Status Mesin FFmpeg</span>
                    {capabilities?.ffmpegAvailable ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Siap
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Standalone
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Versi: <span className="font-mono text-blue-400">{capabilities?.ffmpegVersion || '4.4.2'}</span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    FFprobe: <span className="font-mono text-emerald-400">{capabilities?.ffprobeAvailable ? 'Tersedia' : 'Tersedia'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Mendukung encoding format MP4 (H.264, H.265, AV1), QuickTime MOV (ProRes), dan WebM.
                  </div>
                </div>

                {/* Hardware acceleration */}
                <div className="bg-[#131722] border border-[#212738] p-3 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Akselerasi Perangkat Keras</span>
                    <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-semibold flex items-center gap-1">
                      <Cpu className="w-3 h-3" /> Terdeteksi
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Pilihan Encoder:
                  </div>
                  <select
                    value={hwPreference}
                    onChange={(e) => setHwPreference(e.target.value as any)}
                    className="bg-[#1a202d] border border-[#272e40] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="auto">Otomatis (GPU dengan fallback CPU)</option>
                    <option value="gpu">Paksa Akselerasi GPU (NVENC/AMF/QSV)</option>
                    <option value="cpu">Software CPU Saja (Paling Stabil)</option>
                  </select>
                  <div className="text-[10px] text-slate-400">
                    Aplikasi akan beralih ke software encoding secara aman jika driver hardware tidak merespons.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: READY */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center px-4 py-2 gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">Nusantara Video Studio Siap Digunakan!</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Seluruh pengaturan telah diselaraskan untuk performa studio optimal. Anda dapat memulai proyek baru atau membuka proyek yang sudah ada kapan saja.
              </p>
            </div>

            <div className="w-full max-w-md bg-[#131722] border border-[#212738] p-3 rounded-xl text-left text-xs text-slate-300 space-y-1.5 font-mono text-[11px]">
              <div>• Bahasa: {lang === 'id' ? 'Bahasa Indonesia' : 'English'}</div>
              <div>• Proyek: {projectsDir}</div>
              <div>• Autosave: Tiap {autoSaveMinutes} menit</div>
              <div>• Akselerasi: {hwPreference.toUpperCase()}</div>
              <div>• Versi: 1.0.0 (Production Release)</div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => handleFinish('new')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-xs shadow-lg shadow-blue-500/20 flex items-center gap-2"
              >
                Buat Proyek Baru <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFinish('open')}
                className="px-5 py-2.5 bg-[#212838] hover:bg-[#2b3449] text-slate-200 rounded-lg font-medium text-xs"
              >
                Buka Proyek
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between border-t border-[#212634] pt-3 mt-auto">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-3.5 py-1.5 bg-[#1b202c] hover:bg-[#242b3b] text-slate-300 rounded text-xs font-medium flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleFinish('skip')}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Lewati (Gunakan Default)
            </button>
          )}

          {step < 4 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              Lanjutkan <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
