/**
 * Create Operations Department and User Script
 * Creates Operations department, role, and user for testing Phase 4
 * 
 * Usage: node backend/scripts/createOperationUser.js
 * 
 * Prerequisites: Run seed.js first to create Master Admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');
const Department = require('../models/Department');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const { PERMISSIONS } = require('../constants/permissions');
const logger = require('../utils/logger');

// Connect to MongoDB
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => {
    logger.info('Connected to MongoDB');
    createOperationUser();
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

async function createOperationUser() {
  try {
    logger.info('Creating Operations department and user...');

    // Step 1: Create Operations Department
    logger.info('Creating Operations department...');
    const operationDepartment = await Department.findOneAndUpdate(
      { code: 'OPERATION' },
      {
        name: 'Operation',
        code: 'OPERATION',
        isActive: true
      },
      { upsert: true, new: true }
    );
    logger.info(`  ✓ Created/Updated department: ${operationDepartment.name}`);

    // Step 2: Create Finance Department (needed for Phase 4)
    logger.info('Creating Finance department...');
    const financeDepartment = await Department.findOneAndUpdate(
      { code: 'FINANCE' },
      {
        name: 'Finance',
        code: 'FINANCE',
        isActive: true
      },
      { upsert: true, new: true }
    );
    logger.info(`  ✓ Created/Updated department: ${financeDepartment.name}`);

    // Step 3: Get required permissions
    const requiredPermissions = [
      PERMISSIONS.PERSON_CREATE,
      PERMISSIONS.PERSON_READ,
      PERMISSIONS.PERSON_SUBMIT_TO_FINANCE
    ];

    const permissionIds = [];
    for (const permName of requiredPermissions) {
      const permission = await Permission.findOne({ name: permName });
      if (permission) {
        permissionIds.push(permission._id);
      } else {
        logger.warn(`  ⚠ Permission not found: ${permName}`);
      }
    }

    // Step 4: Create Operations Role
    logger.info('Creating Operations role...');
    const operationRole = await Role.findOneAndUpdate(
      { name: 'Operations Staff' },
      {
        name: 'Operations Staff',
        permissions: permissionIds
      },
      { upsert: true, new: true }
    );
    logger.info(`  ✓ Created/Updated role: ${operationRole.name} with ${permissionIds.length} permissions`);

    // Step 5: Create Operations User
    logger.info('Creating Operations user...');
    const operationEmail = process.env.OPERATION_USER_EMAIL || 'operation@jpsecurestaff.com';
    const operationPassword = process.env.OPERATION_USER_PASSWORD || 'Operation@123456';

    const existingUser = await User.findOne({ email: operationEmail });
    if (existingUser) {
      logger.info(`  ⚠ Operations user already exists: ${operationEmail}`);
      logger.info('  To reset password, delete the user and run this script again');
    } else {
      const operationUser = await User.create({
        fullName: 'Operations Staff',
        email: operationEmail,
        password: operationPassword,
        department: operationDepartment._id,
        role: operationRole._id,
        isActive: true
      });
      logger.info(`  ✓ Created Operations user: ${operationEmail}`);
      logger.info(`  ⚠ Default password: ${operationPassword}`);
      logger.info('  ⚠ IMPORTANT: Change the password after first login!');
    }

    logger.info('');
    logger.info('✓ Operations setup completed successfully!');
    logger.info('');
    logger.info('Summary:');
    logger.info(`  - Departments: 2 (Operation, Finance)`);
    logger.info(`  - Roles: 1 (Operations Staff)`);
    logger.info(`  - Users: 1 (Operations Staff)`);
    logger.info('');
    logger.info('You can now login with Operations user:');
    logger.info(`  Email: ${operationEmail}`);
    logger.info(`  Password: ${operationPassword}`);
    logger.info('');
    logger.info('This user can:');
    logger.info('  - Create persons (PERSON_CREATE)');
    logger.info('  - View persons (PERSON_READ)');
    logger.info('  - Submit persons to Finance (PERSON_SUBMIT_TO_FINANCE)');

    process.exit(0);
  } catch (error) {
    logger.error('Create operation user error:', error);
    process.exit(1);
  }
}

