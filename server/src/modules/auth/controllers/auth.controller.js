import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import redis from '../../../config/cache.config.js';
import envConfig from '../../../config/env.config.js';
import { User } from '../../../models/user.model.js';
import { sendResponse } from '../../../utils/response.utlis.js';

import {
  issueOtp,
  verifyOtp,
  resendOtp,
  OTP_PURPOSES,
  getOtpHtml,
  getForgotPasswordOtpHtml,
  getRecoverAccountOtpHtml,
  getAccountRecoveredHtml,
  normalizeEmail,
} from '../../../utils/otp.utils.js';
import { sendEmail } from '../../../services/mail/mail.service.js';

/**
 * Send token response with cookie and user payload
 */
export function sendTokenResponse(res, statusCode, message, user, rememberMe = false) {
  const userId = user.id || (user._id ? user._id.toString() : '');
  const role = user.role || (typeof user.get === 'function' ? user.get('role') : null) || 'USER';
  const expiresIn = rememberMe ? '30d' : (envConfig.JWT_EXPIRES_IN || '7d');

  const token = jwt.sign(
    { id: userId, email: user.email, role },
    envConfig.JWT_SECRET_KEY,
    { expiresIn }
  );

  const maxAge = rememberMe
    ? 30 * 24 * 60 * 60 * 1000
    : 7 * 24 * 60 * 60 * 1000;

  res.cookie('token', token, {
    ...envConfig.AUTH_COOKIE_OPTIONS,
    maxAge,
  });

  return sendResponse({
    res,
    statusCode,
    message,
    success: true,
    token,
    user: {
      id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role,
      profileImage: user.profileImage || null,
      isActive: user.isActive !== undefined ? user.isActive : true,
      emailVerified: !!user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isGoogleUser: !!user.googleId,
    },
  });
}

/**
 * Handle user registration request
 */
export async function register(req, res, next) {
  try {
    const { email, password, firstName, lastName, profileImage, role } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const passwordValue = typeof password === 'string' ? password : '';
    const firstNameValue = typeof firstName === 'string' ? firstName.trim() : '';
    const lastNameValue = typeof lastName === 'string' ? lastName.trim() : '';

    if (!normalizedEmail || !passwordValue || !firstNameValue || !lastNameValue) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Name, email, and password are required.',
        success: false,
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email is already registered',
        success: false,
      });
    }

    const isVerifiedKey = `verified_email:${normalizedEmail}`;
    let isEmailVerified = null;
    try {
      isEmailVerified = await redis.get(isVerifiedKey);
    } catch (err) {
      console.warn('Redis check failed during registration:', err.message);
    }

    let emailVerified = false;
    if (isEmailVerified) {
      emailVerified = true;
      try {
        await redis.del(isVerifiedKey);
      } catch (err) {
        console.warn('Redis del failed during registration:', err.message);
      }
    } else {
      const otpResult = await issueOtp({
        email: normalizedEmail,
        purpose: OTP_PURPOSES.VERIFY_EMAIL,
        subject: 'Verification Email',
        buildHtml: getOtpHtml,
      });

      if (!otpResult.ok) {
        return sendResponse({
          res,
          statusCode: 400,
          message: 'Unable to generate OTP.',
          success: false,
        });
      }
    }

    const hashedPassword = await bcrypt.hash(passwordValue, 10);

    let mappedRole = 'USER';
    if (role && (role.toUpperCase() === 'ADMIN')) {
      mappedRole = 'ADMIN';
    }

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstNameValue,
      lastName: lastNameValue,
      profileImage: profileImage || null,
      role: mappedRole,
      emailVerified,
      isActive: true,
      isDeleted: false,
    });

    return sendTokenResponse(res, 201, 'User registered successfully', user);
  } catch (error) {
    next(error);
  }
}

/**
 * Send pre-registration verification OTP
 */
export async function sendVerificationOtp(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email is required.',
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email is already registered.',
        success: false,
      });
    }

    const otpResult = await issueOtp({
      email,
      purpose: OTP_PURPOSES.VERIFY_EMAIL,
      subject: 'Verification Email',
      buildHtml: getOtpHtml,
    });

    if (!otpResult.ok) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Unable to generate OTP.',
        success: false,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Verification OTP sent to your email.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle user login request
 */
