import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { useParams } from 'react-router-dom';
import BandSheetEditor from '../components/BandSheetEditor';
import { useAuth } from '../contexts/AuthContext';
import ImportModal from '../components/ImportModal';
import ExportModal from '../components/ExportModal';
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
  const { isAuthenticated } = useAuth();
  
  // Reference to the BandSheetEditor component instance
  const editorRef = useRef(null);
  
  // State for modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Get the setEditorActions function from our EditorActionsContext
  const { setEditorActions } = useEditorActions();
  
  // Set up editor actions to be used in the app layout
  useEffect(() => {
    if (editorRef.current && setEditorActions) {
      // Define handler functions
      const handleImportWrapper = () => setImportModalOpen(true);
      const handleExportWrapper = () => setExportModalOpen(true);
      
      // Create function to expose editor methods once the editor is fully initialized
      const setupEditorActions = () => {
        // Extract the editor action methods once they're available
        if (editorRef.current) {
          const actions = {
            handleNewSheet: () => editorRef.current.handleNewSheet(),
            handleSave: () => editorRef.current.handleSave(),
            handleImport: handleImportWrapper,
            handleExport: handleExportWrapper
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
    <div className="h-full w-full max-w-full relative overflow-hidden">
      {/* Use the BandSheetEditor with its built-in toolbar for sheet-related actions */}
      <BandSheetEditor
        ref={editorRef}
        initialSheetId={sheetId}
        key={`sheet-${sheetId}`}
        isAuthenticated={isAuthenticated}
        setImportModalOpen={setImportModalOpen}
        setExportModalOpen={setExportModalOpen}
        // Hide the built-in toolbar since we're using the header actions
        useExternalToolbar={true}
        // We'll be using the AppLayout's header for editor actions
        showToolbar={false}
      />
      
      {/* Modals */}
      {importModalOpen && <ImportModal onClose={() => setImportModalOpen(false)} />}
      {exportModalOpen && <ExportModal onClose={() => setExportModalOpen(false)} />}
    </div>
  );
};

export default SheetEditorPage;
