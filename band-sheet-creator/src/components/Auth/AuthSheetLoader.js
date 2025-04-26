import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllSheets } from '../../services/SheetStorageService';

/**
 * Component that handles loading any sheet when a user authenticates
 * This is a "headless" component (no UI) that just handles the sheet loading logic
 */
const AuthSheetLoader = () => {
  const { isAuthenticated } = useAuth();
  const [prevAuthState, setPrevAuthState] = useState(false);
  const navigate = useNavigate();

  // This effect runs only when authentication state changes from false to true
  useEffect(() => {
    // Only run when user has just logged in (auth state changed from false to true)
    if (isAuthenticated && !prevAuthState) {
      // Update previous auth state
      setPrevAuthState(isAuthenticated);
      
      // Function to load any sheet
      const loadAnySheet = async () => {
        try {
          // Get all sheets from MongoDB
          const sheets = await getAllSheets();
          
          if (sheets && sheets.length > 0) {
            // Just pick any sheet (first one in the array)
            const anySheet = sheets[0];
            
            if (anySheet && anySheet.id) {
              // Navigate to the sheet directly
              navigate(`/sheet/${anySheet.id}`);
            }
          }
        } catch (error) {
          console.error('Error loading sheet:', error);
        }
      };
      
      // Wait for authentication to fully process before loading sheets
      setTimeout(loadAnySheet, 1000);
    } else if (!isAuthenticated) {
      // Update previous auth state when logging out
      setPrevAuthState(false);
    }
  }, [isAuthenticated, navigate, prevAuthState]);
  
  // This is a headless component, so it doesn't render anything
  return null;
};

export default AuthSheetLoader;
