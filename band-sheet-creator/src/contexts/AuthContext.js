import React, { createContext, useContext, useState, useEffect } from 'react';
// Use real ApiService for authentication
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../services/ApiService';
import { setUseApi } from '../services/SheetStorageService';

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
            setUseApi(true); // Enable API in SheetStorageService
          } else {
            localStorage.removeItem('token');
            setUseApi(false);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUseApi(false);
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
      setUseApi(true);
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
      setLoading(true);
      
      const user = await loginUser({ email, password });
      
      setCurrentUser(user);
      setUseApi(true);
      setLoading(false);
      return true;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return false;
    }
  };

  /**
   * Log out the current user
   * 
   * @returns {Promise<boolean>} - Success status
   */
  const logout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setUseApi(false);
      return true;
    } catch (err) {
      console.error('Logout error:', err);
      return false;
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
