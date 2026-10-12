# Third-Party Software Notices and Licenses

Nusantara Video Studio incorporates or links with third-party software libraries and multimedia binaries. This document provides clear attribution, licensing information, and distribution compliance notices.

---

## 1. FFmpeg & Multimedia Codecs

**Software:** FFmpeg & FFprobe  
**Licensing:** GNU Lesser General Public License (LGPL) version 2.1+ or GNU General Public License (GPL) version 3.0 (depending on compiled external encoders).  
**Source Code:** [https://ffmpeg.org](https://ffmpeg.org)  

### Codec Build & Licensing Strategy:
* **Default Distribution Policy:**
  Nusantara Video Studio communicates with FFmpeg via safe process execution (`spawn` argument arrays and IPC communication) without statically linking private code against FFmpeg libraries.
* **Codecs & Encoders:**
  - **H.264 (`libx264`):** GPL v2+. When distributed with `libx264`, the binary is licensed under GPL.
  - **H.265 / HEVC (`libx265`):** GPL v2+. Subject to patent licensing terms in applicable jurisdictions.
  - **AV1 (`libsvtav1` / `libaom-av1`):** BSD 2-Clause / Alliance for Open Media Patent License 1.0. Royalty-free modern codec.
  - **Apple ProRes (`prores_ks` / `prores_aw`):** LGPL v2.1+.
  - **VP9 (`libvpx`):** BSD 3-Clause.
  - **AAC (`aac` native encoder):** LGPL v2.1+.
  - **Opus (`libopus`):** BSD 3-Clause.
* **Compliance Offer:**
  Pursuant to LGPL v2.1 / GPL v3, Nusantara Video Studio does not restrict user replacement of FFmpeg executables. Users may configure custom FFmpeg binaries in **Preferences > Performance > FFmpeg Executable Path**.

---

## 2. Frontend & Desktop Frameworks

### React & React DOM
* **License:** MIT License
* **Copyright:** (c) Meta Platforms, Inc. and affiliates.
* **Website:** [https://react.dev](https://react.dev)

### Tauri Framework & Plugins
* **License:** MIT or Apache 2.0 (Dual License)
* **Copyright:** (c) 2017 - Present Tauri Programme within The Commons Conservancy.
* **Website:** [https://tauri.app](https://tauri.app)

### Vite
* **License:** MIT License
* **Copyright:** (c) 2019-present Evan You & Vite Contributors.
* **Website:** [https://vite.dev](https://vite.dev)

### Zustand
* **License:** MIT License
* **Copyright:** (c) 2019 Paul Henschel.
* **Website:** [https://github.com/pmndrs/zustand](https://github.com/pmndrs/zustand)

### Tailwind CSS
* **License:** MIT License
* **Copyright:** (c) Tailwind Labs, Inc.
* **Website:** [https://tailwindcss.com](https://tailwindcss.com)

### Lucide Icons
* **License:** ISC License
* **Copyright:** (c) Lucide Contributors
* **Website:** [https://lucide.dev](https://lucide.dev)

### Motion (Framer Motion)
* **License:** MIT License
* **Copyright:** (c) 2018 Framer B.V.
* **Website:** [https://motion.dev](https://motion.dev)

---

## 3. Rust Backend Dependencies

### Serde & Serde JSON
* **License:** MIT / Apache 2.0 (Dual License)
* **Copyright:** (c) 2014-2024 Erick Tryzelaar and David Tolnay.
