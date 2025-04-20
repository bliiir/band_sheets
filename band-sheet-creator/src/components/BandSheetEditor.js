import React, { useEffect } from "react";
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import SongInfoBar from './SongInfoBar';
import SheetHeader from './SheetHeader';
import Section from './Section';
import ContextMenu from './ContextMenu';
import EnergyDialog from './EnergyDialog';
import { useEditing } from '../contexts/EditingContext';
import { useSheetData } from '../contexts/SheetDataContext';
import { useUIState } from '../contexts/UIStateContext';
import { getEnergyBackgroundColor } from '../services/StyleService';


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
    getTransposedChordsForPart
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
    hoverState,
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
  
  // Helper function for beginning editing of parts module items
  const beginPartModuleEdit = (index, field, initialValue) => {
    beginEdit(index, null, field, 'partsModule');
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
              getEnergyBackgroundColor={getEnergyBackgroundColor}
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

        {/* Parts Module */}
        <div className="mt-6 mb-6 ml-4 mr-4 bg-white rounded-md shadow border border-gray-200 overflow-x-auto">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold">Chord progressions</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Transpose:</label>
              <div className="flex items-center">
                <button 
                  className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300 text-gray-700 font-bold"
                  onClick={() => setTransposeValue(prev => Math.max(-12, prev - 1))}
                >
                  -
                </button>
                <span className="w-10 text-center">{transposeValue > 0 ? `+${transposeValue}` : transposeValue}</span>
                <button 
                  className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300 text-gray-700 font-bold"
                  onClick={() => setTransposeValue(prev => Math.min(12, prev + 1))}
                >
                  +
                </button>
              </div>
              <button 
                className="ml-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                onClick={contextInitializePartsModule}
              >
                Refresh Parts
              </button>
            </div>
          </div>
          
          {/* Parts table header */}
          <div className="flex border-b border-gray-300 font-bold bg-white text-sm text-gray-800">
            <div className="w-[80px] min-w-[80px] px-4 py-2 flex items-center">Part</div>
            <div className="w-[80px] min-w-[80px] px-2 py-2 flex items-center">Bars</div>
            <div className="flex-1 px-2 py-2 flex items-center">Original Chords</div>
            <div className="flex-1 px-2 py-2 flex items-center">Transposed Chords</div>
            <div className="w-[40px] min-w-[40px] px-2 py-2 flex justify-center items-center"></div>
          </div>
          
          {/* Parts list */}
          {partsModule?.map((partItem, index) => (
            <div key={partItem.id} className="flex min-h-[40px] border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
              {/* Part */}
              <div className="w-[80px] min-w-[80px] px-4 py-2 flex items-center font-semibold">
                {isEditing(index, null, 'part', 'partsModule') ? (
                  <input
                    className="w-full bg-white rounded px-2 py-1 text-sm border border-gray-300"
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      // Save edit
                      if (editValue) {
                        saveEdit();
                      } else {
                        beginEdit(null); // Cancel edit if empty
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // Save edit
                        if (editValue) {
                          saveEdit();
                        } else {
                          beginEdit(null);
                        }
                      }
                      if (e.key === "Escape") {
                        beginEdit(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => beginPartModuleEdit(index, 'part', partItem.part || '')}
                  >
                    {partItem.part}
                  </div>
                )}
              </div>
              
              {/* Bars */}
              <div className="w-[80px] min-w-[80px] px-2 py-2 flex items-center">
                {isEditing(index, null, 'bars', 'partsModule') ? (
                  <input
                    className="w-full bg-white rounded px-2 py-1 text-sm border border-gray-300"
                    type="number"
                    min="1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      // Save edit - default to 4 bars if value is invalid
                      saveEdit();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // Save edit
                        saveEdit();
                      }
                      if (e.key === "Escape") {
                        beginEdit(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => beginPartModuleEdit(index, 'bars', partItem.bars.toString())}
                  >
                    {partItem.bars}
                  </div>
                )}
              </div>
              
              {/* Chords */}
              <div className="flex-1 px-2 py-2 overflow-y-auto">
                {isEditing(index, null, 'chords', 'partsModule') ? (
                  <textarea
                    className="w-full bg-white rounded px-2 py-1 text-sm min-h-[40px] resize-vertical border border-gray-300"
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                      // Auto-resize the textarea using DOM methods directly
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
                    }}
                    onFocus={(e) => {
                      // Auto-resize on focus too
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
                    }}
                    onBlur={() => {
                      // Save edit
                      saveEdit();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        beginEdit(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer whitespace-pre-wrap max-h-[120px] overflow-y-auto w-full h-full p-1 hover:bg-gray-100"
                    onClick={() => beginPartModuleEdit(index, 'chords', partItem.chords || '')}
                  >
                    {partItem.chords || <span className="text-gray-400 italic">Click to add chords...</span>}
                  </div>
                )}
              </div>
              
              {/* Transposed Chords */}
              <div className="flex-1 px-2 py-2 overflow-y-auto">
                <div className="font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                  {partItem.chords ? 
                    getTransposedChordsForPart(partItem.chords) : 
                    <span className="text-gray-400 italic">Transposed chords will appear here</span>
                  }
                </div>
              </div>
              
              {/* Actions */}
              <div className="w-[40px] min-w-[40px] px-2 py-2 flex justify-center items-center">
                <button 
                  className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 rounded"
                  onClick={() => {
                    // Don't allow manual deletion from parts module anymore
                    // Parts should only be managed through the main sheet
                    alert('Parts are automatically managed based on the sheet structure. Delete the part from the sheet if needed.');
                  }}
                  title="Remove part"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          
          {/* No add part button - parts are added automatically when editing the sheet */}
        </div>
        {/* Context Menu - now gets state from UIStateContext */}
        <ContextMenu menuItems={getContextMenuItems()} />
        {/* Energy Dialog component - extracted to its own file */}
        <EnergyDialog />
      </div>

    </div>
  );
}
