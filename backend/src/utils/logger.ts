// src/utils/logger.ts
import winston from 'winston';
import env from '../config/env';

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

// ---------------------------------------------------------------------------
// Custom formats
// ---------------------------------------------------------------------------

/**
 * Development format — coloured, human-readable single line.
 * Example: 2024-05-01 12:00:00 [error] Something broke {"userId":"abc"}
 */
const devFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? ` ${JSON.stringify(meta, null, 0)}`
    : '';
  // If an Error was passed, prefer the stack trace over the bare message
  const body = stack ? `\n${stack}` : message;
  return `${ts} [${level}] ${body}${metaStr}`;
});

/**
 * Production format — structured JSON, one object per line.
 * Pairs cleanly with log aggregators (Datadog, CloudWatch, Loki).
 */
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),   // capture stack traces on Error objects
  splat(),                   // support printf-style %s %d interpolation
  json()
);

const devFormatFull = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  splat(),
  devFormat
);

// ---------------------------------------------------------------------------
// Log level strategy
//
//  production  → 'warn'  (error + warn only — keeps noise low)
//  test        → 'error' (silence everything except failures)
//  development → 'debug' (full verbosity)
// ---------------------------------------------------------------------------
function resolveLogLevel(): string {
  if (env.IS_PRODUCTION)  return 'warn';
  if (env.IS_TEST)        return 'error';
  return env.LOG_LEVEL ?? 'debug';
}

// ---------------------------------------------------------------------------
// Transports
// ---------------------------------------------------------------------------
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.IS_PRODUCTION ? prodFormat : devFormatFull,
    stderrLevels: ['error'],       // errors → stderr, everything else → stdout
    handleExceptions: true,        // also catch uncaughtException via Winston
    handleRejections: true,        // also catch unhandledRejection via Winston
  }),
];

// In production, additionally write to rotating log files
if (env.IS_PRODUCTION) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
      maxsize: 10 * 1024 * 1024,  // 10 MB per file
      maxFiles: 5,                 // keep last 5 rotations
      tailable: true,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
      maxsize: 20 * 1024 * 1024,  // 20 MB per file
      maxFiles: 10,
      tailable: true,
    })
  );
}

// ---------------------------------------------------------------------------
// Logger instance
// ---------------------------------------------------------------------------
const logger = winston.createLogger({
  level: resolveLogLevel(),
  // Base metadata attached to every log entry
  defaultMeta: { service: 'projecthub-api' },
  // handleExceptions / handleRejections are set on the Console transport above
  exitOnError: false,  // don't crash the process on a logged exception
  silent: false,
  transports,
});

// ---------------------------------------------------------------------------
// Dev-only convenience — log unhandled rejections before Winston's handler
// fires, so the message is visible even if Winston setup itself fails
// ---------------------------------------------------------------------------
if (env.IS_DEVELOPMENT) {
  logger.debug('[logger] Logger initialised', {
    level: resolveLogLevel(),
    transports: transports.map((t) => t.constructor.name),
  });
}

export default logger;