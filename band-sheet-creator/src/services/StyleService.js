/**
 * StyleService.js
 * Service for handling UI styling utilities and helper functions
 */

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
 * @returns {string} CSS width value as pixels or viewport width
 */
export const getEnergyLineWidth = (energyLevel) => {
  // For energy level 1, we want it to be the width of just the section column (120px)
  // For energy level 10, we want the full width of the entire sheet (100vw)
  
  if (energyLevel === 1) {
    // Just the section column width
    return '120px';
  } else if (energyLevel === 10) {
    // The full sheet width (using viewport width)
    return '100vw';
  } else {
    // Calculate a proportional width between those extremes
    // We'll use viewport width units (vw) for a smooth transition
    // Assuming section column is roughly 12vw (120px)
    const minWidth = 12; // section column in vw
    const maxWidth = 100; // full sheet width in vw
    
    // Calculate proportional width
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
