/**
 * SetlistService.js
 * Service for handling setlist operations
 * Uses MongoDB as the primary source of truth
 * - All users can read setlists
 * - Only authenticated users can create, update, or delete setlists
 */
import { fetchWithAuth, API_URL } from './ApiService';

/**
 * Get all setlists from the API
 * @returns {Promise<Array>} Array of setlists
 */
export const getAllSetlists = async () => {
  try {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    let data;
    
    if (token) {
      // If authenticated, use fetchWithAuth to get user-specific setlists
      data = await fetchWithAuth(`${API_URL}/setlists`);
      console.log('Fetched authenticated setlists from API:', data);
    } else {
      // If not authenticated, use regular fetch to get only public setlists
      const response = await fetch(`${API_URL}/setlists`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch setlists: ${response.status}`);
      }
      
      data = await response.json();
      console.log('Fetched public setlists from API:', data);
    }
    
    if (data.setlists && Array.isArray(data.setlists)) {
      return data.setlists;
    } else if (data.count >= 0 && Array.isArray(data.setlists)) {
      return data.setlists;
    } else {
      console.warn('API returned unexpected data format:', data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching setlists from API:', error);
    return [];
  }
};

/**
 * Get a setlist by ID
 * @param {string} setlistId - ID of the setlist to retrieve
 * @returns {Promise<Object>} The setlist object
 */
export const getSetlistById = async (setlistId) => {
  try {
    // Direct API call without authentication requirement
    // This allows all users to view a specific setlist
    const response = await fetch(`${API_URL}/setlists/${setlistId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch setlist: ${response.status}`);
    }
    
    const data = await response.json();
    return data.setlist || null;
  } catch (error) {
    console.error(`Error fetching setlist ${setlistId}:`, error);
    return null;
  }
};

/**
 * Create a new setlist
 * @param {Object} setlistData - Setlist data (name, description)
 * @returns {Promise<Object>} The created setlist
 * @throws {Error} If user is not authenticated
 */
export const createSetlist = async (setlistData) => {
  // Check if user is authenticated by looking for token
  const token = localStorage.getItem('token');
  
  // Only allow authenticated users to create setlists
  if (!token) {
    throw new Error('You must be logged in to create a setlist');
  }
  
  const newSetlist = {
    id: `setlist_${Date.now()}`,
    name: setlistData.name || 'Untitled Setlist',
    description: setlistData.description || '',
    sheets: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  try {
    // Use fetchWithAuth for consistent authentication handling
    const data = await fetchWithAuth(`${API_URL}/setlists`, {
      method: 'POST',
      body: JSON.stringify(newSetlist)
    });
    
    console.log('Setlist created successfully:', data);
    return data.setlist || newSetlist;
  } catch (error) {
    console.error('Error creating setlist:', error);
    throw error;
  }
};

/**
 * Update an existing setlist
 * @param {string} setlistId - ID of the setlist to update
 * @param {Object} setlistData - Updated setlist data
 * @returns {Promise<Object>} The updated setlist
 * @throws {Error} If user is not authenticated or setlist is not found
 */
export const updateSetlist = async (setlistId, setlistData) => {
  // Check if user is authenticated by looking for token
  const token = localStorage.getItem('token');
  
  // Only allow authenticated users to update setlists
  if (!token) {
    throw new Error('You must be logged in to update a setlist');
  }
  
  try {
    // First, get the current setlist to ensure it exists
    const currentSetlist = await getSetlistById(setlistId);
    
    if (!currentSetlist) {
      throw new Error('Setlist not found');
    }
    
    // Prepare the updated setlist data
    const updatedSetlist = {
      ...currentSetlist,
      ...setlistData,
      updatedAt: new Date().toISOString()
    };
    
    // Update in API
    const data = await fetchWithAuth(`${API_URL}/setlists/${setlistId}`, {
      method: 'PUT',
      body: JSON.stringify(updatedSetlist)
    });
    
    console.log('Setlist updated successfully:', data);
    return data.setlist || updatedSetlist;
  } catch (error) {
    console.error('Error updating setlist:', error);
    throw error;
  }
};

/**
 * Delete a setlist
 * @param {string} setlistId - ID of the setlist to delete
 * @returns {Promise<boolean>} True if successful
 * @throws {Error} If user is not authenticated
 */
export const deleteSetlist = async (setlistId) => {
  // Check if user is authenticated by looking for token
  const token = localStorage.getItem('token');
  
  // Only allow authenticated users to delete setlists
  if (!token) {
    throw new Error('You must be logged in to delete a setlist');
  }
  
  try {
    // Delete from API
    await fetchWithAuth(`${API_URL}/setlists/${setlistId}`, {
      method: 'DELETE'
    });
    
    console.log('Setlist deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting setlist:', error);
    throw error;
  }
};

/**
 * Add a sheet to a setlist
 * @param {string} setlistId - ID of the setlist
 * @param {Object} sheet - Sheet to add
 * @returns {Promise<Object>} The updated setlist
 * @throws {Error} If user is not authenticated
 */
export const addSheetToSetlist = async (setlistId, sheet) => {
  // Check if user is authenticated by looking for token
  const token = localStorage.getItem('token');
  
  // Only allow authenticated users to modify setlists
  if (!token) {
    throw new Error('You must be logged in to add sheets to a setlist');
  }
  
  try {
    // First verify the setlist exists
    const setlist = await getSetlistById(setlistId);
    
    if (!setlist) {
      throw new Error('Setlist not found');
    }
    
    // Use direct API endpoint for adding a sheet to a setlist
    console.log(`Adding sheet ${sheet.id} to setlist ${setlistId}`);
    const data = await fetchWithAuth(`${API_URL}/setlists/${setlistId}/sheets`, {
      method: 'POST',
      body: JSON.stringify({ sheetId: sheet.id })
    });
    
    console.log('Sheet added to setlist successfully:', data);
    return data.setlist;
  } catch (error) {
    console.error('Error adding sheet to setlist:', error);
    throw error;
  }
};

/**
 * Remove a sheet from a setlist
 * @param {string} setlistId - ID of the setlist
 * @param {string} sheetId - ID of the sheet to remove
 * @returns {Promise<Object>} The updated setlist
 * @throws {Error} If user is not authenticated
 */
export const removeSheetFromSetlist = async (setlistId, sheetId) => {
  // Check if user is authenticated by looking for token
  const token = localStorage.getItem('token');
  
  // Only allow authenticated users to modify setlists
  if (!token) {
    throw new Error('You must be logged in to remove sheets from a setlist');
  }
  
  try {
    // First verify the setlist exists
    const setlist = await getSetlistById(setlistId);
    
    if (!setlist) {
      throw new Error('Setlist not found');
    }
    
    // Use direct API endpoint for removing a sheet from a setlist
    console.log(`Removing sheet ${sheetId} from setlist ${setlistId}`);
    const data = await fetchWithAuth(`${API_URL}/setlists/${setlistId}/sheets/${sheetId}`, {
      method: 'DELETE'
    });
    
    console.log('Sheet removed from setlist successfully:', data);
    return data.setlist;
  } catch (error) {
    console.error('Error removing sheet from setlist:', error);
    throw error;
  }
};

/**
 * Reorder sheets in a setlist
 * @param {string} setlistId - ID of the setlist
 * @param {number} oldIndex - Current index of the sheet
 * @param {number} newIndex - New index for the sheet
 * @returns {Promise<Object>} The updated setlist
 * @throws {Error} If user is not authenticated
 */
export const reorderSetlistSheets = async (setlistId, oldIndex, newIndex) => {
  try {
    // Require authentication
    const response = await fetchWithAuth(
      `${API_URL}/setlists/${setlistId}/reorder`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldIndex,
          newIndex,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to reorder setlist sheets: ${response.status}`);
    }

    const data = await response.json();
    console.log('Sheets reordered successfully:', data);
    return data.setlist;
  } catch (error) {
    console.error('Error reordering sheets in setlist:', error);
    throw error;
  }
};

/**
 * Add a setlist to the user's favorites (creates a copy for the user)
 * @param {string} setlistId - ID of the setlist to favorite
 * @returns {Promise<Object>} The newly created setlist copy
 * @throws {Error} If user is not authenticated
 */
export const favoriteSetlist = async (setlistId) => {
  console.log(`Starting favoriteSetlist operation for setlistId: ${setlistId}`);
  console.log('API_URL:', API_URL);
  
  // Get the authentication token
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  if (token) {
    // Log first few characters of token for debugging (avoid showing the full token)
    console.log('Token preview:', token.substring(0, 15) + '...');
  }
  
  if (!token) {
    console.error('No authentication token available');
    throw new Error('You must be logged in to add a setlist to your collection');
  }
  
  // Construct the API endpoint
  const endpoint = `${API_URL}/setlists/${setlistId}/favorite`;
  console.log(`Making API request to: ${endpoint}`);
  console.log('Request method: POST');
  
  try {
    // Make a direct fetch request to the API with proper authentication
    console.log('Making fetch request with the following config:');
    const config = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      // Empty body since we're just creating a copy
      body: JSON.stringify({}),
      credentials: 'include',
      mode: 'cors'
    };
    console.log('Request config:', JSON.stringify(config, null, 2));
    
    const response = await fetch(endpoint, config);

    console.log(`API response status: ${response.status}`);
    
    // Get the raw response text for debugging
    const responseText = await response.text();
    console.log('API Response raw text:', responseText ? responseText.substring(0, 100) + '...' : '');
    
    // Try to parse the response as JSON
    let data = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response data:', data);
      } catch (jsonError) {
        console.error('Response is not valid JSON:', jsonError);
      }
    }
    
    // Check if the request was successful
    if (!response.ok) {
      const errorMsg = data?.error || `Failed to add setlist: ${response.status}`;
      throw new Error(errorMsg);
    }

    // Return the created setlist, or a success indicator if no data
    if (data && data.setlist) {
      return data.setlist;
    } else if (data && data.success) {
      return { success: true, message: 'Setlist added to your collection' };
    } else {
      return { success: true, message: 'Setlist added successfully' };
    }
  } catch (error) {
    console.error('Error adding setlist to favorites:', error);
    throw error;
  }
};
