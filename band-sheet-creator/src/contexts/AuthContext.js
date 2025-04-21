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
        console.log('AuthContext: Checking login status, token exists:', !!token);
        
        if (token) {
          console.log('AuthContext: Attempting to get current user with token');
          const user = await getCurrentUser();
          if (user) {
            console.log('AuthContext: User authenticated successfully:', user.username);
            setCurrentUser(user);
            setUseApi(true); // Enable API in SheetStorageService
          } else {
            console.log('AuthContext: Token exists but user fetch failed');
            localStorage.removeItem('token');
            setUseApi(false);
          }
        } else {
          console.log('AuthContext: No token found, user is not logged in');
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
      console.log('AuthContext: Attempting login for email:', email);
      setError(null);
      setLoading(true);
      
      const user = await loginUser({ email, password });
      console.log('AuthContext: Login successful, user:', user);
      
      setCurrentUser(user);
      setUseApi(true);
      console.log('AuthContext: useApi set to true after login');
      setLoading(false);
      return true;
    } catch (err) {
      console.error('AuthContext: Login failed:', err.message);
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
