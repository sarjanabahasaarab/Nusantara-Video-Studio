/**
 * Nusantara Video Studio - Marker System Engine
 * Phase 8: Professional Editing Workflow
 *
 * Implements typed markers (Scene, Chapter, Review, Edit, AI, Audio, Color),
 * range markers, search/filtering, and CSV/EDL/JSON import & export.
 */

import { Marker, MarkerType } from '../../types';

export const MARKER_TYPE_COLORS: Record<MarkerType, string> = {
  general: '#3b82f6', // blue
  chapter: '#8b5cf6', // purple
  edit: '#ef4444', // red
  review: '#f59e0b', // amber
  scene: '#06b6d4', // cyan
  ai: '#10b981', // emerald
  audio: '#ec4899', // pink
  color: '#eab308', // yellow
  export: '#64748b', // slate
};

export class MarkerManager {
  static createMarker(
    time: number,
    name: string,
    type: MarkerType = 'general',
    options: { description?: string; color?: string; duration?: number; timelineId?: string } = {}
  ): Marker {
    return {
      id: `marker-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timelineId: options.timelineId || 'timeline-primary',
      time: Math.max(0, Math.round(time * 1000) / 1000),
      duration: options.duration,
      name: name.trim() || 'Marker',
      description: options.description || '',
      color: options.color || MARKER_TYPE_COLORS[type],
      type,
    };
  }

  /**
   * Filters and sorts markers by timeline position
   */
  static filterMarkers(
    markers: Marker[],
    query = '',
    filterType: MarkerType | 'all' = 'all'
  ): Marker[] {
    const q = query.toLowerCase().trim();
    return markers
      .filter((m) => {
        if (filterType !== 'all' && m.type !== filterType) return false;
        if (q) {
          return (
            m.name.toLowerCase().includes(q) ||
            (m.description && m.description.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => a.time - b.time);
  }

  /**
   * Exports markers to CSV string
   */
  static exportToCSV(markers: Marker[]): string {
    const header = 'Time (s),Timecode,Type,Name,Description,Color,Duration (s)\n';
    const rows = markers.map((m) => {
      const mins = Math.floor(m.time / 60);
      const secs = (m.time % 60).toFixed(2);
      const timecode = `${String(mins).padStart(2, '0')}:${String(secs).padStart(5, '0')}`;
      const safeName = `"${m.name.replace(/"/g, '""')}"`;
      const safeDesc = `"${(m.description || '').replace(/"/g, '""')}"`;
      return `${m.time.toFixed(3)},${timecode},${m.type},${safeName},${safeDesc},${m.color || ''},${m.duration || 0}`;
    });
    return header + rows.join('\n');
  }

  /**
   * Exports chapter markers in YouTube / MP4 chapters format:
   * 00:00 Introduction
   * 01:25 Chapter 1
   */
  static exportChaptersText(markers: Marker[]): string {
    const chapters = markers
      .filter((m) => m.type === 'chapter' || m.type === 'scene')
      .sort((a, b) => a.time - b.time);

    return chapters
      .map((c) => {
        const mins = Math.floor(c.time / 60);
        const secs = Math.floor(c.time % 60);
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        return `${timeStr} ${c.name}`;
      })
      .join('\n');
  }

  /**
   * Imports markers from CSV or JSON text
   */
  static importFromText(text: string): Marker[] {
    const imported: Marker[] = [];
    const trimmed = text.trim();

    // Check JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        return arr.map((item, idx) => ({
          id: item.id || `marker-imp-${idx}`,
          timelineId: item.timelineId || 'timeline-primary',
          time: Number(item.time) || 0,
          duration: item.duration ? Number(item.duration) : undefined,
          name: item.name || 'Marker',
          description: item.description || '',
          color: item.color || MARKER_TYPE_COLORS[(item.type as MarkerType) || 'general'],
          type: (item.type as MarkerType) || 'general',
        }));
      } catch {
        // Fallback to line parser
      }
    }

    // Line by line parser (handles CSV or timestamp text)
    const lines = trimmed.split('\n');
    lines.forEach((line, idx) => {
      if (idx === 0 && line.toLowerCase().includes('time')) return; // skip header
      const parts = line.split(',');
      if (parts.length >= 4) {
        const time = parseFloat(parts[0]) || 0;
        const type = (parts[2].trim() as MarkerType) || 'general';
        const name = parts[3].replace(/^"|"$/g, '').trim();
        imported.push(this.createMarker(time, name, type));
      } else {
        // Check "MM:SS Name" format
        const match = line.match(/^(\d+):(\d+)\s+(.+)$/);
        if (match) {
          const time = parseInt(match[1]) * 60 + parseInt(match[2]);
          const name = match[3].trim();
          imported.push(this.createMarker(time, name, 'chapter'));
        }
      }
    });

    return imported;
  }
}
