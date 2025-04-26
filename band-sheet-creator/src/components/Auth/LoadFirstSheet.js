import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAllSheets } from '../../services/SheetStorageService';

/**
 * Simple component that loads the first available sheet after authentication
 * This is a "headless" component with no UI
 */
const LoadFirstSheet = () => {
  const { isAuthenticated } = useAuth();
  const [hasLoaded, setHasLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Only attempt to load a sheet when authenticated and we haven't already loaded one
    if (isAuthenticated && !hasLoaded) {
      const loadFirstSheet = async () => {
        try {
          // Get all sheets
          const sheets = await getAllSheets();
          
          // If we have sheets, load the first one
          if (sheets && sheets.length > 0) {
            const sheet = sheets[0];
            if (sheet && sheet.id) {
              console.log(`Loading sheet: ${sheet.id}`);
              
              // Navigate directly to the sheet
              navigate(`/sheet/${sheet.id}`);
              
              // Mark as loaded
              setHasLoaded(true);
            }
          }
        } catch (error) {
          console.error('Error loading sheet:', error);
        }
      };
      
      // Add a delay to ensure authentication is complete
      setTimeout(loadFirstSheet, 1000);
    }
    
    // Reset when logged out
    if (!isAuthenticated) {
      setHasLoaded(false);
    }
  }, [isAuthenticated, navigate, hasLoaded]);
  
  // No UI
  return null;
};

export default LoadFirstSheet;
