const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

// Public routes
router.post('/register', 
  AuthController.getRegisterValidation(),
  AuthController.handleValidationErrors,
  AuthController.register
);

router.post('/login',
  AuthController.getLoginValidation(),
  AuthController.handleValidationErrors,
  AuthController.login
);

// Protected routes
router.get('/profile', 
  authenticateToken,
  AuthController.getProfile
);

module.exports = router;
