# Nusantara Video Studio (Phase 1 — Foundation)

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11%20|%20macOS%20|%20Linux-blue)](https://tauri.app)
[![Version](https://img.shields.io/badge/Version-0.1.0-emerald)](#)
[![Phase](https://img.shields.io/badge/Roadmap-Phase%201%20Foundation-indigo)](#roadmap-10-phase)
[![License](https://img.shields.io/badge/License-Proprietary-slate)](#license)

**Nusantara Video Studio** adalah software desktop video editor profesional mandiri yang dirancang untuk performa tinggi, tampilan modern, dan alur kerja non-linear editing (NLE) yang intuitif.

Terinspirasi dari keandalan editor desktop profesional (seperti Corel VideoStudio, DaVinci Resolve, dan Filmora), Nusantara Video Studio dibangun dengan arsitektur orisinal, bebas dari kode tiruan pihak ketiga, menggunakan teknologi modern web & native system: **React 19**, **TypeScript**, **Vite**, **Tauri 2**, dan **Rust**.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend Core**: React 19, TypeScript, Vite
- **Desktop Runtime**: Tauri v2, Rust
- **Styling & UI**: Tailwind CSS v4, Dark Studio Theme, Lucide Icons
- **State Management**: Zustand (Stores modular terpisah)
- **Database Abstraction**: `databaseService` (Arsitektur SQLite repository pattern)
- **File Format**: Format native `.nvproj` (JSON Schema v1)
- **Audio/Video Engine**: Web Audio & Canvas Timecode Architecture (disiapkan untuk hardware-accelerated pipeline pada phase lanjutan)

---

## 📐 Tata Letak Antarmuka (Layout)

```
┌──────────────────────────────────────────────────────────────┐
│ [N] Nusantara Video Studio - Untitled Project                │
├──────────────────────────────────────────────────────────────┤
│ File  Edit  View  Clip  Timeline  Tools  Export  Help        │
├──────────────────────────────────────────────────────────────┤
│ New Open Save Undo Redo | Select Cut Split Delete Text Audio │
├───────────────┬──────────────────────────────┬───────────────┤
│               │                              │               │
│ MEDIA         │                              │ PROPERTIES    │
│ AUDIO         │       VIDEO PREVIEW          │               │
│ TEXT          │       MONITOR                │ Transform     │
│ TRANSITION    │                              │ Position X, Y │
│ EFFECTS       │       00:00:00:00            │ Scale         │
│ FILTERS       │                              │ Rotation      │
│               │ [Stop][Prev][Play][Next][Vol]│ Opacity       │
│               │                              │ Audio / Speed │
├───────────────┴──────────────────────────────┴───────────────┤
│                    TIMELINE                                  │
│ Time: 00:00:00:00 | + Video Track | + Audio Track | Zoom [==]│
├──────────────────────────────────────────────────────────────┤
│ Ruler: | 00:00 | 00:05 | 00:10 | 00:15 | 00:20 | 00:25       │
│ V3 (Overlay / PIP)                                           │
│ V2 (Titles / Text)                                           │
│ V1 (Main Video)                                              │
│ A1 (Dialogue / Main Audio)                                   │
│ A2 (Music / BGM)                                             │
│ A3 (Sound Effects)                                           │
└──────────────────────────────────────────────────────────────┘
```

---

## 📁 Struktur Folder Proyek

```
/
├── .env.example                # Konfigurasi environment
├── index.html                  # Entry point HTML & Dark theme configuration
├── metadata.json               # Manifest metadata aplikasi
├── package.json                # Dependencies & script runner
├── tsconfig.json               # Konfigurasi TypeScript strict
├── vite.config.ts              # Konfigurasi Vite bundler
│
├── src-tauri/                  # Desktop Native Backend (Rust & Tauri 2)
│   ├── Cargo.toml              # Rust manifest & dependencies
│   ├── tauri.conf.json         # Konfigurasi identifier & window Tauri
│   ├── capabilities/
│   │   └── default.json        # Least-privilege desktop permissions
│   ├── icons/
│   │   └── icon.svg            # Custom geometric Nusantara Studio emblem
│   └── src/
│       └── main.rs             # Desktop window initialization & handlers
│
└── src/                        # Frontend Application (React & TypeScript)
    ├── App.tsx                 # Root coordinator
    ├── main.tsx                # Client bootstrapper
    ├── index.css               # Global desktop styling & dark scrollbars
    │
    ├── types/
    │   └── index.ts            # Type definitions (Project, Track, Clip, Settings, dll)
    │
    ├── utils/
    │   ├── timecode.ts         # SMPTE Timecode HH:MM:SS:FF & duration parser
    │   └── presets.ts          # Resolution (720p - 4K), FPS, & Aspect Ratios
    │
    ├── services/
    │   ├── databaseService.ts  # Abstraksi database SQLite (Repository pattern)
    │   └── fileService.ts      # Native .nvproj serialize, parse, save, open
    │
    ├── stores/
    │   ├── projectStore.ts     # Project, settings, and undo/redo snapshots
    │   ├── mediaStore.ts       # Media items & filter state
    │   ├── timelineStore.ts    # Tracks, playhead, zoom, split, playback
    │   ├── selectionStore.ts   # Active clip/track selection & clipboard
    │   ├── uiStore.ts          # Panels resizing, dialogs, & toast alerts
    │   └── settingsStore.ts    # User preferences & performance config
    │
    ├── hooks/
    │   ├── useAutoSave.ts      # Automatic periodic project backup
    │   └── useKeyboardShortcuts.ts # Global NLE keyboard hotkeys
    │
    └── components/
        ├── common/
        │   ├── Modal.tsx       # Reusable accessible dialog modal
        │   ├── SliderInput.tsx # NLE numeric range slider
        │   └── ToastContainer.tsx # Floating notification system
        ├── layout/
        │   ├── TitleBar.tsx    # Desktop window header & controls
        │   ├── Workspace.tsx   # Resizable panels coordinator
        │   └── StatusBar.tsx   # Resolution, FPS, zoom, and auto-save bar
        ├── menu/
        │   └── MenuBar.tsx     # File, Edit, View, Clip, Timeline, Tools, Export, Help
        ├── toolbar/
        │   └── Toolbar.tsx     # Fast-access icon toolbar with tooltips
        ├── sidebar/
        │   └── Sidebar.tsx     # Media, Audio, Text, Transition, Effects, Filters
        ├── preview/
        │   └── VideoPreview.tsx# Monitor, safe areas, timecode, transport controls
        ├── timeline/
        │   ├── Timeline.tsx    # Master timeline container with vertical resize
        │   ├── TimelineToolbar.tsx # Zoom, snapping, loop, track creators
        │   ├── TimelineRuler.tsx   # Interactive second/frame ruler
        │   ├── Playhead.tsx    # Draggable red needle playhead
        │   ├── TrackHeader.tsx # Lock, mute, hide, delete, rename
        │   └── TrackLane.tsx   # Clip positioning, selection, and dragging
        └── dialogs/
            ├── NewProjectDialog.tsx
            ├── ProjectSettingsDialog.tsx
            ├── SettingsDialog.tsx
            ├── AboutDialog.tsx
            └── ShortcutsDialog.tsx
```

---

## ⚡ Fitur Selesai pada Phase 1 (Foundation)

- [x] **Arsitektur Desktop Tauri & Rust**: Terkonfigurasi dengan identifier `com.nusantara.videostudio` dan permissions least privilege.
- [x] **Modern Dark NLE UI**: Skema warna gelap kelas profesional dengan visual hierarchy yang jelas.
- [x] **Docking & Resizable Layout**:
  - Sidebar kiri dapat di-resize dan di-collapse.
  - Properties panel kanan dapat di-resize.
  - Multi-track timeline bawah dapat di-resize secara vertikal.
- [x] **Complete Menu Bar Hierarchy**: File, Edit, View, Clip, Timeline, Tools, Export, Help lengkap dengan pintasan keyboard dan notifikasi phase lanjutan.
- [x] **Full Action Toolbar**: New, Open, Save, Undo, Redo, Select, Cut, Split, Delete, Text, Audio, Transition, Effect, Export.
- [x] **Sidebar Tabs & Empty States**: Tab Media, Audio, Text, Transition, Effects, dan Filters dengan empty state bersih dan tombol sample test clips.
- [x] **Preview Monitor & Playback Engine**:
  - Timecode SMPTE `00:00:00:00` tersinkronisasi.
  - Kontrol Transport: Play/Pause, Stop, Next Frame, Previous Frame, Volume/Mute, Fullscreen.
  - Framing Aspect Ratio otomatis (16:9, 9:16, 1:1, 4:3) dengan safe area guides.
- [x] **Multi-Track Timeline**:
  - Track default: V3, V2, V1, A1, A2, A3.
  - Track header dengan aksi Lock, Hide Video, Mute Audio, Delete Track, dan Rename Track.
  - Tambah Video Track dan Audio Track dinamis.
  - Ruler interaktif dengan penyesuaian zoom (px/second).
  - Jarum Playhead merah yang dapat di-drag dan di-scrub.
  - Split clip pada playhead (Ctrl+B / Toolbar Split).
- [x] **Property Inspector Panel**:
  - Transform (Position X, Position Y, Scale, Rotation, Opacity) dengan slider & numeric input.
  - Audio (Volume, Pan L/R).
  - Speed (Playback rate).
  - Empty state saat tidak ada clip terpilih.
- [x] **Project System & .nvproj File**:
  - Format file `.nvproj` berbasis JSON berversi (`projectVersion: 1`).
  - Ekspor/Save file proyek ke disk.
  - Impor/Buka file `.nvproj` dengan verifikasi integritas data.
- [x] **Undo / Redo Architecture**: Snapshot stack riwayat perubahan proyek.
- [x] **Auto Save System**: Backup berkala otomatis (default: setiap 5 menit).
- [x] **SQLite Service Abstraction**: `databaseService` dengan pattern repository terpisah untuk proyek, cache media, dan konfigurasi.
- [x] **Keyboard Shortcuts Engine**: Ctrl+N, Ctrl+O, Ctrl+S, Ctrl+Z, Ctrl+Shift+Z, Del, Space, Ctrl+B, dll.
- [x] **Settings & Preferences Modal**: Pengaturan Umum, Project Defaults, Performa (Proxy/Quality), dan daftar pintasan.
- [x] **About Nusantara Video Studio**: Informasi v0.1.0, roadmap status, dan identitas orisinal.
- [x] **Notification & Toast System**: Alert feedback untuk info, success, warning, dan error.

---

## ⏳ Fitur yang Dijadwalkan pada Phase Berikutnya

- **Phase 2 (Media Library)**: File browser, media ingestion nyata, thumbnail generator, drag-and-drop media ke timeline.
- **Phase 3 (Timeline Editor)**: Ripple edit, rolling edit, multi-clip selection, slip & slide tool, snapping magnets to clip edges.
- **Phase 4 (Video & Audio Editing)**: Video playback decoder, frame cache, waveform rendering presisi, volume envelopes.
- **Phase 5 (Text & Subtitle)**: Subtitle generator (SRT/VTT), title templates, lower-thirds, rich text styling.
- **Phase 6 (Effects & Transitions)**: GL transitions (Dissolve, Wipe, Zoom, Spin), WebGL/WGPU shader filters, LUT color grading.
- **Phase 7 (Advanced Editing)**: Keyframing bezier curves, Chroma Key green screen, Picture-in-Picture transform handles pada preview.
- **Phase 8 (Audio Studio)**: Multi-band equalizer, compressor, noise suppression, audio ducking, audio mixer console.
- **Phase 9 (Rendering & Export)**: FFmpeg / WebCodecs / Hardware encoder, render queue, export MP4/WebM sampai 4K UHD 60fps.
- **Phase 10 (Final Release)**: Installer Windows (.msi / .exe), auto-updater, optimasi memori final, release build publik.

---

## 🚀 Panduan Instalasi & Menjalankan

### Persyaratan Sistem
- **Node.js**: Versi 18+ atau 20+
- **Rust & Cargo**: Versi 1.77+ (untuk kompilasi Tauri desktop)
- **C++ Build Tools**: Visual Studio C++ Build Tools (untuk Windows)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Menjalankan Development (Web Preview)
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 3. Menjalankan Development Desktop (Tauri Desktop App)
```bash
npm run tauri:dev
```
Aplikasi desktop Windows/macOS/Linux akan terbuka dengan native window.

### 4. Build Production Desktop (Windows Installer / Executable)
```bash
npm run tauri:build
```
File installer `.msi` dan binary `.exe` akan dihasilkan di:
`src-tauri/target/release/bundle/msi/`

---

## 🧪 Cara Melakukan Testing Phase 1

1. **Membuat Proyek Baru**:
   - Tekan `Ctrl + N` atau menu `File -> New Project`.
   - Pilih preset resolusi (misal `Full HD 1080p`), FPS `30`, Aspect Ratio `16:9`, lalu klik "Buat Proyek".
2. **Menguji Sample Clip & Properties**:
   - Di sidebar kiri (tab Media), klik tombol `+ Sample Video Clip`.
   - Clip akan muncul di track timeline `V1`.
   - Klik clip tersebut untuk memilihnya.
   - Perhatikan panel **Properties** di sisi kanan akan terisi dengan nilai Position, Scale, Rotation, Opacity, Audio, dan Speed.
   - Geser slider Position X atau Scale, perhatikan nilainya langsung ter-update.
3. **Menguji Playhead & Transport**:
   - Tekan tombol `Space` atau klik tombol `Play` di monitor preview.
   - Jarum playhead merah akan bergerak secara mulus di atas timeline ruler dan track lanes.
   - Timecode SMPTE `00:00:xx:xx` akan berjalan serentak.
   - Drag jarum scrubber playhead ke posisi sembarang.
4. **Menguji Split Clip**:
   - Posisikan playhead di tengah clip yang sedang dipilih.
   - Tekan `Ctrl + B` atau klik tombol `Split` di toolbar.
   - Clip akan terbelah menjadi dua bagian mandiri.
5. **Menguji Track Controls**:
   - Klik ikon gembok pada track header untuk menguji Lock/Unlock.
   - Klik ikon mata untuk Hide/Show track video.
   - Klik ikon speaker untuk Mute/Unmute audio track.
   - Klik tombol `+ Video Track` atau `+ Audio Track` di timeline toolbar.
6. **Menguji Save & Open Format .nvproj**:
   - Tekan `Ctrl + S` atau tombol `Save` di toolbar.
   - Browser/aplikasi akan mengunduh/menyimpan file berekstensi `.nvproj`.
   - Tekan `Ctrl + O` untuk membuka kembali file `.nvproj` tersebut.
7. **Menguji Undo / Redo**:
   - Lakukan modifikasi (tambah track atau pindahkan clip), lalu tekan `Ctrl + Z`.
   - Perubahan akan dibatalkan (Undo). Tekan `Ctrl + Shift + Z` untuk Redo.

---

## 🔧 Troubleshooting Error Umum

1. **`tauri: not found`**:
   - Pastikan dependencies telah terpasang dengan menjalankan `npm install`.
   - Jika menggunakan Tauri CLI global, jalankan `cargo install tauri-cli`.
2. **Port 3000 sudah digunakan**:
   - Vite otomatis menggunakan port cadangan atau ubah parameter `--port` pada script `dev` di `package.json`.
3. **Rust build error pada Windows**:
   - Pastikan "Desktop development with C++" sudah terpasang melalui Visual Studio Installer.
   - Jalankan `rustup default stable-msvc`.

---

## 📄 License

Proprietary © 2026 Nusantara Video Studio. Seluruh hak cipta dilindungi undang-undang.
