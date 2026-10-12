const REDACTED_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'apikey',
  'api_key',
  'cv_text',
  'raw_text',
  'cvtext',
  'ssn',
  'phone',
  'email',
]);

export function redactSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactSensitiveData(value);
      }
    }
    return redacted;
  }

  return obj;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  context?: Record<string, unknown>;
  error?: unknown;
}

export const logger = {
  info(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.log('info', message, context, undefined, requestId);
  },
  warn(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.log('warn', message, context, undefined, requestId);
  },
  error(message: string, error?: unknown, context?: Record<string, unknown>, requestId?: string) {
    this.log('error', message, context, error, requestId);
  },
  debug(message: string, context?: Record<string, unknown>, requestId?: string) {
    this.log('debug', message, context, undefined, requestId);
  },
  log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown, requestId?: string) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      requestId,
      context: context ? (redactSensitiveData(context) as Record<string, unknown>) : undefined,
      error: error instanceof Error ? { name: error.name, message: error.message } : error,
    };

    const serialized = JSON.stringify(entry);
    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  },
};
