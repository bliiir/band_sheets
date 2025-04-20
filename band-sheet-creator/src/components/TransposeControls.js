import React from 'react';
import { useSheetData } from '../contexts/SheetDataContext';

/**
 * TransposeControls component for handling transpose value adjustments
 * This component provides a UI for changing the transposition of chords
 * 
 * @param {Object} props
 * @param {string} props.className - Additional CSS classes for the container
 */
const TransposeControls = ({ className = '' }) => {
  // Get transpose value and setter from context
  const { transposeValue, setTransposeValue } = useSheetData();
  
  // Increment transposition (up to maximum +12)
  const incrementTranspose = () => {
    setTransposeValue(prev => Math.min(12, prev + 1));
  };
  
  // Decrement transposition (down to minimum -12)
  const decrementTranspose = () => {
    setTransposeValue(prev => Math.max(-12, prev - 1));
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <label className="text-sm font-medium mr-2">Transpose:</label>
      <div className="flex items-center">
        <button 
          className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300 text-gray-700 font-bold"
          onClick={decrementTranspose}
          aria-label="Decrease transpose value"
        >
          -
        </button>
        <span className="w-10 text-center">
          {transposeValue > 0 ? `+${transposeValue}` : transposeValue}
        </span>
        <button 
          className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300 text-gray-700 font-bold"
          onClick={incrementTranspose}
          aria-label="Increase transpose value"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default TransposeControls;
