/**
 * Nusantara Video Studio - Subtitle Parser & Exporter Engine
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Implements high-precision SRT, WebVTT, and ASS/SSA parsing and exporting,
 * strict timing validation, overlap detection, split/merge algorithms,
 * search & replace, and full UTF-8 Unicode preservation (Indonesian punctuation, diacritics).
 */

import { SubtitleItem } from '../../types';

export interface SubtitleValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  overlaps: { indexA: number; indexB: number; startA: number; endA: number; startB: number; endB: number }[];
}

export class SubtitleParser {
  /**
   * Convert seconds (float) to SRT timestamp string "HH:MM:SS,mmm"
   */
  static secondsToSrtTime(totalSeconds: number): string {
    const validSeconds = Math.max(0, isNaN(totalSeconds) ? 0 : totalSeconds);
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const seconds = Math.floor(validSeconds % 60);
    const milliseconds = Math.floor((validSeconds % 1) * 1000);

    const pad = (num: number, size = 2) => String(num).padStart(size, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
  }

  /**
   * Convert seconds (float) to WebVTT timestamp string "HH:MM:SS.mmm"
   */
  static secondsToVttTime(totalSeconds: number): string {
    const validSeconds = Math.max(0, isNaN(totalSeconds) ? 0 : totalSeconds);
    const hours = Math.floor(validSeconds / 3600);
    const minutes = Math.floor((validSeconds % 3600) / 60);
    const seconds = Math.floor(validSeconds % 60);
    const milliseconds = Math.floor((validSeconds % 1) * 1000);

    const pad = (num: number, size = 2) => String(num).padStart(size, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
  }

  /**
   * Parse timestamp string to seconds (handles both comma and dot for milliseconds)
   */
  static parseTimestampToSeconds(timeStr: string): number {
    const cleaned = timeStr.trim().replace(',', '.');
    const parts = cleaned.split(':');

    if (parts.length === 3) {
      const hours = parseFloat(parts[0]);
      const minutes = parseFloat(parts[1]);
      const seconds = parseFloat(parts[2]);
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const minutes = parseFloat(parts[0]);
      const seconds = parseFloat(parts[1]);
      return minutes * 60 + seconds;
    } else {
      const sec = parseFloat(cleaned);
      return isNaN(sec) ? 0 : sec;
    }
  }

  /**
   * Parses SubRip (.srt) text content into SubtitleItem array
   */
  static parseSRT(content: string): SubtitleItem[] {
    if (!content) return [];

    // Strip UTF-8 BOM if present and normalize line endings
    const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.trim().split(/\n\s*\n/);
    const items: SubtitleItem[] = [];

    blocks.forEach((block, blockIndex) => {
      const lines = block.trim().split('\n');
      if (lines.length === 0) return;

      let timeLineIdx = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('-->')) {
          timeLineIdx = i;
          break;
        }
      }

      if (timeLineIdx === -1) return;

      const timeLine = lines[timeLineIdx];
      const timeParts = timeLine.split('-->');
      if (timeParts.length !== 2) return;

      const startTime = this.parseTimestampToSeconds(timeParts[0]);
      // Remove any trailing VTT positioning parameters if mixed
      const endTimeRaw = timeParts[1].trim().split(/\s+/)[0];
      const endTime = this.parseTimestampToSeconds(endTimeRaw);

      const textLines = lines.slice(timeLineIdx + 1);
      const text = textLines.join('\n').trim();

      items.push({
        id: `sub-${Date.now()}-${blockIndex}-${Math.random().toString(36).substring(2, 6)}`,
        index: blockIndex + 1,
        startTime,
        endTime: Math.max(startTime + 0.1, endTime),
        text,
      });
    });

    return items.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Parses WebVTT (.vtt) text content into SubtitleItem array
   */
  static parseVTT(content: string): SubtitleItem[] {
    if (!content) return [];

    const normalized = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // Remove WEBVTT header and any leading comments/NOTE blocks
    const lines = normalized.split('\n');
    let startIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        // Find beginning of this cue block
        startIndex = i > 0 && lines[i - 1].trim() !== '' && !lines[i - 1].startsWith('NOTE') ? i - 1 : i;
        break;
      }
    }

    const cueContent = lines.slice(startIndex).join('\n');
    const blocks = cueContent.trim().split(/\n\s*\n/);
    const items: SubtitleItem[] = [];

