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
  
  // Selection state for sections and parts
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Helper function to check if an item is selected
  const isItemSelected = (type, sectionIndex, partIndex = null) => {
    return selectedItems.some(item => 
      item.type === type && 
      item.sectionIndex === sectionIndex && 
      (partIndex === null || item.partIndex === partIndex)
    );
  };
  
  // Toggle selection of an item
  const toggleItemSelection = (type, sectionIndex, partIndex = null, isMultiSelect = false) => {
    setSelectedItems(prev => {
      // Check if item is already selected
      const isSelected = isItemSelected(type, sectionIndex, partIndex);
      
      if (isSelected) {
        // If already selected, remove it
        return prev.filter(item => 
          !(item.type === type && 
            item.sectionIndex === sectionIndex && 
            (partIndex === null || item.partIndex === partIndex))
        );
      } else {
        // If not selected, add it
        if (isMultiSelect) {
          // Add to existing selection for multi-select
          return [...prev, { type, sectionIndex, partIndex }];
        } else {
          // Replace selection for single select
          return [{ type, sectionIndex, partIndex }];
        }
      }
    });
  };
  
  // Clear all selections
  const clearSelection = () => {
    setSelectedItems([]);
  };
  
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
  

  
  // Function to handle context menu events
  const handleContextMenu = (event, type, si, pi = null) => {
    // Prevent default browser context menu
    event.preventDefault();
    
    // Stop propagation to prevent other handlers from firing
    event.stopPropagation();
    
    // Store the current section/part indices to ensure consistency
    const sectionIndex = Number(si);
    const partIndex = pi !== null ? Number(pi) : null;
    
    // Set context menu state with explicit values
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      type,
      si: sectionIndex,
      pi: partIndex,
      isNew: true // Used for position adjustment on first render
    });
    
    // Set isNew to false after a short delay to avoid position adjustment issues
    setTimeout(() => {
      setContextMenu(prev => ({
        ...prev,
        isNew: false
      }));
    }, 50);
    
    // Also set the hover state to match the context menu
    // This ensures the menu icon stays visible on the correct section
    setHoverState({
      type,
      si: sectionIndex,
      pi: partIndex
    });
    
    // Prevent any other click handlers from firing
    return false;
  };
  
  const hideContextMenu = () => {
    // Completely reset the context menu state instead of just hiding it
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      type: null,
      si: null,
      pi: null,
      isNew: false
    });
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
    openSidebar,
    closeSidebar,
    toggleSidebar,
    savedSheets,
    setSavedSheets,
    
    // API loading states
    isLoading,
    setIsLoading,
    apiError,
    setApiError,
    beginApiCall,
    endApiCall,
    
    // Context menu state
    contextMenu,
    setContextMenu,
    handleContextMenu,
    hideContextMenu,
    
    // Hover state
    hoverState,
    setHoverState,
    
    // Selection state
    selectedItems,
    setSelectedItems,
    isItemSelected,
    toggleItemSelection,
    clearSelection,
    
    // Energy dialog
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
