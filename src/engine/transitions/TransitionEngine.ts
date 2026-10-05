/**
 * Nusantara Video Studio - Transition Engine
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Implements 11 advanced transitions (Cross Dissolve, Fade, Dip to Black/White,
 * Wipes, Push, Slide, Zoom), media handle validation, and real-time compositor progress math.
 */

import { Clip, TimelineTransition, TransitionType } from '../../types';

export interface TransitionDefinition {
  type: TransitionType;
  name: string;
  category: 'dissolve' | 'wipe' | 'motion' | 'dip';
  description: string;
  defaultDuration: number;
}

export const TRANSITION_DEFINITIONS: TransitionDefinition[] = [
  {
    type: 'cross-dissolve',
    name: 'Cross Dissolve',
    category: 'dissolve',
    description: 'Smooth optical alpha blend between outgoing and incoming clip',
    defaultDuration: 1.0,
  },
  {
    type: 'fade',
    name: 'Fade',
    category: 'dissolve',
    description: 'Classic linear opacity dissolve',
    defaultDuration: 1.0,
  },
  {
    type: 'dip-to-black',
    name: 'Dip to Black',
    category: 'dip',
    description: 'Fades outgoing clip to pure black, then reveals incoming clip',
    defaultDuration: 1.2,
  },
  {
    type: 'dip-to-white',
    name: 'Dip to White',
    category: 'dip',
    description: 'Flashes through high-key white daylight',
    defaultDuration: 0.8,
  },
  {
    type: 'wipe-left',
    name: 'Wipe Left',
    category: 'wipe',
    description: 'Incoming clip wipes across from right to left',
    defaultDuration: 1.0,
  },
  {
    type: 'wipe-right',
    name: 'Wipe Right',
    category: 'wipe',
    description: 'Incoming clip wipes across from left to right',
    defaultDuration: 1.0,
  },
  {
    type: 'wipe-up',
    name: 'Wipe Up',
    category: 'wipe',
    description: 'Incoming clip wipes upward from bottom',
    defaultDuration: 1.0,
  },
  {
    type: 'wipe-down',
    name: 'Wipe Down',
    category: 'wipe',
    description: 'Incoming clip wipes downward from top',
    defaultDuration: 1.0,
  },
  {
    type: 'push',
    name: 'Push',
    category: 'motion',
    description: 'Incoming clip slides in, physically pushing outgoing clip aside',
    defaultDuration: 1.0,
  },
  {
    type: 'slide',
    name: 'Slide',
    category: 'motion',
    description: 'Incoming clip slides over stationary outgoing clip',
    defaultDuration: 1.0,
  },
  {
    type: 'zoom',
    name: 'Zoom Transition',
    category: 'motion',
    description: 'Expansive vortex scale into incoming clip',
    defaultDuration: 1.0,
  },
];

export class TransitionEngine {
  /**
   * Validate if two clips on the same track can support a transition of desired duration.
   */
  public static validateTransition(
    fromClip: Clip,
    toClip: Clip,
    duration: number
  ): { valid: boolean; reason?: string } {
    if (fromClip.trackId !== toClip.trackId) {
      return { valid: false, reason: 'Transition harus berada pada track yang sama.' };
    }

    if (duration <= 0.1) {
      return { valid: false, reason: 'Durasi transition minimal 0.1 detik.' };
    }

    const maxAllowedFrom = fromClip.duration * 0.8;
    const maxAllowedTo = toClip.duration * 0.8;
    const maxDuration = Math.min(maxAllowedFrom, maxAllowedTo);

    if (duration > maxDuration) {
      return {
        valid: false,
        reason: `Handle media tidak cukup. Durasi maksimal yang didukung clip adalah ${maxDuration.toFixed(1)} detik.`,
      };
    }

    return { valid: true };
  }

