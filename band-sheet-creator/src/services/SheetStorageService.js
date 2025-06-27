/**
 * SheetStorageService.js
 * Service for handling sheet storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 * Uses localStorage only for temporary drafts when not authenticated
 */

import { fetchWithAuth, API_URL } from './ApiService';
import eventBus from '../utils/EventBus';
import logger from './LoggingService';
import { isAuthenticated, handleUnauthenticated } from '../utils/AuthUtils';

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
      
      // Use fetchWithAuth for consistent API handling
      const data = await fetchWithAuth(`${API_URL}/sheets/${formattedId}`);
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
      logger.debug('SheetStorageService', 'Loaded sheet status:', loadedData.status);
      console.log('%c[LOADED SHEET STATUS]', 'color: orange; font-weight: bold', loadedData.status);
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
      
      // Use fetchWithAuth for consistent API handling (works for public access too)
      const data = await fetchWithAuth(apiUrl);
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
  
  // Authentication will be handled automatically by fetchWithAuth
  logger.debug('SheetStorageService', `[${source}] Starting save operation`);

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
      // Ensure title and status are explicitly set
      title: updatedSheet.title || '',
      status: updatedSheet.status || 'WIP'
    }));
    
    // Debug log to confirm status is being sent
    console.log('%c[SAVING SHEET STATUS]', 'color: green; font-weight: bold', sheetWithColors.status);
    logger.debug('SheetStorageService', 'Saving sheet with status:', sheetWithColors.status);
    
    // Token has already been validated at the beginning of this function
    // No need to check again

    // Decide whether to create a new sheet or update an existing one
    const shouldCreateNew = isNewSave === true || !sheetWithColors.id;
    
    if (shouldCreateNew) {
      // Create new sheet using fetchWithAuth
      const data = await fetchWithAuth(`${API_URL}/sheets`, {
        method: 'POST',
        body: JSON.stringify(sheetWithColors)
      });
      
      // Verify data structure
      if (!data || !data.data) {
        throw new Error('Invalid server response format - missing data field');
      }
      
      return data.data;
    } else {
      // Update existing sheet using fetchWithAuth
      try {
        const data = await fetchWithAuth(`${API_URL}/sheets/${sheetWithColors.id}`, {
          method: 'PUT',
          body: JSON.stringify(sheetWithColors)
        });
        
        if (!data || !data.data) {
          throw new Error('Invalid server response format - missing data field');
        }
        
        return data.data;
      } catch (error) {
        // If we get a 404 when trying to update, fall back to creating a new sheet
        if (error.message && error.message.includes('404')) {
          const createData = await fetchWithAuth(`${API_URL}/sheets`, {
            method: 'POST',
            body: JSON.stringify(sheetWithColors)
          });
          
          if (!createData || !createData.data) {
            throw new Error('Invalid server response format - missing data field');
          }
          
          return createData.data;
        } else {
          // For other errors, re-throw
          throw error;
        }
      }
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
  
  // Authentication will be handled by fetchWithAuth
  logger.debug('SheetStorageService', 'Attempting to delete sheet with authentication');
  
  try {
    // Use fetchWithAuth for consistent authentication handling
    await fetchWithAuth(`${API_URL}/sheets/${id}`, {
      method: 'DELETE'
    });
    
    logger.info('SheetStorageService', `Successfully deleted sheet ${id}`);
    return true;
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
    
    // Use fetchWithAuth for consistent authentication handling
    const data = await fetchWithAuth(`${API_URL}/sheets`);
    logger.debug('SheetStorageService', 'API response data:', data);
    
    const sheets = data.data || [];
    logger.info('SheetStorageService', `Loaded ${sheets.length} sheets from the API`);
    
    // Debug: Check status fields in loaded sheets
    console.log('%c[LOADED SHEETS STATUS DEBUG]', 'color: purple; font-weight: bold');
    sheets.slice(0, 3).forEach((sheet, i) => {
      console.log(`Backend Sheet ${i + 1}:`, {
        id: sheet.id,
        title: sheet.title,
        status: sheet.status,
        hasStatus: 'status' in sheet,
        allKeys: Object.keys(sheet)
      });
    });
    
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
    status: 'WIP',
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
