import React from "react";
import {
  FilePlus as FilePlusIcon,
  Import as ImportIcon,
  Printer as PrinterIcon,
  Save as SaveIcon,
  Upload as UploadIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../utils/cn";

/**
 * Editor toolbar that provides actions specific to the sheet editor
 * Styled to match the new design system but preserves functionality
 * from the original toolbar
 */
const EditorToolbar = ({
  sidebarOpen,
  setSidebarOpen,
  editorFunctions,
  isAuthenticated,
  setlistsPanelOpen,
  setSetlistsPanelOpen,
  setImportModalOpen,
  setExportModalOpen
}) => {
  // Extract editor functions - these will be passed from the SheetEditorPage
  const { handleNewSheet, handleSave, handleSaveAs, handleExport } = editorFunctions || {};
  
  // Debug log what functions we have available
  console.log('EditorToolbar: Available functions:', {
    handleNewSheet: typeof handleNewSheet,
    handleSave: typeof handleSave,
    handleSaveAs: typeof handleSaveAs,
    handleExport: typeof handleExport
  });
  return (
    <div className="h-full w-14 bg-card border-r border-border p-2 flex flex-col gap-4">
      {/* Editor actions */}
      <div className="flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewSheet} 
          disabled={typeof handleNewSheet !== 'function'}
          title="New Sheet"
          className="w-10 h-10 rounded-md flex items-center justify-center"
        >
          <FilePlusIcon className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          disabled={!isAuthenticated || typeof handleSave !== 'function'}
          title={isAuthenticated ? "Save" : "Login to Save"}
          className={cn("w-10 h-10 rounded-md flex items-center justify-center", !isAuthenticated && "opacity-50")}
        >
          <SaveIcon className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSaveAs}
          disabled={!isAuthenticated || typeof handleSaveAs !== 'function'}
          title={isAuthenticated ? "Save As" : "Login to Save As"}
          className={cn("w-10 h-10 rounded-md flex items-center justify-center", !isAuthenticated && "opacity-50")}
        >
          <SaveIcon className="h-5 w-5" />
          <span className="absolute h-1 w-1 bg-primary rounded-full bottom-1 right-1"></span>
        </Button>
      </div>

      {/* Export/Import */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExport}
          disabled={typeof handleExport !== 'function'}
          title="Export to PDF"
          className="w-10 h-10 rounded-md flex items-center justify-center"
        >
          <PrinterIcon className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => typeof setImportModalOpen === 'function' && setImportModalOpen(true)}
          disabled={typeof setImportModalOpen !== 'function'}
          title="Import Sheets"
          className="w-10 h-10 rounded-md flex items-center justify-center"
        >
          <ImportIcon className="h-5 w-5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => typeof setExportModalOpen === 'function' && setExportModalOpen(true)}
          disabled={typeof setExportModalOpen !== 'function'}
          title="Export Sheets"
          className="w-10 h-10 rounded-md flex items-center justify-center"
        >
          <UploadIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default EditorToolbar;
