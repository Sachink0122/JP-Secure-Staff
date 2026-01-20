/**
 * Finance Validators
 * Input validation for Finance module endpoints (Phase 5)
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

// Update Finance Details validation
const validateUpdateFinance = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),

  body('bankName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bank name cannot exceed 200 characters'),

  body('accountHolderName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Account holder name cannot exceed 200 characters'),

  body('accountNumber')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Account number cannot exceed 50 characters')
    .matches(/^[A-Z0-9]+$/i)
    .withMessage('Account number must contain only alphanumeric characters'),

  body('ifscCode')
    .optional()
    .trim()
    .isLength({ min: 11, max: 11 })
    .withMessage('IFSC code must be exactly 11 characters')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .withMessage('IFSC code must be in format: AAAA0XXXXX (4 letters, 0, 6 alphanumeric)'),

  body('panNumber')
    .optional()
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage('PAN number must be exactly 10 characters')
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .withMessage('PAN number must be in format: ABCDE1234F'),

  body('paymentMode')
    .optional()
    .isIn(['BANK_TRANSFER', 'CHEQUE', 'CASH'])
    .withMessage('Payment mode must be BANK_TRANSFER, CHEQUE, or CASH'),

  body('salaryType')
    .optional()
    .isIn(['MONTHLY', 'DAILY', 'HOURLY'])
    .withMessage('Salary type must be MONTHLY, DAILY, or HOURLY'),

  body('salaryAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Salary amount must be greater than 0'),

  body('financeRemarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Finance remarks cannot exceed 1000 characters'),

  body('bankProof')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Bank proof file reference is required'),

  body('panCard')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('PAN card file reference is required'),

  body('salaryStructure')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Salary structure file reference is required'),

  handleValidationErrors
];

// Complete Finance validation
const validateCompleteFinance = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),

  handleValidationErrors
];

// Assign Employee Code validation
const validateAssignEmployeeCode = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),

  handleValidationErrors
];

module.exports = {
  validateUpdateFinance,
  validateCompleteFinance,
  validateAssignEmployeeCode
};

