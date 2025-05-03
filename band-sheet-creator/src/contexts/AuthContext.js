import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Use real ApiService for authentication
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/ApiService';
import { getAllSheets } from '../services/SheetStorageService';
import eventBus from '../utils/EventBus';

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

  // Check if user is logged in on app load
  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        // Check for token
        const token = localStorage.getItem('token');
        if (token) {
          const user = await getCurrentUser();
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
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
          console.log(`Loading first sheet: ${sheet.id}`);
          navigate(`/sheet/${sheet.id}`);
        }
      }
    } catch (error) {
      console.error('Error loading first sheet:', error);
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
      console.log('Emitted auth-change event: logged in');
      
      // Load the first sheet after successful login
      setTimeout(() => loadFirstSheet(), 500);
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
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
      
      // Make sure token is removed from localStorage
      localStorage.removeItem('token');
      
      // Trigger auth change event
      setAuthChangeCounter(prev => prev + 1);
      
      // Emit auth change event
      eventBus.emit('auth-change', { isAuthenticated: false, user: null });
      console.log('Emitted auth-change event: logged out');
    } catch (err) {
      console.error('Logout error:', err);
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

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!currentUser,
    authChangeCounter,
    onAuthChange,
    showAuthModal,
    hideAuthModal,
    isAuthModalOpen
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
