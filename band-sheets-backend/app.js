const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database (try to connect but continue even if it fails)
try {
  connectDB().then(() => {
    console.log('MongoDB connected successfully!');
  }).catch(err => {
    console.warn('MongoDB connection failed:', err.message);
    console.log('Server will run with limited functionality (no persistence)');
  });
} catch (error) {
  console.warn('MongoDB connection error:', error.message);
  console.log('Server will run with limited functionality (no persistence)');
}

// Import routes
const authRoutes = require('./routes/auth');
const sheetRoutes = require('./routes/sheets');

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Use our simple CORS middleware for development
const enableCors = require('./enableCors');
app.use(enableCors);

// Also keep the cors middleware for older browsers
app.use(cors({
  origin: '*', // Allow any origin in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

module.exports = app;
