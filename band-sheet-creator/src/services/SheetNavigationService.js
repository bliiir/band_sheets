/**
 * SheetNavigationService
 * 
 * This service encapsulates the logic for sheet navigation and loading,
 * providing a clean interface that separates concerns and reduces coupling
 * between components.
 */
import { NAV_SOURCE } from '../contexts/NavigationContext';

/**
 * Manages sheet navigation and loading
 * @param {Object} dependencies - Service dependencies
 * @param {Function} dependencies.loadSheet - Function to load a sheet by ID
 * @param {Function} dependencies.setLoadedSheet - Function to update loaded sheet state
 * @param {Function} dependencies.setNavSource - Function to update navigation source
 * @param {Function} dependencies.navigateToSheet - Function to navigate to a sheet URL
 * @param {Function} dependencies.showNotification - Function to show notifications
 * @param {Function} dependencies.clearTemporaryDraft - Function to clear temporary drafts
 */
export default class SheetNavigationService {
  constructor(dependencies) {
    this.loadSheet = dependencies.loadSheet;
    this.setLoadedSheet = dependencies.setLoadedSheet;
    this.setNavSource = dependencies.setNavSource;
    this.navigateToSheet = dependencies.navigateToSheet;
    this.showNotification = dependencies.showNotification;
    this.clearTemporaryDraft = dependencies.clearTemporaryDraft;
  }

  /**
   * Load a sheet from a URL parameter
   * @param {string} sheetId - The sheet ID to load
   * @returns {Promise<boolean>} - True if the sheet was loaded successfully
   */
  async loadSheetFromUrl(sheetId) {
    if (!sheetId) return false;
    
    console.log(`SheetNavigationService: Loading sheet from URL: ${sheetId}`);
    
    try {
      // Set navigation source first to prevent circular updates
      this.setNavSource(NAV_SOURCE.URL);
      
      // Load the sheet
      const success = await this.loadSheet(sheetId);
      
      if (success) {
        // Update state with loaded sheet
        this.setLoadedSheet(sheetId, NAV_SOURCE.URL);
        this.showNotification('Sheet loaded successfully');
        
        // Clear temporary draft
        if (this.clearTemporaryDraft) {
          this.clearTemporaryDraft();
        }
        
        return true;
      } else {
        this.showNotification('Failed to load sheet', 'error');
        return false;
      }
    } catch (error) {
      console.error('SheetNavigationService: Error loading sheet from URL:', error);
      this.showNotification(`Error loading sheet: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Load a sheet from browser history navigation
   * @param {string} sheetId - The sheet ID to load
   * @returns {Promise<boolean>} - True if the sheet was loaded successfully
   */
  async loadSheetFromHistory(sheetId) {
    if (!sheetId) return false;
    
    console.log(`SheetNavigationService: Loading sheet from history: ${sheetId}`);
    
    try {
      // Set navigation source first to prevent circular updates
      this.setNavSource(NAV_SOURCE.HISTORY);
      
      // Load the sheet
      const success = await this.loadSheet(sheetId);
      
      if (success) {
        // Update state with loaded sheet
        this.setLoadedSheet(sheetId, NAV_SOURCE.HISTORY);
        this.showNotification('Sheet loaded successfully');
        return true;
      } else {
        this.showNotification('Failed to load sheet', 'error');
        return false;
      }
    } catch (error) {
      console.error('SheetNavigationService: Error loading sheet from history:', error);
      this.showNotification(`Error loading sheet: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Navigate to a sheet internally
   * @param {string} sheetId - The sheet ID to navigate to
   */
  navigateInternally(sheetId) {
    if (!sheetId) return;
    
    console.log(`SheetNavigationService: Internal navigation to sheet: ${sheetId}`);
    
    // Mark as internal navigation
    this.setNavSource(NAV_SOURCE.INTERNAL);
    
    // Navigate to the sheet
    this.navigateToSheet(sheetId);
  }
}

/**
 * Create a sheet navigation service with the provided dependencies
 * @param {Object} dependencies - Service dependencies
 * @returns {SheetNavigationService} - Configured sheet navigation service
 */
export function createSheetNavigationService(dependencies) {
  return new SheetNavigationService(dependencies);
}
