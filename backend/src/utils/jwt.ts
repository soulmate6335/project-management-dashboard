import jwt, { SignOptions } from 'jsonwebtoken';
import env from '../config/env';

export interface JwtPayload {
  id: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------
if (!env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined');
}

if (!env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET is not defined');
}

// ---------------------------------------------------------------------------
// ACCESS TOKEN
// ---------------------------------------------------------------------------
export function generateAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

// ---------------------------------------------------------------------------
// REFRESH TOKEN
// ---------------------------------------------------------------------------
export function generateRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

// ---------------------------------------------------------------------------
// VERIFY ACCESS TOKEN
// ---------------------------------------------------------------------------
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

// ---------------------------------------------------------------------------
// VERIFY REFRESH TOKEN
// ---------------------------------------------------------------------------
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
}