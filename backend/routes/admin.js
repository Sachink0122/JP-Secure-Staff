/**
 * Admin Routes
 * Master Admin setup and management endpoints
 * All routes protected by authenticate + permission checks
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../constants/permissions');

// Department routes
const {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus
} = require('../controllers/departmentController');
const {
  validateCreate: validateDeptCreate,
  validateUpdate: validateDeptUpdate,
  validateGet: validateDeptGet,
  validateStatusChange: validateDeptStatusChange
} = require('../validators/departmentValidator');

// Permission routes
const {
  getAllPermissions,
  getPermission,
  createPermission
} = require('../controllers/permissionController');
const {
  validateCreate: validatePermCreate,
  validateGet: validatePermGet
} = require('../validators/permissionValidator');

// Role routes
const {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  checkRoleUsage
} = require('../controllers/roleController');
const {
  validateCreate: validateRoleCreate,
  validateUpdate: validateRoleUpdate,
  validateGet: validateRoleGet
} = require('../validators/roleValidator');

// User routes
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword
} = require('../controllers/userController');
const {
  validateCreate: validateUserCreate,
  validateUpdate: validateUserUpdate,
  validateGet: validateUserGet,
  validateStatusChange: validateUserStatusChange,
  validateResetPassword
} = require('../validators/userValidator');

// Audit routes
const {
  getAuditLogs,
  getAuditLog
} = require('../controllers/auditController');
const {
  validateGetLogs,
  validateGetLog
} = require('../validators/auditValidator');

// All admin routes require authentication
router.use(authenticate);

// ==================== DEPARTMENT ROUTES ====================

router.get(
  '/departments',
  checkPermission(PERMISSIONS.DEPARTMENT_READ),
  getAllDepartments
);

router.get(
  '/departments/:id',
  checkPermission(PERMISSIONS.DEPARTMENT_READ),
  validateDeptGet,
  getDepartment
);

router.post(
  '/departments',
  checkPermission(PERMISSIONS.DEPARTMENT_CREATE),
  validateDeptCreate,
  createDepartment
);

router.put(
  '/departments/:id',
  checkPermission(PERMISSIONS.DEPARTMENT_UPDATE),
  validateDeptUpdate,
  updateDepartment
);

router.patch(
  '/departments/:id/status',
  checkPermission(PERMISSIONS.DEPARTMENT_UPDATE),
  validateDeptStatusChange,
  updateDepartmentStatus
);

// ==================== PERMISSION ROUTES ====================

router.get(
  '/permissions',
  checkPermission(PERMISSIONS.PERMISSION_READ),
  getAllPermissions
);

router.get(
  '/permissions/:id',
  checkPermission(PERMISSIONS.PERMISSION_READ),
  validatePermGet,
  getPermission
);

router.post(
  '/permissions',
  checkPermission(PERMISSIONS.PERMISSION_READ), // Using PERMISSION_READ as creation permission
  validatePermCreate,
  createPermission
);

// ==================== ROLE ROUTES ====================

router.get(
  '/roles',
  checkPermission(PERMISSIONS.ROLE_READ),
  getAllRoles
);

router.get(
  '/roles/:id',
  checkPermission(PERMISSIONS.ROLE_READ),
  validateRoleGet,
  getRole
);

router.get(
  '/roles/:id/usage',
  checkPermission(PERMISSIONS.ROLE_READ),
  validateRoleGet,
  checkRoleUsage
);

router.post(
  '/roles',
  checkPermission(PERMISSIONS.ROLE_CREATE),
  validateRoleCreate,
  createRole
);

router.put(
  '/roles/:id',
  checkPermission(PERMISSIONS.ROLE_UPDATE),
  validateRoleUpdate,
  updateRole
);

// ==================== USER ROUTES ====================

router.get(
  '/users',
  checkPermission(PERMISSIONS.USER_READ),
  getAllUsers
);

router.get(
  '/users/:id',
  checkPermission(PERMISSIONS.USER_READ),
  validateUserGet,
  getUser
);

router.post(
  '/users',
  checkPermission(PERMISSIONS.USER_CREATE),
  validateUserCreate,
  createUser
);

router.put(
  '/users/:id',
  checkPermission(PERMISSIONS.USER_UPDATE),
  validateUserUpdate,
  updateUser
);

router.patch(
  '/users/:id/status',
  checkPermission(PERMISSIONS.USER_ACTIVATE), // Using activate permission for status change
  validateUserStatusChange,
  updateUserStatus
);

router.post(
  '/users/:id/reset-password',
  checkPermission(PERMISSIONS.USER_UPDATE),
  validateResetPassword,
  resetUserPassword
);

// ==================== AUDIT ROUTES ====================

router.get(
  '/audit',
  checkPermission(PERMISSIONS.AUDIT_LOG_READ),
  validateGetLogs,
  getAuditLogs
);

router.get(
  '/audit/:id',
  checkPermission(PERMISSIONS.AUDIT_LOG_READ),
  validateGetLog,
  getAuditLog
);

module.exports = router;

