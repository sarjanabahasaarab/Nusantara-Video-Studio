/**
 * Nusantara Video Studio - Real FFmpeg Render Server Handler
 * Phase 9: Professional Rendering & Export Engine
 *
 * Implements real FFmpeg execution, capabilities scanning, progress parsing,
 * process control (pause/resume/cancel), ffprobe validation, and file delivery.
 */

import { spawn, execSync, ChildProcess } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { IncomingMessage, ServerResponse } from 'http';
import {
  RenderCapabilities,
  OutputValidationReport,
  ExportHistoryItem,
} from '../../types/render';

interface ActiveProcessInfo {
  jobId: string;
  process: ChildProcess;
  outputPath: string;
  totalDurationSec: number;
  totalFrames: number;
  fps: number;
  startTime: number;
  lastProgress: {
    percentage: number;
    currentFrame: number;
    totalFrames: number;
    fps: number;
    renderSpeedRealtime: number;
    elapsedSeconds: number;
    remainingSeconds: number;
    currentBitrateKbps: number;
    currentStage: string;
  };
  status: 'rendering' | 'paused' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  logs: string[];
}

const activeProcesses = new Map<string, ActiveProcessInfo>();
const exportHistory: ExportHistoryItem[] = [];

// Cache capabilities
let cachedCapabilities: RenderCapabilities | null = null;

