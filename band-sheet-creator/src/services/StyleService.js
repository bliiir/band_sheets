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
 * Adjusts a textarea's height to fit its content
 * @param {HTMLElement} textarea - The textarea element to adjust
 * @param {number} maxHeight - Optional maximum height in pixels (defaults to 200)
 */
export const adjustTextareaHeight = (textarea, maxHeight = 200) => {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(maxHeight, textarea.scrollHeight) + 'px';
};
