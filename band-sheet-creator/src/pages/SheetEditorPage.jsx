import React, { useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import BandSheetEditor from '../components/BandSheetEditor';
import { useEditorActions } from '../contexts/EditorActionsContext';

/**
 * Page component for editing a sheet.
 * This is a wrapper around the existing BandSheetEditor component
 * to integrate it with our new design system.
 * 
 * We're using the original BandSheetEditor with its built-in toolbar for sheet-related actions,
 * while the general navigation has been moved to the top header bar.
 */
const SheetEditorPage = () => {
  const { sheetId } = useParams();
  
  // Reference to the BandSheetEditor component instance
  const editorRef = useRef(null);
  
  // Get the setEditorActions function from our EditorActionsContext
  const { setEditorActions } = useEditorActions();
  
  // Set up editor actions to be used in the app layout
  useEffect(() => {
    if (editorRef.current && setEditorActions) {
      // Create function to expose editor methods once the editor is fully initialized
      const setupEditorActions = () => {
        // Extract the editor action methods once they're available
        if (editorRef.current) {
          const actions = {
            handleNewSheet: () => editorRef.current.handleNewSheet()
            // Import/Export functionality moved to SheetsPage
          };
          
          // Pass the actions up to the AppLayout via context
          setEditorActions(actions);
        }
      };
      
      // Setup initial actions
      setupEditorActions();
      
      // Clean up when component unmounts
      return () => setEditorActions(null);
    }
  }, [setEditorActions]);
  
  return (
    <div className="h-full w-full max-w-full relative overflow-auto">
      {/* Use the BandSheetEditor with its built-in toolbar for sheet-related actions */}
      <BandSheetEditor
        ref={editorRef}
        initialSheetId={sheetId}
        key={`sheet-${sheetId}`}
        // Import/Export functionality moved to SheetsPage
        // Hide the built-in toolbar since we're using the header actions
        useExternalToolbar={true}
        // We'll be using the AppLayout's header for editor actions
        showToolbar={false}
      />
      
      {/* Import/Export functionality moved to SheetsPage */}
    </div>
  );
};

export default SheetEditorPage;
