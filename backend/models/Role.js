/**
 * Role Model
 * Represents user roles with associated permissions
 */

const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Role name cannot exceed 100 characters']
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  }]
}, {
  timestamps: true
});

// Indexes
roleSchema.index({ name: 1 });

// Virtual to populate permissions
roleSchema.virtual('permissionDetails', {
  ref: 'Permission',
  localField: 'permissions',
  foreignField: '_id'
});

module.exports = mongoose.model('Role', roleSchema);

