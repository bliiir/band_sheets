/**
 * SheetStorageService.js
 * Service for handling sheet storage, saving, and loading operations
 * Integrated with backend API with localStorage fallback
 */

import { fetchWithAuth } from './ApiService';

// API flag - set to true when a user is logged in
let useApi = false;

/**
 * Set whether to use the API or localStorage
 * Called by AuthContext when login state changes
 * 
 * @param {boolean} value - Whether to use API
 */
export const setUseApi = (value) => {
  useApi = !!value;
};

/**
 * Load a sheet by its ID
 * @param {string|number} id - The ID of the sheet to load
 * @returns {Object|null} The loaded sheet or null if not found
 */
export const getSheetById = async (id) => {
  // Try API first if enabled
  if (useApi) {
    try {
      const data = await fetchWithAuth(`/sheets/${id}`);
      return data.data;
    } catch (error) {
      console.error(`Error fetching sheet ${id} from API:`, error);
      // Fall back to localStorage if API fails
    }
  }
  
  // Use localStorage as fallback
  try {
    const raw = localStorage.getItem(`sheet_${id}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sheet from localStorage:', e);
    return null;
  }
};

/**
 * Save a sheet to storage
 * @param {Object} sheetData - The sheet data to save
 * @param {boolean} isNewSave - Whether to save as a new sheet (with new ID)
 * @returns {Object} The saved sheet with its ID
 */
export const saveSheet = async (sheetData, isNewSave = false) => {
  // Update modification date
  const updatedSheet = {
    ...sheetData,
    dateModified: new Date()
  };
  
  // Generate ID if needed
  if (isNewSave || !updatedSheet.id) {
    updatedSheet.id = `sheet_${Date.now()}`;
  }
  
  // Try API first if enabled
  if (useApi) {
    try {
      if (isNewSave || !sheetData.id) {
        // Create new sheet
        const data = await fetchWithAuth('/sheets', {
          method: 'POST',
          body: JSON.stringify(updatedSheet)
        });
        return data.data;
      } else {
        // Update existing sheet
        const data = await fetchWithAuth(`/sheets/${updatedSheet.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatedSheet)
        });
        return data.data;
      }
    } catch (error) {
      console.error('Error saving sheet to API:', error);
      // Fall back to localStorage if API fails
    }
  }
  
  // Use localStorage as fallback
  try {
    localStorage.setItem(`sheet_${updatedSheet.id}`, JSON.stringify(updatedSheet));
    return updatedSheet;
  } catch (e) {
    console.error('Failed to save sheet to localStorage:', e);
    return updatedSheet; // Return the sheet even if saving failed
  }
};

/**
 * Delete a sheet by ID
 * @param {string|number} id - ID of the sheet to delete
 * @returns {boolean} Whether the deletion was successful
 */
export const deleteSheet = async (id) => {
  // Try API first if enabled
  if (useApi) {
    try {
      await fetchWithAuth(`/sheets/${id}`, {
        method: 'DELETE'
      });
      return true;
    } catch (error) {
      console.error(`Error deleting sheet ${id} from API:`, error);
      // Fall back to localStorage if API fails
    }
  }
  
  // Use localStorage as fallback
  try {
    localStorage.removeItem(`sheet_${id}`);
    return true;
  } catch (e) {
    console.error('Failed to delete sheet from localStorage:', e);
    return false;
  }
};

/**
 * Get all saved sheets from storage
 * @param {boolean} sortByNewest - Whether to sort sheets by date (descending)
 * @returns {Array} Array of sheet objects
 */
export const getAllSheets = async (sortByNewest = true) => {
  // Try API first if enabled
  if (useApi) {
    try {
      const data = await fetchWithAuth('/sheets');
      const sheets = data.data || [];
      
      // Sort if needed
      if (sortByNewest && sheets.length > 0) {
        return sheets.sort((a, b) => {
          return new Date(b.dateModified || b.createdAt) - new Date(a.dateModified || a.createdAt);
        });
      }
      
      return sheets;
    } catch (error) {
      console.error('Error fetching sheets from API:', error);
      // Fall back to localStorage if API fails
    }
  }
  
  // Use localStorage as fallback
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
    console.error('Error fetching all sheets from localStorage:', e);
    return [];
  }
};

/**
 * Share a sheet with another user
 * @param {string} id - ID of the sheet to share
 * @param {string} username - Username to share with
 * @param {string} permission - 'read' or 'edit' permission
 * @returns {Object|null} Updated sheet or null if failed
 */
export const shareSheet = async (id, username, permission = 'read') => {
  if (!useApi) {
    console.error('Sheet sharing requires API connection');
    return null;
  }
  
  try {
    const data = await fetchWithAuth(`/sheets/${id}/share`, {
      method: 'POST',
      body: JSON.stringify({ username, permission })
    });
    return data.data;
  } catch (error) {
    console.error(`Error sharing sheet ${id}:`, error);
    return null;
  }
};

/**
 * Initialize a new default sheet
 * @returns {Object} A new default sheet structure
 */
export const createNewSheet = () => {
  const newId = Date.now();
  
  return {
    id: `sheet_${newId}`,
    title: '',
    artist: '',
    bpm: 120,
    dateCreated: new Date(),
    dateModified: new Date(),
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
    isPublic: false,
    // Return next available ID counter for the component
    nextIdCounter: newId + 3
  };
};
