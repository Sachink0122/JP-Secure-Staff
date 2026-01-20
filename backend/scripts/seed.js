/**
 * Database Seed Script
 * Creates initial permissions, Master Admin role, and Master Admin user
 * 
 * Usage: node backend/scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config');
const Department = require('../models/Department');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const { PERMISSIONS, PERMISSION_DESCRIPTIONS } = require('../constants/permissions');
const logger = require('../utils/logger');

// Connect to MongoDB
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => {
    logger.info('Connected to MongoDB for seeding');
    seedDatabase();
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

async function seedDatabase() {
  try {
    logger.info('Starting database seed...');

    // Step 1: Create Permissions
    logger.info('Creating permissions...');
    const permissionMap = {};
    
    for (const [key, permissionName] of Object.entries(PERMISSIONS)) {
      const permission = await Permission.findOneAndUpdate(
        { name: permissionName },
        {
          name: permissionName,
          description: PERMISSION_DESCRIPTIONS[permissionName] || ''
        },
        { upsert: true, new: true }
      );
      permissionMap[permissionName] = permission._id;
      logger.info(`  ✓ Created/Updated permission: ${permissionName}`);
    }

    // Step 2: Create Admin Department
    logger.info('Creating Admin department...');
    const adminDepartment = await Department.findOneAndUpdate(
      { code: 'ADMIN' },
      {
        name: 'Administration',
        code: 'ADMIN',
        isActive: true
      },
      { upsert: true, new: true }
    );
    logger.info(`  ✓ Created/Updated department: ${adminDepartment.name}`);

    // Step 3: Create Master Admin Role with ALL permissions
    logger.info('Creating Master Admin role...');
    const allPermissionIds = Object.values(permissionMap);
    const masterAdminRole = await Role.findOneAndUpdate(
      { name: 'Master Admin' },
      {
        name: 'Master Admin',
        permissions: allPermissionIds
      },
      { upsert: true, new: true }
    );
    logger.info(`  ✓ Created/Updated role: ${masterAdminRole.name} with ${allPermissionIds.length} permissions`);

    // Step 4: Create Master Admin User
    logger.info('Creating Master Admin user...');
    const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL || 'admin@jpsecurestaff.com';
    const masterAdminPassword = process.env.MASTER_ADMIN_PASSWORD || 'Admin@123456';

    // Check if user already exists
    const existingUser = await User.findOne({ email: masterAdminEmail });
    if (existingUser) {
      logger.info(`  ⚠ Master Admin user already exists: ${masterAdminEmail}`);
      logger.info('  To reset password, delete the user and run seed again');
    } else {
      const masterAdminUser = await User.create({
        fullName: 'Master Administrator',
        email: masterAdminEmail,
        password: masterAdminPassword,
        department: adminDepartment._id,
        role: masterAdminRole._id,
        isActive: true
      });
      logger.info(`  ✓ Created Master Admin user: ${masterAdminEmail}`);
      logger.info(`  ⚠ Default password: ${masterAdminPassword}`);
      logger.info('  ⚠ IMPORTANT: Change the password after first login!');
    }

    logger.info('✓ Database seed completed successfully!');
    logger.info('');
    logger.info('Summary:');
    logger.info(`  - Permissions: ${Object.keys(PERMISSIONS).length}`);
    logger.info(`  - Departments: 1 (Admin)`);
    logger.info(`  - Roles: 1 (Master Admin)`);
    logger.info(`  - Users: 1 (Master Admin)`);
    logger.info('');
    logger.info('You can now start the server and login with:');
    logger.info(`  Email: ${masterAdminEmail}`);
    logger.info(`  Password: ${masterAdminPassword}`);

    process.exit(0);
  } catch (error) {
    logger.error('Seed error:', error);
    process.exit(1);
  }
}

