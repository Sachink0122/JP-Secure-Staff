/**
 * JP Secure Staff - Backend Server
 * Production-ready Express server with security best practices
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/demo', require('./routes/demo')); // Demo protected routes
// app.use('/api/users', require('./routes/users'));
// app.use('/api/roles', require('./routes/roles'));
// app.use('/api/permissions', require('./routes/permissions'));
// app.use('/api/departments', require('./routes/departments'));
// app.use('/api/person', require('./routes/person'));
// app.use('/api/documents', require('./routes/documents'));
// app.use('/api/tickets', require('./routes/tickets'));
// app.use('/api/access-grants', require('./routes/accessGrants'));
// app.use('/api/audit', require('./routes/audit'));
// app.use('/api/templates', require('./routes/templates'));

// Error handling middleware (must be last)
app.use(errorHandler);

// Database connection
mongoose.connect(config.mongodb.uri, config.mongodb.options)
  .then(() => {
    logger.info('MongoDB connected successfully');
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Start server
const PORT = config.port || 5000;
app.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
});

module.exports = app;

