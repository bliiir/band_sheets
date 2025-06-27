import React, { createContext, useContext, useState, useCallback } from 'react';
import { createNewSheet, saveSheet, getSheetById } from '../services/SheetStorageService';
import { exportToPDF } from '../services/ExportService';
import { getTransposedChords } from '../services/ChordService';
import ExportOptionsModal from '../components/ExportOptionsModal';
import { useUIState } from './UIStateContext';
import { useAuth } from './AuthContext';
import { handleUnauthenticated, isAuthenticated as isAuthenticatedFunc } from '../utils/AuthUtils';
import logger from '../services/LoggingService';

// Create the SheetDataContext
const SheetDataContext = createContext(null);

/**
 * SheetDataProvider component for managing all sheet-related data
 * This centralizes the sheet state management and CRUD operations
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function SheetDataProvider({ children }) {
  // Access UI state for loading indicators
  const { beginApiCall, endApiCall } = useUIState();
  
  // Access authentication state - get the current authenticated status
  const { isAuthenticated: isUserAuthenticated, currentUser } = useAuth();

  // Sheet data state
  const [sections, setSections] = useState([]);
  const [songData, setSongData] = useState({ title: '', artist: '', bpm: 120 });
  const [partsModule, setPartsModule] = useState([]);
  const [transposeValue, setTransposeValue] = useState(0);
  const [currentSheetId, setCurrentSheetId] = useState(null);
  const [idCounter, setIdCounter] = useState(() => Date.now());
  
  // Helper to get a unique ID
  const getNextId = () => {
    // Use a more reliable ID generation method with additional randomness
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const nextId = `${timestamp}_${random}`;
    setIdCounter(timestamp);
    return nextId;
  };
  
  // Section CRUD operations
  const addSection = () => {
    const newSection = {
      id: getNextId(),
      name: 'New Section',
      energy: 5,
      parts: [
        {
          id: getNextId(),
          part: '',
          bars: 4,
          notes: ''
        }
      ]
    };
    
    setSections(prev => [...prev, newSection]);
  };
  
  const deleteSection = (sectionIndex) => {
    setSections(prev => prev.filter((_, i) => i !== sectionIndex));
  };
  
  const moveSection = (sectionIndex, direction) => {
    if (direction !== 'up' && direction !== 'down') return;
    
    // First, get the current sections to determine the new index
    const currentSections = [...sections];
    const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    // Validate the new index
    if (newIndex < 0 || newIndex >= currentSections.length) return;
    
    // Create a deep copy with JSON parse/stringify for complete isolation
    const deepCopy = JSON.parse(JSON.stringify(currentSections));
    
    // Remove the section from its current position
    const [removed] = deepCopy.splice(sectionIndex, 1);
    
    // Insert it at the new position
    deepCopy.splice(newIndex, 0, removed);
    
    // Update the state with the new array
    setSections(deepCopy);
    
    // Force a re-render after a short delay to ensure UI is updated
    setTimeout(() => {
      setSections(prev => JSON.parse(JSON.stringify(prev)));
    }, 50);
  };
  
  // Part CRUD operations
  const addPart = (sectionIndex) => {
    setSections(prev => 
      prev.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        
        return {
          ...section,
          parts: [
            ...section.parts,
            {
              id: getNextId(),
              part: '',
              bars: 4,
              notes: ''
            }
          ]
        };
      })
    );
  };
  
  const deletePart = (sectionIndex, partIndex) => {
    setSections(prev => 
      prev.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        
        return {
          ...section,
          parts: section.parts.filter((_, i) => i !== partIndex)
        };
      })
    );
  };
  
  const movePart = (sectionIndex, partIndex, direction) => {
    if (direction !== 'up' && direction !== 'down') return;
    
    setSections(prev => {
      const newSections = [...prev];
      const section = {...newSections[sectionIndex]};
      const parts = [...section.parts];
      
      const newIndex = direction === 'up' ? partIndex - 1 : partIndex + 1;
      if (newIndex < 0 || newIndex >= parts.length) return prev;
      
      const [removed] = parts.splice(partIndex, 1);
      parts.splice(newIndex, 0, removed);
      
      section.parts = parts;
      newSections[sectionIndex] = section;
      
      return newSections;
    });
  };
  
  // Parts module operations
  const initializePartsModule = useCallback(() => {
    if (!sections || sections.length === 0) return;
    
    // Extract unique part labels from all sections
    const uniqueParts = new Set();
    sections.forEach(section => {
      section.parts.forEach(part => {
        if (part.part) uniqueParts.add(part.part);
      });
    });
    
    // Create parts module entries for each unique part
    const newPartsModule = Array.from(uniqueParts).map(partLabel => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      part: partLabel,
      bars: sections.find(s => s.parts.find(p => p.part === partLabel))?.parts.find(p => p.part === partLabel)?.bars || 4,
      chords: '',
    }));
    
    // Preserve existing chords from current parts module
    const updatedPartsModule = newPartsModule.map(newPart => {
      const existingPart = partsModule.find(p => p.part === newPart.part);
      if (existingPart && existingPart.chords) {
        return { ...newPart, chords: existingPart.chords };
      }
      return newPart;
    });
    
    setPartsModule(updatedPartsModule);
  }, [sections, partsModule, setPartsModule]);
  
  // Sheet operations
  const createNewSheetData = () => {
    const newSheet = createNewSheet();
    
    // Update component state with the new sheet data
    setSongData({ title: newSheet.title, artist: newSheet.artist, bpm: newSheet.bpm });
    setSections(newSheet.sections);
    setPartsModule(newSheet.partsModule);
    setTransposeValue(newSheet.transposeValue);
    setIdCounter(newSheet.nextIdCounter);
    setCurrentSheetId(null);
    return newSheet;
  };
  
  /**
   * Load a sheet by ID
   * @param {string} id - The sheet ID to load
   * @returns {Promise<boolean>} - Whether the sheet was loaded successfully
   */
  const loadSheet = useCallback(async (id) => {
    beginApiCall();
    logger.debug('SheetDataContext', `Loading sheet with ID: ${id}`);
    try {
      // Ensure the ID is properly formatted
      const formattedId = id.toString();
      logger.debug('SheetDataContext', `Using formatted ID: ${formattedId}`);
      
      const sheet = await getSheetById(formattedId);
      logger.debug('SheetDataContext', `Sheet loaded: ${sheet ? 'Success' : 'Not found'}`);
      
      if (!sheet) {
        logger.error('SheetDataContext', `Sheet not found for ID: ${formattedId}`);
        endApiCall(new Error('Sheet not found'));
        return false;
      }
    
    // Set song metadata from sheet
    setSongData({ 
      title: sheet.title || '', 
      artist: sheet.artist || '', 
      bpm: sheet.bpm || '' 
    });
    
    // Set sections or create default if none exist
    if (!sheet.sections || sheet.sections.length === 0) {
      const newId = Date.now();
      setSections([{
        id: newId,
        name: "Verse 1",
        energy: 5,
        parts: [{ id: newId + 1, part: "A", bars: 4, lyrics: "" }],
      }]);
      setIdCounter(newId + 2);
    } else {

      // Ensure backgroundColor is preserved when loading sections
      const sectionsWithColors = sheet.sections.map(section => ({
        ...section,
        backgroundColor: section.backgroundColor || null
      }));

      setSections(sectionsWithColors);
      setIdCounter(sheet.id ? sheet.id + 2 : Date.now());
    }
    
    // Load parts module if available
    if (sheet.partsModule) {
      setPartsModule(sheet.partsModule);
    } else {
      // No parts module provided, generate one based on section parts
      initializePartsModule();
    }
    
    setTransposeValue(sheet.transposeValue || 0);
    // Update current sheet ID (only once at the end)
    // Use the sheet's ID if available, otherwise use the requested ID
    setCurrentSheetId(sheet.id || id);
    
    endApiCall();
    return true;
    } catch (error) {
      logger.error('SheetDataContext', 'Error loading sheet:', error);
      endApiCall(error);
      return false;
    }
  }, [beginApiCall, endApiCall, setPartsModule, setTransposeValue, setCurrentSheetId, initializePartsModule]);
  
  /**
   * Save the current sheet
   * @param {boolean} saveAsNew - Whether to save as a new sheet
   * @param {boolean} forceUpdate - Force update the sheet regardless of changes
   * @param {string} source - Source of the save operation (KEYBOARD_SHORTCUT, TOOLBAR_BUTTON, etc.)
   * @returns {Promise<Object>} - The saved sheet data
   */
  const saveCurrentSheet = useCallback(async (saveAsNew = false, forceUpdate = false, source = 'UNKNOWN') => {
    beginApiCall();
    try {
      // Use the current title from state for validation
      const titleToUse = songData.title;
      
      // Debugging
      logger.debug('SheetDataContext', 'Song data before save:', songData);
      logger.debug('SheetDataContext', `Title value to use: ${titleToUse}`);
      
      // Check authentication before saving using our centralized authentication handler
      // Check authentication directly with isAuthenticatedFunc
      if (!isAuthenticatedFunc()) {
        logger.warn('SheetDataContext', 'Authentication required to save sheets');
        endApiCall();
        // This will show the auth modal and throw a standardized error
        handleUnauthenticated('Authentication required to save sheets');
      }
      
      // Validate required fields
      if (!titleToUse || titleToUse.trim() === '') {
        logger.error('SheetDataContext', 'Title validation failed:', { 
          title: titleToUse,
          isEmpty: !titleToUse, 
          isEmptyAfterTrim: titleToUse ? titleToUse.trim() === '' : true 
        });
        const error = new Error('Title required');
        endApiCall(error);
        throw error;
      }
      
      // CRITICAL DEBUGGING FOR SHEET ID ISSUES
      console.log('%c[SHEET ID DEBUG]', 'color: red; font-weight: bold', {
        currentSheetId,
        saveAsNew,
        'songData.id': songData.id,
        'Will use ID': saveAsNew ? null : currentSheetId,
        'From component stack': saveAsNew ? 'Creating NEW sheet' : 'Updating EXISTING sheet'
      });
      
      // CRITICAL FIX: Auto-detect if this should be a new save
      // If we don't have a valid currentSheetId, this must be a new sheet
      const shouldSaveAsNew = saveAsNew || !currentSheetId || currentSheetId === 'new';
      
      // COMPREHENSIVE FIX: Ensure we have a valid sheet ID if we're updating
      // This ensures proper ID propagation through the entire save flow
      const effectiveId = shouldSaveAsNew ? null : currentSheetId;
      console.log('%c[SHEET ID RESOLUTION]', 'color: purple; font-weight: bold', {
        operation: shouldSaveAsNew ? 'Creating NEW sheet' : 'Updating EXISTING sheet',
        currentSheetId,
        'songData.id': songData.id,
        effectiveId: effectiveId || 'NULL (will create new)',
        shouldSaveAsNew,
        'original saveAsNew': saveAsNew
      });

      // Prepare sheet data with explicitly set title and properly tracked ID
      const sheetData = { 
        ...songData,
        title: titleToUse, // Explicitly use the captured title
        sections, 
        partsModule, 
        transposeValue, 
        id: effectiveId // Use our resolved effective ID
      };
      
      // Double-check that title is present before sending to API
      logger.debug('SheetDataContext', 'Final sheet data for save:', sheetData);
      console.log('%c[SHEET DATA FOR SAVE]', 'color: blue; font-weight: bold', {
        id: sheetData.id,
        title: sheetData.title,
        'sections count': sheetData.sections.length,
        'first section': sheetData.sections[0] || 'NO SECTIONS',
      });
      logger.debug('SheetDataContext', 'Final title value being sent to API:', sheetData.title);
      
      // Use service to save with source information
      const savedSheet = await saveSheet(sheetData, shouldSaveAsNew, source);
      setCurrentSheetId(savedSheet.id);
      
      endApiCall();
      return savedSheet;
    } catch (error) {
      logger.error('SheetDataContext', 'Error saving sheet:', error);
      endApiCall(error);
      throw error;
    }
  }, [songData, sections, partsModule, transposeValue, currentSheetId, beginApiCall, endApiCall, setCurrentSheetId]);
  
  /**
   * Get the direct print URL for the current sheet with query parameters
   * @param {Object} options - Print options
   * @param {boolean} options.includeChordProgressions - Whether to include chord progressions
   * @param {boolean} options.includeSectionColors - Whether to include section background colors
   * @returns {string} The URL to the print view
   */
  const getPrintUrl = useCallback((options = {}) => {
    if (!currentSheetId) return null;
    
    // Read default preferences from localStorage if they exist
    let defaultIncludeChords = true;
    let defaultIncludeColors = true;
    
    // Check if we have saved preferences in localStorage
    const savedChordsPreference = localStorage.getItem('includeChordProgressions');
    const savedColorsPreference = localStorage.getItem('includeSectionColors');
    
    if (savedChordsPreference !== null) {
      defaultIncludeChords = savedChordsPreference === 'true';
    }
    
    if (savedColorsPreference !== null) {
      defaultIncludeColors = savedColorsPreference === 'true';
    }
    
    // Allow options to override defaults
    const { 
      includeChordProgressions = defaultIncludeChords, 
      includeSectionColors = defaultIncludeColors 
    } = options;
    
    // Get the base URL (protocol + host)
    const baseUrl = window.location.origin;
    return `${baseUrl}/sheet/${currentSheetId}?print=true&color=${includeSectionColors}&chords=${includeChordProgressions}`;
  }, [currentSheetId]);
  
  /**
   * Export the current sheet to PDF
   */
  // State for export options modal
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  const exportSheet = useCallback(() => {
    // Open the export options modal instead of using window.confirm
    setExportModalOpen(true);
  }, []);
  
  // Handle the actual export with options
  const handleExportWithOptions = useCallback((options) => {
    // Instead of opening a new window, navigate to the print view URL
    if (currentSheetId) {
      const { includeChordProgressions, includeSectionColors } = options;
      const printUrl = getPrintUrl({ includeChordProgressions, includeSectionColors });
      if (printUrl) {
        window.open(printUrl, '_blank');
      }
    } else {
      // Fall back to the original export method if no sheet ID is available
      exportToPDF(songData, sections, transposeValue, partsModule, options);
    }
  }, [songData, sections, transposeValue, partsModule, currentSheetId, getPrintUrl]);
  
  /**
   * Get transposed chords for a chord string
   * @param {string} chords - The chord string to transpose
   * @returns {string} - The transposed chord string
   */
  const getTransposedChordsForPart = useCallback((chords) => {
    return getTransposedChords(chords, transposeValue);
  }, [transposeValue]);
  
  // Energy level and background color operations
  const updateSectionEnergy = (sectionIndex, energyLevel) => {
    setSections(prev => {
      const newSections = [...prev];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        energy: energyLevel
      };
      return newSections;
    });
  };
  
  // Update section background color
  const updateSectionBackgroundColor = (sectionIndex, backgroundColor) => {
    console.log('Updating section background color:', sectionIndex, backgroundColor);
    
    // Create a proper deep copy to ensure React detects the changes
    setSections(prev => {
      // Create a deep copy of the sections array
      const newSections = JSON.parse(JSON.stringify(prev));
      
      // Update the backgroundColor property
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        backgroundColor
      };
      
      console.log('New sections state with updated color:', newSections);
      return newSections;
    });
    
    // We may need to trigger an additional state update to force a render
    setTimeout(() => {
      setSections(prev => [...prev]);
    }, 100);
  };
  
  const duplicateSection = (sectionIndex) => {
    // Generate a unique ID for the new section
    const newId = getNextId();
    
    // Get the current sections
    const currentSections = [...sections];
    
    // Create a deep copy of all sections using JSON parse/stringify
    const deepCopy = JSON.parse(JSON.stringify(currentSections));
    
    // Create a copy of the section to duplicate with new IDs
    const sectionToCopy = {
      ...deepCopy[sectionIndex],
      id: newId,
      parts: deepCopy[sectionIndex].parts.map(p => ({ ...p, id: getNextId() })),
      // Preserve the background color when duplicating
      backgroundColor: deepCopy[sectionIndex].backgroundColor
    };
    
    // Insert the copied section
    deepCopy.splice(sectionIndex + 1, 0, sectionToCopy);
    
    // Update the state with the new array
    setSections(deepCopy);
    
    // Force a re-render after a longer delay to ensure UI is fully updated
    setTimeout(() => {
      setSections(prev => JSON.parse(JSON.stringify(prev)));
    }, 50);
  };
  
  const duplicatePart = (sectionIndex, partIndex) => {
    // Get the current sections
    const currentSections = [...sections];
    
    // Create a deep copy of all sections using JSON parse/stringify
    const deepCopy = JSON.parse(JSON.stringify(currentSections));
    
    // Get the section and part to duplicate
    const section = deepCopy[sectionIndex];
    const part = section.parts[partIndex];
    
    // Create a new part with a new ID but same content
    const newPart = {
      ...part,
      id: getNextId()
    };
    
    // Insert the duplicated part
    section.parts.splice(partIndex + 1, 0, newPart);
    
    // Update the state with the new array
    setSections(deepCopy);
    
    // Force a re-render after a delay to ensure UI is fully updated
    setTimeout(() => {
      setSections(prev => JSON.parse(JSON.stringify(prev)));
    }, 50);
  };
  
  /**
   * Save energy level for a section
   * @param {number} sectionIndex - Index of the section
   * @param {number} energyLevel - New energy level (1-10)
   */
  const saveEnergyLevel = (sectionIndex, energyLevel) => {
    setSections(prev => {
      // Input validation
      if (sectionIndex < 0 || sectionIndex >= prev.length) return prev;
      if (energyLevel < 1 || energyLevel > 10) return prev;
      
      const newSections = [...prev];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        energy: energyLevel
      };
      
      return newSections;
    });
  };
  
  // Context value
  const value = {
    // Sheet data
    sections, setSections,
    songData, setSongData,
    partsModule, setPartsModule,
    transposeValue, setTransposeValue,
    currentSheetId, setCurrentSheetId,
    idCounter, setIdCounter,
    getNextId,
    
    // Section operations
    addSection,
    deleteSection,
    moveSection,
    duplicateSection,
    updateSectionEnergy,
    saveEnergyLevel,
    updateSectionBackgroundColor,
    
    // Part operations
    addPart,
    deletePart,
    duplicatePart,
    movePart,
    
    // Parts module operations
    initializePartsModule,
    getTransposedChordsForPart,
    
    // Sheet operations
    createNewSheetData,
    loadSheet,
    saveCurrentSheet,
    exportSheet,
    getPrintUrl,
  };

  return (
    <SheetDataContext.Provider value={value}>
      {children}
      
      {/* Export Options Modal */}
      <ExportOptionsModal 
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExportWithOptions}
      />
    </SheetDataContext.Provider>
  );
}

/**
 * Custom hook to use the SheetDataContext
 * @returns {Object} The SheetDataContext value
 * @throws {Error} If used outside of a SheetDataProvider
 */
export function useSheetData() {
  const context = useContext(SheetDataContext);
  if (context === null) {
    throw new Error('useSheetData must be used within a SheetDataProvider');
  }
  return context;
}
