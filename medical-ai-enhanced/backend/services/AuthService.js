const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const pool = require('../config/database');

class AuthService {
  // Generate JWT token
  static generateToken(userId, userType) {
    return jwt.sign(
      { userId, userType },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Hash password
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Register new user
  static async register(userData) {
    const { email, password, userType, name } = userData;
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);
    
    // Create user
    const result = await pool.query(
      `INSERT INTO users (id, email, password, user_type, name, is_active, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING id, email, user_type, name, created_at`,
      [randomUUID(), email, hashedPassword, userType, name || email.split('@')[0], true]
    );

    const user = result.rows[0];
    const token = this.generateToken(user.id, user.user_type);

    return {
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        name: user.name,
        createdAt: user.created_at
      },
      token
    };
  }

  // Login user
  static async login(email, password, userType) {
    // Find user
    const result = await pool.query(
      'SELECT id, email, password, user_type, name, is_active FROM users WHERE email = $1 AND user_type = $2',
      [email, userType]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.user_type);

    return {
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        name: user.name
      },
      token
    };
  }

  // Get user profile
  static async getUserProfile(userId) {
    const result = await pool.query(
      'SELECT id, email, user_type, name, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  }
}

module.exports = AuthService;
