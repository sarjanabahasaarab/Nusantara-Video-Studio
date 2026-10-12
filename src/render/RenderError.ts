/**
 * Nusantara Video Studio - Render Error Model & Handler
 * Phase 9: Professional Rendering & Export Engine (Requirement 47, 49)
 */

import { RenderError } from '../types/render';

export class RenderErrorModel extends Error implements RenderError {
  public code: string;
  public details?: string;
  public stage?: 'preflight' | 'prepare' | 'encode' | 'mux' | 'validate';
  public timestamp: string;
  public recoverable?: boolean;

  constructor(
    code: string,
    message: string,
    details?: string,
    stage: 'preflight' | 'prepare' | 'encode' | 'mux' | 'validate' = 'encode',
    recoverable = false
  ) {
    super(message);
    this.name = 'RenderError';
    this.code = code;
    this.details = details;
    this.stage = stage;
    this.timestamp = new Date().toISOString();
    this.recoverable = recoverable;
  }

  public static fromUnknown(err: unknown, stage: 'preflight' | 'prepare' | 'encode' | 'mux' | 'validate' = 'encode'): RenderErrorModel {
    if (err instanceof RenderErrorModel) return err;
    const msg = err instanceof Error ? err.message : String(err);
    return new RenderErrorModel('ERR_RENDER_GENERIC', msg, undefined, stage, false);
  }

  public toJSON(): RenderError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      stage: this.stage,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
    };
  }
}
