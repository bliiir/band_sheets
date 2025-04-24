import React, { createContext, useContext, useState, useEffect } from 'react';
// Use real ApiService for authentication
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/ApiService';

/**
 * Context for managing authentication state
 */
const AuthContext = createContext(null);

/**
 * Provider component for authentication state
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
    }
  };

  // Context value
  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
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
