/**
 * Import Service - Handles importing sheets from JSON files
 */
import { API_URL } from './ApiService';
import { getAllSheets, getSheetById } from './SheetStorageService';

/**
 * Check for duplicate sheets in localStorage
 * @param {Array} sheets - Array of sheets to check
 * @returns {Object} Results of duplicate check
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
  
  console.log('importToStorage with options:', importOptions);
  
  const results = {
    total: sheets.length,
    imported: 0,
    skipped: 0,
    errors: []
  };
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const isAuthenticated = !!token;
  
  if (isAuthenticated) {
    // Use API to save to MongoDB
    try {
      // Use the correct import-export API endpoint
      const response = await fetch(`${API_URL}/import-export/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sheets,
          options: importOptions
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...results,
        imported: data.imported || sheets.length,
        skipped: data.skipped || 0,
        errors: data.errors || []
      };
    } catch (error) {
      console.error('Error saving to MongoDB:', error);
      throw error;
    }
  } else {
    // Save to localStorage
    for (const sheet of sheets) {
      try {
        // Check for duplicates
        const existingSheet = localStorage.getItem(`sheet_${sheet.id}`);
        
        if (existingSheet) {
          // Handle based on options
          if (importOptions.generateNewIds) {
            // We should have already generated new IDs in the pre-processing step
            // Just save the sheet with its current ID
            try {
              console.log(`Saving sheet with ID: ${sheet.id}`);
              
              // Save the sheet
              localStorage.setItem(`sheet_${sheet.id}`, JSON.stringify(sheet));
              console.log(`Successfully saved sheet with ID ${sheet.id}`);
              results.imported++;
            } catch (saveError) {
              console.error(`Error saving sheet ${sheet.id}:`, saveError);
              console.error('Full error:', saveError);
              results.errors.push({
                sheetId: sheet.id,
                error: saveError.message
              });
            }
          } else if (importOptions.skipDuplicates) {
            // Skip this sheet
            results.skipped++;
            continue;
          } else if (importOptions.overwriteDuplicates) {
            // Overwrite existing
            localStorage.setItem(`sheet_${sheet.id}`, JSON.stringify(sheet));
            results.imported++;
          } else {
            // Default to skip
            results.skipped++;
            continue;
          }
        } else {
          // No duplicate, just save
          localStorage.setItem(`sheet_${sheet.id}`, JSON.stringify(sheet));
          results.imported++;
        }
      } catch (error) {
        console.error(`Error saving sheet ${sheet.id}:`, error);
        results.errors.push({
          sheetId: sheet.id,
          error: error.message
        });
      }
    }
    
    return results;
  }
};

/**
 * Import a file from localStorage (single sheet format)
 * @param {File} file - The file to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import results
 */
