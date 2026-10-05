/**
 * Nusantara Video Studio - Animated Text & Keyframe Integration Engine
 * Phase 5: Professional Text, Subtitle & Graphics Studio
 *
 * Integrates directly with Phase 4 KeyframeEngine to generate fully editable
 * keyframes for Entrance, Exit, and Continuous animations.
 * Provides Typewriter substring calculation and runtime preview modifiers.
 */

import { AnimatedProperty, Keyframe, TextAnimationSettings } from '../../types';

export class TextAnimationEngine {
  /**
   * Generates editable keyframes for a given text animation preset.
   * Modifies positionX, positionY, scaleX, scaleY, opacity, or rotation.
   */
  static generateAnimationKeyframes(
    animation: TextAnimationSettings,
    clipDuration: number
  ): AnimatedProperty[] {
    const { preset, duration = 1.0, delay = 0, direction = 'bottom', intensity = 50 } = animation;
    if (preset === 'none') return [];

    const animDuration = Math.min(duration, clipDuration);
    const animDelay = Math.max(0, delay);
    const startTime = Math.min(animDelay, clipDuration - 0.1);
    const endTime = Math.min(startTime + animDuration, clipDuration);

    const animatedProps: AnimatedProperty[] = [];

    switch (preset) {
      case 'fade-in': {
        animatedProps.push({
          property: 'opacity',
          keyframes: [
            { id: `kf-fadein-0`, time: startTime, value: 0, interpolation: 'ease-out' },
            { id: `kf-fadein-1`, time: endTime, value: 1, interpolation: 'linear' },
          ],
        });
        break;
      }

      case 'slide-in': {
        const offsetPx = (intensity / 50) * 120;
        let startX = 0;
        let startY = 0;
        if (direction === 'left') startX = -offsetPx;
        else if (direction === 'right') startX = offsetPx;
        else if (direction === 'top') startY = -offsetPx;
        else startY = offsetPx; // bottom

        animatedProps.push(
          {
            property: startX !== 0 ? 'positionX' : 'positionY',
            keyframes: [
              { id: `kf-slidein-pos-0`, time: startTime, value: startX !== 0 ? startX : startY, interpolation: 'ease-out' },
              { id: `kf-slidein-pos-1`, time: endTime, value: 0, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: `kf-slidein-op-0`, time: startTime, value: 0, interpolation: 'linear' },
              { id: `kf-slidein-op-1`, time: endTime, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'zoom-in': {
        const startScale = Math.max(0.1, 0.2 * (50 / intensity));
        animatedProps.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: `kf-zoomin-sx-0`, time: startTime, value: startScale, interpolation: 'ease-out' },
              { id: `kf-zoomin-sx-1`, time: endTime, value: 1, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: `kf-zoomin-sy-0`, time: startTime, value: startScale, interpolation: 'ease-out' },
              { id: `kf-zoomin-sy-1`, time: endTime, value: 1, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: `kf-zoomin-op-0`, time: startTime, value: 0, interpolation: 'linear' },
              { id: `kf-zoomin-op-1`, time: endTime, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'pop-in': {
        const midTime = startTime + (endTime - startTime) * 0.7;
        const overshoot = 1 + (intensity / 100) * 0.3;
        animatedProps.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: `kf-pop-sx-0`, time: startTime, value: 0.1, interpolation: 'ease-out' },
              { id: `kf-pop-sx-1`, time: midTime, value: overshoot, interpolation: 'ease-in-out' },
              { id: `kf-pop-sx-2`, time: endTime, value: 1, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: `kf-pop-sy-0`, time: startTime, value: 0.1, interpolation: 'ease-out' },
              { id: `kf-pop-sy-1`, time: midTime, value: overshoot, interpolation: 'ease-in-out' },
              { id: `kf-pop-sy-2`, time: endTime, value: 1, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: `kf-pop-op-0`, time: startTime, value: 0, interpolation: 'linear' },
              { id: `kf-pop-op-1`, time: startTime + (endTime - startTime) * 0.3, value: 1, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'fade-out': {
        const exitStart = Math.max(0, clipDuration - animDuration);
        animatedProps.push({
          property: 'opacity',
          keyframes: [
            { id: `kf-fadeout-0`, time: exitStart, value: 1, interpolation: 'ease-in' },
            { id: `kf-fadeout-1`, time: clipDuration, value: 0, interpolation: 'linear' },
          ],
        });
        break;
      }

      case 'slide-out': {
        const exitStart = Math.max(0, clipDuration - animDuration);
        const offsetPx = (intensity / 50) * 140;
        let endX = 0;
        let endY = 0;
        if (direction === 'left') endX = -offsetPx;
        else if (direction === 'right') endX = offsetPx;
        else if (direction === 'top') endY = -offsetPx;
        else endY = offsetPx;

        animatedProps.push(
          {
            property: endX !== 0 ? 'positionX' : 'positionY',
            keyframes: [
              { id: `kf-slideout-pos-0`, time: exitStart, value: 0, interpolation: 'ease-in' },
              { id: `kf-slideout-pos-1`, time: clipDuration, value: endX !== 0 ? endX : endY, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: `kf-slideout-op-0`, time: exitStart, value: 1, interpolation: 'linear' },
              { id: `kf-slideout-op-1`, time: clipDuration, value: 0, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'zoom-out': {
        const exitStart = Math.max(0, clipDuration - animDuration);
        animatedProps.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: `kf-zoomout-sx-0`, time: exitStart, value: 1, interpolation: 'ease-in' },
              { id: `kf-zoomout-sx-1`, time: clipDuration, value: 0.1, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: `kf-zoomout-sy-0`, time: exitStart, value: 1, interpolation: 'ease-in' },
              { id: `kf-zoomout-sy-1`, time: clipDuration, value: 0.1, interpolation: 'linear' },
            ],
          },
          {
            property: 'opacity',
            keyframes: [
              { id: `kf-zoomout-op-0`, time: exitStart, value: 1, interpolation: 'linear' },
              { id: `kf-zoomout-op-1`, time: clipDuration, value: 0, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'floating': {
        const amplitude = (intensity / 50) * 15;
        const period = Math.max(1, duration);
        const kfs: Keyframe[] = [];
        let t = 0;
        let idx = 0;
        while (t <= clipDuration) {
          const val = Math.sin((t / period) * Math.PI * 2) * amplitude;
          kfs.push({
            id: `kf-float-${idx++}`,
            time: parseFloat(t.toFixed(2)),
            value: parseFloat(val.toFixed(1)),
            interpolation: 'ease-in-out',
          });
          t += period / 2;
        }
        animatedProps.push({ property: 'positionY', keyframes: kfs });
        break;
      }

      case 'pulse': {
        const scaleDelta = (intensity / 100) * 0.15;
        const period = Math.max(0.8, duration);
        const sxKfs: Keyframe[] = [];
        const syKfs: Keyframe[] = [];
        let t = 0;
        let idx = 0;
        while (t <= clipDuration) {
          const factor = 1 + (idx % 2 === 1 ? scaleDelta : 0);
          sxKfs.push({
            id: `kf-pulse-sx-${idx}`,
            time: parseFloat(t.toFixed(2)),
            value: parseFloat(factor.toFixed(2)),
            interpolation: 'ease-in-out',
          });
          syKfs.push({
            id: `kf-pulse-sy-${idx}`,
            time: parseFloat(t.toFixed(2)),
            value: parseFloat(factor.toFixed(2)),
            interpolation: 'ease-in-out',
          });
          t += period / 2;
          idx++;
        }
        animatedProps.push({ property: 'scaleX', keyframes: sxKfs }, { property: 'scaleY', keyframes: syKfs });
        break;
      }

      case 'gentle-zoom': {
        const maxScale = 1 + (intensity / 100) * 0.25;
        animatedProps.push(
          {
            property: 'scaleX',
            keyframes: [
              { id: `kf-gzoom-sx-0`, time: 0, value: 1, interpolation: 'linear' },
              { id: `kf-gzoom-sx-1`, time: clipDuration, value: maxScale, interpolation: 'linear' },
            ],
          },
          {
            property: 'scaleY',
            keyframes: [
              { id: `kf-gzoom-sy-0`, time: 0, value: 1, interpolation: 'linear' },
              { id: `kf-gzoom-sy-1`, time: clipDuration, value: maxScale, interpolation: 'linear' },
            ],
          }
        );
        break;
      }

      case 'typewriter': {
        // Handled directly via typewriter substring evaluator below
        break;
      }
    }

    return animatedProps;
  }

  /**
   * Evaluates text string for Typewriter effect at relative time t (seconds)
   */
  static evaluateTypewriterText(
    fullText: string,
    relTime: number,
    animation?: TextAnimationSettings
  ): string {
    if (!animation || animation.preset !== 'typewriter') {
      return fullText;
    }

    const duration = Math.max(0.2, animation.duration || 2.0);
    const delay = Math.max(0, animation.delay || 0);

    if (relTime < delay) return '';
    const elapsed = relTime - delay;
    const progress = Math.min(1, elapsed / duration);

    const charsCount = Math.floor(progress * fullText.length);
    return fullText.substring(0, charsCount);
  }
}
