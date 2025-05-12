/**
 * ImportExportService.js
 * Service for handling sheet export and import operations
 */

import { fetchWithAuth } from './ApiService';
import { getAllSheets, getSheetById } from './SheetStorageService';
import { v4 as uuidv4 } from 'uuid';
import { isAuthenticated as checkAuth, getAuthToken } from '../utils/AuthUtils';
import logger from './LoggingService';

// Import the API_URL from ApiService to ensure consistency
import { API_URL } from './ApiService';

/**
 * Export a single sheet to a JSON file
 * @param {string} sheetId - ID of the sheet to export
 * @returns {Promise<Object>} Promise that resolves when export is complete
 */
export const exportSingleSheet = async (sheetId) => {
  try {
    // Get the sheet from storage
    const sheet = await getSheetById(sheetId);
    
    if (!sheet) {
      throw new Error(`Sheet with ID ${sheetId} not found`);
    }
    
    // Export the sheet directly (same format as localStorage)
    // This makes it consistent with the localStorage format
    const jsonData = JSON.stringify(sheet, null, 2);
    
    // Create a blob and download
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a safe filename based on the sheet title
    const safeTitle = sheet.title.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeTitle}_${sheet.id}.json`;
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    return { success: true, message: `Sheet "${sheet.title}" exported successfully` };
  } catch (error) {
    logger.error('ImportExportService', 'Error exporting sheet:', error);
    return { success: false, error: error.message };
  }
};

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
    const token = getAuthToken();
    const isAuthenticated = checkAuth();
    
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
            logger.error('ImportExportService', `Error fetching complete data for sheet ${sheetInfo.id}:`, error);
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
        logger.error('ImportExportService', `Error processing sheet ${sheetInfo.id}:`, error);
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
    logger.error('ImportExportService', 'Export failed:', error);
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
    duplicates: [],
    newSheets: [],
    hasDuplicates: false
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
      results.duplicates.push(sheet);
      results.hasDuplicates = true;
    } else {
      // This is a new sheet
      results.newSheets.push(sheet);
    }
  }
  
  return results;
};

/**
 * Helper function to import sheets to storage (MongoDB or localStorage)
 * @param {Array} sheets - Array of sheet objects to import
 * @param {Object} options - Import options
 * @param {boolean} options.generateNewIds - Whether to generate new IDs for duplicates
 * @returns {Promise<Object>} Import results
 */
const importToStorage = async (sheets, options = {}) => {
  const importOptions = {
    generateNewIds: options.generateNewIds || false,
    skipDuplicates: options.skipDuplicates || false,
    overwriteDuplicates: options.overwriteDuplicates || false,
    ...options
  };
  
  logger.debug('ImportExportService', 'importToStorage with options:', importOptions);
  
  const results = {
    total: sheets.length,
    imported: 0,
    skipped: 0,
    errors: []
  };
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  
  // Process each sheet
  for (const sheet of sheets) {
    try {
      // Check if sheet already exists
      const existingSheet = localStorage.getItem(`sheet_${sheet.id}`);
      
      // Prepare the sheet to save
      let sheetToSave = { ...sheet };
      let storageKey = `sheet_${sheet.id}`;
      
      // Handle duplicates based on options
      if (existingSheet) {
        if (importOptions.generateNewIds) {
          // Generate a new unique ID
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000000);
          const newId = `${timestamp}_${random}`;
          
          sheetToSave = {
            ...sheet,
            id: newId,
            dateModified: new Date().toISOString(),
            originalId: sheet.id // Keep track of the original ID for reference
          };
          
          storageKey = `sheet_${newId}`;
        } else {
          // Skip this sheet
          logger.debug('ImportExportService', 'Skipping duplicate sheet:', sheet.title);
          results.skipped++;
          continue;
        }
      }
      
      if (isAuthenticated && API_URL) {
        try {
          // Save to MongoDB via API
          logger.debug('ImportExportService', 'Saving sheet to MongoDB:', sheetToSave.title);
          
          // If this is a new sheet (generated ID), remove the _id field
          if (options.generateNewIds) {
            delete sheetToSave._id;
          }
          
          // Determine if we should create or update
          const method = existingSheet && options.overwriteDuplicates ? 'PUT' : 'POST';
          const url = method === 'PUT' ? `${API_URL}/sheets/${sheetToSave.id}` : `${API_URL}/sheets`;
          
          const response = await fetchWithAuth(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(sheetToSave)
          });
          
          if (!response.ok) {
            throw new Error(`API save failed with status: ${response.status}`);
          }
          
          // Also save to localStorage as backup
          localStorage.setItem(storageKey, JSON.stringify(sheetToSave));
          results.imported++;
        } catch (apiError) {
          logger.error('ImportExportService', 'Error saving to API, falling back to localStorage:', apiError);
          // Fall back to localStorage
          localStorage.setItem(storageKey, JSON.stringify(sheetToSave));
          results.imported++;
        }
      } else {
        // Save to localStorage only
        logger.debug('ImportExportService', 'Saving sheet to localStorage:', sheetToSave.title);
        localStorage.setItem(storageKey, JSON.stringify(sheetToSave));
        results.imported++;
      }
    } catch (err) {
      logger.error('ImportExportService', 'Error importing sheet:', err);
      results.errors.push({
        sheetId: sheet.id || 'unknown',
        title: sheet.title || 'unknown',
        error: err.message
      });
    }
  }
  
  logger.debug('ImportExportService', 'Import results:', results);
  return results;
};

/**
 * Import a single sheet from a local storage JSON file
 * @param {File} file - The JSON file to import
 * @param {Object} options - Import options
 * @param {boolean} options.generateNewIds - Whether to generate new IDs for duplicates
 * @param {boolean} options.skipDuplicates - Whether to skip duplicate sheets
 * @param {boolean} options.overwriteDuplicates - Whether to overwrite duplicate sheets
 * @returns {Promise<Object>} Import results
 */
export const importLocalStorageFile = async (file, options = {}) => {
  // Set default options if not provided
  const importOptions = {
    generateNewIds: options.generateNewIds || false,
    skipDuplicates: options.skipDuplicates || false,
    overwriteDuplicates: options.overwriteDuplicates || false,
    ...options
  };
  
  logger.debug('ImportExportService', 'Import local storage file options:', importOptions);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // Parse JSON data
        const jsonData = JSON.parse(event.target.result);
        
        // Validate import data - for local storage files, the sheet data is the entire file
        if (!jsonData || !jsonData.id || !jsonData.title) {
          throw new Error('Invalid local storage file. No valid sheet data found.');
        }
        
        // Get token to check if we should use API
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('You must be logged in to import sheets to the database');
        }
        
        // Prepare the sheet for MongoDB
        const sheetToSave = { ...jsonData };
        
        // Check if we should generate new IDs or check for duplicates
        if (importOptions.generateNewIds || (!importOptions.skipDuplicates && !importOptions.overwriteDuplicates)) {
          // Always remove _id field to avoid conflicts with MongoDB's auto-generated _id
          delete sheetToSave._id;
          
          // Generate a new ID to avoid duplicates
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000000);
          sheetToSave.id = `${timestamp}_${random}`;
          sheetToSave.dateModified = new Date().toISOString();
        } else if (importOptions.overwriteDuplicates) {
          // Remove _id field but keep the original ID for overwriting
          delete sheetToSave._id;
          sheetToSave.dateModified = new Date().toISOString();
        }
        
        // Save directly to MongoDB via API
        try {
          logger.debug('ImportExportService', 'Saving sheet to MongoDB:', sheetToSave.title);
          logger.debug('ImportExportService', 'Sheet data:', JSON.stringify(sheetToSave, null, 2));
          
          // Save to localStorage first as a backup
          const storageKey = `sheet_${sheetToSave.id}`;
          localStorage.setItem(storageKey, JSON.stringify(sheetToSave));
          
          try {
            // Use POST to create a new sheet
            const response = await fetch(`${API_URL}/sheets`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(sheetToSave)
            });
            
            // Check if the response is ok
            if (!response.ok) {
              const errorText = await response.text();
              logger.error('ImportExportService', 'API response not OK:', response.status, errorText);
              throw new Error(`API save failed with status: ${response.status} - ${errorText}`);
            }
            
            // Try to parse the response as JSON
            let responseData;
            try {
              responseData = await response.json();
              logger.debug('ImportExportService', 'API response:', responseData);
            } catch (jsonError) {
              console.warn('Could not parse response as JSON:', jsonError);
              // Continue anyway since we already saved to localStorage
            }
            
            resolve({
              success: true,
              message: `Imported sheet "${sheetToSave.title}" to database successfully.`,
              results: {
                imported: 1,
                skipped: 0,
                errors: []
              }
            });
          } catch (apiError) {
            logger.error('ImportExportService', 'API save error:', apiError);
            // Since we already saved to localStorage, consider it a partial success
            resolve({
              success: true,
              message: `Imported sheet "${sheetToSave.title}" to localStorage (API save failed: ${apiError.message}).`,
              results: {
                imported: 1,
                skipped: 0,
                errors: []
              }
            });
          }
        } catch (apiError) {
          logger.error('ImportExportService', 'Error saving to MongoDB:', apiError);
          throw apiError;
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

/**
 * Universal import function that handles all types of sheet files
 * @param {File} file - The JSON file to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import results
 */
export const importSheets = async (file, options = {}) => {
  // Set default options if not provided
  const importOptions = {
    generateNewIds: options.generateNewIds || false,
    skipDuplicates: options.skipDuplicates || false,
    overwriteDuplicates: options.overwriteDuplicates || false,
    ...options
  };
  
  logger.debug('ImportExportService', 'Import options:', importOptions);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // Parse JSON data
        const jsonData = JSON.parse(event.target.result);
        logger.debug('ImportExportService', 'Detected file structure:', Object.keys(jsonData));
        
        // Determine the file type based on its structure
        let fileType;
        let sheetsToImport = [];
        
        // Case 1: Single sheet format (direct sheet object with id, title, sections)
        // This is the format used in localStorage and for single sheet exports
        if (jsonData.id && jsonData.title && jsonData.sections) {
          fileType = 'single_sheet';
          sheetsToImport = [jsonData];
          logger.debug('ImportExportService', 'Detected single sheet format');
        }
        // Case 2: Multi-sheet export format with sheets array
        else if (jsonData.sheets && Array.isArray(jsonData.sheets) && jsonData.sheets.length > 0) {
          fileType = 'multi_sheet';
          sheetsToImport = jsonData.sheets;
          logger.debug('ImportExportService', 'Detected multi-sheet format with', sheetsToImport.length, 'sheets');
        }
        // Case 3: Unknown format
        else {
          throw new Error('Invalid import file. Could not determine file format.');
        }
        
        // Get token to check if we should use API
        const token = localStorage.getItem('token');
        const isAuthenticated = !!token;
        
        // First, check for duplicates regardless of whether we're using API or localStorage
        const duplicateCheck = checkForDuplicates(sheetsToImport);
        
        // If there are potential duplicates and we haven't specified options yet,
        // return the duplicate check results so the UI can ask the user what to do
        if (duplicateCheck.hasDuplicates && 
            !options.generateNewIds && 
            !options.skipDuplicates && 
            !options.overwriteDuplicates) {
          logger.debug('ImportExportService', 'Found duplicates:', duplicateCheck.duplicates.length);
          resolve({
            success: true,
            needsUserInput: true,
            message: `Found ${duplicateCheck.duplicates.length} potential duplicate sheets. Please choose how to handle them.`,
            duplicateCheck
          });
          return;
        }
        
        // Apply the selected duplicate handling option
        logger.debug('ImportExportService', 'Handling duplicates with options:', options);
        
        // Process based on file type and authentication status
        if (isAuthenticated) {
          // Use API for import
          try {
            // For single sheets, handle them directly
            if (fileType === 'single_sheet') {
              // Import each sheet individually
              const results = {
                total: sheetsToImport.length,
                imported: 0,
                skipped: 0,
                errors: []
              };
              
              for (const sheet of sheetsToImport) {
                try {
                  // Create a new file with the sheet data
                  const sheetBlob = new Blob([JSON.stringify(sheet)], { type: 'application/json' });
                  const sheetFile = new File([sheetBlob], 'sheet.json', { type: 'application/json' });
                  
                  // Import the sheet using our single sheet import function
                  const sheetResult = await importLocalStorageFile(sheetFile, options);
                  
                  if (sheetResult.success) {
                    results.imported++;
                  } else if (sheetResult.skipped) {
                    results.skipped++;
                  }
                } catch (sheetError) {
                  logger.error('ImportExportService', 'Error importing individual sheet:', sheetError);
                  results.errors.push({
                    sheetId: sheet.id || 'unknown',
                    title: sheet.title || 'unknown',
                    error: sheetError.message
                  });
                }
              }
              
              resolve({
                success: true,
                message: `Imported ${results.imported} sheets. ${results.skipped} skipped. ${results.errors.length} errors.`,
                results,
                fileType
              });
              return;
            }
            
            // For export bundles, use the API import endpoint
            let responseData;
            try {
              // The correct endpoint is /api/import-export/import
              const importUrl = `${API_URL}/import-export/import`;
              logger.debug('ImportExportService', 'Sending import request to API:', importUrl);
              logger.debug('ImportExportService', 'With options:', options);
              
              const response = await fetch(importUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                  sheets: sheetsToImport,
                  importOptions: {
                    generateNewIds: options.generateNewIds || false,
                    skipDuplicates: options.skipDuplicates || false,
                    overwriteDuplicates: options.overwriteDuplicates || false
                  }
                })
              });
              
              // Log the raw response for debugging
              logger.debug('ImportExportService', 'API response status:', response.status, response.statusText);
              
              // Check if response is ok
              if (!response.ok) {
                const errorText = await response.text();
                logger.error('ImportExportService', 'API error response:', errorText);
                throw new Error(`API import failed with status: ${response.status} - ${response.statusText}`);
              }
              
              // Parse response data
              responseData = await response.json();
              logger.debug('ImportExportService', 'API response data:', responseData);
              
              // If the API doesn't return imported/skipped counts, set default values
              if (!responseData.results) {
                responseData.results = {};
              }
              if (!responseData.results.imported && responseData.results.imported !== 0) {
                responseData.results.imported = sheetsToImport.length;
              }
              if (!responseData.results.skipped && responseData.results.skipped !== 0) {
                responseData.results.skipped = 0;
              }
              
              resolve({
                success: true,
                message: responseData.message || `Imported ${responseData.results.imported} ${responseData.results.imported === 1 ? 'sheet' : 'sheets'}. ${responseData.results.skipped} skipped.`,
                results: responseData.results || responseData,
                fileType
              });
            } catch (fetchError) {
              logger.error('ImportExportService', 'Fetch error during import:', fetchError);
              throw new Error(`API import failed: ${fetchError.message}`);
            }
          } catch (error) {
            logger.error('ImportExportService', 'API import error:', error);
            
            // Check if we have a specific API endpoint issue
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
              reject(new Error(`Cannot connect to the API server. Please check your network connection and ensure the server is running.`));
            } else {
              // Don't fall back to localStorage for authenticated users
              // Instead, show the error directly with more details
              reject(new Error(`Failed to import to MongoDB: ${error.message}. Please check the console for more details.`));
            }
          }
        } else {
          // Use localStorage for import - duplicates have already been checked above
          try {
            const results = await importToStorage(sheetsToImport, options);
            
            // Ensure we have valid counts
            if (!results.imported && results.imported !== 0) {
              results.imported = sheetsToImport.length - (results.skipped || 0);
            }
            if (!results.skipped && results.skipped !== 0) {
              results.skipped = 0;
            }
            
            resolve({
              success: true,
              message: `Imported ${results.imported} ${results.imported === 1 ? 'sheet' : 'sheets'} to localStorage. ${results.skipped} skipped.`,
              results,
              fileType
            });
          } catch (error) {
            reject(error);
          }
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
