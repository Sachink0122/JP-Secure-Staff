/**
 * Person Routes
 * Operation Stage-A person management endpoints
 * All routes protected by authenticate + permission checks
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../constants/permissions');

// Person controllers
const {
  createPerson,
  getPerson,
  listPersons,
  submitPersonToFinance
} = require('../controllers/personController');

// Finance controllers (Phase 5)
const {
  updateFinanceDetails,
  completeFinance,
  assignEmployeeCode
} = require('../controllers/financeController');

// HR controllers (Phase 6)
const {
  generateHRDocument,
  uploadSignedHRDocument,
  viewHRDocuments,
  completeHR
} = require('../controllers/hrController');

// Person validators
const {
  validateCreate,
  validateGet,
  validateList,
  validateSubmitToFinance
} = require('../validators/personValidator');

// Finance validators (Phase 5)
const {
  validateUpdateFinance,
  validateCompleteFinance,
  validateAssignEmployeeCode
} = require('../validators/financeValidator');

// HR validators (Phase 6)
const {
  validateGenerateDocument,
  validateUploadSigned,
  validateViewDocuments,
  validateCompleteHR
} = require('../validators/hrValidator');

// All person routes require authentication
router.use(authenticate);

// ==================== PERSON ROUTES ====================

router.post(
  '/persons',
  checkPermission(PERMISSIONS.PERSON_CREATE),
  validateCreate,
  createPerson
);

router.get(
  '/persons',
  checkPermission(PERMISSIONS.PERSON_READ),
  validateList,
  listPersons
);

router.get(
  '/persons/:id',
  checkPermission(PERMISSIONS.PERSON_READ),
  validateGet,
  getPerson
);

router.post(
  '/persons/:id/submit-to-finance',
  checkPermission(PERMISSIONS.PERSON_SUBMIT_TO_FINANCE),
  validateSubmitToFinance,
  submitPersonToFinance
);

// ==================== FINANCE ROUTES (Phase 5) ====================

router.put(
  '/persons/:id/finance',
  checkPermission(PERMISSIONS.FINANCE_KYC_UPDATE),
  validateUpdateFinance,
  updateFinanceDetails
);

router.post(
  '/persons/:id/finance/complete',
  checkPermission(PERMISSIONS.FINANCE_KYC_UPDATE),
  validateCompleteFinance,
  completeFinance
);

router.post(
  '/persons/:id/finance/assign-employee-code',
  checkPermission(PERMISSIONS.FINANCE_KYC_UPDATE),
  validateAssignEmployeeCode,
  assignEmployeeCode
);

// ==================== HR ROUTES (Phase 6) ====================

router.post(
  '/persons/:id/hr/generate',
  checkPermission(PERMISSIONS.HR_DOCUMENT_GENERATE),
  validateGenerateDocument,
  generateHRDocument
);

router.post(
  '/persons/:id/hr/upload',
  checkPermission(PERMISSIONS.HR_DOCUMENT_UPLOAD),
  validateUploadSigned,
  uploadSignedHRDocument
);

router.get(
  '/persons/:id/hr/documents',
  checkPermission(PERMISSIONS.HR_DOCUMENT_READ),
  validateViewDocuments,
  viewHRDocuments
);

router.post(
  '/persons/:id/hr/complete',
  checkPermission(PERMISSIONS.HR_COMPLETE),
  validateCompleteHR,
  completeHR
);

module.exports = router;

