import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import SongInfoBar from './SongInfoBar';
import SheetHeader from './SheetHeader';
import Section from './Section';
import PartsModule from './PartsModule';
import ContextMenu from './ContextMenu';
import EnergyDialog from './EnergyDialog';
import ConfirmModal from './ConfirmModal';
import { useEditing } from '../contexts/EditingContext';
import { useSheetData } from '../contexts/SheetDataContext';
import { useUIState } from '../contexts/UIStateContext';
import { getAllSheets } from '../services/SheetStorageService';


export default function BandSheetEditor({ initialSheetId }) {
  // State for save notification
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // State for new sheet confirmation dialog
  const [newSheetConfirm, setNewSheetConfirm] = useState({
    isOpen: false,
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  // Function to show a notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };
  // Navigation hooks for URL management
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use SheetDataContext for all sheet data and operations
  const { 
    sections,
    songData, setSongData,
    createNewSheetData,
    currentSheetId,
    // Operations
    addSection,
    deleteSection,
    moveSection,
    duplicateSection,
    addPart,
    deletePart,
    movePart,
    duplicatePart,
    // Sheet operations
    loadSheet,
    saveCurrentSheet,
    exportSheet
  } = useSheetData();
  
  // Use EditingContext for editing state
  useEditing(); // Keep the context connection without destructuring
  
  // Use UIStateContext for UI-related state
  const {
    // Sidebar state
    sidebarOpen, setSidebarOpen, savedSheets, setSavedSheets, closeSidebar,
    // Context menu state
    contextMenu, showContextMenu, hideContextMenu,
    // Hover state
    hoverState, setHoverState,
    // Energy dialog state
    openEnergyDialog
  } = useUIState();
  
  // State to track if we've already loaded the initial sheet
  const [initialSheetLoaded, setInitialSheetLoaded] = useState(false);
  
  // Load initial sheet from URL if provided
  useEffect(() => {
    const loadInitialSheet = async () => {
      // Only load if we have an ID and haven't loaded it yet
      if (initialSheetId && !initialSheetLoaded) {
        try {
          console.log('BandSheetEditor: Loading initial sheet from URL:', initialSheetId);
          await loadSheet(initialSheetId);
          showNotification(`Sheet loaded successfully`);
          // Mark as loaded so we don't reload
          setInitialSheetLoaded(true);
        } catch (error) {
          console.error('BandSheetEditor: Error loading initial sheet:', error);
          showNotification(`Error loading sheet: ${error.message}`, 'error');
          // Still mark as attempted so we don't retry
          setInitialSheetLoaded(true);
        }
      }
    };
    
    loadInitialSheet();
  }, [initialSheetId, loadSheet, initialSheetLoaded]);
  
  // Update URL when sheet ID changes
  useEffect(() => {
    if (currentSheetId && location.pathname !== `/sheet/${currentSheetId}`) {
      navigate(`/sheet/${currentSheetId}`, { replace: true });
    }
  }, [currentSheetId, navigate, location.pathname]);
  
  // Fetch saved sheets when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      const fetchSheets = async () => {
        try {
          console.log('BandSheetEditor: Fetching saved sheets');
          const allSheets = await getAllSheets();
          console.log('BandSheetEditor: Fetched sheets:', allSheets);
          setSavedSheets(allSheets);
        } catch (error) {
          console.error('BandSheetEditor: Error fetching sheets:', error);
        }
      };
      
      fetchSheets();
    }
  }, [sidebarOpen, setSavedSheets]);

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

  // New Sheet handler - opens the confirmation dialog
  const handleNewSheet = () => {
    setNewSheetConfirm({
      isOpen: true,
      onConfirm: async () => {
        try {
          // Save the current sheet
          const savedSheet = await handleSave();
          console.log('BandSheetEditor: Sheet saved before creating new sheet:', savedSheet);
          
          // Create a new sheet using the context function
          createNewSheetData();
          showNotification('Sheet saved and new sheet created');
          
          // Reset URL to root when creating a new sheet
          navigate('/', { replace: true });
        } catch (error) {
          console.error('BandSheetEditor: Error saving sheet before creating new:', error);
          showNotification(`Error saving sheet: ${error.message}`, 'error');
        }
      },
      onCancel: () => {
        // Just create a new sheet without saving
        createNewSheetData();
        showNotification('New sheet created');
        
        // Reset URL to root when creating a new sheet
        navigate('/', { replace: true });
      }
    });
  };

  // Helper function to refresh the saved sheets list
  const refreshSavedSheets = async () => {
    try {
      console.log('BandSheetEditor: Refreshing saved sheets after save');
      const allSheets = await getAllSheets();
      console.log('BandSheetEditor: Fetched updated sheets:', allSheets);
      setSavedSheets(allSheets);
    } catch (error) {
      console.error('BandSheetEditor: Error refreshing sheets:', error);
    }
  };

  // Save handler
  const handleSave = async () => {
    try {
      const savedSheet = await saveCurrentSheet(false);
      showNotification(`Sheet saved! (id: ${savedSheet.id})`);
      // Refresh the saved sheets list
      await refreshSavedSheets();
    } catch (error) {
      showNotification(`Error saving sheet: ${error.message}`, 'error');
    }
  };

  // Save As handler
  const handleSaveAs = async () => {
    try {
      const savedSheet = await saveCurrentSheet(true);
      showNotification(`Sheet saved as new! (id: ${savedSheet.id})`);
      // Refresh the saved sheets list
      await refreshSavedSheets();
    } catch (error) {
      showNotification(`Error saving sheet: ${error.message}`, 'error');
    }
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
        loadSheet={async (id) => {
          try {
            console.log('BandSheetEditor: Loading sheet with ID:', id);
            const success = await loadSheet(id);
            if (success) {
              console.log('BandSheetEditor: Sheet loaded successfully');
              closeSidebar();
              showNotification('Sheet loaded successfully');
            } else {
              console.error('BandSheetEditor: Failed to load sheet');
              showNotification('Failed to load sheet', 'error');
            }
          } catch (error) {
            console.error('BandSheetEditor: Error loading sheet:', error);
            showNotification(`Error loading sheet: ${error.message}`, 'error');
          }
        }}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Song info bar */}
        <SongInfoBar songData={songData} setSongData={setSongData} />

        {/* Sheet container */}
        <div className="mt-8 mx-4 mb-4 bg-white rounded-md shadow border border-gray-200 overflow-x-auto">
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
        </div>

        {/* Parts Module - Now extracted as a separate component */}
        <PartsModule />
      </div>
      
      {/* Floating UI elements */}
      {/* Context Menu */}
      <ContextMenu menuItems={getContextMenuItems()} />
      
      {/* Energy Dialog */}
      <EnergyDialog />
      
      {/* New Sheet Confirmation Dialog */}
      <ConfirmModal
        isOpen={newSheetConfirm.isOpen}
        title="Create New Sheet"
        message="Do you want to save your current sheet before creating a new one?"
        confirmText="Save & Create New"
        cancelText="Don't Save, Create New"
        confirmColor="green"
        onConfirm={() => {
          newSheetConfirm.onConfirm();
          setNewSheetConfirm(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => {
          newSheetConfirm.onCancel();
          setNewSheetConfirm(prev => ({ ...prev, isOpen: false }));
        }}
      />
      
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {notification.message}
        </div>
      )}
      
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
    </div>
  );
}
