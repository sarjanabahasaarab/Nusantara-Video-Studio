/**
 * Nusantara Video Studio - AI Workspace
 * Phase 7: AI-Assisted Editing
 *
 * Professional AI editing workspace integrating AIAssistantPanel,
 * active tool configuration views, and the AIJobCenter.
 */

import React from 'react';
import { useAIStore } from '../../stores/aiStore';
import { AIAssistantPanel } from './AIAssistantPanel';
import { AIJobCenter } from './AIJobCenter';
import { SceneDetectionPanel } from './SceneDetectionPanel';
import { SilenceDetectionPanel } from './SilenceDetectionPanel';
import { SmartCutAssistant } from './SmartCutAssistant';
import { TranscriptionPanel } from './TranscriptionPanel';
import { SmartReframePanel } from './SmartReframePanel';
import { AudioCleanupPanel } from './AudioCleanupPanel';
import { AlertCircle, Layers, Smile } from 'lucide-react';

export const AIWorkspace: React.FC = () => {
  const selectedTool = useAIStore((s) => s.selectedTool);

  const renderActiveToolPanel = () => {
    switch (selectedTool) {
      case 'scene-detection':
        return <SceneDetectionPanel />;
      case 'silence-detection':
        return <SilenceDetectionPanel />;
      case 'smart-cut':
        return <SmartCutAssistant />;
      case 'transcription':
      case 'subtitle-generation':
        return <TranscriptionPanel />;
      case 'smart-reframe':
        return <SmartReframePanel />;
      case 'audio-cleanup':
        return <AudioCleanupPanel />;
      case 'object-detection':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-[#151824] border border-[#22293b] rounded-xl p-6 max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Object Detection (YOLO / Cloud Vision)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Status: <strong className="text-amber-400 font-mono">Provider Required</strong>. Model bobot ONNX lokal (YOLOv8) belum dimuat ke memori browser. Nusantara Video Studio mematuhi prinsip kejujuran AI dan tidak menampilkan bounding box palsu.
              </p>
              <div className="text-[11px] text-slate-500 bg-[#0d0f15] p-2.5 rounded border border-[#202738] text-left">
                Untuk mengaktifkan deteksi objek:
                <br />1. Pasang modul native Tauri YOLOv8, atau
                <br />2. Aktifkan Cloud AI Provider di Settings → AI.
              </div>
            </div>
          </div>
        );
      case 'face-detection':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-[#151824] border border-[#22293b] rounded-xl p-6 max-w-md space-y-3">
              <div className="w-12 h-12 rounded-full bg-yellow-950/60 border border-yellow-500/30 flex items-center justify-center mx-auto text-yellow-400">
                <Smile className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Face Detection & Subject Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Status: <strong className="text-amber-400 font-mono">Provider Required</strong>. Model pendeteksi wajah (MediaPipe / FaceMesh) belum dipasang. Silakan konfigurasikan penyedia model di preferensi aplikasi.
              </p>
            </div>
          </div>
        );
      default:
        return <SceneDetectionPanel />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0f14] overflow-hidden select-none">
      {/* Upper split: Left Assistant Panel + Center Active Tool Panel */}
      <div className="flex-1 flex overflow-hidden">
        <AIAssistantPanel />
        <div className="flex-1 flex flex-col bg-[#10131b] overflow-hidden">
          {renderActiveToolPanel()}
        </div>
      </div>

      {/* Lower split: AI Job Center */}
      <AIJobCenter />
    </div>
  );
};
