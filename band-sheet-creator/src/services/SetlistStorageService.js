/**
 * SetlistStorageService.js
 * Service for handling setlist storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 */

import { fetchWithAuth, API_URL } from './ApiService';
import { getAuthToken } from '../utils/AuthUtils';
import logger from './LoggingService';
import { isAuthenticated, requestAuthentication } from '../utils/AuthUtils';

// Key for storing pending favorite setlist ID
const PENDING_FAVORITE_SETLIST_KEY = 'pendingFavoriteSetlistId';

// Using isAuthenticated from AuthUtils

/**
 * Utility function to validate and format MongoDB IDs
 * MongoDB IDs are 24-character hexadecimal strings
 * @param {string|object} id - The ID to validate and format (can be a string, object with _id or id property)
 * @returns {string|null} - The formatted MongoDB ID or null if invalid
 */
const formatMongoId = (id) => {
  if (!id) return null;
  
  // Handle the case where id might be an object with _id or id property
  if (typeof id === 'object') {
    if (id._id) return formatMongoId(id._id);
    if (id.id) return formatMongoId(id.id);
    if (id.$oid) return id.$oid;
    
    console.log('Received object as ID but no recognized ID property found:', id);
    return null;
  }
  
  // Convert to string
  const idStr = String(id);
  
  // If ID starts with a prefix like 'setlist_', remove it
  let cleanId = idStr;
  if (idStr.includes('_')) {
    cleanId = idStr.split('_').pop();
  }
  
  // Check for both MongoDB Object ID format (24 hex chars) and numeric ID format
  if (/^[0-9a-f]{24}$/i.test(cleanId) || /^\d+$/.test(cleanId)) {
    return cleanId;
  }
  
  // Log invalid ID format
  console.log(`ID doesn't match expected MongoDB format: ${id} -> ${cleanId}`);
  return idStr; // Return original string as fallback
};

/**
 * Load a setlist by its ID
 * @param {string|number} id - The ID of the setlist to load
 * @returns {Object|null} The loaded setlist or null if not found
 */