export function getSystemCapabilities(): RenderCapabilities {
  if (cachedCapabilities) return cachedCapabilities;

  let ffmpegAvailable = false;
  let ffmpegVersion = '';
  let ffprobeAvailable = false;
  let ffprobeVersion = '';
  let encoderOutput = '';

  try {
    const vOut = execSync('ffmpeg -version', { encoding: 'utf-8', timeout: 3000 });
    ffmpegAvailable = true;
    const match = vOut.match(/ffmpeg version ([^\s]+)/);
    ffmpegVersion = match ? match[1] : 'installed';
  } catch {
    ffmpegAvailable = false;
  }

  try {
    const pOut = execSync('ffprobe -version', { encoding: 'utf-8', timeout: 3000 });
    ffprobeAvailable = true;
    const match = pOut.match(/ffprobe version ([^\s]+)/);
    ffprobeVersion = match ? match[1] : 'installed';
  } catch {
    ffprobeAvailable = false;
  }

  if (ffmpegAvailable) {
    try {
      encoderOutput = execSync('ffmpeg -encoders', { encoding: 'utf-8', timeout: 4000 });
    } catch {
      encoderOutput = '';
    }
  }

  const hasEncoder = (name: string) => encoderOutput.includes(name);

  const hasH264 = hasEncoder('libx264') || hasEncoder('h264');
  const hasH265 = hasEncoder('libx265') || hasEncoder('hevc');
  const hasAV1 = hasEncoder('libaom-av1') || hasEncoder('librav1e') || hasEncoder('libsvtav1');
  const hasProRes = hasEncoder('prores') || hasEncoder('prores_ks') || hasEncoder('prores_aw');
  const hasVP9 = hasEncoder('libvpx-vp9');

  const hasAAC = hasEncoder('aac') || hasEncoder('libfdk_aac');
  const hasOpus = hasEncoder('opus') || hasEncoder('libopus');
  const hasPCM = hasEncoder('pcm_s16le');

  const hasNVENC = hasEncoder('h264_nvenc') || hasEncoder('hevc_nvenc') || hasEncoder('nvenc');
  const hasAMF = hasEncoder('h264_amf') || hasEncoder('hevc_amf');
  const hasQSV = hasEncoder('h264_qsv') || hasEncoder('hevc_qsv');
  const hasVideoToolbox = hasEncoder('h264_videotoolbox') || hasEncoder('hevc_videotoolbox');
  const hasVAAPI = hasEncoder('h264_vaapi') || hasEncoder('hevc_vaapi');

  cachedCapabilities = {
    ffmpegAvailable,
    ffmpegVersion,
    ffprobeAvailable,
    ffprobeVersion,
    containers: [
      {
        format: 'mp4',
        name: 'MPEG-4 Part 14 (.mp4)',
        extension: '.mp4',
        available: ffmpegAvailable && (hasH264 || hasH265 || hasAV1),
        supportedVideoCodecs: [
          ...(hasH264 ? (['h264'] as const) : []),
          ...(hasH265 ? (['h265'] as const) : []),
          ...(hasAV1 ? (['av1'] as const) : []),
        ],
        supportedAudioCodecs: [
          ...(hasAAC ? (['aac'] as const) : []),
          ...(hasOpus ? (['opus'] as const) : []),
        ],
        supportsAlpha: false,
      },
      {
        format: 'mov',
        name: 'QuickTime Movie (.mov)',
        extension: '.mov',
        available: ffmpegAvailable && (hasH264 || hasProRes || hasH265),
        supportedVideoCodecs: [
          ...(hasH264 ? (['h264'] as const) : []),
          ...(hasProRes ? (['prores'] as const) : []),
          ...(hasH265 ? (['h265'] as const) : []),
        ],
        supportedAudioCodecs: [
          ...(hasAAC ? (['aac'] as const) : []),
          ...(hasPCM ? (['pcm'] as const) : []),
        ],
        supportsAlpha: hasProRes,
      },
      {
        format: 'webm',
        name: 'WebM Video (.webm)',
        extension: '.webm',
        available: ffmpegAvailable && (hasVP9 || hasAV1),
        supportedVideoCodecs: [
          ...(hasVP9 ? (['vp9'] as const) : []),
          ...(hasAV1 ? (['av1'] as const) : []),
        ],
        supportedAudioCodecs: [
          ...(hasOpus ? (['opus'] as const) : []),
        ],
        supportsAlpha: hasVP9,
      },
    ],
    videoCodecs: [
      {
        id: 'h264',
        name: 'H.264 / AVC (Advanced Video Coding)',
        available: hasH264,
        encoderName: hasEncoder('libx264') ? 'libx264' : 'h264',
        hardwareAccelerated: hasNVENC || hasQSV || hasAMF,
        supportedContainers: ['mp4', 'mov'],
        notes: 'Format paling kompatibel untuk semua perangkat dan web.',
      },
      {
        id: 'h265',
        name: 'H.265 / HEVC (High Efficiency Video Coding)',
        available: hasH265,
        encoderName: hasEncoder('libx265') ? 'libx265' : 'hevc',
        hardwareAccelerated: hasNVENC || hasQSV,
        supportedContainers: ['mp4', 'mov'],
        notes: 'Kompresi 50% lebih efisien, ideal untuk 4K.',
      },
      {
        id: 'av1',
        name: 'AV1 (AOMedia Video 1)',
        available: hasAV1,
        encoderName: hasEncoder('libaom-av1') ? 'libaom-av1' : 'av1',
        hardwareAccelerated: false,
        supportedContainers: ['mp4', 'webm'],
        notes: 'Format generasi masa depan bebas royalti, kompresi maksimal.',
      },
      {
        id: 'prores',
        name: 'Apple ProRes 422 / 4444 (Master Quality)',
        available: hasProRes,
        encoderName: hasEncoder('prores_ks') ? 'prores_ks' : 'prores',
        hardwareAccelerated: false,
        supportedContainers: ['mov'],
        notes: 'Codec master broadcast profesional tanpa artefak kompresi temporal.',
      },
      {
        id: 'vp9',
        name: 'VP9 Google Open Video',
        available: hasVP9,
        encoderName: hasEncoder('libvpx-vp9') ? 'libvpx-vp9' : 'vp9',
        hardwareAccelerated: false,
        supportedContainers: ['webm'],
        notes: 'Optimal untuk playback HTML5 web dan transparansi alpha.',
      },
    ],
    audioCodecs: [
      {
        id: 'aac',
        name: 'AAC (Advanced Audio Coding)',
        available: hasAAC,
        encoderName: 'aac',
        supportedContainers: ['mp4', 'mov'],
      },
      {
        id: 'opus',
        name: 'Opus Interactive Audio',
        available: hasOpus,
        encoderName: hasEncoder('libopus') ? 'libopus' : 'opus',
        supportedContainers: ['webm', 'mp4'],
      },
      {
        id: 'pcm',
        name: 'PCM Uncompressed Audio (16/24-bit)',
        available: hasPCM,
        encoderName: 'pcm_s16le',
        supportedContainers: ['mov'],
      },
    ],
    hardwareEncoders: {
      nvenc: hasNVENC,
      amf: hasAMF,
      qsv: hasQSV,
      videotoolbox: hasVideoToolbox,
      vaapi: hasVAAPI,
    },
    supportedFilters: [
      'scale',
      'pad',
      'boxblur',
      'colorkey',
      'eq',
      'curves',
      'lut3d',
      'subtitles',
      'volume',
      'loudnorm',
    ],
  };

  return cachedCapabilities;
}

