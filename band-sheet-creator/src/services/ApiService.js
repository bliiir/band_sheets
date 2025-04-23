/**
 * ApiService - Handles all API calls to the backend
 * Provides a central place for managing authentication and API requests
 */

// API base URL - Use a simpler approach with a direct URL
// Dynamically determine the API URL based on the current environment
let API_URL;

// For production deployment on server
if (window.location.hostname !== 'localhost') {
  // Use the server's IP address directly with the correct port for the API
  // This is for the EC2 instance at 44.211.77.173
  API_URL = 'http://44.211.77.173:5050/api';
} else {
  // For local development
  API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';
}

// Debug log the API URL to help troubleshoot connection issues


/**
 * Helper for making API requests with proper error handling
 * 
 * @param {string} url - Full URL for the request
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const makeRequest = async (url, options = {}) => {
  try {
    // Special handling for auth endpoints
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    
    // Ensure we have headers with correct content type
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Get token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (!isAuthEndpoint) {
      // For non-auth endpoints without a token, use localStorage instead

      
      // If this is a sheets endpoint, we should return early and let the app use localStorage
      if (url.includes('/sheets')) {
        throw new Error('Not authenticated - using localStorage instead');
      }
    }
    
    // Make the request with all needed options set

    const response = await fetch(url, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include'
    }).catch(err => {
      console.error('Network error during fetch:', err);
      throw new Error('Network error - please check your connection');
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
    
    // Return the user object - backend returns it in data.user
    return data.user;
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

    
    // First clear any existing token to prevent auth issues
    localStorage.removeItem('token');
    
    // Direct implementation without using the helper for login
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials),
      mode: 'cors',
      credentials: 'include'
    });
    
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

    
    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);

    }
    
    // Return the user object - backend returns it in data.user
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    // Clear token on login error
    localStorage.removeItem('token');
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
