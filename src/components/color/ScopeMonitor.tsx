/**
 * Nusantara Video Studio - Real-Time Video Scope Monitor
 * Phase 6: Professional Color & Audio Studio
 *
 * Real-time hardware-accelerated scopes computed from preview frame pixels:
 * - 256-level Luma & RGB Histogram
 * - Video Waveform monitor (Luma trace & RGB overlay)
 * - Chrominance Vectorscope with 75% SMPTE color targets and skin-tone line
 */

import React, { useEffect, useRef } from 'react';
import { ScopeEngine } from '../../engine/color/ScopeEngine';
import { ScopeType } from '../../types/color';
import { useColorStore } from '../../stores/colorStore';
import { BarChart3, Activity, Disc, Eye, EyeOff } from 'lucide-react';

interface ScopeMonitorProps {
  previewCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
}

export const ScopeMonitor: React.FC<ScopeMonitorProps> = () => {
  const scopes = useColorStore((s) => s.scopes);
  const setScopeSettings = useColorStore((s) => s.setScopeSettings);
  const setActiveScope = useColorStore((s) => s.setActiveScope);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const renderScope = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) {
        animRef.current = requestAnimationFrame(renderScope);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Find preview monitor element to sample pixels
      const monitorEl = document.querySelector('canvas#video-preview-canvas, video#video-preview-element, img#video-preview-image') as HTMLCanvasElement | HTMLVideoElement | HTMLImageElement | null;

      let sampleData: ImageData | null = null;

      if (monitorEl) {
        try {
          const offscreen = document.createElement('canvas');
          offscreen.width = 160;
          offscreen.height = 90;
          const offCtx = offscreen.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(monitorEl, 0, 0, 160, 90);
            sampleData = offCtx.getImageData(0, 0, 160, 90);
          }
        } catch {
          // cross-origin or canvas read restriction
        }
      }

      // Clear scope background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Grid reticle lines
      ctx.strokeStyle = '#1b2333';
      ctx.lineWidth = 1;
      for (let y = 0; y <= height; y += height / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!sampleData) {
        // Fallback grid pattern if no active playback
        ctx.fillStyle = '#475569';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MENUNGGU SINYAL FRAME PREVIEW', width / 2, height / 2);
        animRef.current = requestAnimationFrame(renderScope);
        return;
      }

      if (scopes.activeScope === 'histogram') {
        // Render 256-bin Histogram
        const hist = ScopeEngine.computeHistogram(sampleData, scopes.samplingRate);
        const max = hist.maxCount;

        ctx.globalCompositeOperation = 'screen';

        // Red channel
        ctx.fillStyle = 'rgba(239, 68, 68, 0.65)';
        for (let i = 0; i < 256; i++) {
          const h = (hist.red[i] / max) * (height - 16);
          const x = (i / 255) * width;
          ctx.fillRect(x, height - h, width / 256, h);
        }

        // Green channel
        ctx.fillStyle = 'rgba(34, 197, 94, 0.65)';
        for (let i = 0; i < 256; i++) {
          const h = (hist.green[i] / max) * (height - 16);
          const x = (i / 255) * width;
          ctx.fillRect(x, height - h, width / 256, h);
        }

        // Blue channel
        ctx.fillStyle = 'rgba(59, 130, 246, 0.65)';
        for (let i = 0; i < 256; i++) {
          const h = (hist.blue[i] / max) * (height - 16);
          const x = (i / 255) * width;
          ctx.fillRect(x, height - h, width / 256, h);
        }

        // Luma overlay line
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < 256; i++) {
          const h = (hist.luma[i] / max) * (height - 16);
          const x = (i / 255) * width;
          if (i === 0) ctx.moveTo(x, height - h);
          else ctx.lineTo(x, height - h);
        }
        ctx.stroke();

      } else if (scopes.activeScope === 'waveform') {
        // Render Column Waveform (Luma or RGB)
        const wf = ScopeEngine.computeWaveform(sampleData, width);
        const maxD = wf.maxDensity;

        const imgData = ctx.createImageData(width, height);
        const buf = imgData.data;

        for (let col = 0; col < width; col++) {
          for (let row = 0; row < height; row++) {
            const idx = col * height + row;
            const lumaCount = wf.lumaDensity[idx];
            if (lumaCount > 0) {
              const intensity = Math.min(255, Math.round((lumaCount / maxD) * 350 + 40));
              const pixelIdx = (row * width + col) * 4;
              buf[pixelIdx] = Math.round(intensity * 0.4); // Greenish phosphor CRT trace
              buf[pixelIdx + 1] = intensity;
              buf[pixelIdx + 2] = Math.round(intensity * 0.7);
              buf[pixelIdx + 3] = 255;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);

        // 100 IRE & 0 IRE calibration labels
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.textAlign = 'left';
        ctx.fillText('100 IRE (255)', 4, 12);
        ctx.fillText('50 IRE (128)', 4, height / 2);
        ctx.fillText('0 IRE (0)', 4, height - 4);

      } else if (scopes.activeScope === 'vectorscope') {
        // Vectorscope circular graticule with skin-tone line
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY) - 8;

        // Circular boundary
        ctx.strokeStyle = '#223048';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.arc(centerX, centerY, radius * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair
        ctx.beginPath();
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, centerY + radius);
        ctx.stroke();

        // Skin Tone Indicator line (at ~-57 degrees / I-line)
        if (scopes.vectorscopeSkinLine) {
          ctx.strokeStyle = 'rgba(251, 146, 60, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          const skinAngle = (-57 * Math.PI) / 180;
          ctx.lineTo(centerX + Math.cos(skinAngle) * radius, centerY + Math.sin(skinAngle) * radius);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#fb923c';
          ctx.font = '8px monospace';
          ctx.fillText('SKIN TONE', centerX + Math.cos(skinAngle) * radius * 0.6, centerY + Math.sin(skinAngle) * radius * 0.6);
        }

        // Color targets (R, Mg, B, Cy, G, Yl)
        const targets = [
          { name: 'R', angle: -78, color: '#ef4444' },
          { name: 'Mg', angle: -20, color: '#ec4899' },
          { name: 'B', angle: 35, color: '#3b82f6' },
          { name: 'Cy', angle: 102, color: '#06b6d4' },
          { name: 'G', angle: 160, color: '#22c55e' },
          { name: 'Yl', angle: -145, color: '#eab308' },
        ];

        targets.forEach((t) => {
          const rad = (t.angle * Math.PI) / 180;
          const tx = centerX + Math.cos(rad) * radius * 0.75;
          const ty = centerY + Math.sin(rad) * radius * 0.75;
          ctx.fillStyle = t.color;
          ctx.beginPath();
          ctx.arc(tx, ty, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = '8px monospace';
          ctx.fillText(t.name, tx + 4, ty + 2);
        });

        // Scatter chrominance points
        const vs = ScopeEngine.computeVectorscope(sampleData, scopes.samplingRate);
        const maxI = vs.maxIntensity;

        for (let gy = 0; gy < 256; gy += 2) {
          for (let gx = 0; gx < 256; gx += 2) {
            const count = vs.scatterGrid[gy * 256 + gx];
            if (count > 0) {
              const nx = (gx - 128) / 128;
              const ny = (gy - 128) / 128;
              const px = centerX + nx * radius;
              const py = centerY + ny * radius;

              const alpha = Math.min(1, (count / maxI) * 1.5 + 0.3);
              ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
              ctx.fillRect(px, py, 1.5, 1.5);
            }
          }
        }
      }

      animRef.current = requestAnimationFrame(renderScope);
    };

    animRef.current = requestAnimationFrame(renderScope);

    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [scopes.activeScope, scopes.samplingRate, scopes.vectorscopeSkinLine]);

  return (
    <div className="flex flex-col bg-[#0b0e15] border border-[#1f2738] rounded-xl overflow-hidden shadow-lg select-none">
      {/* Top Scope Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#121622] border-b border-[#1c2333]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveScope('waveform')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
              scopes.activeScope === 'waveform'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Waveform</span>
          </button>

          <button
            onClick={() => setActiveScope('histogram')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
              scopes.activeScope === 'histogram'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>Histogram</span>
          </button>

          <button
            onClick={() => setActiveScope('vectorscope')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-colors ${
              scopes.activeScope === 'vectorscope'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Disc className="w-3 h-3" />
            <span>Vectorscope</span>
          </button>
        </div>

        {/* Scope Options */}
        <div className="flex items-center gap-2">
          {scopes.activeScope === 'vectorscope' && (
            <button
              onClick={() => setScopeSettings({ vectorscopeSkinLine: !scopes.vectorscopeSkinLine })}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                scopes.vectorscopeSkinLine
                  ? 'bg-amber-950/40 border-amber-600/40 text-amber-300'
                  : 'text-slate-500 border-transparent'
              }`}
              title="Garis Referensi Warna Kulit (Skin Tone Line)"
            >
              Skin Line
            </button>
          )}

          <span className="text-[9px] font-mono text-slate-500">Real Pixel 60fps</span>
        </div>
      </div>

      {/* Scope Monitor Canvas */}
      <div className="relative w-full h-44 flex items-center justify-center p-1 bg-black">
        <canvas
          ref={canvasRef}
          width={320}
          height={170}
          className="w-full h-full object-contain rounded"
        />
      </div>
    </div>
  );
};
