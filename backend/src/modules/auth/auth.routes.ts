// src/modules/auth/auth.routes.ts [BACKEND]
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  register,
  login,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
} from './auth.controller';

const router = Router();

// Public routes
router.post('/register',       register);
router.post('/login',          login);
router.post('/refresh',        refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// Protected routes
router.get('/me', authMiddleware, getMe);

export default router;