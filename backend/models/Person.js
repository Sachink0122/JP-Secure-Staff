/**
 * Person Model
 * Represents person records in Operation Stage-A
 */

const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const personSchema = new mongoose.Schema({
  // Personal Details
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [200, 'Full name cannot exceed 200 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    unique: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ]
  },
  primaryMobile: {
    type: String,
    required: [true, 'Primary mobile is required'],
    trim: true,
    unique: true
  },
  alternateMobile: {
    type: String,
    trim: true,
    default: null
  },

  // Employment & Domain
  employmentType: {
    type: String,
    required: [true, 'Employment type is required'],
    enum: {
      values: ['FULL_TIME', 'CONTRACT', 'INTERN'],
      message: 'Employment type must be FULL_TIME, CONTRACT, or INTERN'
    }
  },
  companyName: {
    type: String,
    trim: true,
    maxlength: [200, 'Company name cannot exceed 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['MECHANICAL', 'ELECTRICAL', 'CIVIL', 'IT', 'OTHER'],
      message: 'Category must be MECHANICAL, ELECTRICAL, CIVIL, IT, or OTHER'
    }
  },
  experience: {
    type: String,
    trim: true,
    maxlength: [100, 'Experience cannot exceed 100 characters']
  },
  currentLocation: {
    type: String,
    trim: true,
    maxlength: [200, 'Current location cannot exceed 200 characters']
  },

  // Stage-A Documents
  cvFile: {
    type: String,
    required: [true, 'CV file is required'],
    trim: true
  },
  qualificationCertificates: {
    type: [String],
    required: [true, 'At least one qualification certificate is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one qualification certificate is required'
    }
  },
  ndtCertificate: {
    type: String,
    trim: true,
    default: null
  },

  // Workflow & System
  owningDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  currentStatus: {
    type: String,
    default: 'OPERATION_STAGE_A',
    required: true
  },
  statusHistory: {
    type: [statusHistorySchema],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
personSchema.index({ email: 1 });
personSchema.index({ primaryMobile: 1 });
personSchema.index({ currentStatus: 1 });
personSchema.index({ category: 1 });
personSchema.index({ owningDepartment: 1 });
personSchema.index({ createdBy: 1 });
personSchema.index({ isActive: 1 });
personSchema.index({ createdAt: -1 });

// Compound indexes for common queries
personSchema.index({ currentStatus: 1, category: 1 });
personSchema.index({ owningDepartment: 1, currentStatus: 1 });

// Custom validation: alternateMobile must not equal primaryMobile
personSchema.pre('validate', function(next) {
  if (this.alternateMobile && this.alternateMobile === this.primaryMobile) {
    this.invalidate('alternateMobile', 'Alternate mobile must be different from primary mobile');
  }
  next();
});

// Custom validation: NDT certificate required only for MECHANICAL category
personSchema.pre('validate', function(next) {
  if (this.category === 'MECHANICAL' && !this.ndtCertificate) {
    this.invalidate('ndtCertificate', 'NDT certificate is required for MECHANICAL category');
  }
  if (this.category !== 'MECHANICAL' && this.ndtCertificate) {
    // Allow NDT certificate for non-mechanical, but it's not required
    // Just clear it if provided incorrectly
    this.ndtCertificate = null;
  }
  next();
});

module.exports = mongoose.model('Person', personSchema);

