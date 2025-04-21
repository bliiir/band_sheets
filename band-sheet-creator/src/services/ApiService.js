/**
 * ApiService - Handles all API calls to the backend
 * Provides a central place for managing authentication and API requests
 */

// API base URL - Use a simpler approach with a direct URL
// Dynamically determine the API URL based on the current environment
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API Service initialized with URL:', API_URL);

/**
 * Helper for making API requests with proper error handling
 * 
 * @param {string} url - Full URL for the request
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const makeRequest = async (url, options = {}) => {
  try {
    // Ensure we have headers with correct content type
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Get token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Make the request with all needed options set
    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include'
    });
    
    // Check if the response can be parsed as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API error: ' + response.status);
      }
      
      return data;
    } else {
      // Handle non-JSON responses
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }
      
      return { success: true };
    }
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Auth API Functions

/**
 * Register a new user
 * 
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} - User data with token
 */
export const registerUser = async (userData) => {
  try {
    // Direct implementation without using the helper
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Registration failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    return data.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Login a user
 * 
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<Object>} - User data with token
 */
export const loginUser = async (credentials) => {
  try {
    console.log('Attempting login with API:', credentials.email);
    
    // Direct implementation without using the helper
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials),
      mode: 'cors',
      credentials: 'include'
    });
    
    console.log('Login response status:', response.status);
    
    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || `Login failed with status: ${response.status}`;
      } catch (e) {
        errorMessage = `Login failed with status: ${response.status}`;
      }
      console.error('Login error:', errorMessage);
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Login successful, received data:', data);
    
    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('Token saved to localStorage');
    }
    
    return data.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Logout the current user
 * 
 * @returns {Promise<boolean>} - Success indicator
 */
export const logoutUser = async () => {
  try {
    // Direct implementation without using the helper
    const token = localStorage.getItem('token');
    const headers = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    await fetch(`${API_URL}/auth/logout`, {
      headers,
      mode: 'cors',
      credentials: 'include'
    });
    
    localStorage.removeItem('token');
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    localStorage.removeItem('token'); // Remove token even if API call fails
    return false;
  }
};

/**
 * Get the current logged-in user
 * 
 * @returns {Promise<Object|null>} - Current user data or null if not logged in
 */
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    // Direct implementation without using the helper
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Get current user error:', error);
    localStorage.removeItem('token');
    return null;
  }
};

// Export the makeRequest helper for other services to use
export const fetchWithAuth = makeRequest;
