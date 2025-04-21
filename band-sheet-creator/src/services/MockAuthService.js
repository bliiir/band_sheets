/**
 * MockAuthService.js
 * Temporary implementation that simulates authentication locally
 * without making network requests to the backend
 */

// Mock user storage in localStorage
const MOCK_USERS_KEY = 'band_sheets_mock_users';
const CURRENT_USER_KEY = 'band_sheets_current_user';
const TOKEN_KEY = 'token';

// Initialize mock users if needed
const initializeMockStorage = () => {
  if (!localStorage.getItem(MOCK_USERS_KEY)) {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify([]));
  }
};

// Get all mock users
const getMockUsers = () => {
  initializeMockStorage();
  return JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
};

// Save mock users
const saveMockUsers = (users) => {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
};

// Generate mock token
const generateToken = (userId) => {
  return `mock_token_${userId}_${Date.now()}`;
};

/**
 * Register a new user locally
 * 
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} User data
 */
export const registerUser = async (userData) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const { username, email, password } = userData;
    
    // Validate input
    if (!username || !email || !password) {
      throw new Error('All fields are required');
    }
    
    // Check if user already exists
    const users = getMockUsers();
    if (users.some(u => u.email === email || u.username === username)) {
      throw new Error('User already exists');
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      username,
      email,
      password, // In a real system, this would be hashed
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    // Save to mock storage
    users.push(newUser);
    saveMockUsers(users);
    
    // Generate token
    const token = generateToken(newUser.id);
    
    // Save current user and token
    const userResponse = { ...newUser };
    delete userResponse.password;
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userResponse));
    localStorage.setItem(TOKEN_KEY, token);
    
    console.log('User registered successfully in mock system:', userResponse);
    
    return userResponse;
  } catch (error) {
    console.error('Mock registration error:', error);
    throw error;
  }
};

/**
 * Login a user locally
 * 
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} User data
 */
export const loginUser = async (credentials) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const { email, password } = credentials;
    
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Find user
    const users = getMockUsers();
    const user = users.find(u => u.email === email);
    
    if (!user || user.password !== password) {
      throw new Error('Invalid credentials');
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Save current user and token
    const userResponse = { ...user };
    delete userResponse.password;
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userResponse));
    localStorage.setItem(TOKEN_KEY, token);
    
    console.log('User logged in successfully in mock system:', userResponse);
    
    return userResponse;
  } catch (error) {
    console.error('Mock login error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * 
 * @returns {Promise<boolean>} Success indicator
 */
export const logoutUser = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return true;
  } catch (error) {
    console.error('Mock logout error:', error);
    return false;
  }
};

/**
 * Get the current user
 * 
 * @returns {Promise<Object|null>} Current user or null
 */
export const getCurrentUser = async () => {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};
