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
 * Helper function to check for duplicate sheets in localStorage
 * @param {Array} sheets - Array of sheet objects to check
 * @returns {Object} Results with potential duplicates
 */
export const checkForDuplicates = (sheets) => {
  const results = {
    total: sheets.length,
    potentialDuplicates: [],
    newSheets: []
  };
  
  // Check each sheet for potential duplicates
  for (const sheet of sheets) {
    const existingSheet = localStorage.getItem(`sheet_${sheet.id}`);
    
    if (existingSheet) {
      // This is a potential duplicate
      const parsedExisting = JSON.parse(existingSheet);
      results.potentialDuplicates.push({
        importSheet: sheet,
        existingSheet: parsedExisting
      });
    } else {
      // This is a new sheet
      results.newSheets.push(sheet);
    }
  }
  
  return results;
};

/**
 * Helper function to import sheets to localStorage
 * @param {Array} sheets - Array of sheet objects to import
 * @param {Object} options - Import options
 * @param {boolean} options.generateNewIds - Whether to generate new IDs for duplicates
 * @returns {Object} Import results
 */
const importToLocalStorage = (sheets, options = {}) => {
  const { generateNewIds = false } = options;
  
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
      
      if (existingSheet && !generateNewIds) {
        // Skip this sheet if it exists and we're not generating new IDs
        results.skipped++;
        continue;
      }
      
      // Prepare the sheet to save
      let sheetToSave = { ...sheet };
      
      // Generate a new ID if needed
      if (existingSheet && generateNewIds) {
        const newId = `sheet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        sheetToSave = {
          ...sheet,
          id: newId,
          dateModified: new Date().toISOString(),
          originalId: sheet.id // Keep track of the original ID for reference
        };
        
        // Save with the new ID
        localStorage.setItem(`sheet_${newId}`, JSON.stringify(sheetToSave));
      } else {
        // Save with the original ID
        localStorage.setItem(`sheet_${sheet.id}`, JSON.stringify(sheetToSave));
      }
      
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
 * @param {Object} options - Import options
 * @param {boolean} options.generateNewIds - Whether to generate new IDs for duplicates
 * @returns {Promise<Object>} Import results
 */
export const importSheets = async (file, options = {}) => {
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
            // If we're using the API, we need to check for duplicates first
            // The API will handle duplicates on its own
            const response = await fetchWithAuth(`${API_URL}/import-export/import`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...jsonData,
                importOptions: options
              })
            });
            
            // Check if response is ok
            if (!response.ok) {
              throw new Error(`API import failed with status: ${response.status}`);
            }
            
            // Parse response data
            const responseData = await response.json();
            
            resolve({
              success: true,
              message: responseData.message || `Imported ${responseData.imported} sheets. ${responseData.skipped} skipped.`,
              results: responseData
            });
          } catch (error) {
            // Handle network errors
            if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
              console.error('Network error during import:', error);
              
              // Fall back to localStorage if API fails
              const fallbackResults = importToLocalStorage(jsonData.sheets, options);
              return {
                success: true,
                message: `API import failed, but imported ${fallbackResults.imported} sheets to localStorage. ${fallbackResults.skipped} skipped.`,
                results: fallbackResults,
                usingFallback: true
              };
            }
            
            // Fall back to localStorage if API fails
            try {
              const fallbackResults = importToLocalStorage(jsonData.sheets, options);
              resolve({
                success: true,
                message: `API import failed, but imported ${fallbackResults.imported} sheets to localStorage. ${fallbackResults.skipped} skipped.`,
                results: fallbackResults,
                usingFallback: true
              });
            } catch (localError) {
              reject(localError);
            }
          }
        } else {
          // Use localStorage for import
          // First, check for duplicates
          const duplicateCheck = checkForDuplicates(jsonData.sheets);
          
          // If there are potential duplicates and we haven't specified options yet,
          // return the duplicate check results so the UI can ask the user what to do
          if (duplicateCheck.potentialDuplicates.length > 0 && !('generateNewIds' in options)) {
            resolve({
              success: true,
              needsUserInput: true,
              message: `Found ${duplicateCheck.potentialDuplicates.length} potential duplicate sheets. Please choose how to handle them.`,
              duplicateCheck
            });
            return;
          }
          
          // Otherwise, proceed with import using the specified options
          const results = importToLocalStorage(jsonData.sheets, options);
          
          resolve({
            success: true,
            message: `Imported ${results.imported} sheets to localStorage. ${results.skipped} skipped.`,
            results
          });
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};