export const getSetlistById = async (id) => {
  logger.debug('SetlistStorageService', 'Original setlist ID received:', id);
  logger.debug('SetlistStorageService', 'ID type:', typeof id);
  console.log('API REQUEST - getSetlistById - ID:', id);
  
  // Check if ID is valid
  if (!id) {
    logger.error('SetlistStorageService', 'Invalid setlist ID:', id);
    return null;
  }
  
  // IMPORTANT: Use the ID exactly as provided - do NOT format or transform it
  // This ensures we match exactly what's in the database
  const idToUse = String(id);
  logger.debug('SetlistStorageService', `Using exact ID: ${idToUse}`);
  console.log('Using ID as-is for API call:', idToUse);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      logger.debug('SetlistStorageService', 'Making authenticated request to API');
      
      // Use fetchWithAuth with the exact ID for consistent authentication handling
      const data = await fetchWithAuth(`${API_URL}/setlists/${idToUse}`, {
        method: 'GET'
      });
      
      logger.debug('SetlistStorageService', 'API Response:', data);
      console.log(`API response for ID ${idToUse}:`, data);
      
      // Check if we got a successful response
      if (data && data.success && data.setlist) {
        // Format 1: { success: true, setlist: {...} }
        logger.info('SetlistStorageService', 'Found setlist');
        return data.setlist;
      } else if (data && data.data) {
        // Format 2: { data: {...} }
        logger.info('SetlistStorageService', 'Found setlist (legacy format)');
        return data.data;
      } else if (data && Array.isArray(data) && data.length > 0) {
        // Format 3: Direct array
        logger.info('SetlistStorageService', 'Found setlist array');
        return data[0]; // Return the first setlist in the array
      } else if (data && typeof data === 'object' && (data.name || data.title)) {
        // Format 4: Direct setlist object
        logger.info('SetlistStorageService', 'Found direct setlist object');
        return data;
      }
      
      // If we got here, this format didn't work
      logger.error('SetlistStorageService', 'API response did not contain valid setlist data');
      console.error('API response did not contain valid setlist data:', data);
      return null;
      
    } catch (error) {
      logger.error('SetlistStorageService', 'Error fetching setlist from API:', error);
      console.error('Error fetching setlist:', error.message);
      return null;
    }
  } else {
    // If not authenticated, return null
    logger.info('SetlistStorageService', 'User not authenticated, cannot fetch setlist');
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
      logger.debug('SetlistStorageService', 'Authentication state:', {
        isAuthenticated: isAuthenticated(),
        token: getAuthToken() ? 'present' : 'missing'
      });
      
      // Ensure the API URL is correctly formatted
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const apiUrl = `${baseUrl}/setlists`;
      logger.debug('SetlistStorageService', 'API URL for setlists:', apiUrl);
      console.log('FETCHING SETLISTS FROM:', apiUrl); // Direct console log for immediate visibility
      
      // Add a timestamp to prevent caching
      const cacheBuster = `?t=${Date.now()}`;
      
      // Try different fetch approaches to handle potential network issues
      let data;
      try {
        // First attempt: Use fetchWithAuth without problematic cache-control header
        data = await fetchWithAuth(`${apiUrl}${cacheBuster}`, {
          method: 'GET'
          // Removed cache-control header that was causing CORS issues
        });
      } catch (fetchError) {
        // Second attempt: If fetchWithAuth fails, try direct fetch
        console.warn('Primary fetch failed, trying direct fetch as fallback:', fetchError.message);
        
        // Direct fetch with explicit auth header but without problematic cache-control
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json'
          // Removed cache-control header that was causing CORS issues
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        console.log('Attempting direct fetch with explicit headers');
        const response = await fetch(`${apiUrl}${cacheBuster}`, {
          method: 'GET',
          headers,
          credentials: 'include',
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
        console.log('Direct fetch succeeded:', data);
      }
      
      logger.debug('SetlistStorageService', 'Setlists API response:', data);
      console.log('API Response for getAllSetlists:', data); // Direct console log for immediate visibility
      console.log('API Response type:', typeof data);
      console.log('API Response is array?', Array.isArray(data));
      console.log('----------------DETAILED SETLIST DEBUG----------------');
      console.log('Authentication status:', isAuthenticated() ? 'Authenticated' : 'Not authenticated');
      console.log('Token present:', !!getAuthToken());
      
      if (data && data.setlists && data.setlists.length > 0) {
        console.log('Number of setlists returned:', data.setlists.length);
        data.setlists.forEach((setlist, index) => {
          console.log(`Setlist ${index + 1}:`, {
            id: setlist.id,
            name: setlist.name,
            owner: setlist.owner,
            isPublic: setlist.isPublic,
            sheetCount: setlist.sheets ? setlist.sheets.length : 0
          });
        });
      } else {
        console.log('No setlists returned from API');
      }
      
      if (data && typeof data === 'object') {
        console.log('API Response keys:', Object.keys(data));
        if (data.setlists) {
          console.log('Setlists count:', data.setlists.length);
          console.log('First setlist:', data.setlists[0]);
        }
      }
      
      // Handle different API response formats
      let setlistsArray = [];
      
      if (data.setlists) {
        // Current API format
        setlistsArray = data.setlists;
      } else if (data.data) {
        // Legacy API format
        setlistsArray = data.data;
      } else if (Array.isArray(data)) {
        // Direct array format
        setlistsArray = data;
      }
      
      logger.debug('SetlistStorageService', 'Extracted setlists array:', setlistsArray);
      
      if (Array.isArray(setlistsArray)) {
        // Normalize setlist IDs to ensure consistency between raw _id from MongoDB and id we use in the app
        setlistsArray = setlistsArray.map(setlist => {
          // Create a copy to avoid mutating the original
          const normalizedSetlist = { ...setlist };
          
          // If the setlist has _id but no id, copy _id to id
          if (normalizedSetlist._id && !normalizedSetlist.id) {
            normalizedSetlist.id = normalizedSetlist._id;
          }
          
          // In some cases we might have the ID in the wrong format, so let's clean that up
          if (typeof normalizedSetlist.id === 'object' && normalizedSetlist.id.$oid) {
            normalizedSetlist.id = normalizedSetlist.id.$oid;
          }
          
          return normalizedSetlist;
        });
        
        // Log the normalized setlists for debugging
        logger.debug('SetlistStorageService', 'Normalized setlists:', 
                     setlistsArray.map(s => ({ id: s.id, _id: s._id, name: s.name })));
        
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
    // Even if not authenticated, we should still try to get public setlists
    // This aligns with the backend behavior that returns public setlists for unauthenticated users
    try {
      logger.info('SetlistStorageService', 'User not authenticated, fetching public setlists only');

      // Use standard API URL but ensure it's correctly formatted
      const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
      const apiUrl = `${baseUrl}/setlists`;
      logger.debug('SetlistStorageService', 'API URL for setlists:', apiUrl);
      console.log('FETCHING SETLISTS FROM:', apiUrl); // Direct console log for immediate visibility
      
      // Add a timestamp to prevent caching
      const cacheBuster = `?t=${Date.now()}`;
      
      // Try a direct fetch approach if fetchWithAuth fails
      let data;
      try {
        data = await fetchWithAuth(`${apiUrl}${cacheBuster}`, {
          method: 'GET'
          // Removed cache-control header that was causing CORS issues
        });
      } catch (fetchError) {
        console.warn('Primary fetch method failed, trying direct fetch:', fetchError.message);
        
        // If fetchWithAuth fails, try a direct fetch with manual auth header
        const token = getAuthToken();
        const headers = {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const response = await fetch(`${apiUrl}${cacheBuster}`, {
          method: 'GET',
          headers,
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
      }

      // Process the response the same way as for authenticated requests
      if (data && typeof data === 'object') {
        // Extract setlists using the same logic as for authenticated requests
        let setlistsArray = [];

        if (data.setlists) {
          setlistsArray = data.setlists;
        } else if (data.data) {
          setlistsArray = data.data;
        } else if (Array.isArray(data)) {
          setlistsArray = data;
        }

        // Normalize setlist IDs
        if (Array.isArray(setlistsArray)) {
          const normalizedSetlists = setlistsArray.map(setlist => {
            const normalizedSetlist = { ...setlist };
            if (normalizedSetlist._id && !normalizedSetlist.id) {
              normalizedSetlist.id = normalizedSetlist._id;
            }
            if (typeof normalizedSetlist.id === 'object' && normalizedSetlist.id.$oid) {
              normalizedSetlist.id = normalizedSetlist.id.$oid;
            }
            return normalizedSetlist;
          });

          logger.info('SetlistStorageService', `Returning ${normalizedSetlists.length} public setlists`);
          return normalizedSetlists;
        }
      }

      return [];
    } catch (error) {
      logger.error('SetlistStorageService', 'Error fetching public setlists:', error);
      return [];
    }
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
