/**
 * Demo Protected Route
 * Example of using checkPermission middleware
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const { PERMISSIONS } = require('../constants/permissions');

/**
 * Example protected route requiring USER_READ permission
 * GET /api/demo/protected
 */
router.get(
  '/protected',
  authenticate,
  checkPermission(PERMISSIONS.USER_READ),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'You have successfully accessed a protected route!',
      data: {
        userId: req.user.userId,
        departmentId: req.user.departmentId,
        permissions: req.user.permissions,
        timestamp: new Date().toISOString()
      }
    });
  }
);

/**
 * Example route requiring multiple permissions (any one)
 * GET /api/demo/admin-only
 */
router.get(
  '/admin-only',
  authenticate,
  checkPermission(PERMISSIONS.MASTER_ADMIN),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Master Admin access granted!',
      data: {
        userId: req.user.userId,
        permissions: req.user.permissions
      }
    });
  }
);

module.exports = router;

