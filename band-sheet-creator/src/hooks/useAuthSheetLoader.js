import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllSheets } from '../services/SheetStorageService';

/**
 * Custom hook to load sheets when authentication state changes
 * This ensures sheets are loaded immediately after login without requiring a page refresh
 * Also loads the most recent sheet automatically
 * 
 * @param {Function} setSavedSheets - Function to update saved sheets state
 * @param {Function} loadSheet - Function to load a specific sheet
 * @returns {Object} - Object containing loading state and last update time
 */
const useAuthSheetLoader = (setSavedSheets, loadSheet) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [mostRecentSheetId, setMostRecentSheetId] = useState(null);

  // Load sheets whenever authentication state changes
  useEffect(() => {
    const loadSheets = async () => {
      if (isAuthenticated) {
        setLoading(true);
        try {
          console.log('Authentication detected, loading sheets from MongoDB...');
          const sheets = await getAllSheets();
          console.log(`Loaded ${sheets.length} sheets from MongoDB`);
          setSavedSheets(sheets);
          setLastUpdate(new Date());
          
          // Find the most recent sheet
          if (sheets && sheets.length > 0) {
            // Sort sheets by date modified (most recent first)
            const sortedSheets = [...sheets].sort((a, b) => {
              const dateA = new Date(a.dateModified || a.dateCreated || 0);
              const dateB = new Date(b.dateModified || b.dateCreated || 0);
              return dateB - dateA;
            });
            
            // Get the most recent sheet ID
            const recentSheet = sortedSheets[0];
            if (recentSheet && recentSheet.id) {
              console.log(`Found most recent sheet: ${recentSheet.id} - ${recentSheet.title}`);
              setMostRecentSheetId(recentSheet.id);
            }
          }
        } catch (error) {
          console.error('Error loading sheets after authentication:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Clear sheets when logged out
        console.log('User logged out, clearing saved sheets');
        setSavedSheets([]);
        setMostRecentSheetId(null);
        setLastUpdate(null);
      }
    };

    // Load sheets immediately when auth state changes
    loadSheets();
  }, [isAuthenticated, currentUser, setSavedSheets]);

  // Load the most recent sheet when it's identified
  useEffect(() => {
    if (mostRecentSheetId && loadSheet && !loading) {
      const loadMostRecentSheet = async () => {
        try {
          console.log(`Loading most recent sheet: ${mostRecentSheetId}`);
          // Add a small delay to ensure the sheets list is fully loaded
          setTimeout(async () => {
            const sheet = await loadSheet(mostRecentSheetId);
            if (sheet) {
              console.log('Most recent sheet loaded successfully');
            } else {
              console.warn('Sheet loading returned no data');
            }
          }, 500);
        } catch (error) {
          console.error('Error loading most recent sheet:', error);
        }
      };
      
      loadMostRecentSheet();
    }
  }, [mostRecentSheetId, loadSheet, loading]);

  return { loading, lastUpdate, mostRecentSheetId };
};

export default useAuthSheetLoader;
