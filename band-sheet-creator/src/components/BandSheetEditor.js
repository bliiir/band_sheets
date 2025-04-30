import React, { useEffect, useState, useCallback, useRef } from "react";
import ColorPicker from './ColorPicker';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import SongInfoBar from './SongInfoBar';
import SheetHeader from './SheetHeader';
import Section from './Section';
import PartsModule from './PartsModule';
import ContextMenu from './ContextMenu';
import EnergyDialog from './EnergyDialog';
import ConfirmModal from './ConfirmModal';
import SetlistsPanel from './SetlistsPanel';
import { useEditing } from '../contexts/EditingContext';
import { useSheetData } from '../contexts/SheetDataContext';
import { useUIState } from '../contexts/UIStateContext';
import { useAuth } from '../contexts/AuthContext';
import { getAllSheets, saveTemporaryDraft, loadTemporaryDraft, clearTemporaryDraft, hasTemporaryDraft } from '../services/SheetStorageService';
import { generatePrintContent } from '../services/ExportService';


export default function BandSheetEditor({ initialSheetId }) {
  // State to track if we're on a mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // State for setlists panel
  const [setlistsPanelOpen, setSetlistsPanelOpen] = useState(false);
  
  // Add resize listener to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  const [searchParams] = useSearchParams();
  
  // Check if we're in print mode based on URL parameters
  const isPrintMode = searchParams.get('print') === 'true';
  const includeColors = searchParams.get('color') === 'true';
  const includeChords = searchParams.get('chords') === 'true';
  
  // Use SheetDataContext for all sheet data and operations
  const { 
    sections,
    songData, setSongData,
    createNewSheetData,
    currentSheetId,
    partsModule,
    transposeValue,
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
    updateSectionBackgroundColor,
    getTransposedChordsForPart
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

  // If we're in print mode, render the print-friendly version
  if (isPrintMode) {
    // Print view options
    const options = {
      includeChordProgressions: includeChords,
      includeSectionColors: includeColors
    };
    
    // Generate the print content directly in the component
    return (
      <div className="print-view">
        <style>
          {`
            @media print {
              .print-button {
                display: none;
              }
              .page-break {
                page-break-before: always;
              }
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #333;
              max-width: 900px;
              margin: 0 auto;
              padding: 10px;
            }
            h1 {
              font-size: 20px;
              margin: 0 20px 0 0;
              display: inline-block;
            }
            .meta {
              display: flex;
              align-items: center;
              flex-wrap: wrap;
              gap: 15px;
              margin-bottom: 10px;
              font-size: 14px;
              color: #555;
            }
            .sheet-container {
              border: 1px solid #ddd;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 5px;
            }
            .sheet-header {
              display: none;
            }
            @media (min-width: 768px) {
              .sheet-header {
                display: grid;
                grid-template-columns: 80px 48px 48px 1fr 12.5% auto;
                gap: 10px;
                padding: 5px 16px;
                background-color: #f8f8f8;
                border-bottom: 1px solid #ddd;
                font-weight: bold;
                font-size: 14px;
              }
            }
            .section-container {
              display: flex;
              flex-direction: row;
              border-bottom: 1px solid #ddd;
              position: relative;
            }
            .section-container:last-child {
              border-bottom: none;
            }
            .section-header {
              width: 80px;
              min-width: 80px;
              padding: 8px 8px;
              border-right: 1px solid #ddd;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
            }
            .section-name {
              font-weight: bold;
              font-size: 13px;
            }
            .energy-line {
              position: absolute;
              bottom: 0;
              left: 0;
              height: 2px;
              background-color: black;
            }
            .parts-container {
              flex: 1;
            }
            .part-row {
              display: grid;
              grid-template-columns: 48px 48px 1fr 12.5% auto;
              gap: 10px;
              padding: 5px 16px;
              border-bottom: 1px solid #eee;
              align-items: center;
            }
            .part-row > div {
              width: auto;
              margin-bottom: 0;
            }
            .part-row > div:before {
              content: none;
            }
            .part-row:last-child {
              border-bottom: none;
            }
            .lyrics {
              white-space: pre-line;
              line-height: 1.3;
              font-family: 'Inconsolata', monospace;
            }
            .notes {
              font-size: 11px;
              color: #666;
              line-height: 1.2;
            }
            .print-button {
              padding: 5px 10px;
              background: #0066cc;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin-left: 10px;
            }
          `}
        </style>
        
        <div className="meta">
          <h1>{songData.title || 'Untitled'}</h1>
          {songData.artist && <div><strong>Artist:</strong> {songData.artist}</div>}
          {songData.bpm && <div><strong>BPM:</strong> {songData.bpm}</div>}
          {transposeValue !== 0 && (
            <div>
              <strong>Transposed:</strong> {transposeValue > 0 ? '+' + transposeValue : transposeValue} semitones
            </div>
          )}
          <button 
            className="print-button" 
            onClick={() => window.print()}
          >
            Print PDF
          </button>
        </div>
        
        <div className="sheet-container">
          {/* Sheet header */}
          <div className="sheet-header">
            <div>Section</div>
            <div>Part</div>
            <div>Bars</div>
            <div>Lyrics</div>
            <div>Notes</div>
            <div>{/* Actions placeholder */}</div>
          </div>
          
          {/* Sections */}
          {sections.map((section, sectionIndex) => (
            <div 
              key={section.id} 
              className="section-container"
              style={includeColors && section.backgroundColor ? { backgroundColor: section.backgroundColor } : {}}
            >
              {/* Energy indicator line */}
              <div 
                className="energy-line" 
                style={{ 
                  width: section.energy === 1 ? '80px' : 
                         section.energy === 10 ? '75%' : 
                         `${8 + ((75 - 8) / 9) * (section.energy - 1)}%`
                }}
              />
              
              {/* Section header */}
              <div className="section-header">
                <div className="section-name">{section.name}</div>
              </div>
              
              {/* Parts container */}
              <div className="parts-container">
                {section.parts.map((part, partIndex) => (
                  <div key={part.id} className="part-row">
                    <div data-label="Part:">{part.part}</div>
                    <div data-label="Bars:">{part.bars}</div>
                    <div data-label="Lyrics:" className="lyrics">{part.lyrics || ''}</div>
                    <div data-label="Notes:" className="notes">{part.notes || ''}</div>
                    <div>{/* No actions in print view */}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Chord progressions on page 2 */}
        {includeChords && partsModule && partsModule.length > 0 && (
          <div className="page-break">
            <h2 className="text-xl font-bold mt-8 mb-4">Chord Progressions</h2>
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="grid grid-cols-4 bg-gray-100 font-bold">
                <div className="p-2 border-r border-gray-300">Part</div>
                <div className="p-2 border-r border-gray-300">Bars</div>
                <div className="p-2 border-r border-gray-300">Original Chords</div>
                <div className="p-2">Transposed Chords</div>
              </div>
              
              {partsModule.map(part => (
                <div key={part.id} className="grid grid-cols-4 border-t border-gray-300">
                  <div className="p-2 border-r border-gray-300">
                    {part.part}
                  </div>
                  <div className="p-2 border-r border-gray-300">
                    {part.bars}
                  </div>
                  <div className="p-2 border-r border-gray-300 font-mono">
                    {part.chords || ''}
                  </div>
                  <div className="p-2 font-mono">
                    {transposeValue !== 0 && part.chords 
                      ? getTransposedChordsForPart(part.chords) 
                      : part.chords || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Regular editor view
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
        isMobile={isMobile}
        setlistsPanelOpen={setlistsPanelOpen}
        setSetlistsPanelOpen={setSetlistsPanelOpen}
      />
      
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        savedSheets={savedSheets}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
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
      
      {/* Setlists Panel */}
      {setlistsPanelOpen && (
        <div className="z-20 transition-all duration-200 block fixed left-14 top-[60px] bottom-0">
          <SetlistsPanel
            open={setlistsPanelOpen}
            onClose={() => setSetlistsPanelOpen(false)}
            onSelectSetlist={(setlist) => {
              // Future enhancement: Load the setlist
              console.log('Selected setlist:', setlist);
              setSetlistsPanelOpen(false);
            }}
            isMobile={isMobile}
          />
        </div>
      )}
      
      {/* Mobile overlay backdrop for setlists panel */}
      {setlistsPanelOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-10" 
          onClick={() => setSetlistsPanelOpen(false)} 
        />
      )}
      {/* Main content area */}
      <div className={`flex-1 flex flex-col ${isMobile ? 'mt-10' : 'ml-14'} overflow-hidden`}>
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
      
      {/* Mobile sidebar button removed */}
    </div>
  );
}
