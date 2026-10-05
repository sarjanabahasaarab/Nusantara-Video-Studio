/**
 * Nusantara Video Studio - Keyframe Engine
 * Phase 4: Advanced Effects & Motion Engine
 *
 * Implements high-performance generic keyframe evaluation, interpolation
 * algorithms (linear, hold, ease-in, ease-out, ease-in-out), keyframe CRUD,
 * and 20+ customizable Animation Presets.
 */

import {
  AnimatedProperty,
  AnimationPresetType,
  Keyframe,
  KeyframeInterpolation,
} from '../../types';

export class KeyframeEngine {
  /**
   * Easing and interpolation evaluation between two values.
   */
  public static interpolate(
    v0: number,
    v1: number,
    t: number,
    type: KeyframeInterpolation = 'linear'
  ): number {
    const clampedT = Math.max(0, Math.min(1, t));

    switch (type) {
      case 'hold':
        return clampedT >= 1 ? v1 : v0;

      case 'ease-in':
        // Quadratic ease-in: accelerating from zero velocity
        return v0 + (v1 - v0) * (clampedT * clampedT);

      case 'ease-out':
        // Quadratic ease-out: decelerating to zero velocity
        return v0 + (v1 - v0) * (clampedT * (2 - clampedT));

      case 'ease-in-out':
        // Quadratic ease-in-out: acceleration until halfway, then deceleration
        if (clampedT < 0.5) {
          return v0 + (v1 - v0) * (2 * clampedT * clampedT);
        } else {
          return v0 + (v1 - v0) * (-1 + (4 - 2 * clampedT) * clampedT);
        }

      case 'linear':
      default:
        return v0 + (v1 - v0) * clampedT;
    }
  }

  /**
   * Evaluates an animated property's value at a given clip-relative time.
   */
  public static evaluate(
    anim: AnimatedProperty | undefined,
    time: number,
    defaultValue: number
  ): number {
    if (!anim || !anim.keyframes || anim.keyframes.length === 0) {
      return defaultValue;
    }

    const kfs = [...anim.keyframes].sort((a, b) => a.time - b.time);

    // If time is before or equal to first keyframe, clamp to first value
    if (time <= kfs[0].time) {
      return kfs[0].value;
    }

    // If time is at or after last keyframe, clamp to last value
    if (time >= kfs[kfs.length - 1].time) {
      return kfs[kfs.length - 1].value;
    }

    // Find the bounding keyframe segment
    for (let i = 0; i < kfs.length - 1; i++) {
      const kf0 = kfs[i];
      const kf1 = kfs[i + 1];

      if (time >= kf0.time && time <= kf1.time) {
        const segDuration = kf1.time - kf0.time;
        if (segDuration <= 0.0001) return kf1.value;

        const t = (time - kf0.time) / segDuration;
        return this.interpolate(kf0.value, kf1.value, t, kf0.interpolation);
      }
    }

    return defaultValue;
  }

  /**
   * Evaluates all animated properties of a clip at a relative time.
   */
  public static evaluateAllProperties(
    properties: AnimatedProperty[] | undefined,
    relativeTime: number,
    defaultValues: Record<string, number>
  ): Record<string, number> {
    const result: Record<string, number> = { ...defaultValues };
    if (!properties) return result;

    for (const anim of properties) {
      const def = defaultValues[anim.property] ?? 0;
      result[anim.property] = this.evaluate(anim, relativeTime, def);
    }

    return result;
  }

