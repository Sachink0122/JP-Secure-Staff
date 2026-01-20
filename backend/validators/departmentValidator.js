/**
 * Department Validators
 * Input validation for department endpoints
 */

const { body, param, validationResult } = require('express-validator');

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

// Create department validation
const validateCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Department name is required')
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Department code is required')
    .isLength({ max: 20 })
    .withMessage('Department code cannot exceed 20 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Department code must be uppercase letters, numbers, and underscores only'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors
];

// Update department validation
const validateUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),
  
  body('code')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Department code cannot be empty')
    .isLength({ max: 20 })
    .withMessage('Department code cannot exceed 20 characters')
    .matches(/^[A-Z0-9_]+$/)
    .withMessage('Department code must be uppercase letters, numbers, and underscores only'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors
];

// Get department validation
const validateGet = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID'),
  
  handleValidationErrors
];

// Status change validation
const validateStatusChange = [
  param('id')
    .isMongoId()
    .withMessage('Invalid department ID'),
  
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  
  handleValidationErrors
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateGet,
  validateStatusChange
};

