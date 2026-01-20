/**
 * Role-Based Access Control middleware
 * Permission-based authorization using permission flags
 * NO role-name checks - only permission flags
 */

const logger = require('../utils/logger');

/**
 * Check if user has required permission
 * @param {string} permission - Permission flag to check (must be uppercase)
 * @returns {Function} Express middleware
 */
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Normalize permission to uppercase
      const normalizedPermission = permission.toUpperCase();

      // Check if user has the required permission
      // Permissions are stored in JWT payload and attached to req.user
      const userPermissions = req.user.permissions || [];
      
      if (!userPermissions.includes(normalizedPermission)) {
        logger.warn(`Permission denied: User ${req.user.userId} attempted to access resource requiring ${normalizedPermission}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: normalizedPermission
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

/**
 * Check if user has any of the required permissions
 * @param {string[]} permissions - Array of permission flags
 * @returns {Function} Express middleware
 */
const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Normalize permissions to uppercase
      const normalizedPermissions = permissions.map(p => p.toUpperCase());
      const userPermissions = req.user.permissions || [];

      // Check if user has any of the permissions
      const hasAnyPermission = normalizedPermissions.some(perm => 
        userPermissions.includes(perm)
      );

      if (!hasAnyPermission) {
        logger.warn(`Permission denied: User ${req.user.userId} attempted to access resource requiring any of: ${normalizedPermissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: normalizedPermissions
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

/**
 * Check if user has all required permissions
 * @param {string[]} permissions - Array of permission flags
 * @returns {Function} Express middleware
 */
const checkAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Normalize permissions to uppercase
      const normalizedPermissions = permissions.map(p => p.toUpperCase());
      const userPermissions = req.user.permissions || [];

      // Check if user has all permissions
      const hasAllPermissions = normalizedPermissions.every(perm => 
        userPermissions.includes(perm)
      );

      if (!hasAllPermissions) {
        logger.warn(`Permission denied: User ${req.user.userId} attempted to access resource requiring all of: ${normalizedPermissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: normalizedPermissions
        });
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions
};

