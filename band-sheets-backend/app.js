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
    
    // Whitelist specific origins
    const allowedOrigins = [
      // Local development
      'http://localhost:3000',
      // Server IP and EC2 hostname
      'http://35.157.195.167',
      'http://35.157.195.167:3000',
      'http://35.157.195.167:80',
      'http://35.157.195.167:5050',
      'http://ec2-44-211-77-173.compute-1.amazonaws.com',
      'https://ec2-44-211-77-173.compute-1.amazonaws.com',
      // Domain names (both http and https)
      'http://muzjik.com',
      'https://muzjik.com',
      'http://www.muzjik.com',
      'https://www.muzjik.com',
      'http://band-sheets.com',
      'https://band-sheets.com',
      'http://www.band-sheets.com',
      'https://www.band-sheets.com',
      'http://bandut.com',
      'https://bandut.com',
      'http://www.bandut.com',
      'https://www.bandut.com',
      'http://f-minor.com',
      'https://f-minor.com',
      'http://www.f-minor.com',
      'https://www.f-minor.com',
      'http://b-major.com',
      'https://b-major.com',
      'http://www.b-major.com',
      'https://www.b-major.com',
      'http://g-minor.com',
      'https://g-minor.com',
      'http://www.g-minor.com',
      'https://www.g-minor.com',
      'http://lead-sheets.com',
      'https://lead-sheets.com',
      'http://www.lead-sheets.com',
      'https://www.lead-sheets.com',
      'http://putuni.com',
      'https://putuni.com',
      'http://www.putuni.com',
      'https://www.putuni.com',
      'http://riddam.com',
      'https://riddam.com',
      'http://www.riddam.com',
      'https://www.riddam.com'
    ];
    
    // Check if the origin is in our whitelist
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      // Still allow all origins in development and production for now
      // but log for debugging purposes
      console.log('CORS request from:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Add CORS headers to all responses as a fallback
app.use((req, res, next) => {
  // Always allow the request origin
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
