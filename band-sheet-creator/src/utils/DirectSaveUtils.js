/**
 * DirectSaveUtils.js
 * 
 * A direct implementation of the save functionality that works with the keyboard shortcut.
 * This bypasses the problematic authentication handling in other parts of the application.
 */

import { isAuthenticated } from './AuthUtils';
import logger from '../services/LoggingService';
import eventBus from './EventBus';

/**
 * Directly save the current sheet using the same logic that works with the keyboard shortcut
 * 
 * @param {Function} saveCurrentSheet - The saveCurrentSheet function from context
 * @param {Function} clearTemporaryDraft - Function to clear temporary drafts 
 */
export const directSaveSheet = async (saveCurrentSheet, clearTemporaryDraft) => {
  try {
    logger.debug('DirectSaveUtils', 'Starting direct save operation');
    
    // Check authentication using the same approach as the keyboard shortcut
    if (isAuthenticated()) {
      logger.debug('DirectSaveUtils', 'User is authenticated, proceeding with save');
      
      // Call the save function directly
      const result = await saveCurrentSheet();
      
      // Show success notification
      eventBus.emit('show-notification', {
        message: 'Sheet saved successfully',
        type: 'success'
      });
      
      // Clear temporary draft after successful save
      if (clearTemporaryDraft) {
        clearTemporaryDraft();
      }
      
      logger.debug('DirectSaveUtils', 'Save completed successfully');
      return result;
    } else {
      logger.debug('DirectSaveUtils', 'User is not authenticated, showing notification');
      
      // Show login required notification
      eventBus.emit('show-notification', {
        message: 'Please log in to save your sheet',
        type: 'error'
      });
      
      return null;
    }
  } catch (error) {
    logger.error('DirectSaveUtils', 'Error in direct save operation:', error);
    
    // Show error notification
    eventBus.emit('show-notification', {
      message: `Error saving sheet: ${error.message}`,
      type: 'error'
    });
    
    return null;
  }
};

/**
 * Direct implementation for saving sheet as new
 */
export const directSaveSheetAs = async (saveCurrentSheet, clearTemporaryDraft) => {
  try {
    logger.debug('DirectSaveUtils', 'Starting direct save-as operation');
    
    // Check authentication using the same approach as the keyboard shortcut
    if (isAuthenticated()) {
      logger.debug('DirectSaveUtils', 'User is authenticated, proceeding with save-as');
      
      // Call the save function directly with saveAsNew flag
      const result = await saveCurrentSheet(true);
      
      // Show success notification
      eventBus.emit('show-notification', {
        message: 'Sheet saved as new successfully',
        type: 'success'
      });
      
      // Clear temporary draft after successful save
      if (clearTemporaryDraft) {
        clearTemporaryDraft();
      }
      
      logger.debug('DirectSaveUtils', 'Save-as completed successfully');
      return result;
    } else {
      logger.debug('DirectSaveUtils', 'User is not authenticated, showing notification');
      
      // Show login required notification
      eventBus.emit('show-notification', {
        message: 'Please log in to save your sheet as new',
        type: 'error'
      });
      
      return null;
    }
  } catch (error) {
    logger.error('DirectSaveUtils', 'Error in direct save-as operation:', error);
    
    // Show error notification
    eventBus.emit('show-notification', {
      message: `Error saving sheet as new: ${error.message}`,
      type: 'error'
    });
    
    return null;
  }
};

export default {
  directSaveSheet,
  directSaveSheetAs
};