export const importLocalStorageFile = async (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        // Parse JSON data
        const sheetData = JSON.parse(event.target.result);
        
        // Validate sheet data
        if (!sheetData.id || !sheetData.title) {
          throw new Error('Invalid sheet data. Missing required fields.');
        }
        
        // Check for duplicates
        const existingSheet = localStorage.getItem(`sheet_${sheetData.id}`);
        
        if (existingSheet && !options.generateNewIds && !options.overwriteDuplicates) {
          // Skip duplicate
          resolve({
            success: true,
            skipped: true,
            message: `Sheet "${sheetData.title}" already exists. Skipped.`
          });
          return;
        }
        
        // Import to storage
        const results = await importToStorage([sheetData], options);
        
        // Refresh sheet list
        await getAllSheets(true);
        
        resolve({
          success: true,
          results,
          message: `Imported sheet "${sheetData.title}" successfully.`
        });
      } catch (error) {
        console.error('Error importing file:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file.'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Import sheets from a JSON file
 * @param {File} file - The file to import
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

  console.log('Import options:', importOptions);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        // Parse JSON data
        const jsonData = JSON.parse(event.target.result);
        console.log('Detected file structure:', Object.keys(jsonData));
        
        // Determine the file type based on its structure
        let fileType;
        let sheetsToImport = [];
        
        // Case 1: Single sheet format (direct sheet object with id, title, sections)
        // This is the format used in localStorage and for single sheet exports
        if (jsonData.id && jsonData.title && jsonData.sections) {
          fileType = 'single_sheet';
          sheetsToImport = [jsonData];
          console.log('Detected single sheet format');
        }
        // Case 2: Multi-sheet export format with sheets array
        else if (jsonData.sheets && Array.isArray(jsonData.sheets) && jsonData.sheets.length > 0) {
          fileType = 'multi_sheet';
          sheetsToImport = jsonData.sheets;
          console.log('Detected multi-sheet format with', sheetsToImport.length, 'sheets');
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
          console.log('Found duplicates:', duplicateCheck.duplicates.length);
          resolve({
            success: true,
            needsUserInput: true,
            message: `Found ${duplicateCheck.duplicates.length} potential duplicate sheets. Please choose how to handle them.`,
            duplicateCheck
          });
          return;
        }
        
        // Pre-process sheets if generating new IDs
        if (options.generateNewIds && duplicateCheck.hasDuplicates) {
          console.log('Pre-processing sheets to generate new IDs');
          // Create a new array of sheets with new IDs for duplicates
          const processedSheets = [];
          
          for (const sheet of sheetsToImport) {
            // Check if this is a duplicate
            const isDuplicate = duplicateCheck.duplicates.some(dup => dup.id === sheet.id);
            
            if (isDuplicate) {
              // Generate a new ID
              const timestamp = Date.now();
              const random = Math.floor(Math.random() * 1000000);
              const newId = `${timestamp}_${random}`;
              
              // Create a copy with the new ID
              const newSheet = { ...sheet, id: newId };
              console.log(`Pre-processed: Generated new ID ${newId} for duplicate sheet ${sheet.id}`);
              processedSheets.push(newSheet);
            } else {
              // Not a duplicate, keep as is
              processedSheets.push(sheet);
            }
          }
          
          // Replace the original sheets with the processed ones
          sheetsToImport = processedSheets;
        }

        // Apply the selected duplicate handling option
        console.log('Handling duplicates with options:', options);
        
        // Handle different duplicate options
        if (duplicateCheck.hasDuplicates) {
          if (options.skipDuplicates) {
            console.log('Skipping all duplicates as requested');
            // If all sheets are duplicates and we're skipping them
            if (duplicateCheck.newSheets.length === 0) {
              resolve({
                success: true,
                message: `Import complete. 0 sheets imported, ${duplicateCheck.duplicates.length} skipped. 0 errors.`,
                results: {
                  total: sheetsToImport.length,
                  imported: 0,
                  skipped: duplicateCheck.duplicates.length,
                  errors: []
                }
              });
              return;
            }
            // If we have some new sheets to import
            sheetsToImport = duplicateCheck.newSheets;
            console.log(`Filtered out ${duplicateCheck.duplicates.length} duplicates, proceeding with ${sheetsToImport.length} new sheets`);
          } else if (options.generateNewIds) {
            console.log('Will generate new IDs for duplicates:', duplicateCheck.duplicates.length, 'duplicates found');
            // Log each duplicate for debugging
            duplicateCheck.duplicates.forEach((sheet, index) => {
              console.log(`Duplicate ${index + 1}:`, sheet.id, sheet.title);
            });
            // We don't filter out duplicates here, as we want to import them with new IDs
            // The actual ID generation happens in importToStorage
          } else if (options.overwriteDuplicates) {
            console.log('Will overwrite existing duplicates');
            // We don't filter out duplicates here, as we want to overwrite them
          }
        }

        // Log the final sheets to import
        console.log(`Final import list: ${sheetsToImport.length} sheets`);
        sheetsToImport.forEach((sheet, index) => {
          console.log(`Sheet ${index + 1}:`, sheet.id, sheet.title);
        });
        
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
                  console.error('Error importing individual sheet:', sheetError);
                  results.errors.push({
                    sheetId: sheet.id || 'unknown',
                    title: sheet.title || 'unknown',
                    error: sheetError.message
                  });
                }
              }

              resolve({
                success: true,
                message: `Imported ${results.imported} ${results.imported === 1 ? 'sheet' : 'sheets'}. ${results.skipped} skipped. ${results.errors.length} errors.`,
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
              console.log('Sending import request to API:', importUrl);
              console.log('With options:', options);

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
              console.log('API response status:', response.status, response.statusText);

              // Check if response is ok
              if (!response.ok) {
                const errorText = await response.text();
                console.error('API error response:', errorText);
                throw new Error(`API import failed with status: ${response.status} - ${response.statusText}`);
              }

              // Parse response data
              responseData = await response.json();
              console.log('API response data:', responseData);

              // If the API doesn't return imported/skipped counts, set default values
              if (!responseData.results) {
                responseData.results = {};
              }
              if (!responseData.results.imported && responseData.results.imported !== 0) {
                responseData.results.imported = 0; // Default to 0 imported if not provided
              }
              if (!responseData.results.skipped && responseData.results.skipped !== 0) {
                responseData.results.skipped = 0;
              }
              
              // Use the exact message from the backend if available
              const message = responseData.message || 
                `Import complete. ${responseData.results.imported} ${responseData.results.imported === 1 ? 'sheet' : 'sheets'} imported, ${responseData.results.skipped} skipped.`;
              
              console.log('Final import message:', message);
              
              resolve({
                success: true,
                message: message,
                results: responseData.results
              });
            } catch (apiError) {
              console.error('API import error:', apiError);
              throw new Error(`API import failed: ${apiError.message}`);
            }
          } catch (error) {
            console.error('Error during import:', error);
            reject(error);
          }
        } else {
          // Use localStorage for import
          try {
            console.log('Starting localStorage import with options:', options);
            const results = await importToStorage(sheetsToImport, options);
            console.log('Import results:', results);
            
            // Refresh sheet list
            await getAllSheets(true);
            console.log('Sheet list refreshed');
            
            resolve({
              success: true,
              message: `Imported ${results.imported} ${results.imported === 1 ? 'sheet' : 'sheets'}. ${results.skipped} skipped.`,
              results,
              fileType
            });
          } catch (error) {
            console.error('Error importing to localStorage:', error);
            reject(error);
          }
        }
      } catch (error) {
        console.error('Error parsing import file:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file.'));
    };

    reader.readAsText(file);
  });
};
