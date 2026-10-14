type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function format(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production' && level === 'debug') return;
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  console[level](prefix, msg, meta ? JSON.stringify(meta) : '');
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => format('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => format('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => format('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => format('error', msg, meta),
};
