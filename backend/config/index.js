/**
 * Configuration module
 * Centralized configuration management with environment variable support
 */

require('dotenv').config();

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',

  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jp-secure-staff',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-in-production',
    expire: process.env.JWT_EXPIRE || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-in-production',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '30d'
  },

  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    sessionSecret: process.env.SESSION_SECRET || 'change-this-in-production'
  },

  fileUpload: {
    maxSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png').split(',')
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100
  },

  audit: {
    logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS, 10) || 365
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
};

// Validation
if (config.nodeEnv === 'production') {
  if (config.jwt.secret === 'change-this-in-production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  if (config.jwt.refreshSecret === 'change-this-in-production') {
    throw new Error('JWT_REFRESH_SECRET must be set in production');
  }
  if (config.security.sessionSecret === 'change-this-in-production') {
    throw new Error('SESSION_SECRET must be set in production');
  }
}

module.exports = config;

