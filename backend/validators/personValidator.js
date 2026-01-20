/**
 * Person Validators
 * Input validation for person endpoints
 */

const { body, param, query, validationResult } = require('express-validator');

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

// Create person validation
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
  
  body('primaryMobile')
    .trim()
    .notEmpty()
    .withMessage('Primary mobile is required')
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid mobile number')
    .isLength({ min: 10, max: 20 })
    .withMessage('Mobile number must be between 10 and 20 characters'),
  
  body('alternateMobile')
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (value && value === req.body.primaryMobile) {
        throw new Error('Alternate mobile must be different from primary mobile');
      }
      return true;
    })
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Please provide a valid mobile number')
    .isLength({ min: 10, max: 20 })
    .withMessage('Mobile number must be between 10 and 20 characters'),
  
  body('employmentType')
    .notEmpty()
    .withMessage('Employment type is required')
    .isIn(['FULL_TIME', 'CONTRACT', 'INTERN'])
    .withMessage('Employment type must be FULL_TIME, CONTRACT, or INTERN'),
  
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),
  
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['MECHANICAL', 'ELECTRICAL', 'CIVIL', 'IT', 'OTHER'])
    .withMessage('Category must be MECHANICAL, ELECTRICAL, CIVIL, IT, or OTHER'),
  
  body('experience')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Experience cannot exceed 100 characters'),
  
  body('currentLocation')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Current location cannot exceed 200 characters'),
  
  body('cvFile')
    .trim()
    .notEmpty()
    .withMessage('CV file is required'),
  
  body('qualificationCertificates')
    .isArray({ min: 1 })
    .withMessage('At least one qualification certificate is required')
    .custom((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        throw new Error('At least one qualification certificate is required');
      }
      if (!value.every(item => typeof item === 'string' && item.trim().length > 0)) {
        throw new Error('All qualification certificates must be valid file references');
      }
      return true;
    }),
  
  body('ndtCertificate')
    .optional()
    .trim()
    .custom((value, { req }) => {
      // NDT certificate is required only for MECHANICAL category
      if (req.body.category === 'MECHANICAL' && !value) {
        throw new Error('NDT certificate is required for MECHANICAL category');
      }
      // If category is not MECHANICAL, NDT certificate should not be provided
      if (req.body.category !== 'MECHANICAL' && value) {
        throw new Error('NDT certificate is only required for MECHANICAL category');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Get person validation
const validateGet = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),
  
  handleValidationErrors
];

// List persons validation
const validateList = [
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  
  query('category')
    .optional()
    .isIn(['MECHANICAL', 'ELECTRICAL', 'CIVIL', 'IT', 'OTHER'])
    .withMessage('Category must be MECHANICAL, ELECTRICAL, CIVIL, IT, or OTHER'),
  
  query('owningDepartment')
    .optional()
    .isMongoId()
    .withMessage('Owning department must be a valid MongoDB ObjectId'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a non-negative integer'),
  
  handleValidationErrors
];

module.exports = {
  validateCreate,
  validateGet,
  validateList
};

