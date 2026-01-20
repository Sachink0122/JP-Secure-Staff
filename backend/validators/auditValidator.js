/**
 * Audit Validators
 * Input validation for audit log endpoints
 */

const { query, param, validationResult } = require('express-validator');

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

// Get audit logs validation
const validateGetLogs = [
  query('action')
    .optional()
    .isString()
    .withMessage('Action must be a string'),
  
  query('targetEntity')
    .optional()
    .isIn(['Department', 'Permission', 'Role', 'User'])
    .withMessage('Target entity must be one of: Department, Permission, Role, User'),
  
  query('performedBy')
    .optional()
    .isMongoId()
    .withMessage('Performed by must be a valid MongoDB ObjectId'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

// Get single audit log validation
const validateGetLog = [
  param('id')
    .isMongoId()
    .withMessage('Invalid audit log ID'),
  
  handleValidationErrors
];

module.exports = {
  validateGetLogs,
  validateGetLog
};

