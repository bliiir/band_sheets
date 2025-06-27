import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  loadSheet, 
  setNavigationSource, 
  setLoadedSheetId, 
  setPreviousLocation,
  selectCurrentSheetId, 
  selectLoadedSheetId, 
  selectNavigationSource,
  selectNavigationError,
  selectPreviousLocation
} from '../redux/slices/navigationSlice';

/**
 * Custom hook for sheet navigation using Redux
 * 
 * This hook provides a clean API for navigating between sheets
 * while maintaining proper browser history support
 */
export default function useReduxNavigation({ initialSheetId, showNotification }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Select navigation state from Redux
  const currentSheetId = useSelector(selectCurrentSheetId);
  const loadedSheetId = useSelector(selectLoadedSheetId);
  const navSource = useSelector(selectNavigationSource);
  const previousLocation = useSelector(selectPreviousLocation);
  const navigationError = useSelector(selectNavigationError);
  
  // Load sheet from URL parameter
  const loadSheetFromUrl = useCallback(async (sheetId) => {
    if (!sheetId) return false;
    
    console.log(`useReduxNavigation: Loading sheet from URL: ${sheetId}`);
    
    try {
      // Dispatch the loadSheet action with URL source
      await dispatch(loadSheet({ sheetId, source: 'url' })).unwrap();
      
      // Success notifications are now handled centrally in BandSheetEditor
      // to prevent duplicate notifications
      
      return true;
    } catch (error) {
      console.error('useReduxNavigation: Error loading sheet from URL:', error);
      
      if (showNotification) {
        showNotification(`Error loading sheet: ${error}`, 'error');
      }
      
      // Still update the loaded sheet ID to prevent retries
      dispatch(setLoadedSheetId(sheetId));
      
      return false;
    }
  }, [dispatch, showNotification]);
  
  // Handle internal sheet change (e.g., creating a new sheet)
  const handleInternalSheetChange = useCallback((sheetId) => {
    if (!sheetId) return;
    
    console.log(`useReduxNavigation: Internal sheet change to ${sheetId}`);
    
    // Update navigation source
    dispatch(setNavigationSource('internal'));
    
    // Only update URL if different from current
    if (sheetId !== loadedSheetId) {
      navigate(`/sheet/${sheetId}`);
    }
  }, [dispatch, loadedSheetId, navigate]);
  
  // Load initial sheet from URL parameter
  useEffect(() => {
    if (initialSheetId && initialSheetId !== loadedSheetId && navSource !== 'history') {
      loadSheetFromUrl(initialSheetId);
    }
  }, [initialSheetId, loadedSheetId, navSource, loadSheetFromUrl]);
  
  // Update previous location and check for history navigation
  useEffect(() => {
    // If location changed and we have a previous location
    if (previousLocation && location.pathname !== previousLocation) {
      console.log(`useReduxNavigation: Location changed from ${previousLocation} to ${location.pathname}`);
      
      // Extract sheet ID from URL
      const match = location.pathname.match(/\/sheet\/([^/]+)/);
      const urlSheetId = match ? match[1] : null;
      
      // If navigating to a sheet via browser history
      if (urlSheetId && urlSheetId !== loadedSheetId) {
        console.log(`useReduxNavigation: History navigation to sheet ${urlSheetId}`);
        
        // Set navigation source to history
        dispatch(setNavigationSource('history'));
        
        // Load the sheet
        dispatch(loadSheet({ sheetId: urlSheetId, source: 'history' }))
          .unwrap()
          .then(() => {
            // Success notifications are now handled centrally in BandSheetEditor
            // to prevent duplicate notifications
          })
          .catch((error) => {
            console.error('useReduxNavigation: History navigation error:', error);
            if (showNotification) {
              showNotification(`Error loading sheet: ${error}`, 'error');
            }
          });
      }
    }
    
    // Update previous location
    dispatch(setPreviousLocation(location.pathname));
  }, [location.pathname, previousLocation, loadedSheetId, dispatch, showNotification]);
  
  // Show error notifications if needed
  useEffect(() => {
    if (navigationError && showNotification) {
      showNotification(navigationError, 'error');
    }
  }, [navigationError, showNotification]);
  
  return {
    currentSheetId,
    loadedSheetId,
    navSource,
    loadSheetFromUrl,
    handleInternalSheetChange
  };
}
