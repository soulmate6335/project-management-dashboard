import { Router } from 'express';

import {
  register,
  login,
} from './auth.controller';

const router = Router();

router.get('/test', (_req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working'
  });
});

router.post('/register', register);
router.post('/login', login);

export default router;