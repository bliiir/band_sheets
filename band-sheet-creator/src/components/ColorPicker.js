import React, { useState, useEffect, useRef } from 'react';

/**
 * ColorPicker component for selecting colors
 * 
 * @param {Object} props
 * @param {string} props.initialColor - Initial color value (hex)
 * @param {function} props.onChange - Function called when color changes
 * @param {function} props.onClose - Function called when picker should close
 * @param {number} props.x - X position for the picker
 * @param {number} props.y - Y position for the picker
 */
const ColorPicker = ({ initialColor = '#ffffff', onChange, onClose, x, y }) => {
  const [color, setColor] = useState(initialColor);
  const pickerRef = useRef(null);
  const isNewRef = useRef(true);

  // Predefined colors
  const colorOptions = [
    '#ffffff', // White
    '#f8d7da', // Light Red
    '#d1ecf1', // Light Blue
    '#d4edda', // Light Green
    '#fff3cd', // Light Yellow
    '#e2e3e5', // Light Gray
    '#cce5ff', // Pale Blue
    '#d6d8d9', // Medium Gray
    '#ffccbc', // Light Orange
    '#e6d9f2'  // Light Purple
  ];

  // Handle color change
  const handleColorChange = (newColor) => {
    setColor(newColor);
    if (onChange) {
      onChange(newColor);
    }
  };

  // Handle click outside to close the picker
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener("mousedown", handleOutsideClick);
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  // Handle menu positioning to ensure it stays within viewport
  useEffect(() => {
    const adjustPosition = () => {
      if (pickerRef.current && isNewRef.current) {
        const picker = pickerRef.current;
        const pickerRect = picker.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 10; // Margin from viewport edges (px)
        
        let adjustedX = x;
        let adjustedY = y;
        
        // Check right edge
        if (pickerRect.right > viewportWidth - margin) {
          adjustedX = viewportWidth - pickerRect.width - margin;
        }
        
        // Check bottom edge
        if (pickerRect.bottom > viewportHeight - margin) {
          adjustedY = viewportHeight - pickerRect.height - margin;
        }
        
        // Check left edge
        if (adjustedX < margin) {
          adjustedX = margin;
        }
        
        // Check top edge
        if (adjustedY < margin) {
          adjustedY = margin;
        }
        
        // Update position if needed
        if (adjustedX !== x || adjustedY !== y) {
          picker.style.top = `${adjustedY}px`;
          picker.style.left = `${adjustedX}px`;
        }
        
        isNewRef.current = false;
      }
    };
    
    // Wait for the next frame to ensure the picker is rendered
    requestAnimationFrame(adjustPosition);
    
    return () => {
      isNewRef.current = true;
    };
  }, [x, y]);

  return (
    <div
      ref={pickerRef}
      className="fixed bg-white border border-gray-300 rounded-md shadow-lg z-[1001] p-3"
      style={{
        top: y,
        left: x
      }}
    >
      <div className="mb-2 text-sm font-medium text-gray-700">Select Color</div>
      
      {/* Color grid */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {colorOptions.map((colorOption, index) => (
          <div 
            key={index}
            className={`w-8 h-8 rounded cursor-pointer border ${color === colorOption ? 'border-blue-500 border-2' : 'border-gray-300'}`}
            style={{ backgroundColor: colorOption }}
            onClick={() => handleColorChange(colorOption)}
          />
        ))}
      </div>
      
      {/* Custom color input */}
      <div className="mt-2">
        <input 
          type="text" 
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        />
      </div>
      
      {/* Color preview */}
      <div 
        className="mt-2 w-full h-8 rounded border border-gray-300"
        style={{ backgroundColor: color }}
      />
      
      <div className="mt-2 flex justify-end">
        <button 
          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={onClose}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default ColorPicker;
