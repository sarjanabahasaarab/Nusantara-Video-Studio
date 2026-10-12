/**
 * Nusantara Video Studio - AI Job Center
 * Phase 7: AI-Assisted Editing
 *
 * Professional asynchronous background job queue monitor.
 * Displays real-time job progress, cancellation, retry, and error inspection.
 */

import React from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useUIStore } from '../../stores/uiStore';
import {
  ListRestart,
  Trash2,
  XCircle,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AIJob } from '../../types/ai';

export const AIJobCenter: React.FC = () => {
  const jobs = useAIStore((s) => s.jobs);
  const cancelJob = useAIStore((s) => s.cancelJob);
  const retryJob = useAIStore((s) => s.retryJob);
  const removeJob = useAIStore((s) => s.removeJob);
  const clearCompletedJobs = useAIStore((s) => s.clearCompletedJobs);
  const notify = useUIStore((s) => s.notify);

  const getStatusBadge = (job: AIJob) => {
    switch (job.status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-950/60 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            {job.progress}%
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Done
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] text-rose-400 bg-rose-950/60 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono">
            <AlertCircle className="w-2.5 h-2.5" />
            Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded font-mono">
            <XCircle className="w-2.5 h-2.5" />
            Cancelled
          </span>
        );
      case 'queued':
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono">
            <Clock className="w-2.5 h-2.5" />
            Queued
          </span>
        );
    }
  };

  const formatCapabilityName = (type: string) => {
    switch (type) {
      case 'scene-detection':
        return 'Scene Detection';
      case 'silence-detection':
        return 'Silence Detection';
      case 'transcription':
        return 'Speech Transcription';
      case 'subtitle-generation':
        return 'Subtitle Generation';
      case 'smart-reframe':
        return 'Smart Reframe';
      case 'audio-cleanup':
        return 'Audio Cleanup';
      case 'object-detection':
        return 'Object Detection';
      case 'face-detection':
        return 'Face Detection';
      default:
        return type;
    }
  };

  return (
    <div className="bg-[#12151e] border-t border-[#222838] p-3 flex flex-col h-44">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1f2533]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-slate-200">AI Job Center</span>
          <span className="text-[10px] text-slate-500 font-mono">
            ({jobs.filter((j) => j.status === 'running').length} running, {jobs.length} total)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              clearCompletedJobs();
              notify('AI Job Center', 'Tugas yang selesai telah dibersihkan.', 'info', 1500);
            }}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 hover:text-white bg-[#1a202c] hover:bg-[#252e3e] border border-[#2d3748] rounded transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
            Clear Completed
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {jobs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
            Belum ada AI job yang dijalankan. Pilih alat di panel samping untuk memulai analisis.
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className="bg-[#171b26] border border-[#232b3b] rounded p-2 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3 min-w-44">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-200">{formatCapabilityName(job.type)}</span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                {getStatusBadge(job)}
              </div>

              {/* Progress Bar */}
              <div className="flex-1 max-w-xs">
                {job.status === 'running' && (
                  <div className="w-full bg-[#10131b] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                )}
                {job.error && (
                  <span className="text-[10px] text-rose-400 truncate block max-w-xs" title={job.error}>
                    {job.error}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                {job.status === 'running' && (
                  <button
                    onClick={() => cancelJob(job.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                    title="Cancel Job"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
                {(job.status === 'failed' || job.status === 'cancelled') && (
                  <button
                    onClick={() => retryJob(job.id)}
                    className="p-1 text-slate-400 hover:text-blue-400 hover:bg-blue-950/40 rounded transition-colors"
                    title="Retry Job"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => removeJob(job.id)}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-[#252e3e] rounded transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
