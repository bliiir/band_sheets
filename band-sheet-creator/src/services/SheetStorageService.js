/**
 * SheetStorageService.js
 * Service for handling sheet storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 * Uses localStorage only for temporary drafts when not authenticated
 */

import { fetchWithAuth, API_URL } from './ApiService';
import eventBus from '../utils/EventBus';
import logger from './LoggingService';
import { isAuthenticated, getAuthToken, handleUnauthenticated } from '../utils/AuthUtils';

// Using the API_URL imported from ApiService.js for consistency

// Key for storing temporary draft in localStorage
const TEMPORARY_DRAFT_KEY = 'band_sheets_temporary_draft';

/**
 * Load a sheet by its ID
 * @param {string|number} id - The ID of the sheet to load
 * @returns {Object|null} The loaded sheet or null if not found
 */
export const getSheetById = async (id) => {
  // Ensure the ID is properly formatted
  const formattedId = id.toString();
  logger.debug('SheetStorageService', `Getting sheet ${formattedId} from storage`);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      logger.debug('SheetStorageService', `Getting sheet ${formattedId} from MongoDB with authentication`);
      const token = getAuthToken();
      
      // Make the API request with full URL
      const response = await fetch(`${API_URL}/sheets/${formattedId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log the response status
      logger.debug('SheetStorageService', 'API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('%c[LOAD RESPONSE]', 'color: purple; font-weight: bold', data);
      logger.info('SheetStorageService', `Successfully loaded sheet ${formattedId} from MongoDB`);
      
      // Add detailed validation of the retrieved data
      const loadedData = data.data;
      if (!loadedData) {
        logger.error('SheetStorageService', 'API returned success but no data field found in response');
        throw new Error('Invalid server response format - missing data field');
      }
      
      // Log key fields for debugging
      logger.debug('SheetStorageService', 'Loaded sheet ID:', loadedData.id);
      logger.debug('SheetStorageService', 'Loaded sheet title:', loadedData.title);
      if (loadedData.sections) {
        logger.debug('SheetStorageService', 'Loaded sheet has sections:', loadedData.sections.length);
      } else {
        logger.warn('SheetStorageService', 'Loaded sheet has no sections array!');
      }
      
      return loadedData;
    } catch (error) {
      logger.error('SheetStorageService', `Error fetching sheet ${formattedId} from MongoDB:`, error);
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
      logger.debug('SheetStorageService', `Getting public sheet ${formattedId} from MongoDB without authentication`);
      logger.debug('SheetStorageService', 'API URL:', `${API_URL}/sheets/${formattedId}`);
      
      // Use the standard API URL without debug parameters
      const apiUrl = `${API_URL}/sheets/${formattedId}`;
      logger.debug('SheetStorageService', 'API URL:', apiUrl);
      
      // Make the API request with full URL but without token
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Log the response status and details
      logger.debug('SheetStorageService', 'API response status for public access:', response.status, response.statusText);
      logger.debug('SheetStorageService', 'API response headers count:', response.headers.size);
      
      // Don't clone the response or log its full content to reduce overhead
      if (!response.ok) {
        logger.warn('SheetStorageService', `API response not OK: ${response.status} ${response.statusText}`);
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info('SheetStorageService', `Successfully loaded public sheet ${formattedId} from MongoDB`);
      return data.data;
    } catch (error) {
      logger.error('SheetStorageService', `Error fetching public sheet ${id} from API:`, error);
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
    logger.info('SheetStorageService', 'Temporary draft saved');
  } catch (error) {
    logger.error('SheetStorageService', 'Error saving temporary draft:', error);
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
      logger.info('SheetStorageService', 'Temporary draft loaded');
      return draft;
    }
    return null;
  } catch (error) {
    logger.error('SheetStorageService', 'Error loading temporary draft:', error);
    return null;
  }
};

/**
 * Clear the temporary draft
 */
export const clearTemporaryDraft = () => {
  localStorage.removeItem(TEMPORARY_DRAFT_KEY);
  logger.info('SheetStorageService', 'Temporary draft cleared');
};

/**
 * Save a sheet to storage
 * @param {Object} sheetData - The sheet data to save
 * @param {boolean} isNewSave - Whether to save as a new sheet (with new ID)
 * @param {string} explicitSource - Explicitly provided source of the save operation
 * @returns {Object} The saved sheet with its ID
 */
export const saveSheet = async (sheetData, isNewSave = false, explicitSource = null) => {
  // Determine the source of the save operation
  let source = explicitSource || 'UNKNOWN';
  
  // Force source to TOOLBAR_BUTTON if explicitly passed with that value
  if (explicitSource === 'TOOLBAR_BUTTON') {
    source = 'TOOLBAR_BUTTON';
  }
  
  console.log(`%c[SAVE SOURCE: ${source}]`, 'color: red; font-weight: bold');
  console.log('[SAVE STACK]', new Error().stack);
  
  // Get authentication token once at the start
  const token = getAuthToken();
  
  // Enhanced authentication check with detailed logging
  logger.debug('SheetStorageService', `[${source}] Checking authentication for save operation`);
  logger.debug('SheetStorageService', `[${source}] Token exists: ${!!token}`);
  
  // Check if token is valid
  if (!token) {
    logger.debug('SheetStorageService', '[${source}] No authentication token found');
    // This will throw an error and show the auth modal
    handleUnauthenticated('Authentication required to save sheets');
  }
  
  // Log token for debugging (safely)
  if (token) {
    logger.debug('SheetStorageService', `[${source}] Token length: ${token.length}`);
    logger.debug('SheetStorageService', `[${source}] Using token for save operation (first 10 chars): ${token.substring(0, 10)}...`);
  }

  // Update modification date
  const updatedSheet = {
    ...sheetData,
    dateModified: new Date()
  };
  
  // CRITICAL FIX: Handle ID generation with improved logic
  // Only generate a new ID if explicitly saving as new or if there's definitely no ID
  if (isNewSave === true) {
    // For explicit saveAsNew operations, always generate a new ID
    logger.debug('SheetStorageService', `[${source}] Explicitly saving as new sheet`);
    updatedSheet.id = `sheet_${Date.now()}`;
  } else if (!updatedSheet.id) {
    // Only generate ID if truly missing
    logger.debug('SheetStorageService', `[${source}] No ID found, generating new ID`);
    updatedSheet.id = `sheet_${Date.now()}`;
  } else {
    // Otherwise, keep the existing ID
    logger.debug('SheetStorageService', `[${source}] Using existing ID: ${updatedSheet.id}`);
    
    // BUGFIX: Ensure ID format is clean for API call
    // Sometimes IDs might have extra characters or whitespace that cause 404s
    if (typeof updatedSheet.id === 'string') {
      // Trim any whitespace that might cause URL issues
      updatedSheet.id = updatedSheet.id.trim();
    }
  }
  
  try {
    // Always make a fresh copy to avoid mutation issues
    const sheetWithColors = JSON.parse(JSON.stringify({
      ...updatedSheet,
      sections: updatedSheet.sections.map(section => ({
        ...section,
        backgroundColor: section.backgroundColor || null
      })),
      // Ensure title is explicitly set
      title: updatedSheet.title || ''
    }));
    
    // Token has already been validated at the beginning of this function
    // No need to check again

    // Decide whether to create a new sheet or update an existing one
    const shouldCreateNew = isNewSave === true || !sheetWithColors.id;
    
    if (shouldCreateNew) {
      // Create new sheet with explicit token in header
      const fullUrl = `${API_URL}/sheets`;
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Add explicit CORS headers
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(sheetWithColors)
      });
      
      // Check response status
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('SheetStorageService', `API error (${response.status}):`, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Verify data structure
      if (!data || !data.data) {
        throw new Error('Invalid server response format - missing data field');
      }
      
      const responseData = data.data;
      
      return responseData;
    } else {
      // Update existing sheet with explicit token in header
      const fullUrl = `${API_URL}/sheets/${sheetWithColors.id}`;
      
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          // Add explicit CORS headers
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(sheetWithColors)
      });
      
      // Check response status
      if (!response.ok) {
        // If we get a 404 when trying to update, the sheet might not exist on the server
        // Fall back to creating a new sheet instead of failing
        if (response.status === 404) {
          // Create new sheet instead
          const createUrl = `${API_URL}/sheets`;
          const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(sheetWithColors)
          });
          
          if (!createResponse.ok) {
            throw new Error(`Failed to create sheet after 404: ${createResponse.status}`);
          }
          
          return (await createResponse.json()).data;
        } else {
          // For other errors, throw normally
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      if (!data || !data.data) {
        throw new Error('Invalid server response format - missing data field');
      }
      
      const savedData = data.data;
      
      return savedData;
    }
  } catch (error) {
    logger.error('SheetStorageService', 'Error saving sheet to API:', error);
    throw error;
  }
};

/**
 * Delete a sheet by ID
 * @param {string|number} id - ID of the sheet to delete
 * @returns {boolean} Whether the deletion was successful
 */
export const deleteSheet = async (id) => {
  logger.debug('SheetStorageService', `Attempting to delete sheet with ID: ${id}`);
  
  // Check authentication
  if (!isAuthenticated()) {
    logger.error('SheetStorageService', 'Authentication required to delete sheets');
    return false;
  }
  
  // Get token for direct use
  const token = getAuthToken();
  logger.debug('SheetStorageService', 'Auth token exists:', !!token);
  if (token) {
    logger.debug('SheetStorageService', 'Auth token exists');
  } else {
    logger.error('SheetStorageService', 'No auth token found when trying to delete sheet');
    return false;
  }
  
  try {
    // Make a direct fetch call instead of using fetchWithAuth wrapper
    const deleteUrl = `${API_URL}/sheets/${id}`;
    logger.debug('SheetStorageService', `Making direct DELETE request to: ${deleteUrl}`);
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      mode: 'cors',
      credentials: 'include'
    });
    
    logger.debug('SheetStorageService', 'Delete response status:', response.status);
    
    // Log response details
    const responseText = await response.text();
    logger.debug('SheetStorageService', 'Response body:', responseText || '(empty response)');
    
    // Success is based on status code
    if (response.status >= 200 && response.status < 300) {
      logger.info('SheetStorageService', `Successfully deleted sheet ${id}`);
      return true;
    } else {
      logger.error('SheetStorageService', `Server returned error status ${response.status} when deleting sheet ${id}`);
      return false;
    }
  } catch (error) {
    logger.error('SheetStorageService', `Error deleting sheet ${id} from API:`, error);
    logger.error('SheetStorageService', 'Error details:', error.message);
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
  // Always use API regardless of authentication status
  try {
    logger.debug('SheetStorageService', 'Getting sheets from MongoDB using URL:', `${API_URL}/sheets`);
    
    // Get the token if available (will be null for unauthenticated users)
    const token = getAuthToken();
    logger.debug('SheetStorageService', 'Using authentication token:', token ? 'Token exists' : 'No token found');
    
    // Prepare headers - include auth token only if it exists
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // Make the API request with full URL
    const response = await fetch(`${API_URL}/sheets`, {
      method: 'GET',
      headers,
      credentials: 'include' // Include cookies for alternative authentication
    });
    
    // Log the response status
    logger.debug('SheetStorageService', 'API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    logger.debug('SheetStorageService', 'API response data:', data);
    
    const sheets = data.data || [];
    logger.info('SheetStorageService', `Loaded ${sheets.length} sheets from the API`);
    
    // Sort if needed
    if (sortByNewest && sheets.length > 0) {
      sheets.sort((a, b) => {
        return new Date(b.dateModified || b.createdAt) - new Date(a.dateModified || a.createdAt);
      });
    }
    
    return sheets;
  } catch (error) {
    console.error('Error fetching sheets from API:', error);
    logger.error('SheetStorageService', 'Failed to fetch sheets from API:', error.message);
    return []; // Return empty array on error
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
 * Duplicate a sheet
 * @param {Object} sheet - The sheet to duplicate
 * @returns {Promise<Object>} The duplicated sheet
 */
export const duplicateSheet = async (sheet) => {
  logger.debug('SheetStorageService', `Duplicating sheet ${sheet.id}`); 
  
  // Create a deep copy of the sheet
  const duplicatedSheet = JSON.parse(JSON.stringify(sheet));
  
  // Generate a new ID and update the title
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const newId = `${timestamp}_${random}`;
  
  duplicatedSheet.id = newId;
  duplicatedSheet.title = `${sheet.title || 'Untitled'} (copy)`;
  
  // Save the duplicated sheet
  return await saveSheet(duplicatedSheet, true);
};

/**
 * Update an existing sheet (e.g., rename)
 * @param {Object} sheetData - Updated sheet data
 * @returns {Promise<Object>} The updated sheet
 */
export const updateSheet = async (sheetData) => {
  if (!sheetData || !sheetData.id) {
    logger.error('SheetStorageService', 'Cannot update sheet: missing sheet data or ID');
    throw new Error('Cannot update sheet: missing sheet data or ID');
  }
  
  logger.debug('SheetStorageService', `Updating sheet ${sheetData.id}`);
  
  // Use the regular saveSheet function but ensure it's not treated as a new save
  return await saveSheet(sheetData, false);
};

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
