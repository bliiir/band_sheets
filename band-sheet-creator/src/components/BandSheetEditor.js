import React, { useEffect } from "react";
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import SongInfoBar from './SongInfoBar';
import SheetHeader from './SheetHeader';
import Section from './Section';
import PartsModule from './PartsModule';
import ContextMenu from './ContextMenu';
import EnergyDialog from './EnergyDialog';
import { useEditing } from '../contexts/EditingContext';
import { useSheetData } from '../contexts/SheetDataContext';
import { useUIState } from '../contexts/UIStateContext';


export default function BandSheetEditor() {
  // Use SheetDataContext for all sheet data and operations
  const { 
    sections,
    songData, setSongData,
    partsModule,
    transposeValue, setTransposeValue,
    getNextId,
    // Operations
    addSection,
    deleteSection,
    moveSection,
    duplicateSection,
    addPart,
    deletePart,
    movePart,
    duplicatePart,
    initializePartsModule,
    // Sheet operations
    loadSheet,
    saveCurrentSheet,
    exportSheet,
    getTransposedChordsForPart,
    createNewSheetData
  } = useSheetData();
  
  // Use EditingContext for editing state
  const { 
    isEditing,
    beginEdit,
    saveEdit
  } = useEditing();
  
  // Use UIStateContext for UI-related state
  const {
    // Sidebar state
    sidebarOpen, setSidebarOpen, savedSheets, setSavedSheets,
    openSidebar, closeSidebar,
    // Context menu state
    contextMenu, showContextMenu, hideContextMenu,
    // Hover state
    hoverState, setHoverState,
    // Energy dialog state
    openEnergyDialog
  } = useUIState();
  
  // Fetch saved sheets when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      // This will be moved to Sidebar component
    }
  }, [sidebarOpen]);

  // This function is moved to SheetDataContext

  // This initialization is now handled by SheetDataContext

  // Placeholder text for empty fields
  const placeholders = {
    lyrics: "Add lyrics here...",
    notes: "Add notes here..."
  };
  
  // Debugging if needed can be done through browser devtools

  // These operations are now handled by SheetDataContext


  // Context menu handler - delegates to UIStateContext's showContextMenu
  const handleContextMenu = (e, type, si, pi = null) => {
    // Use the showContextMenu function from UIStateContext
    showContextMenu(e, type, si, pi);
  };
  
  // Get context menu items based on context type
  const getContextMenuItems = () => {
    const { type, si, pi } = contextMenu;
    const menuItems = [];
    
    if (type === 'section') {
      // Only show Move Up if not the first section
      if (si > 0) {
        menuItems.push({
          label: 'Move Up',
          action: () => handleMenuAction('moveUp')
        });
      }
      
      // Only show Move Down if not the last section
      if (si < sections.length - 1) {
        menuItems.push({
          label: 'Move Down',
          action: () => handleMenuAction('moveDown')
        });
      }
      
      menuItems.push({
        label: 'Set Energy Level',
        action: () => handleMenuAction('setEnergyLevel')
      });
      
      menuItems.push({
        label: 'Duplicate Section',
        action: () => handleMenuAction('duplicate')
      });
      
      menuItems.push({
        label: 'Delete Section',
        action: () => handleMenuAction('delete'),
        danger: true
      });
    } else if (type === 'part') {
      // Only show Move Up if not the first part
      if (pi > 0) {
        menuItems.push({
          label: 'Move Up',
          action: () => handleMenuAction('moveUp')
        });
      }
      
      // Only show Move Down if not the last part
      if (pi < sections[si]?.parts.length - 1) {
        menuItems.push({
          label: 'Move Down',
          action: () => handleMenuAction('moveDown')
        });
      }
      
      menuItems.push({
        label: 'Add Part',
        action: () => handleMenuAction('add')
      });
      
      menuItems.push({
        label: 'Duplicate Part',
        action: () => handleMenuAction('duplicate')
      });
      
      menuItems.push({
        label: 'Delete Part',
        action: () => handleMenuAction('delete'),
        danger: true
      });
    }
    
    return menuItems;
  };

  // Menu actions
  const handleMenuAction = (action) => {
    const { type, si, pi } = contextMenu;
    if (type === "section") {
      if (action === "duplicate") {
        duplicateSection(si);
      } else if (action === "delete") {
        deleteSection(si);
      } else if (action === "moveUp") {
        moveSection(si, 'up');
      } else if (action === "moveDown") {
        moveSection(si, 'down');
      } else if (action === "setEnergyLevel") {
        openEnergyDialog(si);
      }
    } else if (type === "part") {
      if (action === "add") {
        addPart(si);
      } else if (action === "duplicate") {
        duplicatePart(si, pi);
      } else if (action === "delete") {
        deletePart(si, pi);
      } else if (action === "moveUp") {
        movePart(si, pi, 'up');
      } else if (action === "moveDown") {
        movePart(si, pi, 'down');
      }
    }
    hideContextMenu();
  };

  // Note: Energy dialog functions have been moved to the EnergyDialog component

  // New Sheet handler
  const handleNewSheet = () => {
    if (window.confirm('Do you want to save your current sheet before starting a new one?')) {
      handleSave();
    }
    
    // Create a new sheet using the context function
    const newSheet = createNewSheetData();
  };

  // Save handler
  const handleSave = () => {
    const savedSheet = saveCurrentSheet(false);
    alert(`Sheet saved! (id: ${savedSheet.id})`);
  };

  // Save As handler
  const handleSaveAs = () => {
    const savedSheet = saveCurrentSheet(true);
    alert(`Sheet saved as new! (id: ${savedSheet.id})`);
  };

  // Export handler that uses the context function
  const handleExport = () => {
    exportSheet();
  };

  // JSX
  return (
    <div className="flex h-full min-h-screen bg-white relative">
      {/* Toolbar Component */}
      <Toolbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleNewSheet={handleNewSheet}
        handleSave={handleSave}
        handleSaveAs={handleSaveAs}
        handleExport={handleExport}
      />
      
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        savedSheets={savedSheets}
        setSidebarOpen={setSidebarOpen}
        loadSheet={(id) => {
          const success = loadSheet(id);
          if (success) {
            closeSidebar();
          } else {
            alert('Failed to load sheet');
          }
        }}
      />
      {/* Main content area */}
      <div className="flex-1 min-w-0 relative">
        {/* Sidebar open button (mobile only) */}
        {!sidebarOpen && (
          <button
            className="absolute top-4 left-4 z-10 p-2 rounded bg-white shadow hover:bg-gray-100 text-2xl text-gray-600 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <span className="sr-only">Open sidebar</span>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        )}

        {/* Song info bar */}
        <SongInfoBar songData={songData} setSongData={setSongData} />

        {/* Sheet container */}
        <div className="mt-8 ml-4 mr-4 mb-4 bg-white rounded-md shadow border border-gray-200 overflow-x-auto">
          {/* Sheet header row */}
          <SheetHeader />

          {/* Sections */}
          {sections.map((section, si) => (
            <Section
              key={section.id}
              section={section}
              sectionIndex={si}
              hoverState={hoverState}
              setHoverState={setHoverState}
              handleContextMenu={handleContextMenu}
              placeholders={placeholders}
              // No longer passing editing-related props - they'll come from EditingContext
            />
          ))}
          {/* Add new section button at the bottom */}
          <div className="flex flex-col items-center justify-center mt-6 mb-4 cursor-pointer select-none group" onClick={() => addSection()}>
            <div className="text-2xl font-bold text-blue-600 group-hover:text-blue-800 leading-none">+</div>
            <div className="text-xs text-gray-500 group-hover:text-blue-700">Add Section</div>
          </div>

          {/* No action buttons needed here since they are in the toolbar */}
        </div>

        {/* Parts Module - Now extracted as a separate component */}
        <PartsModule />
        {/* Context Menu - now gets state from UIStateContext */}
        <ContextMenu menuItems={getContextMenuItems()} />
        {/* Energy Dialog component - extracted to its own file */}
        <EnergyDialog />
      </div>

    </div>
  );
}
