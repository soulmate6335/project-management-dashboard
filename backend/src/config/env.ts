// src/config/env.ts
//
// Single source of truth for all environment variables.
// Validates and throws at boot — no silent failures in production.
// All other files import from here, never from process.env directly.

import dotenv from 'dotenv';
import path from 'path';



// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireString(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `[env] Missing required environment variable: "${key}". ` +
      `Check your .env file or deployment config.`
    );
  }
  return value.trim();
}

function optionalString(key: string, fallback: string): string {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : fallback;
}

function requireNumber(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(
      `[env] Environment variable "${key}" must be a positive integer, got: "${raw}"`
    );
  }
  return parsed;
}

function readNodeEnv(): 'development' | 'production' | 'test' {
  const env = optionalString('NODE_ENV', 'development');
  if (!['development', 'production', 'test'].includes(env)) {
    throw new Error(
      `[env] NODE_ENV must be "development", "production", or "test", got: "${env}"`
    );
  }
  return env as 'development' | 'production' | 'test';
}

// ---------------------------------------------------------------------------
// Validated config object
// ---------------------------------------------------------------------------
const env = {
  NODE_ENV:   readNodeEnv(),
  PORT:       requireNumber('PORT', 5000),
  CLIENT_URL: optionalString('CLIENT_URL', 'http://localhost:5173'),

  MONGODB_URI: requireString('MONGODB_URI'),

  JWT_SECRET:             requireString('JWT_SECRET'),
  JWT_EXPIRES_IN:         optionalString('JWT_EXPIRES_IN', '7d'),
  JWT_REFRESH_SECRET:     requireString('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: optionalString('JWT_REFRESH_EXPIRES_IN', '30d'),

  RATE_LIMIT_WINDOW_MS: requireNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  RATE_LIMIT_MAX:       requireNumber('RATE_LIMIT_MAX', 100),
  AUTH_RATE_LIMIT_MAX:  requireNumber('AUTH_RATE_LIMIT_MAX', 10),

  LOG_LEVEL: optionalString('LOG_LEVEL', 'info'),

  get IS_PRODUCTION()  { return this.NODE_ENV === 'production'; },
  get IS_DEVELOPMENT() { return this.NODE_ENV === 'development'; },
  get IS_TEST()        { return this.NODE_ENV === 'test'; },
} as const;

export default env;