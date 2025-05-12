/**
 * SetlistStorageService.js
 * Service for handling setlist storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 */

import { fetchWithAuth, API_URL } from './ApiService';
import logger from './LoggingService';
import { isAuthenticated, requestAuthentication } from '../utils/AuthUtils';

// Key for storing pending favorite setlist ID
const PENDING_FAVORITE_SETLIST_KEY = 'pendingFavoriteSetlistId';

// Using isAuthenticated from AuthUtils

/**
 * Load a setlist by its ID
 * @param {string|number} id - The ID of the setlist to load
 * @returns {Object|null} The loaded setlist or null if not found
 */
export const getSetlistById = async (id) => {
  // Ensure the ID is properly formatted
  const formattedId = id.toString();
  logger.debug('SetlistStorageService', `Getting setlist ${formattedId} from storage`);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      logger.debug('SetlistStorageService', `Getting setlist ${formattedId} from MongoDB with authentication`);
      
      // Use fetchWithAuth for consistent authentication handling
      const data = await fetchWithAuth(`${API_URL}/setlists/${formattedId}`, {
        method: 'GET'
      });
      
      logger.debug('SetlistStorageService', 'Get setlist response:', data);
      return data.data || null;
    } catch (error) {
      logger.error('SetlistStorageService', 'Error fetching setlist from API:', error);
      logger.error('SetlistStorageService', 'Error details:', error.message);
      return null;
    }
  } else {
    logger.info('SetlistStorageService', 'User not authenticated, no setlists available');
    return null;
  }
};

/**
 * Get all saved setlists from storage
 * @param {boolean} sortByNewest - Whether to sort setlists by date (descending)
 * @returns {Array} Array of setlist objects
 */
export const getAllSetlists = async (sortByNewest = true) => {
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      logger.debug('SetlistStorageService', 'Getting setlists from MongoDB using URL:', `${API_URL}/setlists`);
      
      // Use standard API URL without debug parameters
      const apiUrl = `${API_URL}/setlists`;
      logger.debug('SetlistStorageService', 'API URL for setlists:', apiUrl);
      
      const data = await fetchWithAuth(apiUrl, {
        method: 'GET'
      });
      
      logger.debug('SetlistStorageService', 'Setlists API response:', data);
      
      // The backend returns setlists in a 'setlists' field, not 'data'
      const setlistsArray = data.setlists || data.data || [];
      logger.debug('SetlistStorageService', 'Extracted setlists array:', setlistsArray);
      
      if (Array.isArray(setlistsArray)) {
        // Sort setlists if requested
        const setlists = sortByNewest && setlistsArray.length > 0
          ? [...setlistsArray].sort((a, b) => {
              const dateA = a.dateModified || a.updatedAt || a.dateCreated || a.createdAt;
              const dateB = b.dateModified || b.updatedAt || b.dateCreated || b.createdAt;
              return new Date(dateB) - new Date(dateA);
            })
          : setlistsArray;
        
        logger.info('SetlistStorageService', `Returning ${setlists.length} setlists from MongoDB`);
        
        // Log the first setlist for debugging if available
        if (setlists.length > 0) {
          const firstSetlist = setlists[0];
          logger.debug('SetlistStorageService', 'First setlist sample:', {
            id: firstSetlist._id || firstSetlist.id,
            name: firstSetlist.name,
            sheetCount: (firstSetlist.sheets && firstSetlist.sheets.length) || 0
          });
        }
        
        return setlists;
      } else {
        logger.error('SetlistStorageService', 'API returned invalid data format:', data);
        return [];
      }
    } catch (error) {
      logger.error('SetlistStorageService', 'Error fetching setlists from API:', error);
      return []; // Return empty array on error, no fallback
    }
  } else {
    // Not authenticated, return empty array
    logger.info('SetlistStorageService', 'User not authenticated, no setlists available');
    return [];
  }
};

/**
 * Delete a setlist by ID
 * @param {string|number} id - ID of the setlist to delete
 * @returns {boolean} Whether the deletion was successful
 */
export const deleteSetlist = async (id) => {
  // Ensure the ID is properly formatted
  const formattedId = id.toString();
  logger.debug('SetlistStorageService', `Deleting setlist ${formattedId} from storage`);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      logger.debug('SetlistStorageService', `Deleting setlist ${formattedId} from MongoDB with authentication`);
      
      // Use fetchWithAuth for consistent authentication handling
      const data = await fetchWithAuth(`${API_URL}/setlists/${formattedId}`, {
        method: 'DELETE'
      });
      
      logger.debug('SetlistStorageService', 'Delete setlist response:', data);
      return true;
    } catch (error) {
      logger.error('SetlistStorageService', 'Error deleting setlist from API:', error);
      logger.error('SetlistStorageService', 'Error details:', error.message);
      return false;
    }
  } else {
    logger.info('SetlistStorageService', 'User not authenticated, cannot delete setlist');
    return false;
  }
};

