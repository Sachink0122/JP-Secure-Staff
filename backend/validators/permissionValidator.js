/**
 * Permission Validators
 * Input validation for permission endpoints
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

// Create permission validation
const validateCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Permission name is required')
    .isLength({ max: 100 })
    .withMessage('Permission name cannot exceed 100 characters')
    .matches(/^[A-Z_]+$/)
    .withMessage('Permission name must be uppercase letters and underscores only'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Get permission validation
const validateGet = [
  param('id')
    .isMongoId()
    .withMessage('Invalid permission ID'),
  
  handleValidationErrors
];

module.exports = {
  validateCreate,
  validateGet
};

