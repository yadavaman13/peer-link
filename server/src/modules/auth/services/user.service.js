import bcrypt from 'bcryptjs';
import { User } from '../../../models/user.model.js';
import { AppError } from '../../../shared/AppError.js';

/**
 * Update user profile fields
 */
export async function updateProfile(userId, { email, firstName, lastName, profileImage }) {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404);
  }

  if (email && email !== user.email) {
    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing && existing.id !== user.id) {
      throw new AppError('Email is already in use by another account', 400);
    }
    user.email = email.trim().toLowerCase();
    user.emailVerified = false; // reset verification on email change
  }

  if (firstName !== undefined) user.firstName = firstName.trim();
  if (lastName !== undefined) user.lastName = lastName.trim();
  if (profileImage !== undefined) user.profileImage = profileImage;

  await user.save();
  return user;
}

/**
 * Change user password
 */
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404);
  }

  if (!user.password && user.googleId) {
    throw new AppError('Password change is not available for Google OAuth accounts', 400);
  }

  if (currentPassword === newPassword) {
    throw new AppError('New password cannot be similar to the current password', 400);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return user;
}

/**
 * Soft delete user account
 */
export async function deleteAccount(userId, password) {
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    throw new AppError('User not found', 404);
  }

  if (user.password) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Incorrect password', 400);
    }
  }

  // Soft delete: 30 days recovery window
  const recoveryDays = 30;
  user.isDeleted = true;
  user.isActive = false;
  user.recoveryExpiresAt = new Date(Date.now() + recoveryDays * 24 * 60 * 60 * 1000);
  await user.save();

  return { recoveryExpiresAt: user.recoveryExpiresAt };
}

export default { updateProfile, changePassword, deleteAccount };
