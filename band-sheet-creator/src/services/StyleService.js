/**
 * StyleService.js
 * Service for handling UI styling utilities and helper functions
 */

// Energy line configuration
export const ENERGY_LINE_CONFIG = {
  MIN_WIDTH_PERCENTAGE: 5,  // minimum width (5% of total width)
  MAX_WIDTH_PERCENTAGE: 75, // maximum width (75% of total width)
  HEIGHT: 2                 // height in pixels
};

/**
 * Calculates background color based on energy level
 * @param {number} energyLevel - Energy level from 1-10
 * @returns {string} RGB color value for the background
 */
export const getEnergyBackgroundColor = (energyLevel) => {
  // Convert energy level (1-10) to CSS gray scale (very light to very dark)
  const grayscaleValue = 235 - (energyLevel - 1) * 20; // 235 (very light) to 55 (very dark)
  return `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue})`;
};

/**
 * Calculates the width of the energy indicator line based on energy level
 * @param {number} energyLevel - Energy level from 1-10
 * @returns {string} CSS width value as viewport width percentage
 */
export const getEnergyLineWidth = (energyLevel) => {
  // Get configuration values
  const minWidth = ENERGY_LINE_CONFIG.MIN_WIDTH_PERCENTAGE;
  const maxWidth = ENERGY_LINE_CONFIG.MAX_WIDTH_PERCENTAGE;
  
  if (energyLevel === 1) {
    return `${minWidth}vw`;
  } else if (energyLevel === 10) {
    return `${maxWidth}vw`;
  } else {
    // Calculate a proportional width between the min and max
    // Linear interpolation between minWidth and maxWidth
    const widthVw = minWidth + ((maxWidth - minWidth) / 9) * (energyLevel - 1);
    
    return `${widthVw}vw`;
  }
};

/**
 * Adjusts a textarea's height to fit its content
 * @param {HTMLElement} textarea - The textarea element to adjust
 * @param {number} maxHeight - Optional maximum height in pixels (defaults to 200)
 */
export const adjustTextareaHeight = (textarea, maxHeight = 200) => {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(maxHeight, textarea.scrollHeight) + 'px';
};

/**
 * Calculates the appropriate height for text content
 * @param {string} text - The text content to measure
 * @param {boolean} isTextarea - Whether this is multiline content
 * @param {boolean} small - Whether to use small text size
 * @param {number} minHeight - Minimum height in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @returns {number} The calculated height in pixels
 */
export const calculateContentHeight = (text, isTextarea = true, small = false, minHeight = 40, maxHeight = 200) => {
  // Return minimum height for empty or whitespace-only content
  if (!text || text.trim() === '') return minHeight;
  
  try {
    // Create a temporary measuring div
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.height = 'auto';
    measurer.style.width = isTextarea ? '200px' : 'auto'; // Approximate width for textarea
    measurer.style.padding = '8px';
    measurer.style.fontSize = small ? '0.75rem' : '0.875rem';
    measurer.style.lineHeight = '1.5';
    measurer.style.whiteSpace = isTextarea ? 'pre-wrap' : 'nowrap';
    
    // Set the text content
    measurer.textContent = text;
    
    // Add to DOM, measure, then remove
    document.body.appendChild(measurer);
    
    // Calculate height based on content
    // Add a small buffer (4px) for padding, but don't add too much
    const contentHeight = measurer.offsetHeight;
    const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, contentHeight + 4));
    
    // Clean up
    document.body.removeChild(measurer);
    
    return calculatedHeight;
  } catch (error) {
    console.error('Error calculating content height:', error);
    return minHeight; // Fallback to minimum height if measurement fails
  }
};