  /**
   * Creates a new TimelineTransition linking two adjacent clips.
   */
  public static createTransition(
    type: TransitionType,
    fromClip: Clip,
    toClip: Clip,
    customDuration?: number
  ): TimelineTransition | null {
    const def = TRANSITION_DEFINITIONS.find((d) => d.type === type);
    const duration = Math.max(0.2, customDuration || def?.defaultDuration || 1.0);

    const validation = this.validateTransition(fromClip, toClip, duration);
    if (!validation.valid) {
      return null;
    }

    // Cut point is where fromClip ends
    const cutPoint = fromClip.startTime + fromClip.duration;
    const start = Math.max(0, cutPoint - duration / 2);

    return {
      id: `tr-${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      name: def?.name || type,
      fromClipId: fromClip.id,
      toClipId: toClip.id,
      trackId: fromClip.trackId,
      duration,
      start,
      parameters: {},
    };
  }

  /**
   * Calculate transition blend state for a transition at currentTime.
   * Returns progress 0.0 to 1.0, active status, and layer CSS transforms/clip-paths.
   */
  public static evaluateTransition(
    transition: TimelineTransition,
    currentTime: number
  ): {
    active: boolean;
    progress: number; // 0 (start) to 1 (end)
    fromStyle: React.CSSProperties;
    toStyle: React.CSSProperties;
    overlayColor?: string;
    overlayOpacity?: number;
  } {
    const { start, duration, type } = transition;
    const end = start + duration;

    if (currentTime < start || currentTime > end) {
      return {
        active: false,
        progress: currentTime < start ? 0 : 1,
        fromStyle: {},
        toStyle: {},
      };
    }

    const rawT = (currentTime - start) / Math.max(0.001, duration);
    const progress = Math.max(0, Math.min(1, rawT));

    const fromStyle: React.CSSProperties = {};
    const toStyle: React.CSSProperties = {};
    let overlayColor: string | undefined;
    let overlayOpacity: number | undefined;

    switch (type) {
      case 'cross-dissolve':
      case 'fade':
        fromStyle.opacity = 1 - progress;
        toStyle.opacity = progress;
        break;

      case 'dip-to-black':
        overlayColor = '#000000';
        if (progress < 0.5) {
          overlayOpacity = progress * 2;
          fromStyle.opacity = 1;
          toStyle.opacity = 0;
        } else {
          overlayOpacity = (1 - progress) * 2;
          fromStyle.opacity = 0;
          toStyle.opacity = 1;
        }
        break;

      case 'dip-to-white':
        overlayColor = '#ffffff';
        if (progress < 0.5) {
          overlayOpacity = progress * 2;
          fromStyle.opacity = 1;
          toStyle.opacity = 0;
        } else {
          overlayOpacity = (1 - progress) * 2;
          fromStyle.opacity = 0;
          toStyle.opacity = 1;
        }
        break;

      case 'wipe-left':
        toStyle.clipPath = `polygon(${100 - progress * 100}% 0%, 100% 0%, 100% 100%, ${100 - progress * 100}% 100%)`;
        break;

      case 'wipe-right':
        toStyle.clipPath = `polygon(0% 0%, ${progress * 100}% 0%, ${progress * 100}% 100%, 0% 100%)`;
        break;

      case 'wipe-up':
        toStyle.clipPath = `polygon(0% ${100 - progress * 100}%, 100% ${100 - progress * 100}%, 100% 100%, 0% 100%)`;
        break;

      case 'wipe-down':
        toStyle.clipPath = `polygon(0% 0%, 100% 0%, 100% ${progress * 100}%, 0% ${progress * 100}%)`;
        break;

      case 'push':
        fromStyle.transform = `translateX(${-progress * 100}%)`;
        toStyle.transform = `translateX(${(1 - progress) * 100}%)`;
        break;

      case 'slide':
        toStyle.transform = `translateX(${(1 - progress) * 100}%)`;
        break;

      case 'zoom':
        fromStyle.transform = `scale(${1 + progress * 0.8})`;
        fromStyle.opacity = 1 - progress;
        toStyle.transform = `scale(${0.4 + progress * 0.6})`;
        toStyle.opacity = progress;
        break;
    }

    return {
      active: true,
      progress,
      fromStyle,
      toStyle,
      overlayColor,
      overlayOpacity,
    };
  }
}
