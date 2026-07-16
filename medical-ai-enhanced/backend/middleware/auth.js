const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Enhanced authentication middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No authentication token provided' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists in database
    const userResult = await pool.query(
      'SELECT id, email, user_type, name, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Account is deactivated' 
      });
    }

    // Add user info to request
    req.userId = user.id;
    req.userType = user.user_type;
    req.userEmail = user.email;
    req.userName = user.name;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid authentication token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Authentication token expired' 
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Authentication failed', 
      message: 'Internal server error' 
    });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.userType)) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'Insufficient permissions for this action' 
      });
    }
    next();
  };
};

// Doctor-only middleware
const requireDoctor = authorizeRoles('doctor');

// Patient-only middleware  
const requirePatient = authorizeRoles('patient');

module.exports = {
  authenticateToken,
  authorizeRoles,
  requireDoctor,
  requirePatient
};
