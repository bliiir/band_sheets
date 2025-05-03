/**
 * SetlistStorageService.js
 * Service for handling setlist storage, saving, and loading operations
 * Integrated with backend API - requires MongoDB authentication
 */

import { fetchWithAuth, API_URL } from './ApiService';

/**
 * Check if user is authenticated
 * @returns {boolean} Whether the user is authenticated
 */
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Load a setlist by its ID
 * @param {string|number} id - The ID of the setlist to load
 * @returns {Object|null} The loaded setlist or null if not found
 */
export const getSetlistById = async (id) => {
  // Ensure the ID is properly formatted
  const formattedId = id.toString();
  console.log(`Getting setlist ${formattedId} from storage`);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    try {
      console.log(`Getting setlist ${formattedId} from MongoDB with authentication`);
      const token = localStorage.getItem('token');
      
      // Make the API request with full URL
      const response = await fetch(`${API_URL}/setlists/${formattedId}`, {
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
      
      return data.data || null;
    } catch (error) {
      console.error('Error fetching setlist from API:', error);
      return null;
    }
  } else {
    console.log('User not authenticated, no setlists available');
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
      console.log('Getting setlists from MongoDB using URL:', `${API_URL}/setlists`);
      
      // Get the token for debugging
      const token = localStorage.getItem('token');
      console.log('Using authentication token:', token ? 'Token exists' : 'No token found');
      
      // Make the API request with full URL and add debug parameters
      const debugUrl = `${API_URL}/setlists?debug=true&client=web`;
      console.log('Debug URL for setlists:', debugUrl);
      
      const response = await fetch(debugUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Log the response status and headers for detailed debugging
      console.log('API response status:', response.status, response.statusText);
      console.log('API response headers:', [...response.headers.entries()]);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      // Clone the response to log its content without consuming it
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      
      try {
        // Attempt to parse the response
        const data = JSON.parse(responseText);
        console.log('API response data:', data);
        
        // Check for specific error conditions
        if (data.success === false) {
          console.error('API error details:', data.error);
          throw new Error(`API error: ${data.error || 'Unknown error'}`);
        }
        
        // The API returns setlists in the 'setlists' field, not 'data'
        const setlists = data.setlists || data.data || [];
        console.log(`Received ${setlists.length} setlists from API`);
        
        // Log the first setlist for debugging if available
        if (setlists.length > 0) {
          console.log('First setlist preview:', {
            id: setlists[0].id || setlists[0]._id,
            name: setlists[0].name,
            sheets: setlists[0].sheets ? setlists[0].sheets.length : 0
          });
        }
        
        // Sort if needed
        if (sortByNewest && setlists.length > 0) {
          setlists.sort((a, b) => {
            return new Date(b.dateModified || b.createdAt) - new Date(a.dateModified || a.createdAt);
          });
        }
        
        return setlists;
      } catch (parseError) {
        console.error('Error parsing API response:', parseError);
        console.log('Raw response text:', responseText);
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      console.error('Error fetching setlists from API:', error);
      return []; // Return empty array on error, no fallback
    }
  } else {
    // Not authenticated, return empty array
    console.log('User not authenticated, no setlists available');
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
      const token = localStorage.getItem('token');
      
      // Make the API request with full URL
      const response = await fetch(`${API_URL}/setlists/${formattedId}`, {
        method: 'DELETE',
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
      
      return true;
    } catch (error) {
      console.error('Error deleting setlist from API:', error);
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
      const token = localStorage.getItem('token');
      
      // Make the API request with full URL
      const response = await fetch(`${API_URL}/setlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(setlistData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || null;
    } catch (error) {
      console.error('Error creating setlist in API:', error);
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
      const token = localStorage.getItem('token');
      
      // Make the API request with full URL
      const response = await fetch(`${API_URL}/setlists/${formattedId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(setlistData)
      });
      
      // Log response status for debugging
      console.log('API response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
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
