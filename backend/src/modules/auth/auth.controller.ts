// src/modules/auth/auth.controller.ts [BACKEND]
import crypto      from 'crypto';
import jwt         from 'jsonwebtoken';
import bcrypt      from 'bcryptjs';

import User        from '../../models/User.model';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../../utils/ApiResponse';
import { ApiError }     from '../../utils/ApiError';
import env              from '../../config/env';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateAccessToken(payload: {
  id: string; email: string; role: string;
}): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

function generateRefreshToken(payload: {
  id: string; email: string; role: string;
}): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

function sanitiseUser(user: InstanceType<typeof User>) {
  return {
    _id:       user._id,
    name:      user.name,
    email:     user.email,
    role:      user.role,
    avatar:    user.avatar,
    isActive:  user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body as {
    name: string; email: string; password: string;
  };

  const existingUser = await User.findOne({ email });
  if (existingUser) throw ApiError.conflict('An account with this email already exists');

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await User.create({ name, email, password: hashedPassword });

  const tokenPayload = {
    id:    user._id.toString(),
    email: user.email,
    role:  user.role,
  };

  const accessToken  = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  sendCreated(res, {
    user:         sanitiseUser(user),
    accessToken,
    refreshToken,
  }, 'User registered successfully');
});

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body as {
    email: string; password: string;
  };

  // select('+password') because password has select: false in the schema
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  const tokenPayload = {
    id:    user._id.toString(),
    email: user.email,
    role:  user.role,
  };

  const accessToken  = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  sendSuccess(res, {
    user:         sanitiseUser(user),
    accessToken,
    refreshToken,
  }, 'Login successful');
});

// ---------------------------------------------------------------------------
// GET ME
// ---------------------------------------------------------------------------
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?.id);
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, sanitiseUser(user), 'User profile');
});

// ---------------------------------------------------------------------------
// REFRESH TOKEN
// ---------------------------------------------------------------------------
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body as { refreshToken: string };
  if (!token) throw ApiError.badRequest('Refresh token is required');

  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as {
      id: string; email: string; role: string;
    };

    const user = await User.findById(decoded.id);
    if (!user) throw ApiError.unauthorized('User not found');

    const accessToken = generateAccessToken({
      id:    user._id.toString(),
      email: user.email,
      role:  user.role,
    });

    sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }
});

// ---------------------------------------------------------------------------
// FORGOT PASSWORD
// ---------------------------------------------------------------------------
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body as { email: string };

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('No account found with this email');

  const resetToken = crypto.randomBytes(32).toString('hex');

  user.resetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  await user.save();

  sendSuccess(res, {
    resetToken, // dev only — in production send via email
    message:    'Use this token to reset your password within 15 minutes',
  }, 'Reset token generated');
});

// ---------------------------------------------------------------------------
// RESET PASSWORD
// ---------------------------------------------------------------------------
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body as {
    token: string; newPassword: string;
  };

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetToken:       hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.password         = await bcrypt.hash(newPassword, 12);
  user.resetToken       = null as any;
  user.resetTokenExpiry = null as any;
  await user.save();

  sendSuccess(res, null, 'Password reset successful. Please log in.');
});