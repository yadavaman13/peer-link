import jwt from 'jsonwebtoken';
import envConfig from '../../../config/env.config.js';

/**
 * Generate a signed JWT token
 * @param {Object} payload - Token payload (e.g. { id, email, role })
 * @param {string|number} [expiresIn] - Expiration string (e.g. '7d', '1h')
 * @returns {string} Signed JWT
 */
export function generateToken(payload, expiresIn = envConfig.JWT_EXPIRES_IN) {
  return jwt.sign(payload, envConfig.JWT_SECRET_KEY, {
    expiresIn,
  });
}

/**
 * Verify a JWT token
 * @param {string} token - JWT token string
 * @returns {Object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, envConfig.JWT_SECRET_KEY);
}

export default { generateToken, verifyToken };
