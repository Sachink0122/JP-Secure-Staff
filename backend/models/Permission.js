/**
 * Permission Model
 * Represents individual permission flags for RBAC
 */

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Permission name is required'],
    trim: true,
    unique: true,
    uppercase: true,
    maxlength: [100, 'Permission name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes
permissionSchema.index({ name: 1 });

module.exports = mongoose.model('Permission', permissionSchema);

