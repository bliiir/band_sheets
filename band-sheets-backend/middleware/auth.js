const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Get reference to in-memory users array (declared in authController)
let inMemoryUsers = [];
try {
  // Get in-memory users from authController
  const authController = require('../controllers/authController');
  inMemoryUsers = authController.inMemoryUsers || [];
} catch (error) {
  console.warn('Could not import in-memory users array');
}

// Protect routes
exports.protect = async (req, res, next) => {
  let token;
  
  // Get token from header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];
    console.log('Using token from Authorization header');
  } else if (req.cookies.token) {
    // Get token from cookie
    token = req.cookies.token;
    console.log('Using token from cookie');
  }
  
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully');
    
    try {
      // Try MongoDB first
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        // If MongoDB user not found, check in-memory
        const memUser = inMemoryUsers.find(u => u._id === decoded.id);
        if (memUser) {
          req.user = memUser;
        } else {
          throw new Error('User not found');
        }
      }
    } catch (dbError) {
      console.warn('MongoDB unavailable, using in-memory fallback for auth');
      
      // Try to find user in memory
      const memUser = inMemoryUsers.find(u => u._id === decoded.id);
      if (!memUser) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized to access this route'
        });
      }
      
      req.user = memUser;
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }
};

// Authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user ? req.user.role : 'undefined'} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional auth middleware - allows unauthenticated access but populates req.user if token exists
exports.optionalAuth = async (req, res, next) => {
  let token;
  
  // Get token from header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }
  
  // If no token, continue without authentication (for public access)
  if (!token) {
    console.log('No token found, continuing as public access');
    req.user = null;
    return next();
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    try {
      // Try MongoDB first
      req.user = await User.findById(decoded.id);
      
      if (!req.user) {
        // If MongoDB user not found, check in-memory
        const memUser = inMemoryUsers.find(u => u._id === decoded.id);
        if (memUser) {
          req.user = memUser;
        }
      }
      
      next();
    } catch (err) {
      console.error('Error finding user:', err);
      req.user = null;
      next();
    }
  } catch (err) {
    console.error('Invalid token:', err);
    req.user = null;
    next();
  }
};
