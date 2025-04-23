const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database (try to connect but continue even if it fails)
(async () => {
  try {
    const connected = await connectDB();
    if (connected) {
      console.log('MongoDB connected successfully!');
    } else {
      console.warn('MongoDB connection failed');
      console.log('Server will run with limited functionality (no persistence)');
    }
  } catch (error) {
    console.warn('MongoDB connection error:', error.message);
    console.log('Server will run with limited functionality (no persistence)');
  }
})();

// Import routes
const authRoutes = require('./routes/auth');
const sheetRoutes = require('./routes/sheets');
const importExportRoutes = require('./routes/importExport');

// Initialize app
const app = express();

// Logging middleware
app.use(morgan('dev'));

// CORS Configuration - MUST come before other middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development and production
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add CORS headers to all responses as a fallback
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser middleware
app.use(cookieParser());

// Serve static files from the public directory
app.use(express.static('public'));

// Add test routes to check if the server is responding
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

app.get('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'API is working',
    cors: {
      origin: req.headers.origin || 'No origin header',
      method: req.method
    }
  });
});

app.post('/api/test', (req, res) => {
  res.status(200).json({ 
    message: 'POST request successful',
    body: req.body || 'No body',
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/import-export', importExportRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

module.exports = app;
