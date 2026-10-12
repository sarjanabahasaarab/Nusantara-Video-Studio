/**
 * Nusantara Video Studio - Transcription & Subtitle Generation Capability
 * Phase 7: AI-Assisted Editing
 *
 * Implements transcript segment structures, word-level timing interpolation,
 * speaker diarization labeling, and formatting of transcripts into standard subtitle cues.
 */

import { TranscriptData, TranscriptSegment, WordTimestamp } from '../../types/ai';
import { SubtitleItem } from '../../types';

export interface SubtitleGenerationOptions {
  language?: string; // default 'auto'
  maxCharsPerLine?: number; // default 42
  maxLines?: number; // default 2
  minDurationSec?: number; // default 1.2s
}

export class TranscriptionEngine {
  /**
   * Splits a long text segment into balanced lines respecting max characters per line
   */
  static wrapTextIntoLines(text: string, maxCharsPerLine = 42, maxLines = 2): string {
    const words = text.trim().split(/\s+/);
    if (words.length === 0) return '';

    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (!currentLine) {
        currentLine = word;
      } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length === maxLines - 1) {
          // If approaching line limit, keep rest of words together on last line
          break;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }

  /**
   * Converts high-level transcript data into timeline-ready SubtitleItem array
   */
  static convertToSubtitles(
    transcript: TranscriptData,
    options: SubtitleGenerationOptions = {}
  ): SubtitleItem[] {
    const maxChars = options.maxCharsPerLine ?? 42;
    const maxLines = options.maxLines ?? 2;
    const minDuration = options.minDurationSec ?? 1.2;

    const subtitleItems: SubtitleItem[] = [];

    for (let i = 0; i < transcript.segments.length; i++) {
      const seg = transcript.segments[i];
      const rawText = seg.text.trim();
      if (!rawText) continue;

      const duration = Math.max(minDuration, seg.end - seg.start);
      const formattedText = this.wrapTextIntoLines(rawText, maxChars, maxLines);

      subtitleItems.push({
        id: `sub-item-${i + 1}-${Date.now().toString(36)}`,
        index: i + 1,
        startTime: seg.start,
        endTime: seg.start + duration,
        text: formattedText,
        speaker: seg.speaker,
      });
    }

    return subtitleItems;
  }

  /**
   * Interpolates or constructs word-level timestamps for segments when exact word bounds are provided
   */
  static alignWordsToSegment(
    text: string,
    segStart: number,
    segEnd: number
  ): WordTimestamp[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];

    const duration = Math.max(0.1, segEnd - segStart);
    const wordDuration = duration / words.length;

    return words.map((w, idx) => ({
      id: `w-${idx + 1}-${w}`,
      word: w,
      start: Math.round((segStart + idx * wordDuration) * 1000) / 1000,
      end: Math.round((segStart + (idx + 1) * wordDuration) * 1000) / 1000,
      confidence: 0.95,
    }));
  }
}
