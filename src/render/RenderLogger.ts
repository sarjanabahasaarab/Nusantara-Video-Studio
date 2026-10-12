/**
 * Nusantara Video Studio - Render Logger & Diagnostic Journal
 * Phase 9: Professional Rendering & Export Engine (Requirement 62)
 *
 * Keeps track of command metadata, encoder outputs, warnings, and errors
 * while stripping sensitive tokens and providing log export capabilities.
 */

export class RenderLogger {
  private static logsByJobId = new Map<string, string[]>();

  public static append(jobId: string, message: string): void {
    const sanitized = this.sanitize(message);
    const existing = this.logsByJobId.get(jobId) || [];
    const timestamp = new Date().toLocaleTimeString();
    existing.push(`[${timestamp}] ${sanitized}`);

    if (existing.length > 1000) {
      existing.shift();
    }
    this.logsByJobId.set(jobId, existing);
  }

  public static getLogs(jobId: string): string[] {
    return this.logsByJobId.get(jobId) || [];
  }

  public static clear(jobId: string): void {
    this.logsByJobId.delete(jobId);
  }

  /**
   * Strips potential tokens, authorization headers, or private keys
   */
  public static sanitize(raw: string): string {
    return raw
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]')
      .replace(/password[:=]\s*[^\s]+/gi, 'password=[REDACTED]');
  }

  public static exportLogBlob(jobId: string): Blob {
    const lines = this.getLogs(jobId);
    return new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  }
}
