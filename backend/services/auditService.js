/**
 * Audit Service
 * Centralized service for logging admin actions
 */

const AuditLog = require('../models/AuditLog');

/**
 * Log an admin action
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - Action type
 * @param {string} params.performedBy - User ID who performed the action
 * @param {string} params.targetEntity - Entity type (Department, Permission, Role, User)
 * @param {string} params.targetId - Target entity ID
 * @param {Object} params.changes - Changes made (optional)
 * @param {Object} params.metadata - Additional metadata (optional)
 * @param {string} params.ipAddress - IP address (optional)
 * @param {string} params.userAgent - User agent (optional)
 */
const logAction = async ({
  action,
  performedBy,
  targetEntity,
  targetId,
  changes = {},
  metadata = {},
  ipAddress = null,
  userAgent = null
}) => {
  try {
    await AuditLog.create({
      action,
      performedBy,
      targetEntity,
      targetId,
      changes,
      metadata,
      ipAddress,
      userAgent
    });
  } catch (error) {
    // Don't throw error - audit logging should not break the main flow
    console.error('Audit logging error:', error);
  }
};

/**
 * Log department action
 */
const logDepartmentAction = async (action, performedBy, departmentId, changes = {}, metadata = {}, req = null) => {
  await logAction({
    action,
    performedBy,
    targetEntity: 'Department',
    targetId: departmentId,
    changes,
    metadata,
    ipAddress: req?.ip || req?.connection?.remoteAddress || null,
    userAgent: req?.get('user-agent') || null
  });
};

/**
 * Log permission action
 */
const logPermissionAction = async (action, performedBy, permissionId, changes = {}, metadata = {}, req = null) => {
  await logAction({
    action,
    performedBy,
    targetEntity: 'Permission',
    targetId: permissionId,
    changes,
    metadata,
    ipAddress: req?.ip || req?.connection?.remoteAddress || null,
    userAgent: req?.get('user-agent') || null
  });
};

/**
 * Log role action
 */
const logRoleAction = async (action, performedBy, roleId, changes = {}, metadata = {}, req = null) => {
  await logAction({
    action,
    performedBy,
    targetEntity: 'Role',
    targetId: roleId,
    changes,
    metadata,
    ipAddress: req?.ip || req?.connection?.remoteAddress || null,
    userAgent: req?.get('user-agent') || null
  });
};

/**
 * Log user action
 */
const logUserAction = async (action, performedBy, userId, changes = {}, metadata = {}, req = null) => {
  await logAction({
    action,
    performedBy,
    targetEntity: 'User',
    targetId: userId,
    changes,
    metadata,
    ipAddress: req?.ip || req?.connection?.remoteAddress || null,
    userAgent: req?.get('user-agent') || null
  });
};

/**
 * Log person action
 */
const logPersonAction = async (action, performedBy, personId, changes = {}, metadata = {}, req = null) => {
  await logAction({
    action,
    performedBy,
    targetEntity: 'Person',
    targetId: personId,
    changes,
    metadata,
    ipAddress: req?.ip || req?.connection?.remoteAddress || null,
    userAgent: req?.get('user-agent') || null
  });
};

module.exports = {
  logAction,
  logDepartmentAction,
  logPermissionAction,
  logRoleAction,
  logUserAction,
  logPersonAction
};

