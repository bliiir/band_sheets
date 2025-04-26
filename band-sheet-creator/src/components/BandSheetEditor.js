import React, { useEffect, useState, useCallback } from "react";
import ColorPicker from './ColorPicker';
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
import { useAuth } from '../contexts/AuthContext';
import { getAllSheets, saveTemporaryDraft, loadTemporaryDraft, clearTemporaryDraft, hasTemporaryDraft } from '../services/SheetStorageService';


export default function BandSheetEditor({ initialSheetId }) {
  // State for save notification
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // State for new sheet confirmation dialog
  const [newSheetConfirm, setNewSheetConfirm] = useState({
    isOpen: false,
    onConfirm: () => {},
    onCancel: () => {}
  });
  
  // State for color picker
  const [colorPicker, setColorPicker] = useState({
    isOpen: false,
    x: 0,
    y: 0,
    sectionIndex: null,
    initialColor: '#ffffff'
  });
  
  // Get authentication state
  const { isAuthenticated } = useAuth();
  
  // State to track if we've loaded a draft
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  // Function to show a notification
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);
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
    exportSheet,
    updateSectionEnergy,
    updateSectionBackgroundColor
  } = useSheetData();
  
  // Use EditingContext for editing state
  useEditing(); // Keep the context connection without destructuring
  
  // Use UIStateContext for UI-related state
  const {
    // Sidebar state
    sidebarOpen, setSidebarOpen, savedSheets, setSavedSheets, closeSidebar,
    // Context menu state
    contextMenu, handleContextMenu, hideContextMenu,
    // Hover state
    hoverState, setHoverState,
    // Energy dialog state
    openEnergyDialog
  } = useUIState();
  
  // State to track if we've already loaded the initial sheet
  const [initialSheetLoaded, setInitialSheetLoaded] = useState(false);
  
  // Load initial sheet if ID is provided
  useEffect(() => {
    const loadInitialSheet = async () => {
      // Only load if we have an ID and haven't loaded it yet
      if (initialSheetId && !initialSheetLoaded) {
        try {
          await loadSheet(initialSheetId);
          showNotification(`Sheet loaded successfully`);
          // Mark as loaded so we don't reload
          setInitialSheetLoaded(true);
          // Clear any temporary draft since we loaded a real sheet
          clearTemporaryDraft();
        } catch (error) {
          console.error('BandSheetEditor: Error loading initial sheet:', error);
          showNotification(`Error loading sheet: ${error.message}`, 'error');
          // Still mark as attempted so we don't retry
          setInitialSheetLoaded(true);
        }
      } else if (!initialSheetId && !initialSheetLoaded && !draftLoaded) {
        // Check for temporary draft if no sheet ID was provided
        const draft = loadTemporaryDraft();
        if (draft) {
          try {
            // Load the draft data into the editor
            createNewSheetData();
            setSongData(draft.songData || { title: '', artist: '', bpm: 120 });
            // Only set sections if they exist in the draft
            if (draft.sections && draft.sections.length > 0) {
              // We're using the context's internal state update mechanism
              // by calling createNewSheetData first and then manually updating
              for (let i = 0; i < draft.sections.length; i++) {
                if (i === 0) {
                  // Update the first section that was created by createNewSheetData
                  // This avoids having to manipulate the sections array directly
                  updateSectionBackgroundColor(0, draft.sections[i].backgroundColor || null);
                  // Add parts to match the draft
                  for (let j = 1; j < draft.sections[i].parts.length; j++) {
                    addPart(0);
                  }
                } else {
                  // Add additional sections
                  addSection();
                  updateSectionBackgroundColor(i, draft.sections[i].backgroundColor || null);
                  // Add parts to match the draft
                  for (let j = 1; j < draft.sections[i].parts.length; j++) {
                    addPart(i);
                  }
                }
              }
            }
            showNotification('Unsaved draft loaded', 'info');
            setDraftLoaded(true);
          } catch (error) {
            console.error('Error loading draft:', error);
            showNotification('Error loading draft', 'error');
          }
        }
        setInitialSheetLoaded(true);
      }
    };
    
    loadInitialSheet();
  }, [initialSheetId, loadSheet, initialSheetLoaded, draftLoaded, showNotification, createNewSheetData, setSongData, addSection, addPart, updateSectionBackgroundColor]);
  
  // Update URL when sheet ID changes
  useEffect(() => {
    if (currentSheetId && location.pathname !== `/sheet/${currentSheetId}`) {
      navigate(`/sheet/${currentSheetId}`, { replace: true });
    }
  }, [currentSheetId, navigate, location.pathname]);
  
  // Helper function to refresh the saved sheets list
  const refreshSavedSheets = useCallback(async () => {
    try {
      console.log('Refreshing saved sheets list...');
      const allSheets = await getAllSheets();
      setSavedSheets(allSheets);
    } catch (error) {
      console.error('Error refreshing sheets:', error);
    }
  }, [setSavedSheets]);
  
  // Refresh saved sheets when sidebar is opened
  useEffect(() => {
    if (sidebarOpen) {
      refreshSavedSheets();
    }
  }, [sidebarOpen, refreshSavedSheets]);
  
  // Refresh sheets when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshSavedSheets();
    }
  }, [isAuthenticated, refreshSavedSheets]);
  
  // Add keyboard shortcut for saving (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+S (Mac) or Ctrl+S (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's save dialog

        if (isAuthenticated) {
          saveCurrentSheet()
            .then(() => {
              showNotification('Sheet saved successfully');
              // Clear temporary draft after successful save
              clearTemporaryDraft();
            })
            .catch(error => {
              showNotification('Error saving sheet: ' + error.message, 'error');
            });
        } else {
          showNotification('Please log in to save your sheet', 'error');
        }
      }
    };
    
    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveCurrentSheet, showNotification, isAuthenticated]);

  // Auto-save draft for unauthenticated users
  useEffect(() => {
    // Only use draft functionality when not authenticated and there's content
    if (!isAuthenticated && sections.length > 0) {
      const draftTimer = setTimeout(() => {
        const currentSheet = {
          songData,
          sections
        };
        saveTemporaryDraft(currentSheet);
        console.log('Temporary draft auto-saved');
      }, 30000); // Auto-save draft every 30 seconds
      
      return () => clearTimeout(draftTimer);
    }
  }, [isAuthenticated, sections, songData]);

  // Placeholder text for empty fields
  const placeholders = {
    lyrics: "Add lyrics here...",
    notes: "Add notes here..."
  };
  
  // Debugging if needed can be done through browser devtools

  // These operations are now handled by SheetDataContext


  // We're now using handleContextMenu directly from UIStateContext
  // No need for a local wrapper function
  
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
        label: 'Set Background Color',
        action: () => handleMenuAction('setBackgroundColor')
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
    // Store the values locally to avoid using stale contextMenu state
    // Convert indices to numbers to ensure consistent handling
    const type = contextMenu.type;
    const sectionIndex = Number(contextMenu.si);
    const partIndex = contextMenu.pi !== null ? Number(contextMenu.pi) : null;
    
    // Close the context menu first to prevent stale state issues
    hideContextMenu();
    
    // Clear hover state to prevent menu icon from showing on wrong section
    setHoverState({ type: null, si: null, pi: null });
    
    // Handle set background color action
    if (action === 'setBackgroundColor' && type === 'section') {
      const currentColor = sections[sectionIndex].backgroundColor || '#ffffff';
      setColorPicker({
        isOpen: true,
        x: contextMenu.x,
        y: contextMenu.y,
        sectionIndex,
        initialColor: currentColor
      });
      return;
    }
    
    // Add a longer delay to ensure state is fully updated before performing the action
    // This prevents issues with multiple operations in sequence
    setTimeout(() => {
      // Execute the action with the stored values
      if (type === "section") {
        if (action === "duplicate") {
          duplicateSection(sectionIndex);
        } else if (action === "delete") {
          deleteSection(sectionIndex);
        } else if (action === "moveUp") {
          moveSection(sectionIndex, 'up');
        } else if (action === "moveDown") {
          moveSection(sectionIndex, 'down');
        } else if (action === "setEnergyLevel") {
          openEnergyDialog(sectionIndex);
        }
      } else if (type === "part") {
        if (action === "add") {
          addPart(sectionIndex);
        } else if (action === "duplicate") {
          duplicatePart(sectionIndex, partIndex);
        } else if (action === "delete") {
          deletePart(sectionIndex, partIndex);
        } else if (action === "moveUp") {
          movePart(sectionIndex, partIndex, 'up');
        } else if (action === "moveDown") {
          movePart(sectionIndex, partIndex, 'down');
        }
      }
    }, 50); // Longer delay to ensure state updates completely
  };

  // Note: Energy dialog functions have been moved to the EnergyDialog component

  // New Sheet handler - opens the confirmation dialog
  const handleNewSheet = () => {
    // Check if there are unsaved changes
    if (sections.length > 0) {
      setNewSheetConfirm({
        isOpen: true,
        onConfirm: async () => {
          try {
            if (isAuthenticated) {
              // Save current sheet first if authenticated
              await saveCurrentSheet();
              showNotification('Sheet saved before creating new sheet');
            } else {
              // Save as draft if not authenticated
              const currentSheet = {
                songData,
                sections
              };
              saveTemporaryDraft(currentSheet);
              showNotification('Draft saved before creating new sheet', 'info');
            }
            
            // Create new sheet
            createNewSheetData();
            navigate('/');
            showNotification('New sheet created');
          } catch (error) {
            console.error('Error saving before new sheet:', error);
            showNotification('Error saving sheet: ' + error.message, 'error');
          } finally {
            setNewSheetConfirm({ isOpen: false, onConfirm: () => {}, onCancel: () => {} });
          }
        },
        onCancel: () => {
          // Create new sheet without saving
          createNewSheetData();
          navigate('/');
          showNotification('New sheet created');
          setNewSheetConfirm({ isOpen: false, onConfirm: () => {}, onCancel: () => {} });
        }
      });
    } else {
      // No existing content, just create new sheet
      createNewSheetData();
      navigate('/');
      showNotification('New sheet created');
      refreshSavedSheets(); // Refresh saved sheets list after creating new sheet
    }
  };



  // Handle save button click
  const handleSave = async () => {
    try {
      if (!isAuthenticated) {
        showNotification('Please log in to save your sheet', 'error');
        throw new Error('Authentication required');
      }
      
      const savedSheet = await saveCurrentSheet();
      showNotification(`Sheet saved successfully`);
      
      // Clear temporary draft after successful save
      clearTemporaryDraft();
      
      // Refresh saved sheets list after saving
      await refreshSavedSheets();
      
      return savedSheet;
    } catch (error) {
      console.error('BandSheetEditor: Error saving sheet:', error);
      showNotification(`Error saving sheet: ${error.message}`, 'error');
      throw error;
    }
  };

  // Handle save as button click
  const handleSaveAs = async () => {
    try {
      if (!isAuthenticated) {
        showNotification('Please log in to save your sheet', 'error');
        throw new Error('Authentication required');
      }
      
      const savedSheet = await saveCurrentSheet(true);
      showNotification(`Sheet saved as new sheet with ID: ${savedSheet.id}`);
      
      // Clear temporary draft after successful save
      clearTemporaryDraft();
      
      // Refresh saved sheets list after saving as new
      await refreshSavedSheets();
      
      return savedSheet;
    } catch (error) {
      console.error('BandSheetEditor: Error saving sheet as new:', error);
      showNotification(`Error saving sheet: ${error.message}`, 'error');
      throw error;
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
            loadSheet(id).then(() => {
              closeSidebar();
              showNotification('Sheet loaded successfully');
            }).catch(() => {
              showNotification('Failed to load sheet', 'error');
            });
          } catch (error) {
            console.error('BandSheetEditor: Error loading sheet:', error);
            showNotification(`Error loading sheet: ${error.message}`, 'error');
          }
        }}
      />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-auto ml-14">
        {/* Song info bar - positioned above the sheet in the visual stack */}
        <SongInfoBar songData={songData} setSongData={setSongData} />

        {/* Sheet container - positioned below the SongInfoBar in the visual stack */}
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
      
      {/* Color picker */}
      {colorPicker.isOpen && (
        <ColorPicker
          initialColor={colorPicker.initialColor}
          x={colorPicker.x}
          y={colorPicker.y}
          onChange={(color) => {
            // Update the section background color
            updateSectionBackgroundColor(colorPicker.sectionIndex, color);
            
            // Log the update for debugging

            
            // Force an immediate save to ensure the color is persisted
            setTimeout(() => {

              saveCurrentSheet();
            }, 500);
          }}
          onClose={() => {
            setColorPicker(prev => ({ ...prev, isOpen: false }));
            
            // Also save when closing the color picker
            setTimeout(() => {

              saveCurrentSheet();
            }, 500);
          }}
        />
      )}
      
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
