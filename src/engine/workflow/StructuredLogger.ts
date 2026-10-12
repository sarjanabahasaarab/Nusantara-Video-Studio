/**
 * Nusantara Video Studio - Structured Logger
 * Phase 8: Professional Editing Workflow
 *
 * Implements structured JSON/console logging with severity levels (DEBUG, INFO, WARN, ERROR)
 * and automatic redaction of sensitive credentials and private keys.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: unknown;
}

export class StructuredLogger {
  private static minLevel: LogLevel = 'INFO';
  private static logs: LogEntry[] = [];
  private static MAX_LOGS = 200;

  private static LEVEL_WEIGHT: Record<LogLevel, number> = {
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4,
  };

  /**
   * Redacts sensitive tokens or keys from log messages
   */
  private static redact(str: string): string {
    return str
      .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]')
      .replace(/(bearer\s+)[a-zA-Z0-9_\-\.]+/gi, '$1[REDACTED_TOKEN]')
      .replace(/(password|secret|apikey)\s*[:=]\s*["']?[^"'\s,]+/gi, '$1=[REDACTED]');
  }

  static log(level: LogLevel, module: string, message: string, data?: unknown): void {
    if (this.LEVEL_WEIGHT[level] < this.LEVEL_WEIGHT[this.minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      message: this.redact(message),
      data,
    };

    this.logs = [entry, ...this.logs].slice(0, this.MAX_LOGS);

    const logFn =
      level === 'ERROR'
        ? console.error
        : level === 'WARN'
        ? console.warn
        : level === 'DEBUG'
        ? console.debug
        : console.log;

    logFn(`[${entry.timestamp}] [${level}] [${module}]: ${entry.message}`, data || '');
  }

  static debug(module: string, message: string, data?: unknown): void {
    this.log('DEBUG', module, message, data);
  }

  static info(module: string, message: string, data?: unknown): void {
    this.log('INFO', module, message, data);
  }

  static warn(module: string, message: string, data?: unknown): void {
    this.log('WARN', module, message, data);
  }

  static error(module: string, message: string, data?: unknown): void {
    this.log('ERROR', module, message, data);
  }

  static getRecentLogs(): LogEntry[] {
    return [...this.logs];
  }
}
