import { Request, Response } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import { sendCreated, sendSuccess } from '../../utils/ApiResponse';

import {
  registerSchema,
  loginSchema,
} from './auth.validation';

import {
  registerUser,
  loginUser,
  getCurrentUser,
} from './auth.service';

export const register = asyncHandler(
  async (req: Request, res: Response) => {
    const data = registerSchema.parse(req.body);

    const result = await registerUser(data);

    return sendCreated(
      res,
      result,
      'User registered successfully'
    );
  }
);

export const login = asyncHandler(
  async (req: Request, res: Response) => {
    const data = loginSchema.parse(req.body);

    const result = await loginUser(data);

    return sendSuccess(
      res,
      result,
      'Login successful'
    );
  }
);

export const getMe = asyncHandler(
  async (req: Request, res: Response) => {
    const user = await getCurrentUser(req.user!.id);

    return sendSuccess(
      res,
      user,
      'Current user retrieved successfully'
    );
  }
);