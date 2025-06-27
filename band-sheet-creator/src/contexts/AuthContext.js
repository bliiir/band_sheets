import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Use real ApiService for authentication
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/ApiService';
import { getAllSheets } from '../services/SheetStorageService';
import eventBus from '../utils/EventBus';
import logger from '../services/LoggingService';
import { getAuthToken, setAuthToken, removeAuthToken, isAuthenticated as checkAuth } from '../utils/AuthUtils';

/**
 * Context for managing authentication state
 */
const AuthContext = createContext(null);

/**
 * Custom hook to get navigate function in the context
 */
const NavigationWrapper = ({ children }) => {
  const navigate = useNavigate();
  
  return React.cloneElement(children, { navigate });
};

/**
 * Provider component for authentication state
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {Function} props.navigate - React Router navigate function
 */
export function AuthProviderWithoutNav({ children, navigate }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authChangeCounter, setAuthChangeCounter] = useState(0);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Enhanced authentication check on app load with retry and fallback
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Log detailed auth state on app initialization
        logger.debug('AuthContext', 'Checking authentication state on app load');
        
        // Check for token using our centralized AuthUtils
        const token = getAuthToken();
        logger.debug('AuthContext', `Token exists: ${!!token}`);
        
        if (token) {
          logger.debug('AuthContext', `Token length: ${token.length}`);
          logger.debug('AuthContext', 'Attempting to validate token with server...');
          
          try {
            // Try to get the current user with the token
            const user = await getCurrentUser();
            
            if (user) {
              logger.debug('AuthContext', 'Token validated successfully, user authenticated');
              setCurrentUser(user);
              
              // Refresh the token to extend session (optional improvement)
              if (user.id) {
                logger.debug('AuthContext', 'Storing user ID as fallback authentication reference');
                localStorage.setItem('user_id', user.id);
                localStorage.setItem('auth_timestamp', Date.now().toString());
              }
            } else {
              logger.debug('AuthContext', 'Server returned no user data, token may be invalid');
              // Only remove if we're sure it's invalid
              removeAuthToken();
            }
          } catch (validationError) {
            logger.error('AuthContext', 'Token validation error:', validationError);
            
            // Check if it's a network error vs. authentication error
            if (validationError.message && validationError.message.includes('Failed to fetch')) {
              logger.debug('AuthContext', 'Network error, keeping token for retry');
              // Keep the token on network errors - might just be temporary
            } else {
              logger.debug('AuthContext', 'Authentication error, removing invalid token');
              removeAuthToken();
            }
          }
        } else {
          // Log the lack of token
          logger.debug('AuthContext', 'No authentication token found');
          
          // Check if we have a fallback user ID that might help with recovery
          const fallbackUserId = localStorage.getItem('user_id');
          const authTimestamp = localStorage.getItem('auth_timestamp');
          
          if (fallbackUserId && authTimestamp) {
            const timestamp = parseInt(authTimestamp);
            const hoursSinceAuth = (Date.now() - timestamp) / (1000 * 60 * 60);
            
            logger.debug('AuthContext', `Found fallback user ID (${fallbackUserId}) from ${hoursSinceAuth.toFixed(1)} hours ago`);
            
            // We could attempt recovery here if needed
          }
        }
      } catch (err) {
        logger.error('AuthContext', 'Auth check error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkLoggedIn();
  }, []);

  /**
   * Register a new user
   * 
   * @param {string} username - Username
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {Promise<boolean>} - Success status
   */
  const register = async (username, email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const user = await registerUser({ username, email, password });
      
      setCurrentUser(user);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  /**
   * Load the first available sheet
   */
  const loadFirstSheet = async () => {
    try {
      // Get all sheets
      const sheets = await getAllSheets();
      
      // If we have sheets, load the first one
      if (sheets && sheets.length > 0) {
        const sheet = sheets[0];
        if (sheet && sheet.id) {
          logger.info('AuthContext', `Loading first sheet: ${sheet.id}`);
          navigate(`/sheet/${sheet.id}`);
        }
      }
    } catch (error) {
      logger.error('AuthContext', 'Error loading first sheet:', error);
    }
  };

  /**
   * Log in an existing user
   * 
   * @param {string} email - Email address
   * @param {string} password - Password
   * @returns {Promise<boolean>} - Success status
   */
  const login = async (email, password) => {
    try {
      setError(null);
      
      // Don't set loading to true here - it prevents typing in the form
      // We'll let the LoginRegister component handle its own loading state
      
      const user = await loginUser({ email, password });
      setCurrentUser(user);
      
      // Trigger auth change event
      setAuthChangeCounter(prev => prev + 1);
      
      // Emit auth change event
      eventBus.emit('auth-change', { isAuthenticated: true, user });
      logger.info('AuthContext', 'Emitted auth-change event: logged in');
      
      // Navigate to the front page after successful login
      setTimeout(() => navigate('/'), 500);
      
      return true;
    } catch (err) {
      logger.error('AuthContext', 'Login error:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      // Don't set loading to true here - it can cause issues with UI interactions
      
      // Clear user data first to prevent API calls during transition
      setCurrentUser(null);
      
      // Then attempt to logout from the server
      try {
        await logoutUser();
      } catch (err) {
        // Continue with local logout despite server error
      }
      
      // Make sure token is removed using our centralized AuthUtils
      removeAuthToken();
      
      // Trigger auth change event
      setAuthChangeCounter(prev => prev + 1);
      
      // Emit auth change event
      eventBus.emit('auth-change', { isAuthenticated: false, user: null });
      logger.info('AuthContext', 'Emitted auth-change event: logged out');
    } catch (err) {
      logger.error('AuthContext', 'Logout error:', err);
      setError(err.message);
    }
  };

  // Function to subscribe to auth changes
  const onAuthChange = useCallback((callback) => {
    // This will be used by components to react to auth state changes
    return { authChangeCounter };
  }, [authChangeCounter]);
  
  /**
   * Shows the authentication modal
   */
  const showAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
    // Emit an event for the modal to open
    eventBus.emit('show-auth-modal', true);
  }, []);

  /**
   * Hides the authentication modal
   */
  const hideAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    // Emit an event for the modal to close
    eventBus.emit('show-auth-modal', false);
  }, []);

  // Check if the user's authentication token is actually valid
  const checkAuthToken = useCallback(() => {
    const isAuth = checkAuth();
    logger.debug('AuthContext', 'Auth check - User is authenticated:', isAuth);
    
    // If we have a token but no user object, something is out of sync
    if (isAuth && !currentUser) {
      logger.debug('AuthContext', 'Auth state mismatch - token exists but no user');
      return false;
    }
    
    return isAuth;
  }, [currentUser]);
  
  // Get token using our centralized AuthUtils
  const getToken = useCallback(() => {
    return getAuthToken();
  }, []);

  // Value object for the context
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    // Use both currentUser and token presence to determine authentication
    isAuthenticated: !!currentUser || checkAuthToken(),
    authChangeCounter,
    onAuthChange,
    showAuthModal,
    hideAuthModal,
    isAuthModalOpen,
    // Expose token functions
    checkAuthToken,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Wrapper component that provides navigation to the AuthProvider
 */
export function AuthProvider({ children }) {
  return (
    <NavigationWrapper>
      <AuthProviderWithoutNav>{children}</AuthProviderWithoutNav>
    </NavigationWrapper>
  );
}

/**
 * Custom hook to use the auth context
 * 
 * @returns {Object} Auth context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