export async function login(req, res, next) {
  try {
    const { email, password, rememberMe, remember } = req.body || {};

    if (!email || !password) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email and password are required.',
        success: false,
      });
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 401,
        message: 'Incorrect email.',
        success: false,
      });
    }

    if (user.isDeleted) {
      const now = new Date();
      const recoveryExpiresAt = user.recoveryExpiresAt
        ? new Date(user.recoveryExpiresAt)
        : null;

      if (!recoveryExpiresAt || now <= recoveryExpiresAt) {
        const daysRemaining = recoveryExpiresAt
          ? Math.max(
              0,
              Math.ceil(
                (recoveryExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              )
            )
          : 15;

        return sendResponse({
          res,
          statusCode: 403,
          message: 'This account has been deleted. Please recover it to login.',
          success: false,
          isDeleted: true,
          canRecover: true,
          recoveryExpiresAt: user.recoveryExpiresAt,
          daysRemaining,
        });
      } else {
        return sendResponse({
          res,
          statusCode: 410,
          message: 'Recovery period has expired.',
          success: false,
          canRecover: false,
        });
      }
    }

    if (user.googleId && !user.password) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        isGoogleUser: true,
        message:
          'This account is registered with Google Sign-In. Please sign in using Google.',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return sendResponse({
        res,
        statusCode: 401,
        message: 'Incorrect password.',
        success: false,
      });
    }

    return sendTokenResponse(
      res,
      200,
      'Login successful.',
      user,
      !!(rememberMe || remember)
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Handle user logout request
 */
export async function logout(req, res, next) {
  try {
    let token = req.token || (req.cookies && req.cookies.token);
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendResponse({
        res,
        statusCode: 401,
        message: 'Unauthorized. No token provided.',
        success: false,
      });
    }

    try {
      // Blacklist token in Redis for 24 hours (86400 seconds)
      await redis.set(`blacklist:${token}`, 'true', 'EX', 24 * 60 * 60);
    } catch (err) {
      console.warn('Redis blacklist token failed:', err.message);
    }

    res.clearCookie('token');

    return sendResponse({
      res,
      statusCode: 200,
      message: 'Logout successful.',
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify user's email address using OTP
 */
export async function verifyEmail(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Email and OTP are required',
      });
    }

    const verifyResult = await verifyOtp({
      email,
      otp,
      purpose: OTP_PURPOSES.VERIFY_EMAIL,
    });

    if (!verifyResult.ok) {
      if (verifyResult.reason === 'locked') {
        return sendResponse({
          res,
          statusCode: 429,
          success: false,
          message: 'Too many attempts. Please register again.',
        });
      }

      if (verifyResult.reason === 'expired') {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: 'OTP expired',
        });
      }

      if (verifyResult.reason === 'invalid') {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: 'Invalid OTP',
          attemptsLeft: verifyResult.attemptsLeft,
          cooldownRemaining: verifyResult.cooldownRemaining,
        });
      }

      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'OTP expired or invalid',
      });
    }

    const user = await User.findOne({ email });
    if (user) {
      user.emailVerified = true;
      user.isActive = true;
      await user.save();
    } else {
      try {
        await redis.set(`verified_email:${email}`, 'true', 'EX', 3600);
      } catch (err) {
        console.warn('Redis verified_email cache failed:', err.message);
      }
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Resend OTP code
 */
export async function resendOtpHandler(req, res, next) {
  try {
    const { email, purpose } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const normalizedPurpose = typeof purpose === 'string' ? purpose.trim() : '';
    const resolvedPurpose = normalizedPurpose || OTP_PURPOSES.VERIFY_EMAIL;

    if (!normalizedEmail) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Email is required',
      });
    }

    if (
      resolvedPurpose !== OTP_PURPOSES.VERIFY_EMAIL &&
      resolvedPurpose !== OTP_PURPOSES.FORGOT_PASSWORD &&
      resolvedPurpose !== OTP_PURPOSES.RECOVER_ACCOUNT
    ) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Invalid OTP purpose',
      });
    }

    let otpConfig;
    if (resolvedPurpose === OTP_PURPOSES.FORGOT_PASSWORD) {
      otpConfig = {
        subject: 'Reset your password',
        buildHtml: getForgotPasswordOtpHtml,
        missingMessage: 'Password reset session expired. Please request a new OTP.',
      };
    } else if (resolvedPurpose === OTP_PURPOSES.RECOVER_ACCOUNT) {
      otpConfig = {
        subject: 'Recover your account',
        buildHtml: getRecoverAccountOtpHtml,
        missingMessage: 'Account recovery session expired. Please request a new OTP.',
      };
    } else {
      otpConfig = {
        subject: 'Resend Verification OTP',
        buildHtml: getOtpHtml,
        missingMessage: 'Verification session expired. Please register again.',
      };
    }

    const resendResult = await resendOtp({
      email: normalizedEmail,
      purpose: resolvedPurpose,
      subject: otpConfig.subject,
      buildHtml: otpConfig.buildHtml,
    });

    if (!resendResult.ok) {
      if (resendResult.reason === 'cooldown') {
        return sendResponse({
          res,
          statusCode: 429,
          success: false,
          message: `Please wait ${resendResult.cooldownRemaining}s before requesting another OTP`,
          cooldownRemaining: resendResult.cooldownRemaining,
        });
      }

      if (resendResult.reason === 'resend-limit') {
        return sendResponse({
          res,
          statusCode: 429,
          success: false,
          message: 'Maximum resend limit reached',
          resendLimitReached: true,
        });
      }

      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: otpConfig.missingMessage,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'OTP resent successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle password reset OTP request
 */
export async function forgotPassword(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email is required.',
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        success: false,
        message: 'No account found for this email address.',
      });
    }

    if (user.googleId && !user.password) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        isGoogleUser: true,
        message:
          'This email is registered with Google Sign-In. Password reset is not available for Google accounts. Please sign in using Google.',
      });
    }

    const otpResult = await issueOtp({
      email,
      purpose: OTP_PURPOSES.FORGOT_PASSWORD,
      subject: 'Reset your password',
      buildHtml: getForgotPasswordOtpHtml,
    });

    if (!otpResult.ok) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Unable to generate password reset OTP.',
        success: false,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'OTP sent to the registered email. Please check your inbox.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify password reset OTP
 */
