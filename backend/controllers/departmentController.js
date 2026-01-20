/**
 * Department Controller
 * Handles department management logic
 */

const Department = require('../models/Department');
const User = require('../models/User');
const { logDepartmentAction } = require('../services/auditService');
const logger = require('../utils/logger');

/**
 * Get all departments
 * GET /api/admin/departments
 */
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: { departments },
      count: departments.length
    });
  } catch (error) {
    logger.error('Get all departments error:', error);
    next(error);
  }
};

/**
 * Get single department
 * GET /api/admin/departments/:id
 */
const getDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { department }
    });
  } catch (error) {
    logger.error('Get department error:', error);
    next(error);
  }
};

/**
 * Create department
 * POST /api/admin/departments
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, isActive = true } = req.body;
    
    // Check if department code already exists
    const existingDepartment = await Department.findOne({ 
      $or: [
        { code: code.toUpperCase() },
        { name: name.trim() }
      ]
    });
    
    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        error: 'Department with this code or name already exists'
      });
    }
    
    const department = await Department.create({
      name: name.trim(),
      code: code.toUpperCase(),
      isActive
    });
    
    // Audit log
    await logDepartmentAction(
      'DEPARTMENT_CREATE',
      req.user.userId,
      department._id,
      { name: department.name, code: department.code, isActive: department.isActive },
      {},
      req
    );
    
    logger.info(`Department created: ${department.name} (${department._id}) by user ${req.user.userId}`);
    
    res.status(201).json({
      success: true,
      data: { department },
      message: 'Department created successfully'
    });
  } catch (error) {
    logger.error('Create department error:', error);
    next(error);
  }
};

/**
 * Update department
 * PUT /api/admin/departments/:id
 */
const updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    const oldValues = {
      name: department.name,
      code: department.code,
      isActive: department.isActive
    };
    
    const { name, code, isActive } = req.body;
    const changes = {};
    
    if (name !== undefined && name.trim() !== department.name) {
      // Check if new name already exists
      const existingDepartment = await Department.findOne({ 
        name: name.trim(),
        _id: { $ne: department._id }
      });
      
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          error: 'Department with this name already exists'
        });
      }
      
      department.name = name.trim();
      changes.name = { old: oldValues.name, new: name.trim() };
    }
    
    if (code !== undefined && code.toUpperCase() !== department.code) {
      // Check if new code already exists
      const existingDepartment = await Department.findOne({ 
        code: code.toUpperCase(),
        _id: { $ne: department._id }
      });
      
      if (existingDepartment) {
        return res.status(400).json({
          success: false,
          error: 'Department with this code already exists'
        });
      }
      
      department.code = code.toUpperCase();
      changes.code = { old: oldValues.code, new: code.toUpperCase() };
    }
    
    if (isActive !== undefined && isActive !== department.isActive) {
      department.isActive = isActive;
      changes.isActive = { old: oldValues.isActive, new: isActive };
    }
    
    await department.save();
    
    // Audit log
    await logDepartmentAction(
      'DEPARTMENT_UPDATE',
      req.user.userId,
      department._id,
      changes,
      {},
      req
    );
    
    logger.info(`Department updated: ${department.name} (${department._id}) by user ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: { department },
      message: 'Department updated successfully'
    });
  } catch (error) {
    logger.error('Update department error:', error);
    next(error);
  }
};

/**
 * Activate/Deactivate department
 * PATCH /api/admin/departments/:id/status
 */
const updateDepartmentStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Check if department is in use (has users)
    if (isActive === false) {
      const usersCount = await User.countDocuments({ 
        department: department._id,
        isActive: true 
      });
      
      if (usersCount > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot deactivate department. It has ${usersCount} active user(s)`
        });
      }
    }
    
    const oldStatus = department.isActive;
    department.isActive = isActive;
    await department.save();
    
    // Audit log
    const action = isActive ? 'DEPARTMENT_ACTIVATE' : 'DEPARTMENT_DEACTIVATE';
    await logDepartmentAction(
      action,
      req.user.userId,
      department._id,
      { isActive: { old: oldStatus, new: isActive } },
      {},
      req
    );
    
    logger.info(`Department ${isActive ? 'activated' : 'deactivated'}: ${department.name} (${department._id}) by user ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: { department },
      message: `Department ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    logger.error('Update department status error:', error);
    next(error);
  }
};

module.exports = {
  getAllDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus
};

