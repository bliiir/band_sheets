/**
 * New Express server with minimal configuration
 * Run with: node new-server.js
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

// Create Express app
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple API routes
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide all required fields' 
    });
  }
  
  res.json({
    success: true,
    message: 'Registration successful',
    data: { username, email }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      error: 'Please provide email and password' 
    });
  }
  
  res.json({
    success: true,
    message: 'Login successful',
    token: 'test_token_123',
    data: { email }
  });
});

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'simple-test.html'));
});

// Start server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Test the API at: http://localhost:${PORT}/api/test`);
});
