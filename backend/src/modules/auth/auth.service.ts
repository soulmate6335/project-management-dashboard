import bcrypt from 'bcryptjs';

import User from '../../models/User';
import { ApiError } from '../../utils/ApiError';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../utils/jwt';

import {
  RegisterInput,
  LoginInput,
} from './auth.validation';

export async function registerUser(data: RegisterInput) {
  const existingUser = await User.findOne({
    email: data.email.toLowerCase(),
  });

  if (existingUser) {
    throw ApiError.conflict('Email already exists');
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    password: hashedPassword,
  });

  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

 const userObject = user.toObject();

const { password, ...safeUser } = userObject;

return {
  user: safeUser,
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
};
}

export async function loginUser(data: LoginInput) {
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+password');

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!passwordMatch) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

 const userObject = user.toObject();

const { password, ...safeUser } = userObject;

return {
  user: safeUser,
  accessToken: generateAccessToken(payload),
  refreshToken: generateRefreshToken(payload),
};
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
}