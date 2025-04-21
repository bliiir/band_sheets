// Simple CORS middleware that allows all origins in development
const enableCors = (req, res, next) => {
  // Allow any origin in development
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Allow common methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Allow common headers
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

module.exports = enableCors;
