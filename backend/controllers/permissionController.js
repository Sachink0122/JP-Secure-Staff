/**
 * Permission Controller
 * Handles permission management logic
 */

const Permission = require('../models/Permission');
const { logPermissionAction } = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Get all permissions
 * GET /api/admin/permissions
 */
const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: { permissions },
      count: permissions.length
    });
  } catch (error) {
    logger.error('Get all permissions error:', error);
    next(error);
  }
};

/**
 * Get single permission
 * GET /api/admin/permissions/:id
 */
const getPermission = async (req, res, next) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return res.status(404).json({
        success: false,
        error: 'Permission not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { permission }
    });
  } catch (error) {
    logger.error('Get permission error:', error);
    next(error);
  }
};

/**
 * Create permission
 * POST /api/admin/permissions
 */
const createPermission = async (req, res, next) => {
  try {
    const { name, description = '' } = req.body;
    const normalizedName = name.toUpperCase();
    
    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name: normalizedName });
    
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        error: 'Permission with this name already exists'
      });
    }
    
    const permission = await Permission.create({
      name: normalizedName,
      description: description.trim()
    });
    
    // Audit log
    await logPermissionAction(
      'PERMISSION_CREATE',
      req.user.userId,
      permission._id,
      { name: permission.name, description: permission.description },
      {},
      req
    );
    
    logger.info(`Permission created: ${permission.name} (${permission._id}) by user ${req.user.userId}`);
    
    res.status(201).json({
      success: true,
      data: { permission },
      message: 'Permission created successfully'
    });
  } catch (error) {
    logger.error('Create permission error:', error);
    next(error);
  }
};

module.exports = {
  getAllPermissions,
  getPermission,
  createPermission
};

