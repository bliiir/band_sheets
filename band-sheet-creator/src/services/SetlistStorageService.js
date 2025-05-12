/**
 * SetlistStorageService.js
 * Service for handling setlist storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 */

import { fetchWithAuth, API_URL } from './ApiService';
import logger from './LoggingService';
import { isAuthenticated, requestAuthentication } from '../utils/AuthUtils';

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
      console.error('Error fetching setlists from API:', error);
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
  console.log(`Deleting setlist ${formattedId} from storage`);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      console.log(`Deleting setlist ${formattedId} from MongoDB with authentication`);
      
      // Use fetchWithAuth for consistent authentication handling
      const data = await fetchWithAuth(`${API_URL}/setlists/${formattedId}`, {
        method: 'DELETE'
      });
      
      console.log('Delete setlist response:', data);
      return true;
    } catch (error) {
      console.error('Error deleting setlist from API:', error);
      console.error('Error details:', error.message);
      return false;
    }
  } else {
    console.log('User not authenticated, cannot delete setlist');
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
      console.log('Creating new setlist in MongoDB with authentication');
      console.log('Setlist data:', setlistData);
      console.log(`API URL: ${API_URL}/setlists`);
      
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
      
      console.log('Formatted request data:', requestData);
      
      // Use fetchWithAuth instead of direct fetch call to ensure consistent auth handling
      const response = await fetchWithAuth(`${API_URL}/setlists`, {
        method: 'POST',
        body: JSON.stringify(requestData)
      });
      
      console.log('Create setlist response:', response);
      
      // Backend returns { success: true, setlist: {...} } format
      if (response && response.success && response.setlist) {
        return response.setlist;
      } else if (response && response.data) {
        return response.data;
      } else {
        console.error('Unexpected response format:', response);
        return null;
      }
    } catch (error) {
      console.error('Error creating setlist in API:', error);
      console.error('Error details:', error.message);
      return null;
    }
  } else {
    console.log('User not authenticated, cannot create setlist');
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
      console.log(`Updating setlist ${formattedId} in MongoDB with authentication`);
      console.log('Update payload:', setlistData);
      console.log(`API URL: ${API_URL}/setlists/${formattedId}`);
      
      // Use fetchWithAuth for consistent authentication handling
      const data = await fetchWithAuth(`${API_URL}/setlists/${formattedId}`, {
        method: 'PUT',
        body: JSON.stringify(setlistData)
      });
      
      console.log('Update setlist response:', data);
      
      // Better handling of different API response formats
      if (data.data) {
        return data.data; // Standard API response format
      } else if (data.setlist) {
        return data.setlist; // Alternative API response format
      } else if (data._id || data.id) {
        return data; // Direct object return
      } else {
        console.log('Unexpected API response format, returning true to indicate success');
        return true; // Return true to indicate success even if we don't have the expected format
      }
    } catch (error) {
      console.error('Error updating setlist in API:', error);
      return null;
    }
  } else {
    console.log('User not authenticated, cannot update setlist');
    return null;
  }
};
