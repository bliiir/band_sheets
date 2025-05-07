import React, { createContext, useState, useContext } from 'react';

// Create a context for setlist actions
const SetlistActionsContext = createContext();

/**
 * Provider component for setlist actions
 * This allows the AppLayout to access setlist functions from deeper components
 */
export const SetlistActionsProvider = ({ children }) => {
  const [setlistActions, setSetlistActions] = useState(null);

  return (
    <SetlistActionsContext.Provider value={{ setlistActions, setSetlistActions }}>
      {children}
    </SetlistActionsContext.Provider>
  );
};

// Custom hook to use the setlist actions context
export const useSetlistActions = () => useContext(SetlistActionsContext);

export default SetlistActionsContext;
