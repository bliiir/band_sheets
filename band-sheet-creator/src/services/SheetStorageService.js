/**
 * SheetStorageService.js
 * Service for handling sheet storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 * Uses localStorage only for temporary drafts when not authenticated
 */

import { fetchWithAuth, API_URL } from './ApiService';

// Using the API_URL imported from ApiService.js for consistency

// Key for storing temporary draft in localStorage
const TEMPORARY_DRAFT_KEY = 'band_sheets_temporary_draft';

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
  // Ensure the ID is properly formatted
  const formattedId = id.toString();
  console.log(`Getting sheet ${formattedId} from storage`);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      console.log(`Getting sheet ${formattedId} from MongoDB with authentication`);
      const token = localStorage.getItem('token');
      
      // Make the API request with full URL
      const response = await fetch(`${API_URL}/sheets/${formattedId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log the response status
      console.log('API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully loaded sheet ${formattedId} from MongoDB`);
      return data.data;
    } catch (error) {
      console.error(`Error fetching sheet ${formattedId} from MongoDB:`, error);
      // Fall through to try public access
    }
  } else {
    // For unauthenticated users
    // First check if this is a temporary draft
    if (id === 'temporary_draft') {
      return loadTemporaryDraft();
    }
    
    // For other sheets, try to access via API without authentication
    // This will work for public sheets
    try {
      console.log(`Getting public sheet ${formattedId} from MongoDB without authentication`);
      console.log('API URL:', `${API_URL}/sheets/${formattedId}`);
      
      // Add a special query parameter to help debug the issue
      const debugUrl = `${API_URL}/sheets/${formattedId}?debug=true&client=incognito`;
      console.log('Debug URL:', debugUrl);
      
      // Make the API request with full URL but without token
      const response = await fetch(debugUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Log the response status and details
      console.log('API response status for public access:', response.status, response.statusText);
      console.log('API response headers:', [...response.headers.entries()]);
      
      // Clone the response to log its content without consuming it
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      try {
        const data = JSON.parse(responseText);
        console.log('API response data:', data);
        
        // Check for specific error conditions
        if (data.success === false) {
          console.error('API error details:', data.error);
        }
      } catch (e) {
        console.log('API response text (not JSON):', responseText);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Successfully loaded public sheet ${formattedId} from MongoDB`);
      return data.data;
    } catch (error) {
      console.error(`Error fetching public sheet ${id} from API:`, error);
      return null;
    }
  }
};

/**
 * Save a temporary draft for unauthenticated users
 * @param {Object} sheetData - The sheet data to save as draft
 */
export const saveTemporaryDraft = (sheetData) => {
  try {
    // Add timestamp to track when the draft was saved
    const draftWithTimestamp = {
      ...sheetData,
      draftSavedAt: new Date().toISOString()
    };
    localStorage.setItem(TEMPORARY_DRAFT_KEY, JSON.stringify(draftWithTimestamp));
    console.log('Temporary draft saved');
  } catch (error) {
    console.error('Error saving temporary draft:', error);
  }
};

/**
 * Load the temporary draft
 * @returns {Object|null} The draft sheet or null if not found
 */
export const loadTemporaryDraft = () => {
  try {
    const draftData = localStorage.getItem(TEMPORARY_DRAFT_KEY);
    if (draftData) {
      const draft = JSON.parse(draftData);
      console.log('Temporary draft loaded');
      return draft;
    }
    return null;
  } catch (error) {
    console.error('Error loading temporary draft:', error);
    return null;
  }
};

/**
 * Clear the temporary draft
 */
export const clearTemporaryDraft = () => {
  localStorage.removeItem(TEMPORARY_DRAFT_KEY);
  console.log('Temporary draft cleared');
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
    // Debug check for title field
    console.log('Sheet before save:', updatedSheet);
    console.log('Title field value:', updatedSheet.title);
    
    // Ensure section background colors are properly saved
    const sheetWithColors = {
      ...updatedSheet,
      sections: updatedSheet.sections.map(section => ({
        ...section,
        backgroundColor: section.backgroundColor || null
      })),
      // Ensure title is explicitly set
      title: updatedSheet.title || ''
    };
    
    console.log('Sheet after preparation:', sheetWithColors);
    console.log('Title field after preparation:', sheetWithColors.title);

    if (isNewSave || !sheetData.id) {
      // Create new sheet
      console.log('Creating new sheet with data:', JSON.stringify(sheetWithColors, null, 2));
      const data = await fetchWithAuth(`${API_URL}/sheets`, {
        method: 'POST',
        body: JSON.stringify(sheetWithColors)
      });
      console.log('Response from API:', data);
      return data.data;
    } else {
      // Update existing sheet
      console.log('Updating sheet with ID:', sheetWithColors.id);
      console.log('Update data:', JSON.stringify(sheetWithColors, null, 2));
      const data = await fetchWithAuth(`${API_URL}/sheets/${sheetWithColors.id}`, {
        method: 'PUT',
        body: JSON.stringify(sheetWithColors)
      });
      console.log('Response from update API:', data);
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
  console.log(`Attempting to delete sheet with ID: ${id}`);
  
  // Check authentication
  if (!isAuthenticated()) {
    console.error('Authentication required to delete sheets');
    return false;
  }
  
  // Get token for direct use
  const token = localStorage.getItem('token');
  console.log('Auth token exists:', !!token);
  if (token) {
    console.log('Auth token (first 10 chars):', token.substring(0, 10) + '...');
  } else {
    console.error('No auth token found when trying to delete sheet');
    return false;
  }
  
  try {
    // Make a direct fetch call instead of using fetchWithAuth wrapper
    const deleteUrl = `${API_URL}/sheets/${id}`;
    console.log(`Making direct DELETE request to: ${deleteUrl}`);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    console.log('Delete response status:', response.status);
    
    // Log response details
    const responseText = await response.text();
    console.log('Response body:', responseText || '(empty response)');
    
    // Success is based on status code
    if (response.status >= 200 && response.status < 300) {
      console.log(`Successfully deleted sheet ${id}`);
      return true;
    } else {
      console.error(`Server returned error status ${response.status} when deleting sheet ${id}`);
      return false;
    }
  } catch (error) {
    console.error(`Error deleting sheet ${id} from API:`, error);
    console.error('Error details:', error.message);
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
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      console.log('Getting sheets from MongoDB using URL:', `${API_URL}/sheets`);
      
      // Get the token for debugging
      const token = localStorage.getItem('token');
      console.log('Using authentication token:', token ? 'Token exists' : 'No token found');
      
      // Make the API request with full URL
      const response = await fetch(`${API_URL}/sheets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log the response status
      console.log('API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      const sheets = data.data || [];
      
      // Sort if needed
      if (sortByNewest && sheets.length > 0) {
        sheets.sort((a, b) => {
          return new Date(b.dateModified || b.createdAt) - new Date(a.dateModified || a.createdAt);
        });
      }
      
      return sheets;
    } catch (error) {
      console.error('Error fetching sheets from API:', error);
      return []; // Return empty array on error, no fallback
    }
  } else {
    // Not authenticated, return empty array
    console.log('User not authenticated, no sheets available');
    return [];
  }
};

/**
 * Check if a temporary draft exists
 * 
 * @returns {boolean} Whether a temporary draft exists
 */
export const hasTemporaryDraft = () => {
  return !!localStorage.getItem(TEMPORARY_DRAFT_KEY);
};

/**
 * Get the timestamp of when the temporary draft was last saved
 * 
 * @returns {Date|null} The date when the draft was saved, or null if no draft exists
 */
export const getTemporaryDraftTimestamp = () => {
  try {
    const draftData = localStorage.getItem(TEMPORARY_DRAFT_KEY);
    if (draftData) {
      const draft = JSON.parse(draftData);
      return draft.draftSavedAt ? new Date(draft.draftSavedAt) : null;
    }
    return null;
  } catch (error) {
    console.error('Error getting temporary draft timestamp:', error);
    return null;
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
