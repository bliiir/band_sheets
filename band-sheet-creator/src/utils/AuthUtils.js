/**
 * AuthUtils.js
 * Centralized utilities for authentication across the application
 * Single source of truth for authentication status and token management
 */

import eventBus from './EventBus';
import logger from '../services/LoggingService';

// Token storage key
export const TOKEN_STORAGE_KEY = 'token';

/**
 * Get the authentication token from storage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    // Basic validation - ensure it's a non-empty string
    if (token && typeof token === 'string' && token.length > 10) {
      return token;
    } else if (token) {
      // If token exists but seems invalid, log a warning
      logger.warn('AuthUtils', `Found potentially invalid token: ${typeof token}, length: ${token ? token.length : 0}`);
    }
    
    return null;
  } catch (error) {
    logger.error('AuthUtils', 'Error retrieving token:', error);
    return null;
  }
};

/**
 * Store the authentication token
 * @param {string} token - The authentication token to store
 */
export const setAuthToken = (token) => {
  try {
    if (token) {
      // Store token in localStorage for our app's client-side access
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      logger.debug('AuthUtils', 'Token stored in localStorage');
      
      // Also set a non-HttpOnly cookie as a backup persistence mechanism
      // This helps maintain the session across page refreshes
      try {
        const tokenExpiry = new Date();
        // Set expiry for 7 days
        tokenExpiry.setDate(tokenExpiry.getDate() + 7);
        document.cookie = `clientToken=${token}; expires=${tokenExpiry.toUTCString()}; path=/; SameSite=Lax`;
        logger.debug('AuthUtils', 'Also stored token in cookie for redundancy');
      } catch (cookieError) {
        logger.warn('AuthUtils', 'Could not set cookie, using localStorage only', cookieError);
      }
    } else {
      removeAuthToken();
    }
  } catch (error) {
    logger.error('AuthUtils', 'Error storing token in localStorage:', error);
  }
};

/**
 * Remove the authentication token from all storage locations
 */
export const removeAuthToken = () => {
  try {
    // Clear from localStorage
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    logger.debug('AuthUtils', 'Token removed from localStorage');
    
    // Also clear user identification data
    localStorage.removeItem('user_id');
    localStorage.removeItem('auth_timestamp');
    
    // Clear from cookies
    try {
      document.cookie = 'clientToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
      logger.debug('AuthUtils', 'Token cookie cleared');
    } catch (cookieError) {
      logger.warn('AuthUtils', 'Error clearing token cookie:', cookieError);
    }
  } catch (error) {
    logger.error('AuthUtils', 'Error removing token:', error);
  }
};

/**
 * Check if the user is authenticated (has a token)
 * This is the single source of truth for authentication status
 * @returns {boolean} Whether the user is authenticated
 */
export const isAuthenticated = () => {
  try {
    // Direct localStorage check for reliability
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const hasValidToken = !!token && typeof token === 'string' && token.length > 10;
    
    // Log the authentication status
    logger.debug('AuthUtils', `Authentication check: token exists=${!!token}, valid=${hasValidToken}`);
    
    return hasValidToken;
  } catch (err) {
    logger.error('AuthUtils', 'Error checking authentication status:', err);
    return false;
  }
};

/**
 * Handle the case when user is not authenticated
 * Shows authentication modal and throws an error
 * @param {string} message - Error message to show
 * @throws {Error} Authentication error
 */
export const handleUnauthenticated = (message = 'Authentication required') => {
  logger.warn('AuthUtils', message);
  
  // Show authentication modal
  eventBus.emit('show-auth-modal', true);
  
  // Throw authentication error
  throw new Error(message);
};

/**
 * Request authentication from the user
 * Shows the authentication modal without throwing an error
 * @returns {boolean} Always returns false
 */
export const requestAuthentication = () => {
  logger.info('AuthUtils', 'Requesting authentication from user');
  eventBus.emit('show-auth-modal', true);
  return false;
};

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated,
  handleUnauthenticated,
  requestAuthentication,
  TOKEN_STORAGE_KEY
};
