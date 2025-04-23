/**
 * ImportExportService.js
 * Service for handling sheet export and import operations
 */

import { fetchWithAuth } from './ApiService';
import { getAllSheets } from './SheetStorageService';

// Get the API URL from environment or use default
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

/**
 * Export all sheets to a JSON file
 * @returns {Promise<void>} Promise that resolves when export is complete
 */
export const exportSheets = async () => {
  try {
    // Get all sheets from API or localStorage
    const sheets = await getAllSheets();
    
    if (!sheets || sheets.length === 0) {
      throw new Error('No sheets found to export');
    }
    
    // Create export object with metadata
    const exportData = {
      exportDate: new Date(),
      sheetsCount: sheets.length,
      sheets: sheets
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
      message: `${sheets.length} sheets exported successfully`
    };
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
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
            const response = await fetchWithAuth(`${API_URL}/sheets/import`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sheets: jsonData.sheets }),
            });
            
            resolve(response);
          } catch (apiError) {
            console.error('API import failed:', apiError);
            reject(apiError);
          }
        } else {
          // Use localStorage for import
          const results = {
            total: jsonData.sheets.length,
            imported: 0,
            skipped: 0,
            errors: []
          };
          
          // Process each sheet
          for (const sheet of jsonData.sheets) {
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
