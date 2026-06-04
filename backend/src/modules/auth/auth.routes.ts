
import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  register,
  login,
  getMe,
} from './auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

export default router;