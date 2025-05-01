import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Navigation source types
export const NAV_SOURCE = {
  URL: 'url',
  INTERNAL: 'internal',
  HISTORY: 'history'
};

// Action types
const ACTIONS = {
  SET_LOADED_SHEET: 'SET_LOADED_SHEET',
  SET_NAV_SOURCE: 'SET_NAV_SOURCE',
  CLEAR_SHEET: 'CLEAR_SHEET',
  SET_PREVIOUS_LOCATION: 'SET_PREVIOUS_LOCATION'
};

// Initial state
const initialState = {
  loadedSheetId: null,
  navSource: null,
  previousLocation: null
};

// Reducer function
function navigationReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_LOADED_SHEET:
      return {
        ...state,
        loadedSheetId: action.payload.sheetId,
        navSource: action.payload.source || state.navSource
      };
    case ACTIONS.SET_NAV_SOURCE:
      return {
        ...state,
        navSource: action.payload
      };
    case ACTIONS.CLEAR_SHEET:
      return {
        ...state,
        loadedSheetId: null,
        navSource: null
      };
    case ACTIONS.SET_PREVIOUS_LOCATION:
      return {
        ...state,
        previousLocation: action.payload
      };
    default:
      return state;
  }
}

// Create context
const NavigationContext = createContext();

/**
 * NavigationProvider component
 * Provides navigation state and actions to its children
 */
export function NavigationProvider({ children }) {
  const [state, dispatch] = useReducer(navigationReducer, initialState);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Action creators
  const setLoadedSheet = useCallback((sheetId, source) => {
    console.log(`NavigationContext: Setting loaded sheet to ${sheetId} (source: ${source})`);
    dispatch({ 
      type: ACTIONS.SET_LOADED_SHEET, 
      payload: { sheetId, source } 
    });
  }, []);
  
  const setNavSource = useCallback((source) => {
    console.log(`NavigationContext: Setting navigation source to ${source}`);
    dispatch({ type: ACTIONS.SET_NAV_SOURCE, payload: source });
  }, []);
  
  const clearSheet = useCallback(() => {
    console.log('NavigationContext: Clearing sheet');
    dispatch({ type: ACTIONS.CLEAR_SHEET });
  }, []);
  
  // Update previous location when location changes
  useEffect(() => {
    if (state.previousLocation !== location.pathname) {
      dispatch({ 
        type: ACTIONS.SET_PREVIOUS_LOCATION, 
        payload: location.pathname 
      });
    }
  }, [location.pathname, state.previousLocation]);
  
  // Navigation actions
  const navigateToSheet = useCallback((sheetId, options = {}) => {
    if (!sheetId) return;
    
    const source = options.source || NAV_SOURCE.INTERNAL;
    console.log(`NavigationContext: Navigating to sheet ${sheetId} (source: ${source})`);
    
    // Update state first
    setNavSource(source);
    
    // Then navigate
    navigate(`/sheet/${sheetId}`, options);
  }, [navigate, setNavSource]);
  
  // Check if URL has changed due to history navigation
  useEffect(() => {
    const match = location.pathname.match(/\/sheet\/([^/]+)/);
    const urlSheetId = match ? match[1] : null;
    
    // If location has changed and it's a sheet URL
    if (state.previousLocation !== null && 
        state.previousLocation !== location.pathname && 
        urlSheetId) {
      console.log(`NavigationContext: Detected history navigation to sheet ${urlSheetId}`);
      
      // Only update if this is a different sheet
      if (urlSheetId !== state.loadedSheetId) {
        setNavSource(NAV_SOURCE.HISTORY);
      }
    }
  }, [location, state.previousLocation, state.loadedSheetId, setNavSource]);
  
  // The value we'll provide to consumers
  const value = {
    ...state,
    setLoadedSheet,
    setNavSource,
    clearSheet,
    navigateToSheet
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// Custom hook to use the navigation context
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
