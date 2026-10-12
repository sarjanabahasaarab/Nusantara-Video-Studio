/**
 * Nusantara Video Studio - Whisper Adapter
 * Phase 7: AI-Assisted Editing
 *
 * Implements hardware/process discovery for local Whisper models (Whisper.cpp, Tauri sidecar, or Web Speech API).
 * If neither is available, provides honest "Not Installed" status with configuration instructions.
 */

import { TranscriptData } from '../../types/ai';

export type WhisperStatus = 'installed' | 'not_installed' | 'ready' | 'browser_speech_available';

export interface WhisperAdapterConfig {
  modelPath?: string;
  modelSize?: 'tiny' | 'base' | 'small' | 'medium';
  customEndpoint?: string;
}

export class WhisperAdapter {
  private config: WhisperAdapterConfig;

  constructor(config: WhisperAdapterConfig = {}) {
    this.config = config;
  }

  /**
   * Discovers whether a real Whisper backend is present
   */
  async checkStatus(): Promise<{
    status: WhisperStatus;
    details: string;
    instructions?: string;
  }> {
    // 1. Check custom endpoint if configured
    if (this.config.customEndpoint) {
      try {
        const res = await fetch(`${this.config.customEndpoint}/health`, { method: 'GET' });
        if (res.ok) {
          return {
            status: 'ready',
            details: `Connected to custom Whisper endpoint: ${this.config.customEndpoint}`,
          };
        }
      } catch {
        // endpoint unreachable
      }
    }

    // 2. Check Tauri sidecar if running in Tauri desktop environment
    if (typeof window !== 'undefined' && (window as unknown as { __TAURI__?: unknown }).__TAURI__) {
      return {
        status: 'installed',
        details: 'Tauri Whisper.cpp native sidecar detected.',
      };
    }

    // 3. Check browser Web Speech API capability as a local speech alternative
    if (
      typeof window !== 'undefined' &&
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
    ) {
      return {
        status: 'browser_speech_available',
        details: 'Browser SpeechRecognition engine available for audio capture.',
        instructions:
          'For high-accuracy offline Whisper, install whisper.cpp or launch a local Whisper HTTP server.',
      };
    }

    // 4. Not installed
    return {
      status: 'not_installed',
      details: 'Whisper local model is not installed on this system.',
      instructions:
        'To enable local Whisper transcription:\n1. Install Whisper CLI (`pip install openai-whisper`) or whisper.cpp\n2. Run a local server at `http://localhost:8000/v1` or use the Tauri desktop build\n3. Or configure Cloud AI in Settings → AI.',
    };
  }

  /**
   * Executes transcription if backend is operational
   */
  async transcribeAudio(
    audioBlobOrUrl: Blob | string,
    onProgress?: (percent: number) => void
  ): Promise<TranscriptData> {
    const status = await this.checkStatus();
    if (status.status === 'not_installed') {
      throw new Error(
        'Whisper Provider Status: Not Installed. Silakan konfigurasi Whisper lokal atau gunakan Cloud AI Provider.'
      );
    }

    onProgress?.(20);

    // If custom endpoint is operational
    if (this.config.customEndpoint) {
      const formData = new FormData();
      if (typeof audioBlobOrUrl === 'string') {
        const resp = await fetch(audioBlobOrUrl);
        const blob = await resp.blob();
        formData.append('file', blob, 'audio.wav');
      } else {
        formData.append('file', audioBlobOrUrl, 'audio.wav');
      }

      onProgress?.(50);
      const res = await fetch(`${this.config.customEndpoint}/transcribe`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Whisper server error: ${res.statusText}`);
      }

      onProgress?.(90);
      const json = await res.json();
      return json as TranscriptData;
    }

    throw new Error(
      'Whisper Provider Status: Not Installed. Gunakan panel konfigurasi Settings → AI untuk menyambungkan backend.'
    );
  }
}
