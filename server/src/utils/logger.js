const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel =
  LEVELS[process.env.LOG_LEVEL] ??
  (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);

function emit(level, context, message, meta) {
  if (LEVELS[level] > currentLevel) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase().padEnd(5)}] [${context}]`;
  const line = meta !== undefined
    ? `${prefix} ${message} ${JSON.stringify(meta)}`
    : `${prefix} ${message}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  error: (ctx, msg, meta) => emit('error', ctx, msg, meta),
  warn:  (ctx, msg, meta) => emit('warn',  ctx, msg, meta),
  info:  (ctx, msg, meta) => emit('info',  ctx, msg, meta),
  debug: (ctx, msg, meta) => emit('debug', ctx, msg, meta),
};
