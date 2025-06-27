import React, { createContext, useState, useContext } from 'react';

// Create a unified context for all app actions
const ActionsContext = createContext();

/**
 * Unified provider component for all application actions
 * Consolidates editor, setlist, and sheet actions into a single context
 */
export const ActionsProvider = ({ children }) => {
  const [editorActions, setEditorActions] = useState(null);
  const [setlistActions, setSetlistActions] = useState(null);
  const [sheetActions, setSheetActions] = useState({
    handleCreateSheet: () => {
      console.log('Default create sheet handler - this should be overridden by SheetsPage');
    }
  });

  const value = {
    // Editor actions
    editorActions,
    setEditorActions,
    
    // Setlist actions  
    setlistActions,
    setSetlistActions,
    
    // Sheet actions
    sheetActions,
    setSheetActions
  };

  return (
    <ActionsContext.Provider value={value}>
      {children}
    </ActionsContext.Provider>
  );
};

// Custom hooks to use specific action types (maintains backward compatibility)
export const useEditorActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useEditorActions must be used within an ActionsProvider');
  }
  return { 
    editorActions: context.editorActions, 
    setEditorActions: context.setEditorActions 
  };
};

export const useSetlistActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useSetlistActions must be used within an ActionsProvider');
  }
  return { 
    setlistActions: context.setlistActions, 
    setSetlistActions: context.setSetlistActions 
  };
};

export const useSheetActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useSheetActions must be used within an ActionsProvider');
  }
  return { 
    sheetActions: context.sheetActions,
    setSheetActions: context.setSheetActions,
    // Destructure individual actions for direct access
    handleCreateSheet: context.sheetActions?.handleCreateSheet
  };
};

// Main context for direct access if needed
export const useActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useActions must be used within an ActionsProvider');
  }
  return context;
};

export default ActionsContext;