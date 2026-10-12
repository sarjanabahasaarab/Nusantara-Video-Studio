/**
 * Nusantara Video Studio - Documentation & User Guide Modal
 * Phase 10: Official Release & User Experience (Requirements 13, 14)
 */

import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useUIStore } from '../../stores/uiStore';
import {
  BookOpen,
  Film,
  Scissors,
  Type,
  Palette,
  Volume2,
  Tv,
  HelpCircle,
  Search,
  ExternalLink,
} from 'lucide-react';

interface GuideSection {
  id: string;
  title: string;
  icon: any;
  content: React.ReactNode;
}

export const DocumentationModal: React.FC = () => {
  const activeDialog = useUIStore((s) => s.activeDialog);
  const closeDialog = useUIStore((s) => s.closeDialog);
  const isOpen = activeDialog === 'documentation';

  const [activeSection, setActiveSection] = useState<string>('getting-started');
  const [searchTerm, setSearchTerm] = useState('');

  const sections: GuideSection[] = [
    {
      id: 'getting-started',
      title: '1. Memulai Proyek',
      icon: BookOpen,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <h4 className="text-sm font-semibold text-white">Membuat &amp; Mengelola Proyek Video</h4>
          <p>
            Nusantara Video Studio menggunakan format file tunggal <code>.nvproj</code> yang menyimpan seluruh metadata timeline, susunan klip, transisi, keyframe, perataan warna, dan pengaturan audio mixer.
          </p>
          <div className="bg-[#141824] border border-[#22293b] p-3 rounded-lg space-y-1">
            <div className="font-semibold text-blue-400">Langkah Awal:</div>
            <div>• Klik <strong>File &gt; New Project (Ctrl+N)</strong> untuk menentukan resolusi (1080p, 4K, 9:16 Vertikal) dan frame rate (24, 30, 60 fps).</div>
            <div>• Simpan proyek secara berkala dengan <strong>Ctrl+S</strong>.</div>
            <div>• Fitur <em>Autosave</em> aktif otomatis setiap 5 menit untuk melindungi dari crash.</div>
          </div>
        </div>
      ),
    },
    {
      id: 'media-library',
      title: '2. Media Library & Proxy',
      icon: Film,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <h4 className="text-sm font-semibold text-white">Pengelolaan Aset &amp; Proxy Editing</h4>
          <p>
            Media Library mendukung ribuan video (MP4, MOV, WebM, MKV), audio (WAV, MP3, AAC, FLAC), dan gambar (PNG, JPG, SVG, WebP) dengan folder Bin hierarkis.
          </p>
          <div className="bg-[#141824] border border-[#22293b] p-3 rounded-lg space-y-1.5">
            <div className="font-semibold text-purple-400">Fitur Proxy Media (Editing Lancar di PC Ringan):</div>
            <div>• Klik kanan file video di Media Library &gt; pilih <strong>Generate Proxy (540p / 720p)</strong>.</div>
            <div>• Timeline akan memutar proxy yang ringan tanpa lag saat pengeditan.</div>
            <div>• Saat ekspor final, mesin otomatis beralih ke file master resolusi penuh untuk kualitas maksimal.</div>
          </div>
        </div>
      ),
    },
    {
      id: 'timeline-editing',
      title: '3. Timeline & Pemotongan',
      icon: Scissors,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <h4 className="text-sm font-semibold text-white">Navigasi Timeline &amp; Shortcut Pemotong</h4>
          <p>
            Timeline multi-track mendukung hingga puluhan layer video (V1–V5+) dan layer audio (A1–A5+) dengan magnetik snapping dan ripple edit.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="bg-[#141824] p-2 rounded border border-[#22293b]">
              <span className="text-blue-400 font-bold">C / Split:</span> Potong klip di playhead
            </div>
            <div className="bg-[#141824] p-2 rounded border border-[#22293b]">
              <span className="text-blue-400 font-bold">Space:</span> Play / Pause preview
            </div>
            <div className="bg-[#141824] p-2 rounded border border-[#22293b]">
              <span className="text-blue-400 font-bold">Ctrl+Z / Ctrl+Y:</span> Undo / Redo
            </div>
            <div className="bg-[#141824] p-2 rounded border border-[#22293b]">
              <span className="text-blue-400 font-bold">Delete:</span> Hapus klip terpilih
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'color-grading',
      title: '4. Studio Warna & .CUBE LUT',
      icon: Palette,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <h4 className="text-sm font-semibold text-white">Koreksi Warna Sinematik &amp; Scope Real-Time</h4>
          <p>
            Studio warna menyediakan kontrol 3-Way Color Wheels (Lift, Gamma, Gain), RGB Curves kurva spline kubik, dan penerapan file <code>.cube</code> 3D LUT dengan trilinear interpolation.
          </p>
          <p>
            Dilengkapi instrumen pemantau video real-time: <strong>Histogram</strong>, <strong>RGB Parade</strong>, dan <strong>Vectorscope</strong> untuk akurasi standar broadcast.
          </p>
        </div>
      ),
    },
    {
      id: 'audio-mixer',
      title: '5. Audio Mixer & Normalisasi',
      icon: Volume2,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <h4 className="text-sm font-semibold text-white">Mixdown Multitrack &amp; Loudness EBU R128</h4>
          <p>
            Audio processing engine dilengkapi 5-Band Parametric Equalizer, Dynamics Compressor, dan Master Limiter anti-clipping (-0.1 dB True Peak).
          </p>
          <div className="bg-[#141824] border border-[#22293b] p-3 rounded-lg space-y-1">
            <div className="font-semibold text-emerald-400">Standar Normalisasi Ekspor:</div>
            <div>• <strong>-14 LUFS:</strong> Standar optimal YouTube &amp; Spotify</div>
            <div>• <strong>-16 LUFS:</strong> Standar Apple Podcasts &amp; AES</div>
            <div>• <strong>-23 LUFS:</strong> Standar siaran TV EBU R128 / ITU-R BS.1770</div>
          </div>
        </div>
      ),
    },
    {
      id: 'rendering-export',
      title: '6. Ekspor & Render Queue',
      icon: Tv,
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-300">
          <h4 className="text-sm font-semibold text-white">Mesin Rendering Nyata FFmpeg</h4>
          <p>
            Render Engine mengekspor video ke format MP4 (H.264, H.265, AV1), MOV (Apple ProRes 422 HQ), dan WebM dengan akselerasi GPU (NVENC, AMF, Intel QSV) atau CPU software fallback.
          </p>
          <p>
            Render Queue memungkinkan pemrosesan latar belakang dengan estimasi waktu akurat, jeda (pause), batal (cancel), serta validasi integritas file keluaran.
          </p>
        </div>
      ),
    },
  ];

  const filtered = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const current = sections.find((s) => s.id === activeSection) || sections[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeDialog}
      title="Panduan Pengguna (User Guide)"
      subtitle="Dokumentasi lengkap Nusantara Video Studio v1.0.0"
      maxWidth="max-w-3xl"
    >
      <div className="flex gap-4 min-h-[420px] select-none">
        {/* Left Sidebar */}
        <div className="w-56 border-r border-[#212634] pr-2 flex flex-col gap-2 shrink-0">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Cari panduan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#141822] border border-[#222938] rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto">
            {filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161a25]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 pl-2 overflow-y-auto pr-1">
          {current && (
            <div className="flex flex-col gap-3">
              <div className="border-b border-[#212634] pb-2 flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <current.icon className="w-5 h-5 text-blue-400" />
                  {current.title}
                </h3>
                <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
                  NVS Guide v1.0
                </span>
              </div>
              {current.content}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
