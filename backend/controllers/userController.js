/**
 * User Controller
 * Handles user management logic
 */

const User = require('../models/User');
const Department = require('../models/Department');
const Role = require('../models/Role');
const { logUserAction } = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Get all users
 * GET /api/admin/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .populate('department', 'name code')
      .populate('role', 'name')
      .select('-password')
      .sort({ fullName: 1 });
    
    res.status(200).json({
      success: true,
      data: { users },
      count: users.length
    });
  } catch (error) {
    logger.error('Get all users error:', error);
    next(error);
  }
};

/**
 * Get single user
 * GET /api/admin/users/:id
 */
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name code')
      .populate('role', 'name')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    next(error);
  }
};

/**
 * Create user
 * POST /api/admin/users
 */
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, department, role, isActive = true } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Validate department exists
    const departmentExists = await Department.findById(department);
    if (!departmentExists) {
      return res.status(400).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Enforce department isActive
    if (!departmentExists.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot assign user to inactive department'
      });
    }
    
    // Validate role exists
    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({
        success: false,
        error: 'Role not found'
      });
    }
    
    const user = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase(),
      password,
      department,
      role,
      isActive
    });
    
    const populatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('role', 'name')
      .select('-password');
    
    // Audit log
    await logUserAction(
      'USER_CREATE',
      req.user.userId,
      user._id,
      {
        fullName: user.fullName,
        email: user.email,
        department: departmentExists.name,
        role: roleExists.name,
        isActive: user.isActive
      },
      {},
      req
    );
    
    logger.info(`User created: ${user.email} (${user._id}) by admin ${req.user.userId}`);
    
    res.status(201).json({
      success: true,
      data: { user: populatedUser },
      message: 'User created successfully'
    });
  } catch (error) {
    logger.error('Create user error:', error);
    next(error);
  }
};

/**
 * Update user
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const oldValues = {
      fullName: user.fullName,
      email: user.email,
      department: user.department.toString(),
      role: user.role.toString(),
      isActive: user.isActive
    };
    const changes = {};
    
    const { fullName, email, department, role } = req.body;
    
    if (fullName !== undefined && fullName.trim() !== user.fullName) {
      user.fullName = fullName.trim();
      changes.fullName = { old: oldValues.fullName, new: fullName.trim() };
    }
    
    if (email !== undefined && email.toLowerCase() !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User with this email already exists'
        });
      }
      
      user.email = email.toLowerCase();
      changes.email = { old: oldValues.email, new: email.toLowerCase() };
    }
    
    if (department !== undefined && department !== user.department.toString()) {
      // Validate department exists
      const departmentExists = await Department.findById(department);
      if (!departmentExists) {
        return res.status(400).json({
          success: false,
          error: 'Department not found'
        });
      }
      
      // Enforce department isActive
      if (!departmentExists.isActive) {
        return res.status(400).json({
          success: false,
          error: 'Cannot assign user to inactive department'
        });
      }
      
      user.department = department;
      changes.department = { old: oldValues.department, new: department };
    }
    
    if (role !== undefined && role !== user.role.toString()) {
      // Validate role exists
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({
          success: false,
          error: 'Role not found'
        });
      }
      
      user.role = role;
      changes.role = { old: oldValues.role, new: role };
    }
    
    await user.save();
    
    const populatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('role', 'name')
      .select('-password');
    
    // Audit log
    if (Object.keys(changes).length > 0) {
      await logUserAction(
        'USER_UPDATE',
        req.user.userId,
        user._id,
        changes,
        {},
        req
      );
    }
    
    logger.info(`User updated: ${user.email} (${user._id}) by admin ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: { user: populatedUser },
      message: 'User updated successfully'
    });
  } catch (error) {
    logger.error('Update user error:', error);
    next(error);
  }
};

/**
 * Enable/Disable user
 * PATCH /api/admin/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Prevent self-deactivation
    if (user._id.toString() === req.user.userId && isActive === false) {
      return res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account'
      });
    }
    
    const oldStatus = user.isActive;
    user.isActive = isActive;
    await user.save();
    
    const populatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('role', 'name')
      .select('-password');
    
    // Audit log
    const action = isActive ? 'USER_ENABLE' : 'USER_DISABLE';
    await logUserAction(
      action,
      req.user.userId,
      user._id,
      { isActive: { old: oldStatus, new: isActive } },
      {},
      req
    );
    
    logger.info(`User ${isActive ? 'enabled' : 'disabled'}: ${user.email} (${user._id}) by admin ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: { user: populatedUser },
      message: `User ${isActive ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    logger.error('Update user status error:', error);
    next(error);
  }
};

/**
 * Reset user password (admin-triggered)
 * POST /api/admin/users/:id/reset-password
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    const user = await User.findById(req.params.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();
    
    // Audit log
    await logUserAction(
      'USER_PASSWORD_RESET',
      req.user.userId,
      user._id,
      {},
      { resetBy: req.user.userId },
      req
    );
    
    logger.info(`Password reset for user: ${user.email} (${user._id}) by admin ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    logger.error('Reset user password error:', error);
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword
};