export async function verifyForgotPasswordOtp(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const verifyResult = await verifyOtp({
      email,
      otp,
      purpose: OTP_PURPOSES.FORGOT_PASSWORD,
    });

    if (!verifyResult.ok) {
      if (verifyResult.reason === 'locked') {
        return sendResponse({
          res,
          statusCode: 429,
          success: false,
          message: 'Too many attempts. Please request a new OTP.',
        });
      }

      if (verifyResult.reason === 'expired') {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: 'OTP expired',
        });
      }

      if (verifyResult.reason === 'invalid') {
        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: 'Invalid OTP',
          attemptsLeft: verifyResult.attemptsLeft,
          cooldownRemaining: verifyResult.cooldownRemaining,
        });
      }

      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'OTP expired or invalid',
      });
    }

    try {
      await redis.set(`verified_reset:${email}`, 'true', 'EX', 600);
    } catch (err) {
      console.warn('Redis verified_reset failed:', err.message);
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'OTP verified successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle password reset completion using OTP
 */
export async function resetPassword(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const confirmPassword =
      typeof req.body?.confirmPassword === 'string' ? req.body.confirmPassword : '';

    if (!email || !otp || !password || !confirmPassword) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email, OTP, password, and confirm password are required.',
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        message: 'No valid account exists for this email.',
      });
    }

    if (user.googleId && !user.password) {
      return sendResponse({
        res,
        statusCode: 400,
        success: false,
        isGoogleUser: true,
        message:
          'This email is registered with Google Sign-In. Password reset is not available for Google accounts. Please sign in using Google.',
      });
    }

    if (password !== confirmPassword) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Passwords do not match.',
        success: false,
      });
    }

    if (user.password) {
      const isSamePassword = await bcrypt.compare(password, user.password);
      if (isSamePassword) {
        return sendResponse({
          res,
          statusCode: 400,
          message: 'New password cannot be same as previous password.',
          success: false,
        });
      }
    }

    let isAlreadyVerified = null;
    try {
      isAlreadyVerified = await redis.get(`verified_reset:${email}`);
    } catch (err) {
      console.warn('Redis get verified_reset failed:', err.message);
    }

    if (isAlreadyVerified) {
      try {
        await redis.del(`verified_reset:${email}`);
      } catch (err) {
        console.warn('Redis del verified_reset failed:', err.message);
      }
    } else {
      const verifyResult = await verifyOtp({
        email,
        otp,
        purpose: OTP_PURPOSES.FORGOT_PASSWORD,
      });

      if (!verifyResult.ok) {
        if (verifyResult.reason === 'locked') {
          return sendResponse({
            res,
            statusCode: 429,
            success: false,
            message: 'Too many attempts. Please request a new OTP.',
          });
        }

        if (verifyResult.reason === 'expired') {
          return sendResponse({
            res,
            statusCode: 400,
            success: false,
            message: 'OTP expired',
          });
        }

        if (verifyResult.reason === 'invalid') {
          return sendResponse({
            res,
            statusCode: 400,
            success: false,
            message: 'Invalid OTP',
            attemptsLeft: verifyResult.attemptsLeft,
            cooldownRemaining: verifyResult.cooldownRemaining,
          });
        }

        return sendResponse({
          res,
          statusCode: 400,
          success: false,
          message: 'OTP expired or invalid',
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Password reset successful.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Request account recovery OTP
 */
export async function requestAccountRecovery(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email is required.',
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        message: 'No account found for this email address.',
        success: false,
      });
    }

    if (!user.isDeleted) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Account is not deleted.',
        success: false,
      });
    }

    const now = new Date();
    if (user.recoveryExpiresAt && now > new Date(user.recoveryExpiresAt)) {
      return sendResponse({
        res,
        statusCode: 410,
        message: 'Recovery period has expired for this account.',
        success: false,
        canRecover: false,
      });
    }

    const otpResult = await issueOtp({
      email,
      purpose: OTP_PURPOSES.RECOVER_ACCOUNT,
      subject: 'Recover your account',
      buildHtml: getRecoverAccountOtpHtml,
    });

    if (!otpResult.ok) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Unable to generate account recovery OTP.',
        success: false,
      });
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Recovery OTP sent to your registered email.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify account recovery OTP and restore account
 */