export function handleRenderApi(req: IncomingMessage, res: ServerResponse): boolean {
  const url = req.url || '';
  if (!url.startsWith('/api/render')) {
    return false;
  }

  res.setHeader('Content-Type', 'application/json');

  // 1. GET /api/render/capabilities
  if (url === '/api/render/capabilities' && req.method === 'GET') {
    const caps = getSystemCapabilities();
    res.end(JSON.stringify(caps));
    return true;
  }

  // 2. POST /api/render/preflight
  if (url === '/api/render/preflight' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const settings = payload.settings || {};
        const durationSec = payload.durationSec || 60;
        const fps = settings.fps || 30;
        const totalFrames = Math.ceil(durationSec * fps);

        // Calculate approximate bitrate
        const bitrateMbps = settings.targetBitrateMbps || 10;
        const requiredBytes = Math.ceil((bitrateMbps * 1000000 * durationSec) / 8 * 1.15); // +15% overhead

        // Check available disk space
        let availableBytes: number | undefined;
        try {
          const dfOut = execSync('df -k .', { encoding: 'utf-8' });
          const lines = dfOut.trim().split('\n');
          if (lines.length > 1) {
            const parts = lines[1].split(/\s+/);
            if (parts[3]) {
              availableBytes = parseInt(parts[3], 10) * 1024;
            }
          }
        } catch {
          // ignore
        }

        const issues: any[] = [];
        if (availableBytes !== undefined && availableBytes < requiredBytes) {
          issues.push({
            severity: 'error',
            title: 'Ruang Disk Tidak Cukup',
            message: `Dibutuhkan minimal ${(requiredBytes / 1024 / 1024).toFixed(1)} MB, hanya tersedia ${(availableBytes / 1024 / 1024).toFixed(1)} MB.`,
          });
        }

        res.end(
          JSON.stringify({
            ready: issues.filter((i) => i.severity === 'error').length === 0,
            canProceed: issues.filter((i) => i.severity === 'error').length === 0,
            issues,
            diskSpace: {
              requiredBytes,
              availableBytes,
              status: availableBytes && availableBytes < requiredBytes ? 'warning' : 'ok',
            },
            totalEstimatedFrames: totalFrames,
            totalDurationSec: durationSec,
          })
        );
      } catch (err: any) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // 3. POST /api/render/start
  if (url === '/api/render/start' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const { jobId, settings, args, durationSec, fps } = payload;

        if (!jobId || !Array.isArray(args) || args.length === 0) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'jobId and args array are required' }));
          return;
        }

        // Determine destination file path
        let outPath = settings?.outputPath;
        if (!outPath) {
          const ext = settings?.format === 'webm' ? '.webm' : settings?.format === 'mov' ? '.mov' : '.mp4';
          const exportDir = path.resolve(process.cwd(), 'exports');
          if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
          }
          outPath = path.join(exportDir, `Render_${jobId}_${Date.now()}${ext}`);
        } else {
          const dir = path.dirname(outPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        }

        const sanitizedArgs = [...args];
        // Replace destination in args if placeholder exists
        const lastIdx = sanitizedArgs.length - 1;
        sanitizedArgs[lastIdx] = outPath;

        const totalDuration = durationSec || 10;
        const frameRate = fps || 30;
        const totalFrames = Math.max(1, Math.ceil(totalDuration * frameRate));

        const info: ActiveProcessInfo = {
          jobId,
          process: {} as any,
          outputPath: outPath,
          totalDurationSec: totalDuration,
          totalFrames,
          fps: frameRate,
          startTime: Date.now(),
          lastProgress: {
            percentage: 0,
            currentFrame: 0,
            totalFrames,
            fps: 0,
            renderSpeedRealtime: 0,
            elapsedSeconds: 0,
            remainingSeconds: totalDuration,
            currentBitrateKbps: 0,
            currentStage: 'Encoding timeline',
          },
          status: 'rendering',
          logs: [`[Nusantara FFmpeg] Spawning process for Job: ${jobId}`, `[Command] ffmpeg ${sanitizedArgs.join(' ')}`],
        };

        const proc = spawn('ffmpeg', sanitizedArgs);
        info.process = proc;
        activeProcesses.set(jobId, info);

        proc.stderr.on('data', (data: Buffer) => {
          const text = data.toString();
          info.logs.push(text);
          if (info.logs.length > 500) {
            info.logs = info.logs.slice(-300);
          }

          // Parse progress from FFmpeg stderr line:
          // frame=  120 fps= 48.2 q=28.0 size=    1200kB time=00:00:04.00 bitrate=2450.0kbits/s speed=1.60x
          const frameMatch = text.match(/frame=\s*(\d+)/);
          const fpsMatch = text.match(/fps=\s*([\d.]+)/);
          const timeMatch = text.match(/time=\s*(\d+):(\d+):([\d.]+)/);
          const speedMatch = text.match(/speed=\s*([\d.]+)x/);
          const bitrateMatch = text.match(/bitrate=\s*([\d.]+)kbits\/s/);

          let currentFrame = info.lastProgress.currentFrame;
          if (frameMatch) {
            currentFrame = parseInt(frameMatch[1], 10);
          }

          let elapsedSec = (Date.now() - info.startTime) / 1000;
          let currentFps = fpsMatch ? parseFloat(fpsMatch[1]) : info.fps;
          let speed = speedMatch ? parseFloat(speedMatch[1]) : 1.0;
          let bitrate = bitrateMatch ? parseFloat(bitrateMatch[1]) : 0;

          let timeSec = 0;
          if (timeMatch) {
            timeSec =
              parseInt(timeMatch[1], 10) * 3600 +
              parseInt(timeMatch[2], 10) * 60 +
              parseFloat(timeMatch[3]);
          }

          let pct = Math.min(99, Math.round((currentFrame / totalFrames) * 100));
          if (timeSec > 0 && totalDuration > 0) {
            const timePct = Math.min(99, Math.round((timeSec / totalDuration) * 100));
            pct = Math.max(pct, timePct);
          }

          let remainingSec = 0;
          if (pct > 0) {
            remainingSec = Math.max(0, Math.round(((100 - pct) / pct) * elapsedSec));
          }

          info.lastProgress = {
            percentage: pct,
            currentFrame,
            totalFrames,
            fps: currentFps,
            renderSpeedRealtime: speed,
            elapsedSeconds: Math.round(elapsedSec),
            remainingSeconds: remainingSec,
            currentBitrateKbps: bitrate,
            currentStage: `Frame ${currentFrame} / ${totalFrames}`,
          };
        });

        proc.on('close', (code) => {
          if (code === 0) {
            info.status = 'completed';
            info.lastProgress.percentage = 100;
            info.lastProgress.currentFrame = totalFrames;
            info.lastProgress.remainingSeconds = 0;
            info.logs.push(`[Nusantara FFmpeg] Job completed successfully (Exit Code 0). Output: ${outPath}`);

            // Add to history
            exportHistory.unshift({
              id: `hist-${Date.now()}`,
              jobId,
              date: new Date().toISOString(),
              projectName: payload.projectName || 'Proyek Video',
              presetName: settings?.qualityPreset || 'Standard',
              format: settings?.format || 'mp4',
              resolution: `${settings?.width || 1920}×${settings?.height || 1080}`,
              duration: `${totalDuration.toFixed(1)}s`,
              outputPath: outPath,
              fileSizeBytes: fs.existsSync(outPath) ? fs.statSync(outPath).size : 0,
              status: 'completed',
            });
          } else if (info.status !== 'cancelled') {
            info.status = 'failed';
            info.error = `FFmpeg exited with error code ${code}`;
            info.logs.push(`[Nusantara FFmpeg] Job failed with exit code ${code}`);
          }
        });

        proc.on('error', (err) => {
          info.status = 'failed';
          info.error = err.message;
          info.logs.push(`[Nusantara FFmpeg] Process error: ${err.message}`);
        });

        res.end(
          JSON.stringify({
            success: true,
            jobId,
            outputPath: outPath,
            message: 'FFmpeg process started successfully',
          })
        );
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // 4. GET /api/render/progress?jobId=...
  if (url.startsWith('/api/render/progress') && req.method === 'GET') {
    const qIndex = url.indexOf('?');
    const params = new URLSearchParams(qIndex !== -1 ? url.substring(qIndex) : '');
    const jobId = params.get('jobId') || '';

    const info = activeProcesses.get(jobId);
    if (!info) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Job not found' }));
      return true;
    }

    res.end(
      JSON.stringify({
        jobId,
        status: info.status,
        outputPath: info.outputPath,
        progress: info.lastProgress,
        error: info.error,
        logs: info.logs.slice(-30),
      })
    );
    return true;
  }

  // 5. POST /api/render/pause
  if (url === '/api/render/pause' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { jobId } = JSON.parse(body || '{}');
      const info = activeProcesses.get(jobId);
      if (info && info.process && info.status === 'rendering') {
        try {
          info.process.kill('SIGSTOP');
          info.status = 'paused';
          info.logs.push('[Nusantara FFmpeg] Process paused via SIGSTOP');
          res.end(JSON.stringify({ success: true, status: 'paused' }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Cannot pause job' }));
      }
    });
    return true;
  }

  // 6. POST /api/render/resume
  if (url === '/api/render/resume' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { jobId } = JSON.parse(body || '{}');
      const info = activeProcesses.get(jobId);
      if (info && info.process && info.status === 'paused') {
        try {
          info.process.kill('SIGCONT');
          info.status = 'rendering';
          info.logs.push('[Nusantara FFmpeg] Process resumed via SIGCONT');
          res.end(JSON.stringify({ success: true, status: 'rendering' }));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      } else {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Cannot resume job' }));
      }
    });
    return true;
  }

  // 7. POST /api/render/cancel
  if (url === '/api/render/cancel' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const { jobId } = JSON.parse(body || '{}');
      const info = activeProcesses.get(jobId);
      if (info) {
        info.status = 'cancelled';
        info.logs.push('[Nusantara FFmpeg] Process cancelled by user');
        if (info.process && info.process.kill) {
          try {
            info.process.kill('SIGKILL');
          } catch {}
        }
        // Clean up partial file
        if (info.outputPath && fs.existsSync(info.outputPath)) {
          try {
            fs.unlinkSync(info.outputPath);
            info.logs.push('[Nusantara FFmpeg] Temporary output file cleaned up');
          } catch {}
        }
        res.end(JSON.stringify({ success: true, status: 'cancelled' }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Job not found' }));
      }
    });
    return true;
  }

  // 8. POST /api/render/validate
  if (url === '/api/render/validate' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { filePath } = JSON.parse(body || '{}');
        if (!filePath || !fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'File output not found' }));
          return;
        }

        const stat = fs.statSync(filePath);
        let ffprobeData: any = null;
        try {
          const probeOut = execSync(
            `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`,
            { encoding: 'utf-8', timeout: 5000 }
          );
          ffprobeData = JSON.parse(probeOut);
        } catch {
          // fallback
        }

        const videoStream = ffprobeData?.streams?.find((s: any) => s.codec_type === 'video');
        const audioStream = ffprobeData?.streams?.find((s: any) => s.codec_type === 'audio');
        const formatData = ffprobeData?.format || {};

        let fps = 30;
        if (videoStream?.r_frame_rate) {
          const parts = videoStream.r_frame_rate.split('/');
          if (parts.length === 2 && parseInt(parts[1], 10) > 0) {
            fps = Math.round((parseInt(parts[0], 10) / parseInt(parts[1], 10)) * 100) / 100;
          }
        }

        const report: OutputValidationReport = {
          isValid: stat.size > 0 && !!videoStream,
          filePath,
          fileSizeBytes: stat.size,
          durationSec: parseFloat(formatData.duration || videoStream?.duration || '0'),
          width: videoStream?.width || 1920,
          height: videoStream?.height || 1080,
          fps,
          videoCodec: videoStream?.codec_name || 'h264',
          audioCodec: audioStream?.codec_name || 'aac',
          bitrateKbps: Math.round(parseInt(formatData.bit_rate || '0', 10) / 1000),
          hasVideoStream: !!videoStream,
          hasAudioStream: !!audioStream,
          validationWarnings: [],
          inspectedAt: new Date().toISOString(),
        };

        res.end(JSON.stringify(report));
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return true;
  }

  // 9. GET /api/render/history
  if (url === '/api/render/history' && req.method === 'GET') {
    res.end(JSON.stringify(exportHistory));
    return true;
  }

  // 10. GET /api/render/download?path=...
  if (url.startsWith('/api/render/download') && req.method === 'GET') {
    const qIndex = url.indexOf('?');
    const params = new URLSearchParams(qIndex !== -1 ? url.substring(qIndex) : '');
    const targetPath = params.get('path') || '';

    if (!targetPath || !fs.existsSync(targetPath)) {
      res.statusCode = 404;
      res.end('File not found');
      return true;
    }

    const stat = fs.statSync(targetPath);
    const filename = path.basename(targetPath);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    const readStream = fs.createReadStream(targetPath);
    readStream.pipe(res);
    return true;
  }

  return false;
}
