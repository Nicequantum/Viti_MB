type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  timestamp: string;
}

const MAX_BUFFER = 200;
const buffer: LogEntry[] = [];

function write(level: LogLevel, message: string, context?: string, data?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    context,
    data,
    timestamp: new Date().toISOString(),
  };
  buffer.push(entry);
  if (buffer.length > MAX_BUFFER) buffer.shift();

  const prefix = context ? `[${context}]` : '[BenzTech]';
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`${prefix} ${message}`, data ?? '');
}

export const logger = {
  debug: (message: string, context?: string, data?: unknown) => write('debug', message, context, data),
  info: (message: string, context?: string, data?: unknown) => write('info', message, context, data),
  warn: (message: string, context?: string, data?: unknown) => write('warn', message, context, data),
  error: (message: string, context?: string, data?: unknown) => write('error', message, context, data),
  getRecent: (): readonly LogEntry[] => [...buffer],
  clear: (): void => {
    buffer.length = 0;
  },
};