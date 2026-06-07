// src/middleware/auth.middleware.ts [BACKEND]
import { Request, Response, NextFunction } from 'express';
import jwt                                 from 'jsonwebtoken';
import env                                 from '../config/env';
import { ApiError }                        from '../utils/ApiError';

interface JwtPayload {
  id:    string;
  email: string;
  role:  'admin' | 'member' | 'viewer';
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('No token provided'));
  }

  const token = authHeader.split(' ')[1];
  if (!token) return next(ApiError.unauthorized('No token provided'));

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    next(err); // Caught by error.middleware as JsonWebTokenError or TokenExpiredError
  }
}

export function requireRole(...roles: ('admin' | 'member' | 'viewer')[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient permissions'));
    }
    next();
  };
}