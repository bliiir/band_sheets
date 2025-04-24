/**
 * SheetStorageService.js
 * Service for handling sheet storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 */

import { fetchWithAuth } from './ApiService';

// Get the API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

/**
 * Check if user is authenticated
 * @returns {boolean} Whether the user is authenticated
 */
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Load a sheet by its ID
 * @param {string|number} id - The ID of the sheet to load
 * @returns {Object|null} The loaded sheet or null if not found
 */
export const getSheetById = async (id) => {
  if (!isAuthenticated()) {
    console.error('Authentication required to load sheets');
    return null;
  }
  
  try {
    const data = await fetchWithAuth(`${API_URL}/sheets/${id}`);
    return data.data;
  } catch (error) {
    console.error(`Error fetching sheet ${id} from API:`, error);
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
  if (!isAuthenticated()) {
    console.error('Authentication required to save sheets');
    throw new Error('Authentication required to save sheets');
  }

  // Update modification date
  const updatedSheet = {
    ...sheetData,
    dateModified: new Date()
  };
  
  // Generate ID if needed
  if (isNewSave || !updatedSheet.id) {
    updatedSheet.id = `sheet_${Date.now()}`;
  }
  
  try {
    // Ensure section background colors are properly saved
    const sheetWithColors = {
      ...updatedSheet,
      sections: updatedSheet.sections.map(section => ({
        ...section,
        backgroundColor: section.backgroundColor || null
      }))
    };

    if (isNewSave || !sheetData.id) {
      // Create new sheet
      const data = await fetchWithAuth(`${API_URL}/sheets`, {
        method: 'POST',
        body: JSON.stringify(sheetWithColors)
      });
      return data.data;
    } else {
      // Update existing sheet
      const data = await fetchWithAuth(`${API_URL}/sheets/${sheetWithColors.id}`, {
        method: 'PUT',
        body: JSON.stringify(sheetWithColors)
      });
      return data.data;
    }
  } catch (error) {
    console.error('Error saving sheet to API:', error);
    throw error;
  }
};

/**
 * Delete a sheet by ID
 * @param {string|number} id - ID of the sheet to delete
 * @returns {boolean} Whether the deletion was successful
 */
export const deleteSheet = async (id) => {
  if (!isAuthenticated()) {
    console.error('Authentication required to delete sheets');
    return false;
  }
  
  try {
    await fetchWithAuth(`${API_URL}/sheets/${id}`, {
      method: 'DELETE'
    });
    return true;
  } catch (error) {
    console.error(`Error deleting sheet ${id} from API:`, error);
    return false;
  }
};

/**
 * Get all saved sheets from storage
 * @param {boolean} sortByNewest - Whether to sort sheets by date (descending)
 * @param {boolean} skipUIRefresh - Whether to skip refreshing the UI (for export/import operations)
 * @returns {Array} Array of sheet objects
 */
export const getAllSheets = async (sortByNewest = true, skipUIRefresh = false) => {
  if (!isAuthenticated()) {
    console.error('Authentication required to get all sheets');
    return [];
  }
  
  try {
    const data = await fetchWithAuth(`${API_URL}/sheets`);
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
  if (!isAuthenticated()) {
    console.error('Authentication required to share sheets');
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
