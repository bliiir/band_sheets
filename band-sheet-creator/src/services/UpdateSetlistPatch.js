/**
 * Patched version of updateSetlist function to fix "Failed to save changes" issue
 */

import { API_URL } from './ApiService';

export const updateSetlist = async (id, setlistData) => {
  const formattedId = id.toString();
  
  // Check for authentication
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('User not authenticated, cannot update setlist');
    return null;
  }
  
  try {
    console.log(`Updating setlist ${formattedId} in MongoDB with authentication`);
    console.log('Update payload:', setlistData);
    
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
};
