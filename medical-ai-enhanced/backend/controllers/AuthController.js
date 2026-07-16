const { body, validationResult } = require('express-validator');
const AuthService = require('../services/AuthService');

class AuthController {
  // Register validation rules
  static getRegisterValidation() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
      body('userType')
        .isIn(['patient', 'doctor'])
        .withMessage('User type must be either patient or doctor'),
      body('name')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
    ];
  }

  // Login validation rules
  static getLoginValidation() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
      body('password')
        .notEmpty()
        .withMessage('Password is required'),
      body('userType')
        .isIn(['patient', 'doctor'])
        .withMessage('User type must be either patient or doctor')
    ];
  }

  // Handle validation errors
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }

  // Register new user
  static async register(req, res, next) {
    try {
      const { email, password, userType, name } = req.body;
      
      const result = await AuthService.register({
        email,
        password,
        userType,
        name
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Login user
  static async login(req, res, next) {
    try {
      const { email, password, userType } = req.body;
      
      const result = await AuthService.login(email, password, userType);

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user profile
  static async getProfile(req, res, next) {
    try {
      const profile = await AuthService.getUserProfile(req.userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
