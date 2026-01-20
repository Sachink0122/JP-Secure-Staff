/**
 * Role Validators
 * Input validation for role endpoints
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

// Create role validation
const validateCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Role name is required')
    .isLength({ max: 100 })
    .withMessage('Role name cannot exceed 100 characters'),
  
  body('permissions')
    .isArray({ min: 1 })
    .withMessage('At least one permission is required')
    .custom((permissions) => {
      if (!Array.isArray(permissions)) {
        throw new Error('Permissions must be an array');
      }
      // Validate all permissions are valid MongoDB ObjectIds
      const invalidIds = permissions.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('All permission IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Update role validation
const validateUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid role ID'),
  
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Role name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Role name cannot exceed 100 characters'),
  
  body('permissions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one permission is required')
    .custom((permissions) => {
      if (!Array.isArray(permissions)) {
        throw new Error('Permissions must be an array');
      }
      const invalidIds = permissions.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        throw new Error('All permission IDs must be valid MongoDB ObjectIds');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Get role validation
const validateGet = [
  param('id')
    .isMongoId()
    .withMessage('Invalid role ID'),
  
  handleValidationErrors
];

module.exports = {
  validateCreate,
  validateUpdate,
  validateGet
};

