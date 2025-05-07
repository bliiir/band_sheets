import { createContext, useContext, useState } from 'react';

/**
 * Context for managing sheet-related actions
 * This centralizes sheet actions so they can be triggered from the app header
 */
const SheetActionsContext = createContext();

/**
 * Provider component for the SheetActions context
 */
export const SheetActionsProvider = ({ children }) => {
  const [sheetActions, setSheetActions] = useState({
    handleCreateSheet: () => {
      console.log('Default create sheet handler - this should be overridden by SheetsPage');
    }
  });

  return (
    <SheetActionsContext.Provider value={{ ...sheetActions, setSheetActions }}>
      {children}
    </SheetActionsContext.Provider>
  );
};

/**
 * Hook for accessing sheet actions
 * @returns {Object} Sheet actions and setter function
 */
export const useSheetActions = () => {
  const context = useContext(SheetActionsContext);
  if (context === undefined) {
    throw new Error('useSheetActions must be used within a SheetActionsProvider');
  }
  return context;
};
