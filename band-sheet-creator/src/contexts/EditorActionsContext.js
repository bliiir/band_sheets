import React, { createContext, useState, useContext } from 'react';

// Create a context for editor actions
const EditorActionsContext = createContext();

/**
 * Provider component for editor actions
 * This allows the AppLayout to access editor functions from deeper components
 */
export const EditorActionsProvider = ({ children }) => {
  const [editorActions, setEditorActions] = useState(null);

  return (
    <EditorActionsContext.Provider value={{ editorActions, setEditorActions }}>
      {children}
    </EditorActionsContext.Provider>
  );
};

// Custom hook to use the editor actions context
export const useEditorActions = () => useContext(EditorActionsContext);

export default EditorActionsContext;
