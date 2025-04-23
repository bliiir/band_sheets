/**
 * ImportExportService.js
 * Service for handling sheet export and import operations
 */

import { fetchWithAuth } from './ApiService';
import { getAllSheets } from './SheetStorageService';

// Import the API_URL from ApiService to ensure consistency
import { API_URL } from './ApiService';

/**
 * Export all sheets to a JSON file
 * @returns {Promise<Object>} Promise that resolves when export is complete
 */
export const exportSheets = async () => {
  try {
    // Get all sheets from API or localStorage without triggering UI updates
    const sheetList = await getAllSheets(true, true); // sortByNewest=true, skipUIRefresh=true
    
    if (!sheetList || sheetList.length === 0) {
      throw new Error('No sheets found to export');
    }
    
    // Fetch the complete data for each sheet
    const completeSheets = [];
    const token = localStorage.getItem('token');
    const isAuthenticated = !!token;
    
    // For each sheet in the list, get its complete data
    for (const sheetInfo of sheetList) {
      try {
        let completeSheet;
        
        if (isAuthenticated && API_URL) {
          // Get complete sheet data from API
          try {
            const response = await fetchWithAuth(`${API_URL}/sheets/${sheetInfo.id}`);
            completeSheet = response.data;
          } catch (error) {
            console.error(`Error fetching complete data for sheet ${sheetInfo.id}:`, error);
            // Try localStorage as fallback
            const localData = localStorage.getItem(`sheet_${sheetInfo.id}`);
            if (localData) {
              completeSheet = JSON.parse(localData);
            }
          }
        } else {
          // Get from localStorage
          const localData = localStorage.getItem(`sheet_${sheetInfo.id}`);
          if (localData) {
            completeSheet = JSON.parse(localData);
          }
        }
        
        if (completeSheet) {
          completeSheets.push(completeSheet);
        }
      } catch (error) {
        console.error(`Error processing sheet ${sheetInfo.id}:`, error);
      }
    }
    
    if (completeSheets.length === 0) {
      throw new Error('Failed to retrieve complete data for any sheets');
    }
    
    // Create export object with metadata
    const exportData = {
      exportDate: new Date(),
      sheetsCount: completeSheets.length,
      sheets: completeSheets
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `band_sheets_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      message: `${completeSheets.length} sheets exported successfully`
    };
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
};

/**
 * Helper function to import sheets to localStorage
 * @param {Array} sheets - Array of sheet objects to import
 * @returns {Object} Import results
 */
const importToLocalStorage = (sheets) => {
  const results = {
    total: sheets.length,
    imported: 0,
    skipped: 0,
    errors: []
  };
  
  // Process each sheet
  for (const sheet of sheets) {
    try {
      // Check if sheet already exists
      const existingSheet = localStorage.getItem(`sheet_${sheet.id}`);
      
      if (existingSheet) {
        // Skip this sheet
        results.skipped++;
        continue;
      }
      
      // Save to localStorage
      localStorage.setItem(`sheet_${sheet.id}`, JSON.stringify(sheet));
      results.imported++;
    } catch (err) {
      results.errors.push({
        sheetId: sheet.id || 'unknown',
        title: sheet.title || 'unknown',
        error: err.message
      });
    }
  }
  
  return results;
};

/**
 * Import sheets from a JSON file
 * @param {File} file - The JSON file to import
 * @returns {Promise<Object>} Import results
 */
export const importSheets = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // Parse JSON data
        const jsonData = JSON.parse(event.target.result);
        
        // Validate import data
        if (!jsonData.sheets || !Array.isArray(jsonData.sheets) || jsonData.sheets.length === 0) {
          throw new Error('Invalid import file. No sheets found.');
        }
        
        // Get token to check if we should use API
        const token = localStorage.getItem('token');
        
        if (token) {
          // Use API for import
          try {
            const response = await fetchWithAuth(`${API_URL}/import-export/import`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sheets: jsonData.sheets }),
            }).catch(error => {
              // Handle network errors
              console.error('Network error during import:', error);
              
              // Fall back to localStorage if API fails
              const fallbackResults = importToLocalStorage(jsonData.sheets);
              return {
                success: true,
                message: `API import failed, but imported ${fallbackResults.imported} sheets to localStorage. ${fallbackResults.skipped} skipped.`,
                results: fallbackResults,
                usingFallback: true
              };
            });
            
            resolve(response);
          } catch (apiError) {
            console.error('API import failed:', apiError);
            
            // Fall back to localStorage if API fails
            try {
              const fallbackResults = importToLocalStorage(jsonData.sheets);
              resolve({
                success: true,
                message: `API import failed, but imported ${fallbackResults.imported} sheets to localStorage. ${fallbackResults.skipped} skipped.`,
                results: fallbackResults,
                usingFallback: true
              });
            } catch (fallbackError) {
              reject(apiError); // If fallback also fails, reject with original error
            }
          }
        } else {
          // Use localStorage for import
          const results = importToLocalStorage(jsonData.sheets);
          
          resolve({
            success: true,
            message: `Import complete. ${results.imported} sheets imported, ${results.skipped} skipped.`,
            results
          });
        }
      } catch (error) {
        console.error('Import failed:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
