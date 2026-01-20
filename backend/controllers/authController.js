/**
 * Authentication Controller
 * Handles authentication logic
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');
const Permission = require('../models/Permission');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user with password and populate role
    const user = await User.findOne({ email })
      .select('+password')
      .populate({
        path: 'role',
        populate: {
          path: 'permissions',
          select: 'name'
        }
      })
      .populate('department', 'name code');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact administrator'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Extract permission names from role
    const permissions = user.role.permissions.map(perm => perm.name);

    // Generate JWT payload
    const payload = {
      userId: user._id.toString(),
      departmentId: user.department._id.toString(),
      permissions: permissions
    };

    // Generate JWT token
    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expire
    });

    // Remove password from user object
    user.password = undefined;

    logger.info(`User logged in: ${user.email} (${user._id})`);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          department: {
            id: user.department._id,
            name: user.department.name,
            code: user.department.code
          },
          role: {
            id: user.role._id,
            name: user.role.name
          }
        },
        token,
        permissions
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
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
    logger.error('Get current user error:', error);
    next(error);
  }
};

module.exports = {
  login,
  getCurrentUser
};

