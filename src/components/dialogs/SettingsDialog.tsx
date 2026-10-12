/**
 * Nusantara Video Studio - Application Settings Dialog
 * General, Project Defaults, Performance, and Keyboard settings
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAIStore } from '../../stores/aiStore';
import { RESOLUTION_PRESETS, FRAME_RATES, ASPECT_RATIOS } from '../../utils/presets';
import { AspectRatio, FrameRate, ResolutionPreset } from '../../types';
import { Sliders, Monitor, Cpu, Keyboard, Check, Tv } from 'lucide-react';
import { useWorkflowStore } from '../../stores/workflowStore';

type SettingsTab = 'general' | 'project' | 'performance' | 'keyboard' | 'ai' | 'proxy';

export const SettingsDialog: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const notify = useUIStore((s) => s.notify);

  const settings = useSettingsStore((s) => s.settings);
  const updateGeneral = useSettingsStore((s) => s.updateGeneralSettings);
  const updateProject = useSettingsStore((s) => s.updateProjectDefaults);
  const updatePerformance = useSettingsStore((s) => s.updatePerformanceSettings);

  const [currentTab, setCurrentTab] = useState<SettingsTab>('general');

  const isOpen = activeDialog === 'settings';

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title="Preferences & Settings"
      subtitle="Konfigurasi Nusantara Video Studio"
      maxWidth="max-w-2xl"
    >
      <div className="flex gap-4 min-h-[340px]">
        {/* Left Nav */}
        <div className="w-40 border-r border-[#222836] pr-2 flex flex-col gap-1 shrink-0">
          <button
            onClick={() => setCurrentTab('general')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
              currentTab === 'general'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d28]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>General</span>
          </button>
          <button
            onClick={() => setCurrentTab('project')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
              currentTab === 'project'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d28]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Project Defaults</span>
          </button>
          <button
            onClick={() => setCurrentTab('performance')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
              currentTab === 'performance'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d28]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Performance</span>
          </button>
          <button
            onClick={() => setCurrentTab('keyboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
              currentTab === 'keyboard'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d28]'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard</span>
          </button>
          <button
            onClick={() => setCurrentTab('ai')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
              currentTab === 'ai'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d28]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>AI & Privacy</span>
          </button>
          <button
            onClick={() => setCurrentTab('proxy')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
              currentTab === 'proxy'
                ? 'bg-blue-600/20 text-blue-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#181d28]'
            }`}
          >
            <Tv className="w-3.5 h-3.5 text-blue-400" />
            <span>Proxy Media</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 pl-2 overflow-y-auto">
          {currentTab === 'general' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Language (Bahasa)
                </label>
                <select
                  value={settings.general.language}
                  onChange={(e) =>
                    updateGeneral({ language: e.target.value as 'id' | 'en' })
                  }
                  className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English (US)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Editor Theme
                </label>
                <select
                  value={settings.general.theme}
                  onChange={(e) =>
                    updateGeneral({
                      theme: e.target.value as 'dark-studio' | 'dark-slate' | 'oled',
                    })
                  }
                  className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="dark-studio">Dark Studio (Default Professional)</option>
                  <option value="dark-slate">Dark Slate</option>
                  <option value="oled">True Black OLED</option>
                </select>
              </div>

              <div className="p-3 bg-[#11141c] border border-[#212736] rounded-lg flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200 text-xs">Auto Save Architecture</div>
                    <div className="text-[10px] text-slate-400">
                      Simpan project secara berkala di latar belakang
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.general.autoSaveEnabled}
                    onChange={(e) =>
                      updateGeneral({ autoSaveEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 accent-blue-500"
                  />
                </div>

                {settings.general.autoSaveEnabled && (
                  <div className="pt-2 border-t border-[#1e2331] flex items-center justify-between">
                    <span className="text-[11px] text-slate-300">Interval Penyimpanan</span>
                    <select
                      value={settings.general.autoSaveIntervalMinutes}
                      onChange={(e) =>
                        updateGeneral({
                          autoSaveIntervalMinutes: parseInt(e.target.value, 10),
                        })
                      }
                      className="bg-[#0b0d12] border border-[#252b3a] rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value={1}>Setiap 1 menit</option>
                      <option value={3}>Setiap 3 menit</option>
                      <option value={5}>Setiap 5 menit (Default)</option>
                      <option value={10}>Setiap 10 menit</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentTab === 'project' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Default Resolution
                </label>
                <select
                  value={settings.project.defaultResolution}
                  onChange={(e) =>
                    updateProject({
                      defaultResolution: e.target.value as ResolutionPreset,
                    })
                  }
                  className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {RESOLUTION_PRESETS.map((r) => (
                    <option key={r.preset} value={r.preset}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Default FPS
                </label>
                <select
                  value={settings.project.defaultFps}
                  onChange={(e) =>
                    updateProject({
                      defaultFps: parseInt(e.target.value, 10) as FrameRate,
                    })
                  }
                  className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {FRAME_RATES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Default Aspect Ratio
                </label>
                <select
                  value={settings.project.defaultAspectRatio}
                  onChange={(e) =>
                    updateProject({
                      defaultAspectRatio: e.target.value as AspectRatio,
                    })
                  }
                  className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  {ASPECT_RATIOS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentTab === 'performance' && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Preview Quality (Proxy Mode)
                </label>
                <select
                  value={settings.performance.previewQuality}
                  onChange={(e) =>
                    updatePerformance({
                      previewQuality: e.target.value as 'full' | 'half' | 'quarter',
                    })
                  }
                  className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white"
                >
                  <option value="full">Full Quality (100%)</option>
                  <option value="half">1/2 Half Quality (Optimized for smooth scrubbing)</option>
                  <option value="quarter">1/4 Quarter Quality (Ultra fast proxy)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Cache Location
                </label>
                <input
                  type="text"
                  value={settings.performance.cacheLocation}
                  onChange={(e) =>
                    updatePerformance({ cacheLocation: e.target.value })
                  }
                  className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div className="p-3 bg-[#11141c] border border-[#212736] rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">Hardware GPU Acceleration</div>
                  <div className="text-[10px] text-slate-400">
                    Gunakan NVENC / Intel QuickSync / AMD VCN via Tauri & WebGL
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.performance.gpuAcceleration}
                  onChange={(e) =>
                    updatePerformance({ gpuAcceleration: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-blue-600 accent-blue-500"
                />
              </div>
            </div>
          )}

          {currentTab === 'keyboard' && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-300 mb-1">
                Active Keyboard Shortcuts
              </span>
              <div className="border border-[#222836] rounded-lg overflow-hidden text-[11px]">
                <div className="grid grid-cols-2 p-2 bg-[#171b26] font-semibold text-slate-300 border-b border-[#222836]">
                  <span>Action</span>
                  <span>Shortcut</span>
                </div>
                <div className="divide-y divide-[#1e2330] max-h-52 overflow-y-auto">
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>New Project</span>
                    <span className="font-mono text-blue-400">Ctrl + N</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>Open Project</span>
                    <span className="font-mono text-blue-400">Ctrl + O</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>Save Project</span>
                    <span className="font-mono text-blue-400">Ctrl + S</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>Undo</span>
                    <span className="font-mono text-blue-400">Ctrl + Z</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>Redo</span>
                    <span className="font-mono text-blue-400">Ctrl + Shift + Z</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>Play / Pause</span>
                    <span className="font-mono text-blue-400">Space</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>Delete Clip</span>
                    <span className="font-mono text-blue-400">Delete / Backspace</span>
                  </div>
                  <div className="grid grid-cols-2 p-2 text-slate-300">
                    <span>Split Clip at Playhead</span>
                    <span className="font-mono text-blue-400">Ctrl + B</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === 'ai' && <AISettingsTabContent />}
          {currentTab === 'proxy' && <ProxySettingsTabContent />}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 mt-4 border-t border-[#222836]">
        <button
          onClick={() => {
            closeDialog();
            notify('Settings', 'Pengaturan telah disimpan.', 'success');
          }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-colors"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Selesai</span>
        </button>
      </div>
    </Modal>
  );
};

const AISettingsTabContent: React.FC = () => {
  const settings = useAIStore((s) => s.settings);
  const updateSettings = useAIStore((s) => s.updateSettings);

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Provider Selector */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
          AI Provider
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateSettings({ preferredProvider: 'local' })}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              settings.preferredProvider === 'local'
                ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                : 'bg-[#10131c] border-[#22293b] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-xs">Local AI</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
              Your media remains on this computer.
            </div>
          </button>

          <button
            onClick={() => updateSettings({ preferredProvider: 'cloud' })}
            className={`p-2.5 rounded-lg border text-left transition-all ${
              settings.preferredProvider === 'cloud'
                ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                : 'bg-[#10131c] border-[#22293b] text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="font-semibold text-xs">Cloud AI</div>
            <div className="text-[10px] text-slate-400 font-normal mt-0.5">
              Selected media may be uploaded to an external AI provider.
            </div>
          </button>
        </div>
      </div>

      {/* Privacy Section (Requirement 6) */}
      <div className="p-3 bg-[#11141d] border border-[#202738] rounded-xl space-y-2.5">
        <div className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">
          Privacy
        </div>

        <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.privacy.allowCloudProcessing}
            onChange={(e) =>
              updateSettings({
                privacy: { ...settings.privacy, allowCloudProcessing: e.target.checked },
              })
            }
            className="rounded mt-0.5 accent-blue-500"
          />
          <div>
            <div className="font-medium">Allow cloud processing</div>
            <div className="text-[10px] text-slate-500">
              Default: OFF. Wajib persetujuan eksplisit untuk memproses data di cloud.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.privacy.sendMediaToExternal}
            onChange={(e) =>
              updateSettings({
                privacy: { ...settings.privacy, sendMediaToExternal: e.target.checked },
              })
            }
            className="rounded mt-0.5 accent-blue-500"
          />
          <div>
            <div className="font-medium">Send media to external AI providers</div>
            <div className="text-[10px] text-slate-500">
              Default: OFF. Jangan mengirim file ke layanan eksternal tanpa persetujuan.
            </div>
          </div>
        </label>

        <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.privacy.autoProcessImported}
            onChange={(e) =>
              updateSettings({
                privacy: { ...settings.privacy, autoProcessImported: e.target.checked },
              })
            }
            className="rounded mt-0.5 accent-blue-500"
          />
          <div>
            <div className="font-medium">Automatically process imported media</div>
            <div className="text-[10px] text-slate-500">
              Default: OFF. Otomatisasi pemindaian scene/silence saat import.
            </div>
          </div>
        </label>
      </div>

      {/* Local Whisper Config */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
          Whisper Model Size (Local)
        </label>
        <select
          value={settings.whisper.modelSize}
          onChange={(e) =>
            updateSettings({
              whisper: { ...settings.whisper, modelSize: e.target.value as any },
            })
          }
          className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="tiny">Tiny (39 MB - Cepat, RAM Rendah)</option>
          <option value="base">Base (74 MB - Standar Seimbang)</option>
          <option value="small">Small (244 MB - Akurasi Lebih Baik)</option>
          <option value="medium">Medium (769 MB - Akurasi Tinggi)</option>
        </select>
      </div>
    </div>
  );
};