    blocks.forEach((block, blockIndex) => {
      if (!block.trim() || block.trim().startsWith('NOTE')) return;

      const blockLines = block.trim().split('\n');
      let timeLineIdx = -1;
      for (let i = 0; i < blockLines.length; i++) {
        if (blockLines[i].includes('-->')) {
          timeLineIdx = i;
          break;
        }
      }

      if (timeLineIdx === -1) return;

      const timeLine = blockLines[timeLineIdx];
      const timeParts = timeLine.split('-->');
      if (timeParts.length !== 2) return;

      const startTime = this.parseTimestampToSeconds(timeParts[0]);
      const endTimeRaw = timeParts[1].trim().split(/\s+/)[0];
      const endTime = this.parseTimestampToSeconds(endTimeRaw);

      const textLines = blockLines.slice(timeLineIdx + 1);
      // Clean standard VTT formatting tags like <b>, <i>, <c.color> while preserving text
      const rawText = textLines.join('\n').trim();
      const text = rawText.replace(/<[^>]+>/g, '');

      items.push({
        id: `vtt-${Date.now()}-${blockIndex}-${Math.random().toString(36).substring(2, 6)}`,
        index: blockIndex + 1,
        startTime,
        endTime: Math.max(startTime + 0.1, endTime),
        text,
      });
    });

    return items.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Adapter for Advanced SubStation Alpha (.ass / .ssa) format
   */
  static parseASS(content: string): SubtitleItem[] {
    if (!content) return [];

    const lines = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const items: SubtitleItem[] = [];
    let inEvents = false;
    let formatFields: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.toLowerCase() === '[events]') {
        inEvents = true;
        continue;
      }

