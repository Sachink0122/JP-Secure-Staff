/**
 * User Validators
 * Input validation for user endpoints
 */

const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// Create user validation
const validateCreate = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ max: 200 })
    .withMessage('Full name cannot exceed 200 characters'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('department')
    .isMongoId()
    .withMessage('Valid department ID is required'),
  
  body('role')
    .isMongoId()
    .withMessage('Valid role ID is required'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors
];

// Update user validation
const validateUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Full name cannot exceed 200 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('department')
    .optional()
    .isMongoId()
    .withMessage('Valid department ID is required'),
  
  body('role')
    .optional()
    .isMongoId()
    .withMessage('Valid role ID is required'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors
];

// Get user validation
const validateGet = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  handleValidationErrors
];

// Status change validation
const validateStatusChange = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors
];

// Reset password validation
const validateResetPassword = [
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  handleValidationErrors
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateGet,
  validateStatusChange,
  validateResetPassword
};