const ProxySettingsTabContent: React.FC = () => {
  const proxySettings = useWorkflowStore((s) => s.proxySettings);
  const updateProxySettings = useWorkflowStore((s) => s.updateProxySettings);
  const proxyEnabled = useWorkflowStore((s) => s.proxyEnabled);
  const setProxyEnabled = useWorkflowStore((s) => s.setProxyEnabled);

  return (
    <div className="flex flex-col gap-4 text-xs">
      {/* Proxy Enable Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-[#141722] border border-[#232938]">
        <div>
          <div className="font-semibold text-slate-200">Enable Proxy Editing</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Gunakan video proxy beresolusi rendah untuk editing lancar tanpa lag
          </div>
        </div>
        <input
          type="checkbox"
          checked={proxyEnabled}
          onChange={(e) => setProxyEnabled(e.target.checked)}
          className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Proxy Resolution */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
          Proxy Resolution (Resolusi Media Proxy)
        </label>
        <select
          value={proxySettings.resolution}
          onChange={(e) => updateProxySettings({ resolution: e.target.value as any })}
          className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
        >
          <option value="540p">540p (960×540 - Direkomendasikan untuk editing responsif)</option>
          <option value="720p">720p (1280×720 - Kualitas tinggi)</option>
          <option value="half">Half Resolution (50% dari ukuran asli)</option>
          <option value="quarter">Quarter Resolution (25% dari ukuran asli)</option>
          <option value="original">Original (Sama dengan resolusi video mentah)</option>
        </select>
      </div>

      {/* Proxy Format & Quality */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Proxy Format
          </label>
          <select
            value={proxySettings.format}
            onChange={(e) => updateProxySettings({ format: e.target.value as any })}
            className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="mp4">MP4 (H.264 / AAC)</option>
            <option value="webm">WebM (VP9 / Opus)</option>
            <option value="prores-proxy">Apple ProRes Proxy</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Proxy Quality
          </label>
          <select
            value={proxySettings.quality}
            onChange={(e) => updateProxySettings({ quality: e.target.value as any })}
            className="w-full bg-[#0d0f14] border border-[#272e3d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="draft">Draft (Kompresi cepat, file kecil)</option>
            <option value="standard">Standard (Keseimbangan optimal)</option>
            <option value="high">High (Detail visual tinggi)</option>
          </select>
        </div>
      </div>

      {/* Auto Generate on Import */}
      <div className="p-3 rounded-lg bg-[#141722] border border-[#232938]">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={proxySettings.autoGenerateOnImport}
            onChange={(e) => updateProxySettings({ autoGenerateOnImport: e.target.checked })}
            className="rounded mt-0.5 accent-blue-500"
          />
          <div>
            <div className="font-medium text-slate-200">Auto Generate Proxy on Import</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Otomatis buat file proxy di latar belakang setiap kali video diimpor ke project
            </div>
          </div>
        </label>
      </div>

      {/* Export Policy Notice */}
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 space-y-1">
        <span className="font-semibold">Aturan Export Profesional (Requirement 12):</span>
        <p className="text-slate-400">
          Saat render final/ekspor, sistem akan selalu menggunakan media asli original untuk kualitas prima, kecuali jika original offline dan pengguna memilih menggunakan proxy.
        </p>
      </div>
    </div>
  );
};
