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

// Person validators
const {
  validateCreate,
  validateGet,
  validateList,
  validateSubmitToFinance
} = require('../validators/personValidator');

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

module.exports = router;

