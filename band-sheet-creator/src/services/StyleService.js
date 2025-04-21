/**
 * StyleService.js
 * Service for handling UI styling utilities and helper functions
 */

// Energy line configuration
export const ENERGY_LINE_CONFIG = {
  MIN_WIDTH_PERCENTAGE: 5,  // minimum width (5% of total width)
  MAX_WIDTH_PERCENTAGE: 75, // maximum width (75% of total width)
  HEIGHT: 1                 // height in pixels
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
