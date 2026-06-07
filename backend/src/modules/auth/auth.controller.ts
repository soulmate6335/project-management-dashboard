import crypto from 'crypto';
import User from '../../models/User'; // FIXED: adjust path to your user model
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import bcrypt from 'bcryptjs';

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) throw ApiError.badRequest('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  sendSuccess(res, user, 'User registered successfully');
});

// ---------------------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------------------
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) throw ApiError.notFound('Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.badRequest('Invalid credentials');

  sendSuccess(res, {
    user,
    token: 'dummy-token', // replace later with JWT
  }, 'Login successful');
});

// ---------------------------------------------------------------------------
// GET ME
// ---------------------------------------------------------------------------
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?.id);
  if (!user) throw ApiError.notFound('User not found');

  sendSuccess(res, user, 'User profile');
});

// ---------------------------------------------------------------------------
// FORGOT PASSWORD
// ---------------------------------------------------------------------------
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw ApiError.notFound('User not found');

  const resetToken = crypto.randomBytes(32).toString('hex');

  user.resetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await user.save();

  sendSuccess(res, {
    resetToken, // dev only
    message: 'Use this token to reset password',
  });
});

// ---------------------------------------------------------------------------
// RESET PASSWORD
// ---------------------------------------------------------------------------
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetToken: hashedToken,
    resetTokenExpiry: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Invalid or expired token');

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null as any;
  user.resetTokenExpiry = null as any;

  await user.save();

  sendSuccess(res, null, 'Password reset successful');
});