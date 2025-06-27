import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import eventBus from "../utils/EventBus";
import { useNavigation } from '../contexts/NavigationContext';
import logger from '../services/LoggingService';
import { getAuthToken, handleUnauthenticated, isAuthenticated } from '../utils/AuthUtils';
import ColorPicker from './ColorPicker';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
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
import { useNotifications } from '../contexts/NotificationContext';
import { getTransposedChords } from '../services/ChordService';
import { useAuth } from '../contexts/AuthContext';
import { getAllSheets, saveTemporaryDraft, loadTemporaryDraft, clearTemporaryDraft, hasTemporaryDraft } from '../services/SheetStorageService';
import { generatePrintContent } from '../services/ExportService';

export default function BandSheetEditor({ 
  initialSheetId,
  // External toolbar integration props
  useExternalToolbar = false,
  externalSidebarOpen,
  externalSetSidebarOpen,
  externalSetlistsPanelOpen,
  externalSetSetlistsPanelOpen
  // Import/Export functionality moved to SheetsPage
}) {
  const location = useLocation();
  
  // For tracking previously loaded sheet to prevent duplicate loads
  const loadedSheetIdRef = useRef(null);
  const notificationShownRef = useRef(null);
  // State to track if we're on a mobile device
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Add resize listener to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Event listeners will be added after function declarations
  
  // State for setlists panel - use external state if provided
  const [internalSetlistsPanelOpen, setInternalSetlistsPanelOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const setlistsPanelOpen = useExternalToolbar ? externalSetlistsPanelOpen : internalSetlistsPanelOpen;
  const setSetlistsPanelOpen = useExternalToolbar ? externalSetSetlistsPanelOpen : setInternalSetlistsPanelOpen;
  // Use centralized notification system instead of local state
  const { showNotification } = useNotifications();
  
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
  
  // Access UI state from context
  const { showAuthModal } = useAuth();
  // Use our centralized authentication utilities instead of context-provided variables
  
  // State to track if we've loaded a draft
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  // We're now using the centralized notification system via useNotifications hook
  
  // Navigation hooks for URL management
  const navigate = useNavigate();
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
    // Context menu state
    contextMenu, handleContextMenu, hideContextMenu,
    // Hover state
    hoverState, setHoverState,
    // Energy dialog state
    openEnergyDialog
  } = useUIState();
  
  // Get navigation state from NavigationContext
  const { loadedSheetId, navSource, setLoadedSheet } = useNavigation();
  
  
  // Removed unused location tracking
  
  
  // Load draft if no sheet ID is provided
  useEffect(() => {
    const loadDraftIfNeeded = async () => {
      if (!initialSheetId && !currentSheetId && !draftLoaded) {
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
            logger.error('BandSheetEditor', 'Error loading draft:', error);
            showNotification('Error loading draft', 'error');
          }
        }
      }
    };
    
    loadDraftIfNeeded();
  }, [initialSheetId, currentSheetId, draftLoaded, showNotification, createNewSheetData, setSongData, addSection, addPart, updateSectionBackgroundColor, loadTemporaryDraft, clearTemporaryDraft]);
  
  // Navigation is now handled through NavigationContext and SheetDataContext
  // Single sheet loading useEffect - this replaces all the problematic Redux middleware
  useEffect(() => {
    const loadSheetIfNeeded = async () => {
      // Determine which sheet ID to load - prioritize initialSheetId (from URL) over NavigationContext
      const sheetIdToLoad = initialSheetId || loadedSheetId;
      
      console.log('%c[NAVIGATION DEBUG]', 'color: green; font-weight: bold', {
        initialSheetId,
        loadedSheetId,
        sheetIdToLoad,
        currentSheetId,
        'loadedSheetIdRef.current': loadedSheetIdRef.current
      });
      
      if (!sheetIdToLoad || sheetIdToLoad === 'new') {
        // No sheet to load or creating new sheet
        if (sheetIdToLoad === 'new') {
          console.log('%c[NEW SHEET]', 'color: purple; font-weight: bold', 'Creating new sheet');
          logger.debug('BandSheetEditor', 'Creating new sheet');
          // Clear any previous loaded sheet reference
          loadedSheetIdRef.current = null;
          notificationShownRef.current = null;
          createNewSheetData();
        }
        return;
      }
      
      // CRITICAL: Enhanced duplicate prevention to avoid cascading loads
      if (loadedSheetIdRef.current === sheetIdToLoad) {
        logger.debug('BandSheetEditor', `Sheet ${sheetIdToLoad} already loaded via ref, skipping`);
        return;
      }
      
      // Additional check: if currentSheetId matches, we're already loaded
      if (currentSheetId === sheetIdToLoad) {
        logger.debug('BandSheetEditor', `Sheet ${sheetIdToLoad} already loaded via context, updating ref`);
        loadedSheetIdRef.current = sheetIdToLoad;
        return;
      }
      
      try {
        logger.debug('BandSheetEditor', `Loading sheet: ${sheetIdToLoad} (source: ${navSource || 'unknown'})`);
        loadedSheetIdRef.current = sheetIdToLoad;
        
        const success = await loadSheet(sheetIdToLoad);
        if (success) {
          // DON'T update NavigationContext here to avoid circular updates
          // setLoadedSheet(sheetIdToLoad, navSource);
          
          // Only show notification once per sheet to prevent duplicates
          if (notificationShownRef.current !== sheetIdToLoad) {
            notificationShownRef.current = sheetIdToLoad;
            showNotification('Sheet loaded successfully');
          }
        } else {
          logger.error('BandSheetEditor', `Failed to load sheet: ${sheetIdToLoad}`);
          showNotification('Failed to load sheet', 'error');
          loadedSheetIdRef.current = null;
        }
      } catch (error) {
        logger.error('BandSheetEditor', 'Error loading sheet:', error);
        
        // Special handling for "Sheet not found" errors that might be temporary
        if (error.message && error.message.includes('Sheet not found')) {
          logger.warn('BandSheetEditor', `Sheet ${sheetIdToLoad} not found - this might be a race condition after save`);
          showNotification('Sheet temporarily unavailable, please try again', 'warning');
        } else {
          showNotification('Error loading sheet: ' + error.message, 'error');
        }
        loadedSheetIdRef.current = null;
      }
    };
    
    loadSheetIfNeeded();
  }, [initialSheetId, loadedSheetId]);
  
  // Removed unused location tracking and saved sheets functionality
  
  // Combined saving functionality: keyboard shortcuts and auto-save drafts
  useEffect(() => {
    // Keyboard shortcut handler for saving (Cmd+S / Ctrl+S)
    const handleKeyDown = (e) => {
      // Check for Cmd+S (Mac) or Ctrl+S (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's save dialog

        if (isAuthenticated()) {
          saveCurrentSheet()
            .then((savedSheet) => {
              // CRITICAL FIX: Update URL if this was a new sheet (URL was /sheet/new OR currentSheetId is null)
              if ((initialSheetId === 'new' || !currentSheetId) && savedSheet && savedSheet.id) {
                logger.debug('BandSheetEditor', `Navigating from new sheet to /sheet/${savedSheet.id}`);
                // Update our loaded sheet reference to prevent immediate reload
                loadedSheetIdRef.current = savedSheet.id;
                notificationShownRef.current = savedSheet.id;
                navigate(`/sheet/${savedSheet.id}`, { replace: true });
              }
              
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
    
    // Auto-save draft for unauthenticated users
    let draftTimer;
    if (!isAuthenticated() && sections.length > 0) {
      draftTimer = setTimeout(() => {
        const currentSheet = {
          songData,
          sections
        };
        saveTemporaryDraft(currentSheet);
        logger.debug('BandSheetEditor', 'Temporary draft auto-saved');
      }, 30000); // Auto-save draft every 30 seconds
    }
    
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (draftTimer) {
        clearTimeout(draftTimer);
      }
    };
  }, [saveCurrentSheet, showNotification, sections, songData]);

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
        action: () => {
          // Call deleteSection directly on click
          try {
            // Get the section index from contextMenu directly at execution time
            const index = Number(contextMenu.si);
            logger.debug('BandSheetEditor', `Deleting section at index: ${index}`);
            
            // Hide the context menu
            hideContextMenu();
            
            // Use the more direct approach, bypass the timeout
            deleteSection(index);
            
            // Show notification
            showNotification('Section deleted successfully');
          } catch (error) {
            logger.error('BandSheetEditor', 'Delete section error:', error);
            showNotification(`Error deleting section: ${error.message}`, 'error');
          }
        },
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
        action: () => {
          // Call deletePart directly on click
          try {
            // Get the indices from contextMenu directly at execution time
            const sectionIndex = Number(contextMenu.si);
            const partIndex = Number(contextMenu.pi);
            logger.debug('BandSheetEditor', `Deleting part at section: ${sectionIndex}, part: ${partIndex}`);
            
            // Hide the context menu
            hideContextMenu();
            
            // Use the more direct approach, bypass the timeout
            deletePart(sectionIndex, partIndex);
            
            // Show notification
            showNotification('Part deleted successfully');
          } catch (error) {
            logger.error('BandSheetEditor', 'Delete part error:', error);
            showNotification(`Error deleting part: ${error.message}`, 'error');
          }
        },
        danger: true
      });
    }
    
    return menuItems;
  };

  // Direct menu action handlers - these are defined outside the main handler to ensure they work correctly
  const handleDeleteSection = (sectionIndex) => {
    // Use the deleteSection function from SheetDataContext
    try {
      deleteSection(sectionIndex);
      showNotification('Section deleted successfully');
    } catch (error) {
      logger.error('BandSheetEditor', 'Error deleting section:', error);
      showNotification(`Failed to delete section: ${error.message}`, 'error');
    }
  };
  
  const handleDeletePart = (sectionIndex, partIndex) => {
    // Use the deletePart function from SheetDataContext
    try {
      deletePart(sectionIndex, partIndex);
      showNotification('Part deleted successfully');
    } catch (error) {
      logger.error('BandSheetEditor', 'Error deleting part:', error);
      showNotification(`Failed to delete part: ${error.message}`, 'error');
    }
  };
  
  // Menu actions - completely rewritten for reliability
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
    
    // Handle each action type directly
    switch (action) {
      case 'setBackgroundColor':
        if (type === 'section') {
          const currentColor = sections[sectionIndex]?.backgroundColor || '#ffffff';
          setColorPicker({
            isOpen: true,
            x: contextMenu.x,
            y: contextMenu.y,
            sectionIndex,
            initialColor: currentColor
          });
        }
        break;
        
      case 'duplicate':
        if (type === 'section') {
          setTimeout(() => duplicateSection(sectionIndex), 50);
        } else if (type === 'part') {
          setTimeout(() => duplicatePart(sectionIndex, partIndex), 50);
        }
        break;
        
      case 'delete':
        if (type === 'section') {
          // Use the direct handler to ensure this works reliably
          setTimeout(() => handleDeleteSection(sectionIndex), 50);
        } else if (type === 'part') {
          setTimeout(() => handleDeletePart(sectionIndex, partIndex), 50);
        }
        break;
        
      case 'moveUp':
        if (type === 'section') {
          setTimeout(() => moveSection(sectionIndex, 'up'), 50);
        } else if (type === 'part') {
          setTimeout(() => movePart(sectionIndex, partIndex, 'up'), 50);
        }
        break;
        
      case 'moveDown':
        if (type === 'section') {
          setTimeout(() => moveSection(sectionIndex, 'down'), 50);
        } else if (type === 'part') {
          setTimeout(() => movePart(sectionIndex, partIndex, 'down'), 50);
        }
        break;
        
      case 'setEnergyLevel':
        if (type === 'section') {
          setTimeout(() => openEnergyDialog(sectionIndex), 50);
        }
        break;
        
      case 'add':
        if (type === 'part') {
          setTimeout(() => addPart(sectionIndex), 50);
        }
        break;
        
      default:
        // Unknown action
        break;
    }
  };

  // Note: Energy dialog functions have been moved to the EnergyDialog component

  // New Sheet handler - navigates to /sheet/new for consistent behavior
  const handleNewSheet = () => {
    // Check if there are unsaved changes
    if (sections.length > 0) {
      setNewSheetConfirm({
        isOpen: true,
        onConfirm: async () => {
          try {
            // Use centralized AuthUtils for authentication check
            if (isAuthenticated()) {
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
            
            // Navigate to new sheet URL for consistent behavior
            navigate('/sheet/new');
            showNotification('New sheet created');
          } catch (error) {
            logger.error('BandSheetEditor', 'Error saving before new sheet:', error);
            showNotification('Error saving sheet: ' + error.message, 'error');
          } finally {
            setNewSheetConfirm({ isOpen: false, onConfirm: () => {}, onCancel: () => {} });
          }
        },
        onCancel: () => {
          // Just close the dialog without saving or creating new sheet
          setNewSheetConfirm({ isOpen: false, onConfirm: () => {}, onCancel: () => {} });
        }
      });
    } else {
      // No existing content, just navigate to new sheet
      navigate('/sheet/new');
      showNotification('New sheet created');
    }
  };



  // Simple implementation of save that matches EXACTLY what the keyboard shortcut does
  const handleSave = async () => {
    console.log('%c[SAVE] Using exact keyboard shortcut implementation', 'color: blue; font-weight: bold');
    
    if (isAuthenticated()) {
      try {
        // Call saveCurrentSheet without any parameters - exactly like the keyboard shortcut
        const savedSheet = await saveCurrentSheet();
        
        // CRITICAL FIX: Update URL if this was a new sheet (URL was /sheet/new OR currentSheetId is null)
        if ((initialSheetId === 'new' || !currentSheetId) && savedSheet && savedSheet.id) {
          logger.debug('BandSheetEditor', `Navigating from new sheet to /sheet/${savedSheet.id}`);
          // Update our loaded sheet reference to prevent immediate reload
          loadedSheetIdRef.current = savedSheet.id;
          notificationShownRef.current = savedSheet.id;
          navigate(`/sheet/${savedSheet.id}`, { replace: true });
        }
        
        showNotification('Sheet saved successfully');
        clearTemporaryDraft();
        return savedSheet;
      } catch (error) {
        console.error('[SAVE] Save failed:', error);
        showNotification('Error saving sheet: ' + error.message, 'error');
        throw error;
      }
    } else {
      console.log('[SAVE] User is not authenticated');
      showNotification('Please log in to save your sheet', 'error');
      return null;
    }
  } // End of handleSave function
  
  // Add event listeners for editor actions now that functions are declared
  useEffect(() => {
    // Listen for editor events from the AppLayout
    const newSheetUnsub = eventBus.on('editor:new', () => {
      logger.debug('BandSheetEditor', 'New sheet event received');
      handleNewSheet();
    });
    
    const saveUnsub = eventBus.on('editor:save', () => {
      handleSave();
    });
    
    const pdfUnsub = eventBus.on('editor:pdf', () => {
      logger.debug('BandSheetEditor', 'PDF event received');
      handleExport();
    });
    
    // Clean up event listeners
    return () => {
      newSheetUnsub();
      saveUnsub();
      pdfUnsub();
    };
  }, [handleSave, handleNewSheet]);
  
  // Handle print button click with BPM and capo options
  const handlePrintClick = () => {
    try {
      console.log('[PRINT] Starting print operation');
      const printWindow = window.open('', '_blank');
      
      // Generate content with appropriate options
      const printContent = generatePrintContent({
        songData,
        sections,
        partsModule,
        transposeValue,
        includeBpm: true,
        includeChords: true,
        includeColors: true
      });
      
      // Set up the print window
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        // Slight delay to ensure content is fully loaded
        setTimeout(() => {
          printWindow.print();
        }, 300);
      } else {
        showNotification('Unable to open print window. Please check your popup settings.', 'error');
      }
    } catch (error) {
      console.error('[PRINT] Error generating print view:', error);
      showNotification(`Error printing: ${error.message}`, 'error');
    }
  };

  // Export handler that uses the context function
  const handleExport = () => {
    logger.debug('BandSheetEditor', 'Export handler called');
    exportSheet();
  };
  
  // PDF event handler consolidated into main event listener above
  
  // Make the PDF function globally accessible for direct access
  window.handleSheetExport = handleExport;

  // Set proper viewport for print mode - must be outside conditional for React Hooks rules
  useEffect(() => {
    if (isPrintMode) {
      const originalViewport = document.querySelector('meta[name="viewport"]');
      const printViewport = document.createElement('meta');
      printViewport.name = 'viewport';
      printViewport.content = 'width=device-width, initial-scale=1.0, user-scalable=yes';
      
      if (originalViewport) {
        originalViewport.replaceWith(printViewport);
      } else {
        document.head.appendChild(printViewport);
      }
      
      // Add print-specific styles to body
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.body.style.fontFamily = 'Arial, sans-serif';
      
      return () => {
        // Restore original viewport on cleanup
        if (originalViewport) {
          printViewport.replaceWith(originalViewport);
        }
        // Reset body styles
        document.body.style.margin = '';
        document.body.style.padding = '';
        document.body.style.fontFamily = '';
      };
    }
  }, [isPrintMode]);

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
            /* Print and mobile styles for main sheet and chord progressions */
            .print-view {
              /* Force full width layout for print */
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 20px !important;
            }
            
            /* Apply mobile-friendly styles both on mobile screens AND when printing */
            @media (max-width: 768px), print {
              .print-view {
                /* Set a fixed width for print to ensure consistent scaling */
                width: 210mm !important; /* A4 width minus margins */
                max-width: none !important;
                font-size: 12pt !important;
              }
              
              /* Main sheet styles for mobile and print */
              .print-view .part-row {
                display: block !important;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
                page-break-inside: avoid;
              }
              
              /* Keep Part and Bars on the same row */
              .print-view .part-row > div:nth-child(1),
              .print-view .part-row > div:nth-child(2) {
                display: inline-block !important;
                width: 50%;
                vertical-align: top;
              }
              
              /* Other fields take full width */
              .print-view .part-row > div:nth-child(3),
              .print-view .part-row > div:nth-child(4),
              .print-view .part-row > div:nth-child(5) {
                display: block !important;
                width: 100%;
                padding-top: 5px;
                clear: both;
              }
              
              /* Show field labels except for lyrics */
              .print-view .part-row > div:not([data-label="Lyrics:"]):before {
                content: attr(data-label);
                font-weight: bold;
                display: inline-block;
                width: 60px;
                margin-right: 5px;
              }
              
              /* Chord progressions table mobile styles */
              .chord-progressions-table {
                display: block !important;
              }
              
              /* Hide header in mobile */
              .chord-progressions-table .row.bg-gray-100 {
                display: none !important;
              }
              
              /* Make rows stack vertically */
              .chord-progressions-table .row {
                display: block !important;
                border-bottom: 1px solid #ddd;
                padding: 8px 0;
              }
              
              /* Keep Part and Bars on same row */
              .chord-progressions-table .row > div:nth-child(1),
              .chord-progressions-table .row > div:nth-child(2) {
                display: inline-block !important;
                width: 50%;
                border-right: none;
              }
              
              /* Transposed chords take full width */
              .chord-progressions-table .row > div:nth-child(3) {
                display: block !important;
                width: 100%;
                border-right: none;
                margin-top: 5px;
                font-size: 0.85em;
                line-height: 1.3;
              }
              
              /* Show field labels except for chords */
              .chord-progressions-table .row > div:not([data-label="Chords:"]):before {
                content: attr(data-label);
                font-weight: bold;
                display: inline-block;
                width: 60px;
              }
            }
            
            /* Dedicated print styles for proper paper scaling */
            @media print {
              /* Set page size and margins */
              @page {
                size: A4;
                margin: 15mm;
              }
              
              /* Reset all viewport-dependent sizing for print */
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              .print-view {
                width: 100% !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 11pt !important;
                line-height: 1.2 !important;
              }
              
              .print-button {
                display: none !important;
              }
              
              .page-break {
                page-break-before: always;
              }
              
              /* Ensure text and elements scale properly */
              h1, h2, h3, h4, h5, h6 {
                font-size: 14pt !important;
                page-break-after: avoid;
              }
              
              /* Prevent content from being cut off */
              .section-container, .chord-progressions-table {
                page-break-inside: avoid;
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
            <div className="border border-gray-300 rounded overflow-hidden chord-progressions-table" style={{ display: 'grid', gridTemplateColumns: 'min-content min-content 1fr' }}>
              <div className="bg-gray-100 font-bold row" style={{ display: 'contents' }}>
                <div className="p-2 border-r border-gray-300 whitespace-nowrap bg-gray-100">Part</div>
                <div className="p-2 border-r border-gray-300 text-center whitespace-nowrap bg-gray-100">Bars</div>
                <div className="p-2 bg-gray-100">Transposed Chords</div>
              </div>
              
              {partsModule.map(part => (
                <div key={part.id} className="row border-t border-gray-300" style={{ display: 'contents' }}>
                  <div className="p-2 border-r border-gray-300 font-semibold whitespace-nowrap" data-label="Part:">
                    {part.part}
                  </div>
                  <div className="p-2 border-r border-gray-300 text-center whitespace-nowrap" data-label="Bars:">
                    {part.bars || 4}
                  </div>
                  <div className="p-2 font-mono whitespace-pre-wrap" data-label="Chords:">
                    {part.chords 
                      ? (transposeValue === 0 ? part.chords : getTransposedChordsForPart(part.chords))
                      : ''}
                    {/* Add a debug comment of the current transpose value to help troubleshoot */}
                    {/* Transpose value: {transposeValue} */}
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
    <div className="flex h-full min-h-screen bg-background relative">
      {/* Left toolbar has been completely removed */}
      
      {/* Main content area - no more left margin needed */}
      <div className={`flex-1 w-full flex flex-col ${isMobile ? 'mt-10' : 'ml-0'} overflow-y-auto`}>
        <div className="w-full px-2 max-w-none">
          {/* Song info bar - positioned above the sheet in the visual stack */}
          <div className="mt-4 w-full">
            <SongInfoBar songData={songData} setSongData={setSongData} />
          </div>

          {/* Sheet container - positioned below the SongInfoBar in the visual stack */}
          <div className="mt-4 mb-4 pb-10 bg-white rounded-md shadow border border-gray-200 w-full max-w-none">
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
          
          {/* Parts Module for chord progressions */}
          <div className="mt-4 mb-20 w-full">
            <PartsModule />
          </div>
        </div>
      </div>

      {/* Floating UI elements */}
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
            logger.debug('BandSheetEditor', `Color changed for section: ${colorPicker.sectionIndex} to: ${color}`);
            
            // Force an immediate save to ensure the color is persisted
            setTimeout(() => {
              logger.debug('BandSheetEditor', 'Auto-saving after color change');
              saveCurrentSheet();
            }, 500);
          }}
          onClose={() => {
            logger.debug('BandSheetEditor', 'Color picker closed, saving final color');
            setColorPicker(prev => ({ ...prev, isOpen: false }));
            
            // Also save when closing the color picker
            setTimeout(() => {
              logger.debug('BandSheetEditor', 'Final save after color picker closed');
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
        title="Save Current Sheet"
        message="Save your current sheet before creating a new one?"
        confirmText="Save"
        cancelText="Cancel"
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
      
      {/* Notifications are now rendered via the centralized Notification component */}
      
      {/* Mobile sidebar button removed */}
    </div>
  );
}
