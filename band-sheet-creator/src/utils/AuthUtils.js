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
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    logger.error('AuthUtils', 'Error retrieving token from localStorage:', error);
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
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      logger.debug('AuthUtils', 'Token stored in localStorage');
    } else {
      removeAuthToken();
    }
  } catch (error) {
    logger.error('AuthUtils', 'Error storing token in localStorage:', error);
  }
};

/**
 * Remove the authentication token
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    logger.debug('AuthUtils', 'Token removed from localStorage');
  } catch (error) {
    logger.error('AuthUtils', 'Error removing token from localStorage:', error);
  }
};

/**
 * Check if the user is authenticated (has a token)
 * This is the single source of truth for authentication status
 * @returns {boolean} Whether the user is authenticated
 */
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
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
