/**
 * Authentication middleware
 * JWT token verification and user context injection
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Verify user still exists and is active
    const user = await User.findById(decoded.userId)
      .populate('department', 'name code')
      .populate('role', 'name');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // Attach user info to request
    // JWT payload already contains userId, departmentId, and permissions
    req.user = {
      userId: decoded.userId,
      departmentId: decoded.departmentId,
      permissions: decoded.permissions || [],
      user: user // Full user object for convenience
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

module.exports = { authenticate };

