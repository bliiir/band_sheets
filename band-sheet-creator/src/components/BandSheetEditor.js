import React, { useEffect, useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import eventBus from "../utils/EventBus";
import { useSelector, useDispatch } from 'react-redux';
import logger from '../services/LoggingService';
import { getAuthToken, handleUnauthenticated, isAuthenticated } from '../utils/AuthUtils';
import ColorPicker from './ColorPicker';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import Toolbar from './Toolbar';
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
import { generatePrintContent } from '../services/ExportService';
import { 
  setNavigationSource,
  setCurrentSheetId,
  setLoadedSheetId,
  resetNavigation,
  selectNavigationSource,
  selectCurrentSheetId,
  selectLoadedSheetId,
  selectNavigationInProgress
} from '../redux/slices/navigationSlice';

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
  const dispatch = useDispatch();
  const location = useLocation();
  
  // For tracking previously loaded sheet to prevent duplicate loads
  const loadedSheetIdRef = useRef(null);
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
  
  // Add event listeners for editor actions - we'll add the PDF handler later after exportSheet is defined
  useEffect(() => {
    // Listen for editor events from the AppLayout
    const newSheetUnsub = eventBus.on('editor:new', () => {
      logger.debug('BandSheetEditor', 'New sheet event received');
      handleNewSheet();
    });
    
    const saveUnsub = eventBus.on('editor:save', () => {
      logger.debug('BandSheetEditor', 'Save event received');
      // Debug the current state of songData directly from context
      logger.debug('BandSheetEditor', 'Title in UI before save (from context):', songData.title);
      logger.debug('BandSheetEditor', 'Full song data at save time:', songData);
      
      // Debug authentication state
      logger.debug('BandSheetEditor', 'Authentication state:', isAuthenticated);
      logger.debug('BandSheetEditor', 'Token exists:', !!getAuthToken());
      
      // Get the title from the DOM as well to compare
      const titleInputValue = document.querySelector('input[aria-label="Song Title"]')?.value;
      logger.debug('BandSheetEditor', 'Title in DOM element:', titleInputValue);
      
      handleSave();
    });
    
    // Import/Export functionality moved to SheetsPage
    // Event handlers for import/export removed
    
    // Clean up event listeners
    return () => {
      newSheetUnsub();
      saveUnsub();
    };
  }, []);
  
  // State for setlists panel - use external state if provided
  const [internalSetlistsPanelOpen, setInternalSetlistsPanelOpen] = useState(false);
  
  // Use external state if provided, otherwise use internal state
  const setlistsPanelOpen = useExternalToolbar ? externalSetlistsPanelOpen : internalSetlistsPanelOpen;
  const setSetlistsPanelOpen = useExternalToolbar ? externalSetSetlistsPanelOpen : setInternalSetlistsPanelOpen;
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
  
  // Access UI state from context
  const { showAuthModal } = useAuth();
  // Use our centralized authentication utilities instead of context-provided variables
  
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
  
  // Get navigation state from Redux
  const reduxLoadedSheetId = useSelector(selectLoadedSheetId);
  const navSource = useSelector(selectNavigationSource);
  const reduxCurrentSheetId = useSelector(selectCurrentSheetId);
  const navigationInProgress = useSelector(selectNavigationInProgress);
  
  // Critical middleware between Redux and SheetDataContext
  // This effect ensures sheets load properly from any navigation source
  useEffect(() => {
    // Skip if navigation is already in progress
    if (navigationInProgress) {
      logger.debug('BandSheetEditor', 'Navigation already in progress, skipping...');
      return;
    }
    
    const loadSheetFromRedux = async () => {
      // Debug current state for troubleshooting
      logger.debug('BandSheetEditor', `Debug - Current state: {
        reduxCurrentSheetId: ${reduxCurrentSheetId},
        loadedSheetIdRef.current: ${loadedSheetIdRef.current},
        navSource: ${navSource}
      }`);
      
      // Only proceed if we have a sheet ID to load
      if (reduxCurrentSheetId) {
        // IMPORTANT: For 'setlist' navigation or when navigating to a different sheet,
        // we need to force a reload regardless of current state
        const forceReload = navSource === 'setlist' || reduxCurrentSheetId !== loadedSheetIdRef.current;
        
        if (forceReload) {
          logger.info('BandSheetEditor', `Loading sheet ${reduxCurrentSheetId} (source: ${navSource}, force: ${forceReload})`);
          
          try {
            // When navigating from setlist, first reset our state reference
            // This ensures we always process the navigation properly
            if (navSource === 'setlist') {
              logger.debug('BandSheetEditor', 'Detected setlist navigation, resetting sheet references');
              loadedSheetIdRef.current = null;
            }
            
            // Use the SheetDataContext to load actual sheet data
            logger.debug('BandSheetEditor', `Calling loadSheet with ID: ${reduxCurrentSheetId}`);
            await loadSheet(reduxCurrentSheetId);
            
            // Update our reference to the freshly loaded sheet ID
            loadedSheetIdRef.current = reduxCurrentSheetId;
            logger.debug('BandSheetEditor', `Updated reference to: ${loadedSheetIdRef.current}`);
            
            // Show success notification to user
            showNotification('Sheet loaded successfully');
            
            // Clear temporary draft (if any) since we loaded a real sheet
            clearTemporaryDraft();
          } catch (error) {
            logger.error('BandSheetEditor', `Error loading sheet ${reduxCurrentSheetId}:`, error);
            showNotification(`Error loading sheet: ${error.message}`, 'error');
          }
        } else {
          logger.debug('BandSheetEditor', `Sheet ${reduxCurrentSheetId} already loaded, skipping reload`);
        }
      }
    };
    
    loadSheetFromRedux();
  }, [reduxCurrentSheetId, navSource, navigationInProgress, loadSheet, showNotification, clearTemporaryDraft]);
  
  // Ref to track previous pathname for history navigation
  const prevPathRef = useRef(location.pathname);
  
  // Load initial sheet from URL parameter
  useEffect(() => {
    const loadInitialSheet = async () => {
      if (initialSheetId && initialSheetId !== loadedSheetIdRef.current) {
        logger.debug('BandSheetEditor', `Initial load from URL param: ${initialSheetId}`);
        
        // Update Redux navigation state
        dispatch(setNavigationSource('url'));
        dispatch(setCurrentSheetId(initialSheetId));
        dispatch(setLoadedSheetId(initialSheetId));
      }
    };
    
    loadInitialSheet();
  }, [initialSheetId, dispatch]);
  
  // Load draft if no sheet ID is provided
  useEffect(() => {
    const loadDraftIfNeeded = async () => {
      if (!initialSheetId && !reduxLoadedSheetId && !draftLoaded) {
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
  }, [initialSheetId, reduxLoadedSheetId, draftLoaded, showNotification, createNewSheetData, setSongData, addSection, addPart, updateSectionBackgroundColor, loadTemporaryDraft, clearTemporaryDraft]);
  
  // Navigation is now handled by the useSheetNavigation hook
  // We've removed the URL update and browser history navigation effects that were here
  
  
  // Sync SheetDataContext state with Redux
  // When the user creates a new sheet or loads a sheet directly in SheetDataContext
  useEffect(() => {
    if (currentSheetId && currentSheetId !== reduxCurrentSheetId && navSource !== 'url') {
      logger.debug('BandSheetEditor', `Syncing SheetDataContext sheet ID to Redux: ${currentSheetId}`);
      
      // Mark this as an internal navigation
      dispatch(setNavigationSource('internal'));
      
      // Update Redux state with the sheet ID from SheetDataContext
      dispatch(setCurrentSheetId(currentSheetId));
      
      // Update browser URL via React Router
      navigate(`/sheet/${currentSheetId}`);
    }
  }, [currentSheetId, reduxCurrentSheetId, navSource, dispatch, navigate]);
  
  // Function to handle internal sheet changes (creating new sheets, etc.)
  const handleInternalSheetChange = useCallback((sheetId) => {
    if (!sheetId) return;
    
    logger.debug('BandSheetEditor', `Internal sheet change to ${sheetId}`);
    
    // Set navigation source
    dispatch(setNavigationSource('internal'));
    
    // Update Redux state
    dispatch(setCurrentSheetId(sheetId));
    
    // Navigate to the sheet
    navigate(`/sheet/${sheetId}`);
  }, [dispatch, navigate]);
  
  // Direct browser history handling with the popstate event
  // This gives us more control than relying on React Router's location changes
  useEffect(() => {
    // This function handles browser back/forward button clicks
    const handlePopState = (event) => {
      logger.debug('BandSheetEditor', 'PopState event fired', event);
      
      // Skip if navigation is already in progress
      if (navigationInProgress) {
        logger.debug('BandSheetEditor', 'Navigation in progress, skipping popstate handler');
        return;
      }
      
      // Get the current URL path after the popstate event
      const currentPath = window.location.pathname;
      logger.debug('BandSheetEditor', `Current path after popstate: ${currentPath}`);
      
      // Extract sheet ID if we're on a sheet page
      const match = currentPath.match(/\/sheet\/([^/]+)/);
      const sheetId = match ? match[1] : null;
      
      // Extract setlist ID if we're on a setlist page
      const setlistMatch = currentPath.match(/\/setlist\/([^/]+)/);
      const setlistId = setlistMatch ? setlistMatch[1] : null;
      
      // State from history (if available)
      const historyState = event.state || {};
      logger.debug('BandSheetEditor', 'History state:', historyState);
      
      // Handle different navigation scenarios
      if (sheetId) {
        // We're navigating to a sheet
        logger.debug('BandSheetEditor', `Popstate navigating to sheet: ${sheetId}`);
        
        if (sheetId !== loadedSheetIdRef.current) {
          // Need to load a different sheet
          dispatch(resetNavigation());
          dispatch(setNavigationSource('history'));
          dispatch(setCurrentSheetId(sheetId));
          dispatch(setLoadedSheetId(sheetId));
          
          // Update our reference
          loadedSheetIdRef.current = sheetId;
        }
      } else if (setlistId) {
        // We're navigating to a setlist - no action needed,
        // the router will handle rendering the setlist component
        logger.debug('BandSheetEditor', `Popstate navigating to setlist: ${setlistId}`);
      }
    };
    
    // Add the popstate event listener
    window.addEventListener('popstate', handlePopState);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigationInProgress, dispatch]);
  
  // Update previous location tracking whenever location changes
  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);
  
  // Helper function to refresh the saved sheets list
  const refreshSavedSheets = useCallback(async () => {
    try {
      logger.debug('BandSheetEditor', 'Refreshing saved sheets list...');
      const allSheets = await getAllSheets();
      setSavedSheets(allSheets);
    } catch (error) {
      logger.error('BandSheetEditor', 'Error refreshing sheets:', error);
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
    if (isAuthenticated()) {
      refreshSavedSheets();
    }
  }, [refreshSavedSheets]);
  
  // Add keyboard shortcut for saving (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check for Cmd+S (Mac) or Ctrl+S (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's save dialog

        if (isAuthenticated()) {
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
  }, [saveCurrentSheet, showNotification]);

  // Auto-save draft for unauthenticated users
  useEffect(() => {
    // Only use draft functionality when not authenticated and there's content
    if (!isAuthenticated() && sections.length > 0) {
      const draftTimer = setTimeout(() => {
        const currentSheet = {
          songData,
          sections
        };
        saveTemporaryDraft(currentSheet);
        logger.debug('BandSheetEditor', 'Temporary draft auto-saved');
      }, 30000); // Auto-save draft every 30 seconds
      
      return () => clearTimeout(draftTimer);
    }
  }, [sections, songData]);

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

  // New Sheet handler - opens the confirmation dialog
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
            
            // Create new sheet
            createNewSheetData();
            
            // Don't navigate away - the sheet data context will handle the URL update
            // through the effect that syncs SheetDataContext with Redux and URL
            showNotification('New sheet created');
          } catch (error) {
            logger.error('BandSheetEditor', 'Error saving before new sheet:', error);
            showNotification('Error saving sheet: ' + error.message, 'error');
          } finally {
            setNewSheetConfirm({ isOpen: false, onConfirm: () => {}, onCancel: () => {} });
          }
        },
        onCancel: () => {
          // Create new sheet without saving
          createNewSheetData();
          
          // Stay in the editor with the new sheet
          // The sheet context will update the URL automatically
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
      // Use centralized AuthUtils for authentication status checks
      const tokenExists = !!getAuthToken();
      const authStatus = isAuthenticated();
      
      logger.debug('BandSheetEditor', 'Save button clicked - Authentication:', { isAuthenticated: authStatus, tokenExists });
      
      // Check authentication using our centralized approach
      if (!authStatus) {
        logger.info('BandSheetEditor', 'No authentication token found or token invalid');
        // Show a clear error message
        showNotification('Please log in to save your sheet', 'error');
        // Use our centralized handleUnauthenticated which will show the auth modal and throw a standardized error
        handleUnauthenticated('Authentication required to save sheet');
      }
      
      // Save the sheet using the API
      const savedSheet = await saveCurrentSheet();
      showNotification(`Sheet saved successfully`);
      
      // Clear temporary draft after successful save
      clearTemporaryDraft();
      
      // Refresh saved sheets list after saving
      await refreshSavedSheets();
      
      return savedSheet;
    } catch (error) {
      logger.error('BandSheetEditor', 'Error saving sheet:', error);
      
      // The AuthUtils.handleUnauthenticated already shows the auth modal for auth errors
      // We only need to handle non-auth errors here
      if (!error.message.includes('Authentication')) {
        showNotification(`Error saving sheet: ${error.message}`, 'error');
      }
    }
  };

  // Handle save as button click
  const handleSaveAs = async () => {
    try {
      // Use centralized AuthUtils for authentication status checks
      const tokenExists = !!getAuthToken();
      const authStatus = isAuthenticated();
      
      logger.debug('BandSheetEditor', 'Save As button clicked - Authentication:', { isAuthenticated: authStatus, tokenExists });
      
      // Check authentication using our centralized approach
      if (!authStatus) {
        logger.info('BandSheetEditor', 'No authentication token found or token invalid');
        // Show a clear error message
        showNotification('Please log in to save your sheet as new', 'error');
        // Use our centralized handleUnauthenticated which will show the auth modal and throw a standardized error
        handleUnauthenticated('Authentication required to save sheet as new');
      }
      
      // Save the sheet as new using the API
      const savedSheet = await saveCurrentSheet(true);
      showNotification(`Sheet saved as new sheet with ID: ${savedSheet.id}`);
      
      // Clear temporary draft after successful save
      clearTemporaryDraft();
      
      // Refresh saved sheets list after saving as new
      await refreshSavedSheets();
      
      return savedSheet;
    } catch (error) {
      logger.error('BandSheetEditor', 'Error saving sheet as new:', error);
      
      // The AuthUtils.handleUnauthenticated already shows the auth modal for auth errors
      // We only need to handle non-auth errors here
      if (!error.message.includes('Authentication')) {
        showNotification(`Error saving sheet as new: ${error.message}`, 'error');
      }
    }
  };

  // Export handler that uses the context function
  const handleExport = () => {
    logger.debug('BandSheetEditor', 'Export handler called');
    exportSheet();
  };
  
  // Register the PDF event handler now that exportSheet is available
  useEffect(() => {
    const pdfUnsub = eventBus.on('editor:pdf', () => {
      logger.debug('BandSheetEditor', 'PDF event received');
      handleExport();
    });
    
    return () => {
      pdfUnsub();
    };
  }, []);
  
  // Make the PDF function globally accessible for direct access
  window.handleSheetExport = handleExport;

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
            <div className="border border-gray-300 rounded overflow-hidden chord-progressions-container" style={{ display: 'grid', gridTemplateColumns: 'min-content min-content 0fr 1fr' }}>
              <div className="bg-gray-100 font-bold row" style={{ display: 'contents' }}>
                <div className="p-2 border-r border-gray-300 whitespace-nowrap bg-gray-100">Part</div>
                <div className="p-2 border-r border-gray-300 text-center whitespace-nowrap bg-gray-100">Bars</div>
                <div className="p-0 w-0 overflow-hidden border-none bg-gray-100">Original Chords</div>
                <div className="p-2 bg-gray-100">Transposed Chords</div>
              </div>
              
              {partsModule.map(part => (
                <div key={part.id} className="row border-t border-gray-300" style={{ display: 'contents' }}>
                  <div className="p-2 border-r border-gray-300 font-semibold whitespace-nowrap">
                    {part.part}
                  </div>
                  <div className="p-2 border-r border-gray-300 text-center whitespace-nowrap">
                    {part.bars || 4}
                  </div>
                  <div className="p-0 w-0 overflow-hidden border-none">
                    {part.chords || ''}
                  </div>
                  <div className="p-2 font-mono whitespace-pre-wrap">
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
    <div className="flex h-full min-h-screen bg-background relative">
      {/* Only show the internal toolbar when not using external toolbar */}
      {!useExternalToolbar && (
        <Toolbar
          sidebarOpen={sidebarOpen || false}
          setSidebarOpen={setSidebarOpen || (() => {})}
          handleNewSheet={handleNewSheet}
          handleSave={handleSave}
          handleSaveAs={handleSaveAs}
          handleExport={handleExport}
          isMobile={isMobile}
          setlistsPanelOpen={setlistsPanelOpen || false}
          setSetlistsPanelOpen={setSetlistsPanelOpen || (() => {})}
        />
      )}
      
      {/* Sidebar and setlists panel have been removed */}
      {/* Main content area - adjust margins based on toolbar visibility */}
      <div className={`flex-1 w-full flex flex-col ${isMobile ? 'mt-10' : useExternalToolbar ? 'ml-0' : 'ml-16'} overflow-y-auto`}>
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