  /**
   * Add or replace a keyframe in an animated property at given time.
   */
  public static addKeyframe(
    anim: AnimatedProperty,
    time: number,
    value: number,
    interpolation: KeyframeInterpolation = 'linear'
  ): AnimatedProperty {
    const clampedTime = Math.max(0, time);
    const existingIndex = anim.keyframes.findIndex(
      (k) => Math.abs(k.time - clampedTime) < 0.03
    );

    let nextKeyframes: Keyframe[];

    if (existingIndex >= 0) {
      // Update existing keyframe close to this time
      nextKeyframes = anim.keyframes.map((k, idx) =>
        idx === existingIndex
          ? { ...k, time: clampedTime, value, interpolation }
          : k
      );
    } else {
      // Add new keyframe
      const newKf: Keyframe = {
        id: `kf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        time: clampedTime,
        value,
        interpolation,
      };
      nextKeyframes = [...anim.keyframes, newKf];
    }

    nextKeyframes.sort((a, b) => a.time - b.time);
    return {
      ...anim,
      keyframes: nextKeyframes,
    };
  }

  /**
   * Remove a keyframe by ID.
   */
  public static removeKeyframe(
    anim: AnimatedProperty,
    keyframeId: string
  ): AnimatedProperty {
    return {
      ...anim,
      keyframes: anim.keyframes.filter((k) => k.id !== keyframeId),
    };
  }

  /**
   * Remove a keyframe near a specific time (tolerance 0.05s).
   */
  public static removeKeyframeAtTime(
    anim: AnimatedProperty,
    time: number
  ): AnimatedProperty {
    return {
      ...anim,
      keyframes: anim.keyframes.filter((k) => Math.abs(k.time - time) >= 0.05),
    };
  }

  /**
   * Move a keyframe to a new time.
   */
  public static moveKeyframe(
    anim: AnimatedProperty,
    keyframeId: string,
    newTime: number
  ): AnimatedProperty {
    const clampedTime = Math.max(0, newTime);
    const updated = anim.keyframes.map((k) =>
      k.id === keyframeId ? { ...k, time: clampedTime } : k
    );
    updated.sort((a, b) => a.time - b.time);
    return {
      ...anim,
      keyframes: updated,
    };
  }

  /**
   * Get previous keyframe before current time.
   */
  public static getPreviousKeyframe(
    anim: AnimatedProperty | undefined,
    currentTime: number
  ): Keyframe | null {
    if (!anim || anim.keyframes.length === 0) return null;
    const prior = anim.keyframes
      .filter((k) => k.time < currentTime - 0.02)
      .sort((a, b) => b.time - a.time);
    return prior[0] || null;
  }

  /**
   * Get next keyframe after current time.
   */
  public static getNextKeyframe(
    anim: AnimatedProperty | undefined,
    currentTime: number
  ): Keyframe | null {
    if (!anim || anim.keyframes.length === 0) return null;
    const next = anim.keyframes
      .filter((k) => k.time > currentTime + 0.02)
      .sort((a, b) => a.time - b.time);
    return next[0] || null;
  }

  /**
   * Generates editable keyframe tracks for Animation Presets (Requirement 7).
   * Generates open, user-modifiable keyframe curves.
   */
  public static createAnimationPresetTracks(
    preset: AnimationPresetType,
    clipDuration: number,
    customDuration?: number
  ): AnimatedProperty[] {
    const dur = Math.min(
      clipDuration,
      Math.max(0.3, customDuration || (preset.startsWith('ken') || preset.startsWith('pan') || preset.startsWith('slow') ? clipDuration : 1.0))
    );

    const tracks: AnimatedProperty[] = [];

    switch (preset) {
      // 1. Entrance Presets
      case 'fade-in':
        tracks.push({
          property: 'opacity',
          keyframes: [
            { id: 'kf-fi-0', time: 0, value: 0, interpolation: 'ease-out' },
            { id: 'kf-fi-1', time: dur, value: 1, interpolation: 'linear' },
          ],
        });
        break;

      case 'slide-in-left':
        tracks.push(
          {
            property: 'positionX',
            keyframes: [
              { id: 'kf-sil-0', time: 0, value: -960, interpolation: 'ease-out' },
              { id: 'kf-sil-1', time: dur, value: 0, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-silo-0', time: 0, value: 0, interpolation: 'ease-out' },
              { id: 'kf-silo-1', time: dur * 0.6, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'slide-in-right':
        tracks.push(
          {
            property: 'positionX',
            keyframes: [
              { id: 'kf-sir-0', time: 0, value: 960, interpolation: 'ease-out' },
              { id: 'kf-sir-1', time: dur, value: 0, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-siro-0', time: 0, value: 0, interpolation: 'ease-out' },
              { id: 'kf-siro-1', time: dur * 0.6, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'slide-in-up':
        tracks.push(
          {
            property: 'positionY',
            keyframes: [
              { id: 'kf-siu-0', time: 0, value: 540, interpolation: 'ease-out' },
              { id: 'kf-siu-1', time: dur, value: 0, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-siuo-0', time: 0, value: 0, interpolation: 'ease-out' },
              { id: 'kf-siuo-1', time: dur * 0.6, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'slide-in-down':
        tracks.push(
          {
            property: 'positionY',
            keyframes: [
              { id: 'kf-sid-0', time: 0, value: -540, interpolation: 'ease-out' },
              { id: 'kf-sid-1', time: dur, value: 0, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-sido-0', time: 0, value: 0, interpolation: 'ease-out' },
              { id: 'kf-sido-1', time: dur * 0.6, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'zoom-in':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-zi-x0', time: 0, value: 0.2, interpolation: 'ease-out' },
              { id: 'kf-zi-x1', time: dur, value: 1.0, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-zi-y0', time: 0, value: 0.2, interpolation: 'ease-out' },
              { id: 'kf-zi-y1', time: dur, value: 1.0, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-zio-0', time: 0, value: 0, interpolation: 'ease-out' },
              { id: 'kf-zio-1', time: dur * 0.5, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'pop-in':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-pi-x0', time: 0, value: 0.1, interpolation: 'ease-out' },
              { id: 'kf-pi-x1', time: dur * 0.7, value: 1.15, interpolation: 'ease-in-out' },
              { id: 'kf-pi-x2', time: dur, value: 1.0, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-pi-y0', time: 0, value: 0.1, interpolation: 'ease-out' },
              { id: 'kf-pi-y1', time: dur * 0.7, value: 1.15, interpolation: 'ease-in-out' },
              { id: 'kf-pi-y2', time: dur, value: 1.0, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-pio-0', time: 0, value: 0, interpolation: 'ease-out' },
              { id: 'kf-pio-1', time: dur * 0.3, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;

      // 2. Exit Presets
      case 'fade-out': {
        const startT = Math.max(0, clipDuration - dur);
        tracks.push({
          property: 'opacity',
          keyframes: [
            { id: 'kf-fo-0', time: startT, value: 1, interpolation: 'ease-in' },
            { id: 'kf-fo-1', time: clipDuration, value: 0, interpolation: 'linear' },
          ],
        });
        break;
      }

      case 'slide-out-left': {
        const startT = Math.max(0, clipDuration - dur);
        tracks.push(
          {
            property: 'positionX',
            keyframes: [
              { id: 'kf-sol-0', time: startT, value: 0, interpolation: 'ease-in' },
              { id: 'kf-sol-1', time: clipDuration, value: -960, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-solo-0', time: startT + dur * 0.4, value: 1, interpolation: 'ease-in' },
              { id: 'kf-solo-1', time: clipDuration, value: 0, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'slide-out-right': {
        const startT = Math.max(0, clipDuration - dur);
        tracks.push(
          {
            property: 'positionX',
            keyframes: [
              { id: 'kf-sor-0', time: startT, value: 0, interpolation: 'ease-in' },
              { id: 'kf-sor-1', time: clipDuration, value: 960, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-soro-0', time: startT + dur * 0.4, value: 1, interpolation: 'ease-in' },
              { id: 'kf-soro-1', time: clipDuration, value: 0, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'slide-out-up': {
        const startT = Math.max(0, clipDuration - dur);
        tracks.push(
          {
            property: 'positionY',
            keyframes: [
              { id: 'kf-sou-0', time: startT, value: 0, interpolation: 'ease-in' },
              { id: 'kf-sou-1', time: clipDuration, value: -540, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-souo-0', time: startT + dur * 0.4, value: 1, interpolation: 'ease-in' },
              { id: 'kf-souo-1', time: clipDuration, value: 0, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'slide-out-down': {
        const startT = Math.max(0, clipDuration - dur);
        tracks.push(
          {
            property: 'positionY',
            keyframes: [
              { id: 'kf-sod-0', time: startT, value: 0, interpolation: 'ease-in' },
              { id: 'kf-sod-1', time: clipDuration, value: 540, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-sodo-0', time: startT + dur * 0.4, value: 1, interpolation: 'ease-in' },
              { id: 'kf-sodo-1', time: clipDuration, value: 0, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'zoom-out': {
        const startT = Math.max(0, clipDuration - dur);
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-zo-x0', time: startT, value: 1.0, interpolation: 'ease-in' },
              { id: 'kf-zo-x1', time: clipDuration, value: 0.1, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-zo-y0', time: startT, value: 1.0, interpolation: 'ease-in' },
              { id: 'kf-zo-y1', time: clipDuration, value: 0.1, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: 'kf-zoo-0', time: startT + dur * 0.3, value: 1, interpolation: 'ease-in' },
              { id: 'kf-zoo-1', time: clipDuration, value: 0, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      // 3. Continuous Motion Presets
      case 'slow-zoom':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-sz-x0', time: 0, value: 1.0, interpolation: 'linear' },
              { id: 'kf-sz-x1', time: clipDuration, value: 1.25, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-sz-y0', time: 0, value: 1.0, interpolation: 'linear' },
              { id: 'kf-sz-y1', time: clipDuration, value: 1.25, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'pan-left':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-pl-s0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pl-s1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-pl-sy0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pl-sy1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'positionX',
            keyframes: [
              { id: 'kf-pl-x0', time: 0, value: 60, interpolation: 'linear' },
              { id: 'kf-pl-x1', time: clipDuration, value: -60, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'pan-right':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-pr-s0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pr-s1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-pr-sy0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pr-sy1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'positionX',
            keyframes: [
              { id: 'kf-pr-x0', time: 0, value: -60, interpolation: 'linear' },
              { id: 'kf-pr-x1', time: clipDuration, value: 60, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'pan-up':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-pu-sx0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pu-sx1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-pu-sy0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pu-sy1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'positionY',
            keyframes: [
              { id: 'kf-pu-y0', time: 0, value: 40, interpolation: 'linear' },
              { id: 'kf-pu-y1', time: clipDuration, value: -40, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'pan-down':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-pd-sx0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pd-sx1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-pd-sy0', time: 0, value: 1.15, interpolation: 'linear' },
              { id: 'kf-pd-sy1', time: clipDuration, value: 1.15, interpolation: 'linear' },
            ],
          },
          {
            property: 'positionY',
            keyframes: [
              { id: 'kf-pd-y0', time: 0, value: -40, interpolation: 'linear' },
              { id: 'kf-pd-y1', time: clipDuration, value: 40, interpolation: 'linear' },
            ],
          }
        );
        break;

      case 'rotate':
        tracks.push({
          property: 'rotation',
          keyframes: [
            { id: 'kf-rot-0', time: 0, value: 0, interpolation: 'linear' },
            { id: 'kf-rot-1', time: clipDuration, value: 360, interpolation: 'linear' },
          ],
        });
        break;

      case 'ken-burns':
        tracks.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: 'kf-kb-x0', time: 0, value: 1.05, interpolation: 'ease-in-out' },
              { id: 'kf-kb-x1', time: clipDuration, value: 1.28, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: 'kf-kb-y0', time: 0, value: 1.05, interpolation: 'ease-in-out' },
              { id: 'kf-kb-y1', time: clipDuration, value: 1.28, interpolation: 'linear' },
            ],
          },
          {
            property: 'positionX',
            keyframes: [
              { id: 'kf-kb-px0', time: 0, value: -30, interpolation: 'ease-in-out' },
              { id: 'kf-kb-px1', time: clipDuration, value: 45, interpolation: 'linear' },
            ],
          },
          {
            property: 'positionY',
            keyframes: [
              { id: 'kf-kb-py0', time: 0, value: 20, interpolation: 'ease-in-out' },
              { id: 'kf-kb-py1', time: clipDuration, value: -25, interpolation: 'linear' },
            ],
          }
        );
        break;
    }

    return tracks;
  }

  /**
   * Applies an animation preset to a clip, merging generated curves non-destructively.
   */
  public static applyAnimationPreset(
    clip: { duration: number; animatedProperties?: AnimatedProperty[] },
    preset: AnimationPresetType,
    customDuration?: number
  ): AnimatedProperty[] {
    const newTracks = this.createAnimationPresetTracks(preset, clip.duration, customDuration);
    const existing = clip.animatedProperties || [];
    const newPropNames = new Set(newTracks.map((t) => t.property));
    return [
      ...existing.filter((p) => !newPropNames.has(p.property)),
      ...newTracks,
    ];
  }
}
