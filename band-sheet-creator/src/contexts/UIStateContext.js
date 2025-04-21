import React, { createContext, useContext, useState } from 'react';

// Create the UIStateContext
const UIStateContext = createContext(null);

/**
 * UIStateProvider component for managing all UI-related state
 * This centralizes UI state management to eliminate prop drilling
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function UIStateProvider({ children }) {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedSheets, setSavedSheets] = useState([]);
  
  // API loading states
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null, // 'section' or 'part'
    si: null,
    pi: null,
    isNew: false, // Used for position adjustment
  });
  
  // Hover state tracking
  const [hoverState, setHoverState] = useState({
    type: null, // 'section' or 'part'
    si: null,
    pi: null
  });
  
  // Energy dialog state
  const [energyDialog, setEnergyDialog] = useState({ 
    open: false, 
    sectionIndex: null, 
    currentValue: 5 
  });
  
  // Helper functions
  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  
  const openEnergyDialog = (sectionIndex, currentValue) => {
    setEnergyDialog({
      open: true,
      sectionIndex,
      currentValue
    });
  };
  
  const closeEnergyDialog = () => {
    setEnergyDialog(prev => ({
      ...prev,
      open: false
    }));
  };
  
  const showContextMenu = (event, type, si, pi) => {
    // Prevent default browser context menu
    event.preventDefault();
    
    // Set context menu state
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type,
      si,
      pi,
      isNew: true // Used for position adjustment on first render
    });
    
    // Set isNew to false after a short delay to avoid position adjustment issues
    setTimeout(() => {
      setContextMenu(prev => ({
        ...prev,
        isNew: false
      }));
    }, 50);
  };
  
  const hideContextMenu = () => {
    setContextMenu(prev => ({
      ...prev,
      visible: false
    }));
  };
  
  const setHover = (type, si, pi) => {
    setHoverState({ type, si, pi });
  };
  
  const clearHover = () => {
    setHoverState({ type: null, si: null, pi: null });
  };
  
  // API loading helpers
  const beginApiCall = () => {
    setIsLoading(true);
    setApiError(null);
  };
  
  const endApiCall = (error = null) => {
    setIsLoading(false);
    setApiError(error);
  };

  // Create the context value object
  const value = {
    // Sidebar state
    sidebarOpen,
    setSidebarOpen,
    savedSheets,
    setSavedSheets,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    
    // API loading state
    isLoading,
    apiError,
    beginApiCall,
    endApiCall,
    
    // Context menu state
    contextMenu,
    setContextMenu,
    showContextMenu,
    hideContextMenu,
    
    // Hover state
    hoverState,
    setHoverState,
    setHover,
    clearHover,
    
    // Energy dialog state
    energyDialog,
    setEnergyDialog,
    openEnergyDialog,
    closeEnergyDialog
  };
  
  // Provide the context to children
  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
}

/**
 * Custom hook to access the UI state context
 * @returns {Object} The UI state context value
 */
export function useUIState() {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
}
