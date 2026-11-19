import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../src/models/user.model.js';
import envConfig from '../../src/config/env.config.js';

/**
 * Generate randomized user data to avoid unique constraint collisions
 */
export function generateTestUserData(prefix = 'test_user') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 100000);
  return {
    firstName: 'Test',
    lastName: 'User',
    email: `${prefix}_${timestamp}_${random}@peerlink.dev`,
    password: 'Password@123',
  };
}

/**
 * Directly create an authenticated test user and return records + auth headers/cookies
 */
export async function createAndLoginTestUser(overrides = {}) {
  const payload = {
    ...generateTestUserData(),
    ...overrides,
  };

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await User.create({
    ...payload,
    password: hashedPassword,
    isActive: true,
    emailVerified: true,
  });

  const userId = user._id.toString();
  const role = 'USER';

  const token = jwt.sign({ id: userId, email: user.email, role }, envConfig.JWT_SECRET_KEY, {
    expiresIn: '1d',
  });

  return {
    user,
    token,
    cookie: `token=${token}`,
    authHeader: `Bearer ${token}`,
  };
}
