/**
 * Audit Log Model
 * Tracks all admin actions for compliance and security
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: [
      // Department actions
      'DEPARTMENT_CREATE',
      'DEPARTMENT_UPDATE',
      'DEPARTMENT_ACTIVATE',
      'DEPARTMENT_DEACTIVATE',
      
      // Permission actions
      'PERMISSION_CREATE',
      
      // Role actions
      'ROLE_CREATE',
      'ROLE_UPDATE',
      'ROLE_PERMISSION_ASSIGN',
      
      // User actions
      'USER_CREATE',
      'USER_UPDATE',
      'USER_ENABLE',
      'USER_DISABLE',
      'USER_PASSWORD_RESET',
      
      // Person actions
      'PERSON_CREATE',
      'PERSON_UPDATE',
      'PERSON_DELETE',
      'PERSON_DUPLICATE_ATTEMPT',
      'PERSON_DOCUMENT_VALIDATION_FAILED'
    ],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performed by user is required']
  },
  targetEntity: {
    type: String,
    enum: ['Department', 'Permission', 'Role', 'User', 'Person'],
    required: [true, 'Target entity is required']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Target ID is required']
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for querying
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ targetEntity: 1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Compound index for common queries
auditLogSchema.index({ targetEntity: 1, targetId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

