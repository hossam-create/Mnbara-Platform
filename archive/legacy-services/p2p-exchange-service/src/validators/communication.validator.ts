import { param, body } from 'express-validator';

/**
 * Validation rules for sending a message
 */
export const sendMessageValidator = [
  param('matchId')
    .isInt({ min: 1 })
    .withMessage('Match ID must be a positive integer'),
  
  body('message')
    .isString()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('message must be between 1 and 1000 characters'),
];

/**
 * Validation rules for getting messages
 */
export const getMessagesValidator = [
  param('matchId')
    .isInt({ min: 1 })
    .withMessage('Match ID must be a positive integer'),
];