      if (inEvents) {
        if (line.startsWith('[')) {
          // Another section reached
          break;
        }

        if (line.startsWith('Format:')) {
          formatFields = line
            .substring(7)
            .split(',')
            .map((f) => f.trim().toLowerCase());
          continue;
        }

        if (line.startsWith('Dialogue:')) {
          const rawValues = line.substring(9).trim();
          const startIdx = formatFields.indexOf('start');
          const endIdx = formatFields.indexOf('end');
          const textIdx = formatFields.indexOf('text');

          const parts = rawValues.split(',');
          // In ASS, text is everything after the last format field
          if (parts.length >= formatFields.length && startIdx !== -1 && endIdx !== -1) {
            const startStr = parts[startIdx];
            const endStr = parts[endIdx];
            const textParts = parts.slice(textIdx);
            let text = textParts.join(',');

            // Clean ASS override tags like {\b1}, {\c&H0000FF&}, etc. and line break \N
            text = text.replace(/\{[^}]+\}/g, '').replace(/\\N/g, '\n').trim();

            const startTime = this.parseTimestampToSeconds(startStr);
            const endTime = this.parseTimestampToSeconds(endStr);

            items.push({
              id: `ass-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 6)}`,
              index: items.length + 1,
              startTime,
              endTime: Math.max(startTime + 0.1, endTime),
              text,
            });
          }
        }
      }
    }

    return items.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Export SubtitleItem array to standard SubRip (.srt) format with UTF-8
   */
  static exportToSRT(items: SubtitleItem[]): string {
    const sorted = [...items].sort((a, b) => a.startTime - b.startTime);
    const blocks = sorted.map((item, idx) => {
      const start = this.secondsToSrtTime(item.startTime);
      const end = this.secondsToSrtTime(item.endTime);
      return `${idx + 1}\n${start} --> ${end}\n${item.text.trim()}`;
    });

    return blocks.join('\n\n') + '\n';
  }

  static exportSRT(items: SubtitleItem[]): string {
    return this.exportToSRT(items);
  }

  /**
   * Export SubtitleItem array to WebVTT (.vtt) format with UTF-8
   */
  static exportToVTT(items: SubtitleItem[]): string {
    const sorted = [...items].sort((a, b) => a.startTime - b.startTime);
    const header = 'WEBVTT - Nusantara Video Studio Subtitle Track\n\n';
    const blocks = sorted.map((item, idx) => {
      const start = this.secondsToVttTime(item.startTime);
      const end = this.secondsToVttTime(item.endTime);
      return `${idx + 1}\n${start} --> ${end}\n${item.text.trim()}`;
    });

    return header + blocks.join('\n\n') + '\n';
  }

  static exportVTT(items: SubtitleItem[]): string {
    return this.exportToVTT(items);
  }

  /**
   * Single subtitle item timing validation
   */
  static validateTiming(startTime: number, endTime: number): { valid: boolean; error?: string } {
    if (startTime < 0) {
      return { valid: false, error: 'Start time tidak boleh negatif.' };
    }
    if (endTime <= startTime) {
      return { valid: false, error: 'End time harus lebih besar dari start time.' };
    }
    if (endTime - startTime <= 0) {
      return { valid: false, error: 'Subtitle tidak boleh memiliki durasi nol.' };
    }
    return { valid: true };
  }

  /**
   * Detect overlapping subtitle intervals in an array
   */
  static detectOverlaps(items: SubtitleItem[]): SubtitleValidationResult['overlaps'] {
    const res = this.validateSubtitles(items);
    return res.overlaps;
  }

  /**
   * Export SubtitleItem array to ASS/SSA format
   */
  static exportToASS(items: SubtitleItem[], title = 'Nusantara Video Studio Subtitles'): string {
    const sorted = [...items].sort((a, b) => a.startTime - b.startTime);
    let output = `[Script Info]\nTitle: ${title}\nScriptType: v4.00+\nWrapStyle: 0\nPlayResX: 1920\nPlayResY: 1080\nScaledBorderAndShadow: yes\n\n`;
    output += `[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n`;
    output += `Style: Default,Inter,48,&H00FFFFFF,&H000000FF,&H00000000,&H90000000,-1,0,0,0,100,100,0,0,1,2,2,2,40,40,30,1\n\n`;
    output += `[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

    sorted.forEach((item) => {
      const start = this.secondsToVttTime(item.startTime);
      const end = this.secondsToVttTime(item.endTime);
      const escapedText = item.text.replace(/\n/g, '\\N');
      output += `Dialogue: 0,${start},${end},Default,,0,0,0,,${escapedText}\n`;
    });

    return output;
  }

  /**
   * Timing validation according to requirement 11:
   * - Start time tidak boleh negatif
   * - End time harus lebih besar dari start time
   * - Subtitle tidak boleh memiliki durasi nol
   * - Subtitle yang saling bertumpuk harus diberi peringatan (bukan otomatis dihapus)
   */
  static validateSubtitles(items: SubtitleItem[]): SubtitleValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const overlaps: SubtitleValidationResult['overlaps'] = [];

    const sorted = [...items].sort((a, b) => a.startTime - b.startTime);

    sorted.forEach((item, index) => {
      if (item.startTime < 0) {
        errors.push(`Subtitle #${item.index || index + 1}: Start time tidak boleh negatif (${item.startTime}s).`);
      }

      if (item.endTime <= item.startTime) {
        errors.push(
          `Subtitle #${item.index || index + 1}: End time (${item.endTime}s) harus lebih besar dari start time (${item.startTime}s).`
        );
      }

      if (item.endTime - item.startTime <= 0) {
        errors.push(`Subtitle #${item.index || index + 1}: Subtitle tidak boleh memiliki durasi nol.`);
      }

      // Check overlap with next item
      if (index < sorted.length - 1) {
        const next = sorted[index + 1];
        if (next.startTime < item.endTime) {
          overlaps.push({
            indexA: item.index || index + 1,
            indexB: next.index || index + 2,
            startA: item.startTime,
            endA: item.endTime,
            startB: next.startTime,
            endB: next.endTime,
          });
          warnings.push(
            `Peringatan Overlap: Subtitle #${item.index || index + 1} (${item.startTime.toFixed(2)}s - ${item.endTime.toFixed(
              2
            )}s) bertumpuk dengan Subtitle #${next.index || index + 2} (${next.startTime.toFixed(2)}s - ${next.endTime.toFixed(
              2
            )}s).`
          );
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      overlaps,
    };
  }

  /**
   * Split a subtitle at a given split timestamp into two items
   */
  static splitSubtitle(item: SubtitleItem, splitTime: number): [SubtitleItem, SubtitleItem] | null {
    if (splitTime <= item.startTime || splitTime >= item.endTime) {
      return null;
    }

    const words = item.text.trim().split(/\s+/);
    const midWord = Math.max(1, Math.floor(words.length / 2));
    const firstText = words.slice(0, midWord).join(' ') || item.text;
    const secondText = words.slice(midWord).join(' ') || item.text;

    const first: SubtitleItem = {
      ...item,
      id: `${item.id}-part1`,
      endTime: splitTime,
      text: firstText,
    };

    const second: SubtitleItem = {
      ...item,
      id: `${item.id}-part2`,
      index: (item.index || 1) + 1,
      startTime: splitTime,
      text: secondText,
    };

    return [first, second];
  }

  /**
   * Merge two adjacent subtitles
   */
  static mergeSubtitles(item1: SubtitleItem, item2: SubtitleItem): SubtitleItem {
    const minStart = Math.min(item1.startTime, item2.startTime);
    const maxEnd = Math.max(item1.endTime, item2.endTime);
    const combinedText = `${item1.text.trim()}\n${item2.text.trim()}`;

    return {
      id: item1.id,
      index: Math.min(item1.index || 1, item2.index || 2),
      startTime: minStart,
      endTime: maxEnd,
      text: combinedText,
      style: item1.style || item2.style,
    };
  }

  /**
   * Search and replace text across subtitle items with match count
   */
  static findAndReplace(
    items: SubtitleItem[],
    search: string,
    replacement: string,
    matchCase = false
  ): { items: SubtitleItem[]; matchCount: number } {
    if (!search) return { items, matchCount: 0 };

    let totalMatches = 0;
    const flags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

    const updated = items.map((item) => {
      const matches = item.text.match(regex);
      if (matches) {
        totalMatches += matches.length;
        return {
          ...item,
          text: item.text.replace(regex, replacement),
        };
      }
      return item;
    });

    return { items: updated, matchCount: totalMatches };
  }
}
