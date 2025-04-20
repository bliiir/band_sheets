import React, { createContext, useContext, useState, useCallback } from 'react';
import { createNewSheet, saveSheet, getSheetById, getAllSheets } from '../services/SheetStorageService';
import { exportToPDF } from '../services/ExportService';
import { getTransposedChords } from '../services/ChordService';

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
  // Sheet data state
  const [sections, setSections] = useState([]);
  const [songData, setSongData] = useState({ title: '', artist: '', bpm: 120 });
  const [partsModule, setPartsModule] = useState([]);
  const [transposeValue, setTransposeValue] = useState(0);
  const [currentSheetId, setCurrentSheetId] = useState(null);
  const [idCounter, setIdCounter] = useState(() => Date.now());
  
  // Helper to get a unique ID
  const getNextId = () => {
    setIdCounter(prev => prev + 1);
    return idCounter + 1;
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
    
    setSections(prev => {
      const newIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const result = [...prev];
      const [removed] = result.splice(sectionIndex, 1);
      result.splice(newIndex, 0, removed);
      return result;
    });
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
  const initializePartsModule = () => {
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
  };
  
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
   * @returns {boolean} - Whether the sheet was loaded successfully
   */
  const loadSheet = useCallback((id) => {
    const sheet = getSheetById(id);
    if (!sheet) {
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
      setSections(sheet.sections);
      setIdCounter(sheet.id ? sheet.id + 2 : Date.now());
    }
    
    // Update current sheet ID
    setCurrentSheetId(id);
    
    // Load parts module if available
    if (sheet.partsModule) {
      setPartsModule(sheet.partsModule);
    } else {
      // No parts module provided, generate one based on section parts
      initializePartsModule();
    }
    
    setTransposeValue(sheet.transposeValue || 0);
    setCurrentSheetId(sheet.id || null);
    
    return true;
  }, []);
  
  /**
   * Save the current sheet
   * @param {boolean} saveAsNew - Whether to save as a new sheet
   * @returns {Object} - The saved sheet data
   */
  const saveCurrentSheet = useCallback((saveAsNew = false) => {
    // Prepare sheet data
    const sheetData = { 
      ...songData, 
      sections, 
      partsModule, 
      transposeValue, 
      id: saveAsNew ? null : currentSheetId
    };
    
    // Use service to save
    const savedSheet = saveSheet(sheetData, saveAsNew);
    setCurrentSheetId(savedSheet.id);
    
    return savedSheet;
  }, [songData, sections, partsModule, transposeValue, currentSheetId]);
  
  /**
   * Export the current sheet to PDF
   */
  const exportSheet = useCallback(() => {
    exportToPDF(songData, sections, transposeValue);
  }, [songData, sections, transposeValue]);
  
  /**
   * Get transposed chords for a chord string
   * @param {string} chords - The chord string to transpose
   * @returns {string} - The transposed chord string
   */
  const getTransposedChordsForPart = useCallback((chords) => {
    return getTransposedChords(chords, transposeValue);
  }, [transposeValue]);
  
  // Energy level operations
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
  
  const duplicateSection = (sectionIndex) => {
    const newId = getNextId();
    setSections((prev) => {
      const sectionToCopy = {
        ...prev[sectionIndex],
        id: newId,
        parts: prev[sectionIndex].parts.map((p) => ({
          ...p,
          id: getNextId(),
        })),
      };
      const arr = prev.slice();
      arr.splice(sectionIndex + 1, 0, sectionToCopy);
      return arr;
    });
  };
  
  const duplicatePart = (sectionIndex, partIndex) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== sectionIndex) return section;
        const partToCopy = { ...section.parts[partIndex], id: getNextId() };
        const arr = section.parts.slice();
        arr.splice(partIndex + 1, 0, partToCopy);
        return { ...section, parts: arr };
      })
    );
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
    
    // Part operations
    addPart,
    deletePart,
    movePart,
    duplicatePart,
    
    // Parts module operations
    initializePartsModule,
    getTransposedChordsForPart,
    
    // Sheet operations
    createNewSheetData,
    loadSheet,
    saveCurrentSheet,
    exportSheet
  };

  return (
    <SheetDataContext.Provider value={value}>
      {children}
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
