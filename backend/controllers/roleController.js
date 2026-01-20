/**
 * Role Controller
 * Handles role management logic
 */

const Role = require('../models/Role');
const Permission = require('../models/Permission');
const User = require('../models/User');
const { logRoleAction } = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Get all roles
 * GET /api/admin/roles
 */
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.find()
      .populate('permissions', 'name description')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: { roles },
      count: roles.length
    });
  } catch (error) {
    logger.error('Get all roles error:', error);
    next(error);
  }
};

/**
 * Get single role
 * GET /api/admin/roles/:id
 */
const getRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissions', 'name description');
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { role }
    });
  } catch (error) {
    logger.error('Get role error:', error);
    next(error);
  }
};

/**
 * Create role
 * POST /api/admin/roles
 */
const createRole = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    
    // Check if role already exists
    const existingRole = await Role.findOne({ name: name.trim() });
    
    if (existingRole) {
      return res.status(400).json({
        success: false,
        error: 'Role with this name already exists'
      });
    }
    
    // Check for duplicate permission IDs
    const uniquePermissions = [...new Set(permissions.map(p => p.toString()))];
    if (uniquePermissions.length !== permissions.length) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate permissions are not allowed'
      });
    }
    
    // Validate all permissions exist
    const permissionsCount = await Permission.countDocuments({
      _id: { $in: permissions }
    });
    
    if (permissionsCount !== permissions.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more permissions are invalid'
      });
    }
    
    const role = await Role.create({
      name: name.trim(),
      permissions
    });
    
    const populatedRole = await Role.findById(role._id)
      .populate('permissions', 'name description');
    
    // Audit log
    await logRoleAction(
      'ROLE_CREATE',
      req.user.userId,
      role._id,
      { name: role.name, permissions: permissions },
      { permissionCount: permissions.length },
      req
    );
    
    logger.info(`Role created: ${role.name} (${role._id}) by user ${req.user.userId}`);
    
    res.status(201).json({
      success: true,
      data: { role: populatedRole },
      message: 'Role created successfully'
    });
  } catch (error) {
    logger.error('Create role error:', error);
    next(error);
  }
};

/**
 * Update role
 * PUT /api/admin/roles/:id
 */
const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    const oldValues = {
      name: role.name,
      permissions: role.permissions.map(p => p.toString())
    };
    const changes = {};
    
    const { name, permissions } = req.body;
    
    if (name !== undefined && name.trim() !== role.name) {
      // Check if new name already exists
      const existingRole = await Role.findOne({ 
        name: name.trim(),
        _id: { $ne: role._id }
      });
      
      if (existingRole) {
        return res.status(400).json({
          success: false,
          error: 'Role with this name already exists'
        });
      }
      
      role.name = name.trim();
      changes.name = { old: oldValues.name, new: name.trim() };
    }
    
    if (permissions !== undefined) {
      // Check for duplicate permission IDs
      const uniquePermissions = [...new Set(permissions.map(p => p.toString()))];
      if (uniquePermissions.length !== permissions.length) {
        return res.status(400).json({
          success: false,
          error: 'Duplicate permissions are not allowed'
        });
      }
      
      // Validate all permissions exist
      const permissionsCount = await Permission.countDocuments({
        _id: { $in: permissions }
      });
      
      if (permissionsCount !== permissions.length) {
        return res.status(400).json({
          success: false,
          error: 'One or more permissions are invalid'
        });
      }
      
      const newPermissions = permissions.map(p => p.toString()).sort();
      const oldPermissions = oldValues.permissions.sort();
      
      if (JSON.stringify(newPermissions) !== JSON.stringify(oldPermissions)) {
        role.permissions = permissions;
        changes.permissions = {
          old: oldValues.permissions,
          new: permissions
        };
        
        // Audit log for permission assignment
        await logRoleAction(
          'ROLE_PERMISSION_ASSIGN',
          req.user.userId,
          role._id,
          { permissions: { old: oldValues.permissions, new: permissions } },
          { permissionCount: permissions.length },
          req
        );
      }
    }
    
    await role.save();
    
    const populatedRole = await Role.findById(role._id)
      .populate('permissions', 'name description');
    
    // Audit log for update (if name changed)
    if (changes.name) {
      await logRoleAction(
        'ROLE_UPDATE',
        req.user.userId,
        role._id,
        changes,
        {},
        req
      );
    }
    
    logger.info(`Role updated: ${role.name} (${role._id}) by user ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: { role: populatedRole },
      message: 'Role updated successfully'
    });
  } catch (error) {
    logger.error('Update role error:', error);
    next(error);
  }
};

/**
 * Check if role is in use
 * GET /api/admin/roles/:id/usage
 */
const checkRoleUsage = async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    const usersCount = await User.countDocuments({ role: role._id });
    
    res.status(200).json({
      success: true,
      data: {
        role: {
          id: role._id,
          name: role.name
        },
        usersCount,
        inUse: usersCount > 0
      }
    });
  } catch (error) {
    logger.error('Check role usage error:', error);
    next(error);
  }
};

module.exports = {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  checkRoleUsage
};

