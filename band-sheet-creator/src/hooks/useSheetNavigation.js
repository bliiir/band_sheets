import { useEffect, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to manage sheet navigation
 * 
 * This hook encapsulates all the navigation logic needed for sheet loading
 * and browser history management in a clean, reusable way.
 * 
 * @param {Object} options - Options for the hook
 * @param {string} options.initialSheetId - Initial sheet ID from URL parameter
 * @param {Function} options.loadSheet - Function to load sheet data
 * @param {Function} options.showNotification - Function to show notifications
 * @param {Function} options.navigate - Function to navigate between routes
 * @param {Function} options.clearTemporaryDraft - Function to clear temporary drafts
 * @returns {Object} - Navigation state and methods
 */
export default function useSheetNavigation({
  initialSheetId,
  loadSheet,
  showNotification,
  navigate,
  clearTemporaryDraft
}) {
  // Navigation state
  const [loadedSheetId, setLoadedSheetId] = useState(null);
  const [navSource, setNavSource] = useState(null);
  const location = useLocation();
  const [previousLocation, setPreviousLocation] = useState(location.pathname);
  
  // Update previous location when location changes
  useEffect(() => {
    if (previousLocation !== location.pathname) {
      setPreviousLocation(location.pathname);
    }
  }, [location.pathname, previousLocation]);
  
  // Load a sheet from a URL parameter
  const loadSheetFromUrl = useCallback(async (sheetId) => {
    if (!sheetId) return false;
    
    console.log(`useSheetNavigation: Loading sheet from URL: ${sheetId}`);
    
    try {
      // Set navigation source first to prevent circular updates
      setNavSource('url');
      
      // Load the sheet
      await loadSheet(sheetId);
      
      // Update loaded sheet ID
      setLoadedSheetId(sheetId);
      
      // Show notification
      showNotification('Sheet loaded successfully');
      
      // Clear any temporary draft
      if (clearTemporaryDraft) {
        clearTemporaryDraft();
      }
      
      return true;
    } catch (error) {
      console.error('useSheetNavigation: Error loading sheet from URL:', error);
      showNotification(`Error loading sheet: ${error.message}`, 'error');
      
      // Update loaded sheet ID even on error to prevent retries
      setLoadedSheetId(sheetId);
      
      return false;
    }
  }, [loadSheet, showNotification, clearTemporaryDraft]);
  
  // Load initial sheet if provided
  useEffect(() => {
    if (initialSheetId && initialSheetId !== loadedSheetId) {
      loadSheetFromUrl(initialSheetId);
    }
  }, [initialSheetId, loadedSheetId, loadSheetFromUrl]);
  
  // Load sheet when URL changes due to browser history navigation
  useEffect(() => {
    const match = location.pathname.match(/\/sheet\/([^/]+)/);
    const urlSheetId = match ? match[1] : null;
    
    // If location changed due to browser history and it's a sheet URL
    if (previousLocation !== location.pathname && urlSheetId) {
      console.log(`useSheetNavigation: Detected history navigation to sheet ${urlSheetId}`);
      
      // Only load if this is a different sheet
      if (urlSheetId !== loadedSheetId) {
        // Set navigation source
        setNavSource('history');
        
        // Load the sheet
        loadSheet(urlSheetId)
          .then(() => {
            setLoadedSheetId(urlSheetId);
            showNotification('Sheet loaded successfully');
          })
          .catch(error => {
            console.error('useSheetNavigation: Error loading sheet from history:', error);
            showNotification(`Error loading sheet: ${error.message}`, 'error');
          });
      }
    }
  }, [location.pathname, previousLocation, loadedSheetId, loadSheet, showNotification]);
  
  // Handle internal sheet change
  const handleInternalSheetChange = useCallback((sheetId) => {
    if (!sheetId) return;
    
    console.log(`useSheetNavigation: Internal sheet change to ${sheetId}`);
    
    // Set navigation source
    setNavSource('internal');
    
    // Only update URL if this is a different sheet than what's in the URL
    if (sheetId !== loadedSheetId) {
      navigate(`/sheet/${sheetId}`);
    }
  }, [loadedSheetId, navigate]);
  
  // Update URL when a sheet is loaded internally
  useEffect(() => {
    if (loadedSheetId && navSource === 'internal') {
      // Only navigate if the current URL doesn't match the loaded sheet
      if (location.pathname !== `/sheet/${loadedSheetId}`) {
        navigate(`/sheet/${loadedSheetId}`);
      }
    }
  }, [loadedSheetId, navSource, navigate, location.pathname]);
  
  return {
    loadedSheetId,
    navSource,
    loadSheetFromUrl,
    handleInternalSheetChange
  };
}
