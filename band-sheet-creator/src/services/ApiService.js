/**
 * ApiService - Handles all API calls to the backend
 * Provides a central place for managing authentication and API requests
 */

import { getAuthToken, setAuthToken, removeAuthToken } from '../utils/AuthUtils';
import logger from './LoggingService';

// API base URL - Use a simpler approach with a direct URL
// Dynamically determine the API URL based on the current environment
let API_URL;

// For production deployment on server
if (window.location.hostname !== 'localhost') {
  // Use the current domain for API requests to avoid CORS issues
  // This ensures we use HTTPS when the site is served over HTTPS
  API_URL = `https://${window.location.hostname}/api`;
} else {
  // For local development
  API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';
}

logger.info('ApiService', 'API URL configured as:', API_URL);

// Export the API_URL so it can be imported by other services
export { API_URL };

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
    // Log outgoing requests to diagnose API issues
    console.log(`API REQUEST: ${options.method || 'GET'} ${url}`);
    
    // Special handling for auth endpoints
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    
    // Ensure we have headers with correct content type
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Get token if available using our centralized AuthUtils
    const token = getAuthToken();
    
    // Log authentication status for each request
    logger.debug('ApiService', `Making request to: ${url}`);
    logger.debug('ApiService', `Auth token exists: ${!!token}`);
    
    if (token) {
      // User is authenticated, add token to all requests
      headers.Authorization = `Bearer ${token}`;
      // Add token length info for debugging without exposing the actual token
      logger.debug('ApiService', `Using auth token (length: ${token.length}) for request`);
    } else if (!isAuthEndpoint) {
      // User is not authenticated
      
      // Define which endpoints absolutely require authentication
      const authRequiredEndpoints = [
        '/favorite', 
        '/sheets/add', 
        '/sheets/remove', 
        '/sheets/update',
        '/sheets/delete',
        '/reorder', 
        '/setlists/new',
        '/setlists/create'
      ];
      
      // Any write operation on setlists requires authentication
      const isSetlistWriteOperation = url.includes('/setlists') && 
                                     options.method && 
                                     ['POST', 'PUT', 'DELETE'].includes(options.method.toUpperCase());
      
      // Check if this operation absolutely requires authentication
      const requiresAuth = authRequiredEndpoints.some(endpoint => url.includes(endpoint)) || isSetlistWriteOperation;
      
      if (requiresAuth) {
        console.error('Authentication required for endpoint:', url);
        throw new Error('Authentication required for this operation');
      }
      
      // Setlist GET requests should be allowed without auth (will return public setlists)
      if (url.includes('/setlists') && (!options.method || options.method.toUpperCase() === 'GET')) {
        console.log('Proceeding with unauthenticated setlist request to get public setlists');
        // Allow request to proceed without authentication token
      } else {
        // For all other endpoints without auth, we'll let the request proceed
        // But the backend will determine what data to return based on authentication status
        logger.debug('ApiService', 'Proceeding without authentication token');
      }
    }
    
    // Add debugging for request details
    logger.debug('ApiService', `Making API request to: ${url}`);
    logger.debug('ApiService', 'With options:', { ...options, headers: '[redacted for privacy]' });
    
    // Make the request with all needed options set - ensure credentials are included
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'  // Critical: Always include credentials for cross-domain requests
    }).catch(err => {
      console.error('Network error during fetch:', err);
      throw new Error(`Network error: ${err.message}`);
    });

    
    // Check if the response can be parsed as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      
      // Debug log the API response for all setlist-related requests
      if (url.includes('/setlists')) {
        console.log(`API RESPONSE for ${url}:`, data);
        console.log('Response status:', response.status); 
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        console.log('Response data type:', typeof data);
        console.log('Response is array?', Array.isArray(data));
        console.log('Response keys:', Object.keys(data));
      }
      
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
    
    // Save token using our centralized AuthUtils
    if (data.token) {
      setAuthToken(data.token);
    }
    
    // Return the user object - backend returns it in data.user
    return data.user;
  } catch (error) {
    logger.error('ApiService', 'Registration error:', error);
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
    removeAuthToken();
    
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

    
    // Save token using the centralized auth utility and ensure it's properly stored
    if (data.token) {
      // Store the token
      setAuthToken(data.token);
      
      // Log detailed auth information for debugging
      logger.debug('ApiService', 'Auth token stored via centralized utility');
      logger.debug('ApiService', `Token exists after storage: ${!!getAuthToken()}`);
      logger.debug('ApiService', `Token length: ${getAuthToken()?.length || 0}`);
      
      // Also store user info for backup authentication check
      if (data.user && data.user.id) {
        try {
          localStorage.setItem('user_id', data.user.id);
          localStorage.setItem('auth_timestamp', Date.now().toString());
          logger.debug('ApiService', 'Stored user ID and timestamp for backup auth check');
        } catch (err) {
          logger.error('ApiService', 'Error storing user data:', err);
        }
      }
    }
    
    // Return the user object - backend returns it in data.user
    return data.user;
  } catch (error) {
    logger.error('ApiService', 'Login error:', error);
    // Clear token on login error
    removeAuthToken();
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
    // Use the centralized token management system
    logger.debug('ApiService', 'Logging out user');
    const token = getAuthToken();
    const headers = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      logger.debug('ApiService', 'Token found, adding to logout request');
    } else {
      logger.debug('ApiService', 'No token found for logout request');
    }
    
    await fetch(`${API_URL}/auth/logout`, {
      headers,
      mode: 'cors',
      credentials: 'include'
    });
    
    removeAuthToken();
    return true;
  } catch (error) {
    logger.error('ApiService', 'Logout error:', error);
    removeAuthToken(); // Remove token even if API call fails
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
    // Get token and log detailed debugging info
    const token = getAuthToken();
    logger.debug('ApiService', `getCurrentUser - token exists: ${!!token}`);
    
    if (!token) {
      logger.debug('ApiService', 'No token available, returning null');
      return null;
    }
    
    logger.debug('ApiService', `Making auth validation request to ${API_URL}/auth/me`);
    
    // Direct implementation without using the helper
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    logger.debug('ApiService', `Auth validation response status: ${response.status}`);
    
    if (!response.ok) {
      logger.warn('ApiService', `Failed to validate token: ${response.status}`);
      throw new Error(`Failed to get user: ${response.status}`);
    }
    
    const data = await response.json();
    logger.debug('ApiService', 'Token validated successfully, user data retrieved');
    
    // Ensure we're getting the expected response structure
    if (!data.data && data.user) {
      // Handle different response formats
      logger.debug('ApiService', 'Using alternate response format');
      return data.user;
    }
    
    return data.data;
  } catch (error) {
    logger.error('ApiService', 'Get current user error:', error);
    // Only remove the token if it's an auth error (401/403)
    // Other errors might be temporary network issues
    if (error.message && (error.message.includes('401') || error.message.includes('403'))) {
      logger.debug('ApiService', 'Removing invalid token');
      removeAuthToken();
    }
    return null;
  }
};

// Export the makeRequest helper for other services to use
export const fetchWithAuth = makeRequest;
