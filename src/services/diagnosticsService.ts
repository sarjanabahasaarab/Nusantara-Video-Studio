/**
 * Nusantara Video Studio - System Diagnostics & Logging Service
 * Phase 10: Production Readiness, Security & Diagnostics (Requirements 3, 7, 8, 10, 12)
 */

import { AppDiagnosticInfo } from '../types/workflow';
import { RenderCapabilitiesService } from '../render/RenderCapabilities';
import { RenderCapabilities } from '../types/render';
import { useSettingsStore } from '../stores/settingsStore';
import { useProjectStore } from '../stores/projectStore';
import { useMediaStore } from '../stores/mediaStore';

export interface ComprehensiveDiagnosticReport {
  timestamp: string;
  application: {
    name: string;
    version: string;
    buildType: 'production' | 'development';
    targetPlatform: string;
    schemaVersion: number;
    uptimeSeconds: number;
  };
  system: {
    os: string;
    userAgent: string;
    platform: string;
    cpuCores: number;
    deviceMemoryGb?: number;
    online: boolean;
  };
  storage: {
    estimatedQuotaBytes?: number;
    estimatedUsageBytes?: number;
    cacheDirectory: string;
    projectsDirectory: string;
    databaseStatus: 'connected' | 'offline' | 'memory';
  };
  ffmpeg: {
    available: boolean;
    version?: string;
    probeAvailable: boolean;
    probeVersion?: string;
    configuredPath?: string;
    detectedCodecs: {
      video: string[];
      audio: string[];
      hardwareEncoders: Record<string, boolean>;
    };
  };
  projectState: {
    activeProjectId?: string;
    projectName?: string;
    mediaCount: number;
    tracksCount: number;
    clipsCount: number;
    markersCount: number;
  };
  recentLogs: Array<{
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: string;
  }>;
}

const startTime = Date.now();
const memoryLogs: Array<{ level: 'info' | 'warn' | 'error'; message: string; timestamp: string }> = [];

export class DiagnosticsService {
  private static instance: DiagnosticsService;

  private constructor() {
    this.log('info', 'DiagnosticsService initialized in Nusantara Video Studio v1.0.0');
  }

  public static getInstance(): DiagnosticsService {
    if (!this.instance) {
      this.instance = new DiagnosticsService();
    }
    return this.instance;
  }

  public log(level: 'info' | 'warn' | 'error', message: string): void {
    const entry = {
      level,
      message: this.redactSensitiveData(message),
      timestamp: new Date().toISOString(),
    };
    memoryLogs.unshift(entry);
    if (memoryLogs.length > 200) {
      memoryLogs.pop();
    }
    if (level === 'error') {
      console.error(`[NVS Diagnostics] ${entry.message}`);
    }
  }

  public getLogs(): Array<{ level: 'info' | 'warn' | 'error'; message: string; timestamp: string }> {
    return [...memoryLogs];
  }

  public clearLogs(): void {
    memoryLogs.length = 0;
    this.log('info', 'Diagnostic error logs cleared by user.');
  }

  /**
   * Redacts passwords, API tokens, Authorization headers, and private system usernames
   */
  public redactSensitiveData(input: string): string {
    if (!input) return '';
    return input
      .replace(/(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi, '$1[REDACTED_TOKEN]')
      .replace(/(api[_-]?key[:=]\s*)[A-Za-z0-9\-._~]+/gi, '$1[REDACTED_API_KEY]')
      .replace(/(password[:=]\s*)[^\s&]+/gi, '$1[REDACTED_PASSWORD]')
      .replace(/(C:\\Users\\)[^\\/\s]+/gi, '$1[USERNAME]')
      .replace(/(\/home\/)[^\\/\s]+/gi, '$1[USERNAME]');
  }

  /**
   * Compiles complete diagnostic report for troubleshooting and bug reporting
   */
  public async getComprehensiveReport(): Promise<ComprehensiveDiagnosticReport> {
    const caps: RenderCapabilities = await RenderCapabilitiesService.getInstance().getCapabilities();
    const settings = useSettingsStore.getState().settings;
    const project = useProjectStore.getState().currentProject;
    const mediaItems = useMediaStore.getState().items;
    const tracks = project?.timeline?.tracks || [];

    let quota: number | undefined;
    let usage: number | undefined;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        quota = est.quota;
        usage = est.usage;
      } catch {
        // ignore
      }
    }

    const report: ComprehensiveDiagnosticReport = {
      timestamp: new Date().toISOString(),
      application: {
        name: 'Nusantara Video Studio',
        version: '1.0.0',
        buildType: process.env.NODE_ENV === 'production' ? 'production' : 'development',
        targetPlatform: 'Windows 10 / 11 64-bit (Tauri Desktop Runtime)',
        schemaVersion: 7,
        uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      },
      system: {
        os: typeof navigator !== 'undefined' ? navigator.platform || 'Windows x64' : 'Windows x64',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Desktop',
        platform: typeof navigator !== 'undefined' ? (navigator as any).userAgentData?.platform || 'Windows' : 'Windows',
        cpuCores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4,
        deviceMemoryGb: typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined,
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
      },
      storage: {
        estimatedQuotaBytes: quota,
        estimatedUsageBytes: usage,
        cacheDirectory: settings.performance.cacheLocation || 'App Data / Cache',
        projectsDirectory: settings.general.projectsDirectory || 'Documents/NusantaraProjects',
        databaseStatus: 'connected',
      },
      ffmpeg: {
        available: caps.ffmpegAvailable,
        version: caps.ffmpegVersion,
        probeAvailable: caps.ffprobeAvailable,
        probeVersion: caps.ffprobeVersion,
        configuredPath: settings.performance.ffmpegExecutablePath || 'System PATH default',
        detectedCodecs: {
          video: caps.videoCodecs.filter((v) => v.available).map((v) => v.name),
          audio: caps.audioCodecs.filter((a) => a.available).map((a) => a.name),
          hardwareEncoders: caps.hardwareEncoders,
        },
      },
      projectState: {
        activeProjectId: project?.id,
        projectName: project?.name,
        mediaCount: mediaItems.length,
        tracksCount: tracks.length,
        clipsCount: tracks.reduce((acc: number, t: any) => acc + (t.clips?.length || 0), 0),
        markersCount: project?.timeline?.markers?.length || 0,
      },
      recentLogs: this.getLogs(),
    };

    return report;
  }

  /**
   * Downloads formatted JSON diagnostics file
   */
  public async exportDiagnosticsJson(): Promise<void> {
    const report = await this.getComprehensiveReport();
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nusantara_Diagnostics_${new Date().toISOString().replace(/[:.]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Clears app cache storage
   */
  public async clearCache(): Promise<boolean> {
    if (typeof caches !== 'undefined') {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
        this.log('info', 'Application browser cache cleared successfully.');
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
}

export const diagnosticsService = DiagnosticsService.getInstance();