/**
 * Create a new setlist
 * @param {Object} setlistData - The setlist data to save
 * @returns {Object} The saved setlist with its ID
 */
export const createSetlist = async (setlistData) => {
  if (isAuthenticated()) {
    try {
      logger.debug('SetlistStorageService', 'Creating new setlist in MongoDB with authentication');
      logger.debug('SetlistStorageService', 'Setlist data:', setlistData);
      logger.debug('SetlistStorageService', `API URL: ${API_URL}/setlists`);
      
      // Make sure we're sending the correct fields that the backend expects
      // Note: The backend requires an 'id' field in the schema
      const requestData = {
        id: setlistData.id || `setlist_${Date.now()}`, // Ensure we have an ID (backend will generate one if missing, but let's be explicit)
        name: setlistData.name,
        description: setlistData.description || '',
        sheets: setlistData.sheets || [],
        dateCreated: setlistData.dateCreated,
        dateModified: setlistData.dateModified
      };
      
      logger.debug('SetlistStorageService', 'Formatted request data:', requestData);
      
      // Use fetchWithAuth instead of direct fetch call to ensure consistent auth handling
      const response = await fetchWithAuth(`${API_URL}/setlists`, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      logger.debug('SetlistStorageService', 'Create setlist response:', response);
      
      // Backend returns { success: true, setlist: {...} } format
      if (response && response.success && response.setlist) {
        return response.setlist;
      } else if (response && response.data) {
        return response.data;
      } else {
        logger.error('SetlistStorageService', 'Unexpected response format:', response);
        return null;
      }
    } catch (error) {
      logger.error('SetlistStorageService', 'Error creating setlist in API:', error);
      logger.error('SetlistStorageService', 'Error details:', error.message);
      return null;
    }
  } else {
    logger.info('SetlistStorageService', 'User not authenticated, cannot create setlist');
    return null;
  }
};

/**
 * Update an existing setlist
 * @param {string|number} id - ID of the setlist to update
 * @param {Object} setlistData - The updated setlist data
 * @returns {Object} The updated setlist
 */
export const updateSetlist = async (id, setlistData) => {
  const formattedId = id.toString();
  
  if (isAuthenticated()) {
    try {
      logger.debug('SetlistStorageService', `Updating setlist ${formattedId} in MongoDB with authentication`);
      logger.debug('SetlistStorageService', 'Update payload:', setlistData);
      logger.debug('SetlistStorageService', `API URL: ${API_URL}/setlists/${formattedId}`);
      
      // Use fetchWithAuth for consistent authentication handling
      const data = await fetchWithAuth(`${API_URL}/setlists/${formattedId}`, {
        method: 'PUT',
        body: JSON.stringify(setlistData)
      });
      
      logger.debug('SetlistStorageService', 'Update setlist response:', data);
      
      // Better handling of different API response formats
      if (data.data) {
        return data.data; // Standard API response format
      } else if (data.setlist) {
        return data.setlist; // Alternative API response format
      } else if (data._id || data.id) {
        return data; // Direct object return
      } else {
        logger.debug('SetlistStorageService', 'Unexpected API response format, returning true to indicate success');
        return true; // Return true to indicate success even if we don't have the expected format
      }
    } catch (error) {
      logger.error('SetlistStorageService', 'Error updating setlist in API:', error);
      return null;
    }
  } else {
    logger.info('SetlistStorageService', 'User not authenticated, cannot update setlist');
    return null;
  }
};

/**
 * Save a pending favorite setlist ID for authentication
 * @param {string} setlistId - The ID of the setlist to save as pending favorite
 */
export const savePendingFavoriteSetlistId = (setlistId) => {
  try {
    if (!setlistId) {
      logger.warn('SetlistStorageService', 'Attempting to save empty setlist ID as pending favorite');
      return;
    }
    
    localStorage.setItem(PENDING_FAVORITE_SETLIST_KEY, setlistId);
    logger.debug('SetlistStorageService', `Saved setlist ${setlistId} as pending favorite`);
  } catch (error) {
    logger.error('SetlistStorageService', 'Error saving pending favorite setlist ID:', error);
  }
};

/**
 * Get the pending favorite setlist ID
 * @returns {string|null} The pending favorite setlist ID or null if not found
 */
export const getPendingFavoriteSetlistId = () => {
  try {
    const pendingId = localStorage.getItem(PENDING_FAVORITE_SETLIST_KEY);
    return pendingId;
  } catch (error) {
    logger.error('SetlistStorageService', 'Error getting pending favorite setlist ID:', error);
    return null;
  }
};

/**
 * Clear the pending favorite setlist ID
 */
export const clearPendingFavoriteSetlistId = () => {
  try {
    localStorage.removeItem(PENDING_FAVORITE_SETLIST_KEY);
    logger.debug('SetlistStorageService', 'Cleared pending favorite setlist ID');
  } catch (error) {
    logger.error('SetlistStorageService', 'Error clearing pending favorite setlist ID:', error);
  }
};
