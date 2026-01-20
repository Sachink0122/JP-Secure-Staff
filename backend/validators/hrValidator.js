/**
 * HR Validators
 * Input validation for HR module endpoints (Phase 6)
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

// Generate HR Document validation
const validateGenerateDocument = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),

  body('documentType')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(['OFFER_LETTER', 'DECLARATION'])
    .withMessage('Document type must be OFFER_LETTER or DECLARATION'),

  body('templateId')
    .notEmpty()
    .withMessage('Template ID is required')
    .isMongoId()
    .withMessage('Template ID must be a valid MongoDB ObjectId'),

  handleValidationErrors
];

// Upload Signed HR Document validation
const validateUploadSigned = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),

  body('documentType')
    .notEmpty()
    .withMessage('Document type is required')
    .isIn(['OFFER_LETTER', 'DECLARATION'])
    .withMessage('Document type must be OFFER_LETTER or DECLARATION'),

  body('signedFile')
    .trim()
    .notEmpty()
    .withMessage('Signed file reference is required'),

  handleValidationErrors
];

// View HR Documents validation
const validateViewDocuments = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),

  handleValidationErrors
];

// Complete HR validation
const validateCompleteHR = [
  param('id')
    .isMongoId()
    .withMessage('Invalid person ID'),

  handleValidationErrors
];

module.exports = {
  validateGenerateDocument,
  validateUploadSigned,
  validateViewDocuments,
  validateCompleteHR
};

