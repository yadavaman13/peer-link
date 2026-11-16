import { param, body, validationResult } from 'express-validator';
import { AppError } from '../../shared/AppError.js';

export const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }
    const message = errors
      .array()
      .map((e) => e.msg)
      .join(', ');
    return next(AppError.badRequest(message));
  };
};

export const validateRoomId = validate([
  param('id').isUUID().withMessage('Room ID must be a valid UUID'),
]);

export const validateCreateRoom = validate([
  body('maxParticipants')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('maxParticipants must be 2–10'),
]);
