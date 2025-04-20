/**
 * SheetStorageService.js
 * Service for handling sheet storage, saving, and loading operations
 */

/**
 * Load a sheet by its ID
 * @param {string|number} id - The ID of the sheet to load
 * @returns {Object|null} The loaded sheet or null if not found
 */
export const getSheetById = (id) => {
  try {
    const raw = localStorage.getItem(`sheet_${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sheet:', e);
    return null;
  }
};

/**
 * Save a sheet to localStorage
 * @param {Object} sheetData - The sheet data to save
 * @param {boolean} isNewSave - Whether to save as a new sheet (with new ID)
 * @returns {Object} The saved sheet with its ID
 */
export const saveSheet = (sheetData, isNewSave = false) => {
  const id = isNewSave ? Date.now() : (sheetData.id || Date.now());
  const sheetToSave = { ...sheetData, id };
  localStorage.setItem(`sheet_${id}`, JSON.stringify(sheetToSave));
  return { ...sheetToSave, id };
};

/**
 * Delete a sheet by ID
 * @param {string|number} id - ID of the sheet to delete
 * @returns {boolean} Whether the deletion was successful
 */
export const deleteSheet = (id) => {
  try {
    localStorage.removeItem(`sheet_${id}`);
    return true;
  } catch (e) {
    console.error('Failed to delete sheet:', e);
    return false;
  }
};

/**
 * Get all saved sheets from localStorage
 * @param {boolean} sortByNewest - Whether to sort sheets by ID (descending)
 * @returns {Array} Array of sheet objects
 */
export const getAllSheets = (sortByNewest = true) => {
  const sheets = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('sheet_')) {
        try {
          const sheet = JSON.parse(localStorage.getItem(key));
          sheets.push(sheet);
        } catch (e) {
          // Ignore invalid JSON
        }
      }
    }
    
    // Sort by ID if requested (most recent first)
    if (sortByNewest) {
      sheets.sort((a, b) => b.id - a.id);
    }
    
    return sheets;
  } catch (e) {
    console.error('Error fetching all sheets:', e);
    return [];
  }
};

/**
 * Initialize a new default sheet
 * @returns {Object} A new default sheet structure
 */
export const createNewSheet = () => {
  const newId = Date.now();
  
  return {
    id: newId,
    title: '',
    artist: '',
    bpm: '',
    transposeValue: 0,
    sections: [
      {
        id: newId,
        name: 'Verse 1',
        energy: 5,
        parts: [{ id: newId + 1, part: 'A', bars: 4, lyrics: '' }],
      },
    ],
    partsModule: [
      {
        id: newId + 2,
        part: 'A',
        bars: 4,
        chords: '',
      }
    ],
    // Return next available ID counter for the component
    nextIdCounter: newId + 3
  };
};
