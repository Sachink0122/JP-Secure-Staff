/**
 * Authentication Routes
 * Handles authentication endpoints
 */

const express = require('express');
const router = express.Router();
const { login, getCurrentUser } = require('../controllers/authController');
const { validateLogin } = require('../validators/authValidator');
const { authenticate } = require('../middleware/auth');

// Public routes
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

module.exports = router;

