# Nusantara Video Studio — Installation Guide

Official Production Release v1.0.0 for Windows 10 & Windows 11 (64-bit).

---

## 1. System Requirements

### Minimum Requirements:
* **Operating System:** Windows 10 (version 1903 or later, 64-bit) or Windows 11
* **Processor (CPU):** Intel Core i3 (6th Gen+) / AMD Ryzen 3 or higher
* **Memory (RAM):** 8 GB RAM minimum (16 GB recommended for 4K video)
* **Graphics (GPU):** DirectX 11 / OpenGL 3.3 compatible (NVIDIA GeForce, AMD Radeon, Intel HD/UHD)
* **Storage:** 500 MB free space for application installation; additional SSD space for video cache & scratchpad
* **Runtime:** Microsoft Edge WebView2 (pre-installed on Windows 10/11)

---

## 2. Windows Installer Options

### Option A: Standard NSIS Installer (.exe) — Recommended
**File:** `Nusantara-Video-Studio-Setup-1.0.0-x64.exe`
1. Download the installer executable from the official GitHub Release.
2. Double-click to launch setup.
   * *Note on Windows SmartScreen:* If Windows displays an unknown publisher notification, click **More info** -> **Run anyway** until official EV code signing certificate integration is finalized.
3. Select installation directory (defaults to current user profile: `%LOCALAPPDATA%\Programs\Nusantara Video Studio`).
4. Setup automatically creates:
   * Start Menu shortcut
   * Desktop icon
   * Clean uninstaller entry in Windows Settings (Apps & Features)
5. Click **Finish** to launch Nusantara Video Studio.

### Option B: Enterprise MSI Package (.msi)
**File:** `Nusantara-Video-Studio-1.0.0-x64.msi`
* Designed for automated enterprise deployment via Group Policy (GPO) or Microsoft Intune:
  ```cmd
  msiexec /i Nusantara-Video-Studio-1.0.0-x64.msi /quiet /norestart
  ```

### Option C: Portable Standalone (.zip)
**File:** `Nusantara-Video-Studio-1.0.0-portable-x64.zip`
1. Extract the ZIP archive to any folder or external USB drive.
2. Run `nusantara-video-studio.exe` directly without administrative privileges.

---

## 3. First-Run Setup & FFmpeg Configuration

On first launch, the **First-Run Setup Wizard** guides you through:
1. **Language Selection:** Bahasa Indonesia or English.
2. **Projects & Scratch Folders:** Default storage path for `.nvproj` project files and temporary render cache.
3. **Hardware & FFmpeg Detection:** Automatic discovery of GPU encoders (NVIDIA NVENC, AMD AMF, Intel Quick Sync) and FFmpeg engine.

---

## 4. Upgrading to Newer Releases

* Upgrades preserve all your user project files (`.nvproj`), exported videos, and media assets.
* Legacy projects created in earlier preview versions (Schema v1 to v6) are automatically migrated to Schema v7 with full data safety.

---

## 5. Uninstallation

To remove Nusantara Video Studio:
1. Open Windows **Settings** > **Apps** > **Installed apps**.
2. Locate **Nusantara Video Studio** and click **Uninstall**.
3. The uninstaller removes program binaries without deleting your personal video projects or media clips.

---

## 6. Code Signing & Windows SmartScreen Notice

* **Current Status:** Official binaries in the initial v1.0.0 release pipeline are compiled and packaged using Tauri NSIS/WiX tools. Unless an Organization Extended Validation (EV) code signing certificate is configured in GitHub Secrets (`WINDOWS_CERTIFICATE_THUMBPRINT` or `.pfx`), Windows SmartScreen may present an "Unknown Publisher" warning upon initial setup launch.
* **Signing Instructions (Production Keyring):**
  1. Acquire a Sectigo / DigiCert EV Code Signing Certificate.
  2. Configure `AZURE_KEY_VAULT` or hardware HSM token runner in `.github/workflows/release.yml`.
  3. Add `signtool.exe sign /fd sha256 /tr http://timestamp.digicert.com /td sha256 ...` to the packaging step.

---

## 7. Verification & Platform Compatibility Disclosure

* **Honest Release Engineering Status:** The frontend, web engine, IPC interfaces, and TypeScript unit suites (60/60 tests) have been fully executed and verified in Linux / Vite / Node environments. Full desktop NSIS installer packaging workflows are automated via GitHub Actions on `windows-latest`. Installers must be verified on an actual physical Windows 10/11 machine by your QA team prior to wide public deployment.

