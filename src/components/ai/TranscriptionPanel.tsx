/**
 * Nusantara Video Studio - Transcription & Speech Engine Panel
 * Phase 7: AI-Assisted Editing
 *
 * Implements speech-to-text review, word-level timing editor,
 * speaker diarization labels, Whisper provider status, and subtitle track generation.
 */

import React, { useState, useEffect } from 'react';
import { useAIStore } from '../../stores/aiStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { useUIStore } from '../../stores/uiStore';
import { WhisperAdapter } from '../../ai/adapters/WhisperAdapter';
import { AutoSubtitleModal } from './AutoSubtitleModal';
import { TranscriptionEngine } from '../../ai/capabilities/transcription';
import {
  Mic,
  Subtitles,
  Clock,
  User,
  AlertTriangle,
  Sparkles,
  FileText,
  Upload,
  Plus,
} from 'lucide-react';
import { TranscriptSegment } from '../../types/ai';

export const TranscriptionPanel: React.FC = () => {
  const currentTranscript = useAIStore((s) => s.currentTranscript);
  const notify = useUIStore((s) => s.notify);
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime);

  const [whisperStatus, setWhisperStatus] = useState<'installed' | 'not_installed' | 'ready' | 'browser_speech_available'>('not_installed');
  const [statusDetails, setStatusDetails] = useState('');
  const [instructions, setInstructions] = useState('');
  const [activeTab, setActiveTab] = useState<'segments' | 'words'>('segments');
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState(false);

  // Editable local segments
  const [segments, setSegments] = useState<TranscriptSegment[]>([]);

  useEffect(() => {
    const adapter = new WhisperAdapter();
    adapter.checkStatus().then((res) => {
      setWhisperStatus(res.status);
      setStatusDetails(res.details);
      setInstructions(res.instructions || '');
    });
  }, []);

  useEffect(() => {
    if (currentTranscript?.segments) {
      setSegments(currentTranscript.segments);
    }
  }, [currentTranscript]);

  const handleImportText = () => {
    const sampleText = prompt(
      'Paste teks transkripsi (format: Waktu Mulai - Waktu Selesai: Teks, atau kalimat per baris):',
      '00:01 - 00:04 Selamat datang di Nusantara Video Studio\n00:05 - 00:08 Kami mempersembahkan Phase 7 AI-Assisted Editing'
    );
    if (!sampleText) return;

    const lines = sampleText.split('\n').filter(Boolean);
    const parsed: TranscriptSegment[] = [];
    let curTime = 0;

    lines.forEach((line, idx) => {
      const match = line.match(/^(\d+:\d+|\d+)\s*-\s*(\d+:\d+|\d+)\s*:\s*(.+)$/);
      if (match) {
        const start = parseFloat(match[1]) || curTime;
        const end = parseFloat(match[2]) || start + 3;
        const text = match[3].trim();
        parsed.push({
          id: `seg-${idx + 1}`,
          start,
          end,
          text,
          confidence: 0.95,
          speaker: idx % 2 === 0 ? 'Speaker 1' : 'Speaker 2',
          words: TranscriptionEngine.alignWordsToSegment(text, start, end),
        });
        curTime = end;
      } else {
        const text = line.trim();
        const duration = Math.max(2, text.split(' ').length * 0.4);
        parsed.push({
          id: `seg-${idx + 1}`,
          start: curTime,
          end: curTime + duration,
          text,
          confidence: 0.95,
          speaker: 'Speaker 1',
          words: TranscriptionEngine.alignWordsToSegment(text, curTime, curTime + duration),
        });
        curTime += duration;
      }
    });

    useAIStore.setState({
      currentTranscript: {
        language: 'id',
        duration: curTime,
        segments: parsed,
        speakers: ['Speaker 1', 'Speaker 2'],
      },
    });
    setSegments(parsed);
    notify('Transcript', `${parsed.length} segmen transkrip dimuat.`, 'success');
  };

  const updateSegmentText = (id: string, newText: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, text: newText } : s))
    );
  };

  const updateSegmentSpeaker = (id: string, speaker: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, speaker } : s))
    );
  };

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
      {/* Whisper Status Card */}
      <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Speech-to-Text Transcription</h3>
              <p className="text-xs text-slate-400">
                Ekstraksi dialog otomatis dengan word-level timing dan speaker identification.
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-lg border ${
              whisperStatus === 'ready' || whisperStatus === 'installed'
                ? 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-950/60 text-amber-400 border-amber-500/30'
            }`}
          >
            {whisperStatus === 'not_installed' ? 'Whisper Provider: Not Installed' : 'Whisper Ready'}
          </span>
        </div>

        {/* Configuration notice if not installed */}
        {whisperStatus === 'not_installed' && (
          <div className="mt-3 bg-[#11141c] border border-amber-500/30 rounded-lg p-3 text-xs text-amber-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Whisper Provider Status: Not Installed</span>
            </div>
            <p className="text-[11px] text-slate-300 whitespace-pre-line leading-relaxed">
              {instructions}
            </p>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={handleImportText}
                className="px-3 py-1 bg-[#1e2638] hover:bg-[#2a344d] text-white rounded text-[11px] border border-[#2e3952] flex items-center gap-1.5"
              >
                <Upload className="w-3 h-3 text-blue-400" />
                Import / Paste Transcript Manual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transcript Review Workspace */}
      {segments.length > 0 && (
        <div className="bg-[#151824] border border-[#22293b] rounded-xl p-4 space-y-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-[#202738]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('segments')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'segments'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Transcript Segments ({segments.length})
              </button>
              <button
                onClick={() => setActiveTab('words')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'words'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Word Timeline (Timing)
              </button>
            </div>

            <button
              onClick={() => setIsSubtitleModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Subtitles className="w-3.5 h-3.5" />
              Generate Subtitles
            </button>
          </div>

          {/* Tab 1: Segments */}
          {activeTab === 'segments' && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {segments.map((seg, idx) => (
                <div
                  key={seg.id}
                  className="bg-[#12151f] border border-[#202738] rounded-lg p-2.5 flex items-start gap-3 text-xs"
                >
                  <button
                    onClick={() => setCurrentTime(seg.start)}
                    className="font-mono text-blue-400 hover:text-blue-300 text-[11px] shrink-0 pt-0.5"
                    title="Jump to timeline time"
                  >
                    {seg.start.toFixed(2)}s - {seg.end.toFixed(2)}s
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-[#1a202c] px-1.5 py-0.5 rounded border border-[#283244]">
                        <User className="w-2.5 h-2.5 text-blue-400" />
                        <input
                          type="text"
                          value={seg.speaker || 'Speaker 1'}
                          onChange={(e) => updateSegmentSpeaker(seg.id, e.target.value)}
                          className="bg-transparent border-none text-slate-200 focus:outline-none w-20"
                        />
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Confidence: {Math.round((seg.confidence || 0.95) * 100)}%
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      value={seg.text}
                      onChange={(e) => updateSegmentText(seg.id, e.target.value)}
                      className="w-full bg-[#0d0f15] border border-[#242c3d] rounded p-1.5 text-slate-200 focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Word Timeline (Requirement 12) */}
          {activeTab === 'words' && (
            <div className="max-h-80 overflow-y-auto space-y-2 p-2 bg-[#0e1118] rounded-lg border border-[#202738]">
              <div className="text-[11px] text-slate-400 mb-2">
                Word-level precision timing. Klik kata untuk melompat ke frame playhead.
              </div>
              <div className="flex flex-wrap gap-2">
                {segments.flatMap((s) => s.words || []).map((w, i) => (
                  <button
                    key={w.id || i}
                    onClick={() => setCurrentTime(w.start)}
                    className="group bg-[#161b27] hover:bg-blue-600/20 border border-[#242c3e] hover:border-blue-500 rounded px-2 py-1 flex flex-col items-center text-center transition-colors"
                  >
                    <span className="text-[10px] font-mono text-slate-500 group-hover:text-blue-400">
                      {w.start.toFixed(2)}s
                    </span>
                    <span className="text-xs font-semibold text-slate-200">{w.word}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto Subtitle Modal Dialog */}
      <AutoSubtitleModal
        isOpen={isSubtitleModalOpen}
        onClose={() => setIsSubtitleModalOpen(false)}
      />
    </div>
  );
};
