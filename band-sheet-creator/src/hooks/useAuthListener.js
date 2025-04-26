import { useState, useEffect } from 'react';
import eventBus from '../utils/EventBus';

/**
 * Custom hook to listen for authentication changes
 * @param {boolean} initialValue - Initial authentication state
 * @returns {boolean} Current authentication state
 */
const useAuthListener = (initialValue = false) => {
  const [isAuthenticated, setIsAuthenticated] = useState(initialValue);
  
  useEffect(() => {
    // Subscribe to auth change events
    const unsubscribe = eventBus.on('auth-change', (data) => {
      console.log('Auth change event received:', data);
      setIsAuthenticated(data.isAuthenticated);
    });
    
    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);
  
  return isAuthenticated;
};

export default useAuthListener;
