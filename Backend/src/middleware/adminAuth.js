const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/env');

// Admin authentication middleware
const isAdmin = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Check if token starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Invalid token format.' 
      });
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Find user by id
    const user = await User.findById(decoded.id).select('-passwordHash -otp -expiredin');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. User not found.' 
      });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    // Check if user is verified
    if (!user.isverified) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Account not verified.' 
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Invalid token.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Token expired.' 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: 'Internal server error during authentication.' 
    });
  }
};

module.exports = isAdmin;
