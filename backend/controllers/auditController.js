/**
 * Audit Controller
 * Handles audit log retrieval
 * Accessible only to users with AUDIT_LOG_READ permission
 */

const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

/**
 * Get audit logs
 * GET /api/admin/audit
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { 
      action, 
      targetEntity, 
      performedBy, 
      limit = 100, 
      skip = 0,
      startDate,
      endDate
    } = req.query;
    
    // Build query
    const query = {};
    
    if (action) {
      query.action = action;
    }
    
    if (targetEntity) {
      query.targetEntity = targetEntity;
    }
    
    if (performedBy) {
      query.performedBy = performedBy;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Parse pagination
    const limitNum = Math.min(parseInt(limit, 10) || 100, 1000); // Max 1000
    const skipNum = Math.max(parseInt(skip, 10) || 0, 0);
    
    // Fetch audit logs
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip(skipNum);
    
    // Get total count
    const total = await AuditLog.countDocuments(query);
    
    logger.info(`Audit logs retrieved: ${logs.length} records by user ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          limit: limitNum,
          skip: skipNum,
          hasMore: (skipNum + limitNum) < total
        }
      }
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    next(error);
  }
};

/**
 * Get single audit log entry
 * GET /api/admin/audit/:id
 */
const getAuditLog = async (req, res, next) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('performedBy', 'fullName email');
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Audit log not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { log }
    });
  } catch (error) {
    logger.error('Get audit log error:', error);
    next(error);
  }
};

module.exports = {
  getAuditLogs,
  getAuditLog
};