export async function verifyAccountRecovery(req, res, next) {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = typeof req.body?.otp === 'string' ? req.body.otp.trim() : '';

    if (!email || !otp) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Email and OTP are required.',
        success: false,
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.isDeleted) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Invalid recovery request.',
        success: false,
      });
    }

    const verifyResult = await verifyOtp({
      email,
      otp,
      purpose: OTP_PURPOSES.RECOVER_ACCOUNT,
    });

    if (!verifyResult.ok) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Invalid or expired OTP.',
        success: false,
      });
    }

    user.isDeleted = false;
    user.isActive = true;
    user.recoveryExpiresAt = null;
    await user.save();

    try {
      await sendEmail({
        to: email,
        subject: 'Account Successfully Recovered',
        html: getAccountRecoveredHtml(),
      });
    } catch (mailError) {
      console.warn('Failed to send recovery confirmation email:', mailError.message);
    }

    return sendResponse({
      res,
      statusCode: 200,
      success: true,
      message: 'Account successfully recovered. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current logged in user details
 */
export async function getMe(req, res, next) {
  try {
    const userId = req.user.id;
    const cacheKey = `user:${userId}`;
    let user;
    let fromCache = false;

    try {
      const cachedUser = await redis.get(cacheKey);
      if (cachedUser) {
        user = JSON.parse(cachedUser);
        fromCache = true;
      }
    } catch (cacheError) {
      console.warn('Redis cache get error in getMe:', cacheError.message);
    }

    if (!user) {
      user = await User.findById(userId);
      if (!user) {
        return sendResponse({
          res,
          statusCode: 404,
          message: 'User not found.',
          success: false,
        });
      }
      try {
        await redis.set(cacheKey, JSON.stringify(user), 'EX', 600);
      } catch (cacheError) {
        console.warn('Redis cache set error in getMe:', cacheError.message);
      }
    }

    return sendResponse({
      res,
      statusCode: fromCache ? 304 : 200,
      message: 'User retrieved successfully',
      success: true,
      user: {
        id: user.id || user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role || 'USER',
        profileImage: user.profileImage,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isGoogleUser: !!user.googleId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Change current logged in user password
 */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return sendResponse({
        res,
        statusCode: 404,
        message: 'User not found.',
        success: false,
      });
    }

    if (currentPassword === newPassword) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'New password cannot be similar to the previous password.',
        success: false,
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendResponse({
        res,
        statusCode: 400,
        message: 'Current password is incorrect.',
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    const cacheKey = `user:${userId}`;
    try {
      await redis.del(cacheKey);
    } catch (cacheError) {
      console.warn('Redis cache delete error in changePassword:', cacheError.message);
    }

    return sendResponse({
      res,
      statusCode: 200,
      message: 'Password changed successfully',
      success: true,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Google OAuth Callback handler stub
 */
export async function googleCallback(req, res, next) {
  try {
    if (!req.user) {
      return res.redirect(`${envConfig.CLIENT_ORIGIN}/login?error=google_auth_failed`);
    }
    return sendTokenResponse(res, 200, 'Google login successful', req.user);
  } catch (error) {
    next(error);
  }
}
