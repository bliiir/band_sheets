const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Set cookie with token
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' // Allows the cookie to be sent in cross-site requests
  };
  
  res.cookie('token', token, cookieOptions);
  
  user.password = undefined; // Don't send password in response
  
  res.status(statusCode).json({
    success: true,
    token,
    data: user
  });
};

// Register user
// In-memory user store for fallback when MongoDB is unavailable
const inMemoryUsers = [];

// Export the in-memory users array for middleware to access
exports.inMemoryUsers = inMemoryUsers;

exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Please provide username, email and password'
      });
    }
    
    try {
      // Try MongoDB first
      console.log('Attempting to create user in MongoDB');
      const user = await User.create({
        username,
        email,
        password
      });
      
      console.log('User created successfully in MongoDB');
      sendTokenResponse(user, 201, res);
    } catch (dbError) {
      console.warn('MongoDB unavailable, using in-memory fallback for registration');
      
      // Check if user already exists in our in-memory store
      if (inMemoryUsers.some(u => u.email === email || u.username === username)) {
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }
      
      // Create in-memory user
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: Date.now().toString(),
        username,
        email,
        password: hashedPassword,
        role: 'user'
      };
      
      inMemoryUsers.push(newUser);
      
      // Remove password from response
      const userResponse = { ...newUser };
      delete userResponse.password;
      
      sendTokenResponse(userResponse, 201, res);
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt for:', email);
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }
    
    try {
      // Try MongoDB first
      const user = await User.findOne({ email });
      
      if (!user) {
        console.log('User not found in MongoDB, checking in-memory');
        // Check in-memory store before returning error
        const memUser = inMemoryUsers.find(u => u.email === email);
        if (!memUser) {
          console.log('User not found in in-memory store either');
          return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
          });
        }
        
        // Check password for in-memory user
        const isMatchMem = await bcrypt.compare(password, memUser.password);
        if (!isMatchMem) {
          console.log('Invalid password for in-memory user');
          return res.status(401).json({
            success: false,
            error: 'Invalid credentials'
          });
        }
        
        console.log('In-memory user login successful');
        // Remove password from response
        const userResponse = { ...memUser };
        delete userResponse.password;
        
        return sendTokenResponse(userResponse, 200, res);
      }
      
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        console.log('Invalid password for MongoDB user');
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      console.log('MongoDB user login successful');
      sendTokenResponse(user, 200, res);
    } catch (dbError) {
      console.warn('MongoDB unavailable, using in-memory fallback for login');
      
      // Try in-memory login
      const memUser = inMemoryUsers.find(u => u.email === email);
      if (!memUser) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      // Check password
      const isMatch = await bcrypt.compare(password, memUser.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      // Remove password from response
      const userResponse = { ...memUser };
      delete userResponse.password;
      
      sendTokenResponse(userResponse, 200, res);
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Logout user
exports.logout = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    sameSite: 'lax' // Allows the cookie to be sent in cross-site requests
  });
  
  res.status(200).json({
    success: true,
    data: {}
  });
};

// Get current logged in user
exports.getMe = async (req, res) => {
  try {
    try {
      // Try MongoDB first
      const user = await User.findById(req.user.id);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (dbError) {
      console.warn('MongoDB unavailable, using in-memory fallback for getMe');
      
      // Try to find user in memory
      const memUser = inMemoryUsers.find(u => u._id === req.user.id);
      if (!memUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Remove password from response
      const userResponse = { ...memUser };
      delete userResponse.password;
      
      res.status(200).json({
        success: true,
        data: userResponse
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};
