/**
 * Template Model
 * Represents document templates for HR document generation
 */

const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [200, 'Template name cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Template type is required'],
    enum: {
      values: ['OFFER_LETTER', 'DECLARATION'],
      message: 'Template type must be OFFER_LETTER or DECLARATION'
    }
  },
  content: {
    type: String,
    required: [true, 'Template content is required']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
templateSchema.index({ type: 1 });
templateSchema.index({ isPublished: 1 });
templateSchema.index({ isActive: 1 });
templateSchema.index({ type: 1, isPublished: 1 });

module.exports = mongoose.model('Template', templateSchema);

