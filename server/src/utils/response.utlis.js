/**
 * Standardized JSON response helper
 *
 * @param {Object} options
 * @param {import('express').Response} options.res - Express response object
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {string} [options.message=''] - Response message
 * @param {boolean} [options.success=true] - Success flag
 * @param {Object} [extra] - Any additional properties to include in the response payload
 */
export function sendResponse({ res, statusCode = 200, message = '', success = true, ...extra }) {
  const payload = {
    success,
    message,
    ...extra,
  };

  return res.status(statusCode).json(payload);
}

export default sendResponse;
