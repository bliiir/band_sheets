import React, { useState } from 'react';

/**
 * Modal component for export options
 * Allows users to select options for PDF export
 */
const ExportOptionsModal = ({ isOpen, onClose, onExport }) => {
  const [includeChordProgressions, setIncludeChordProgressions] = useState(true);
  const [includeSectionColors, setIncludeSectionColors] = useState(true);
  
  if (!isOpen) return null;
  
  const handleExport = () => {
    onExport({
      includeChordProgressions,
      includeSectionColors
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <h2 className="text-xl font-bold mb-4">Export Options</h2>
        
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeChordProgressions}
              onChange={(e) => setIncludeChordProgressions(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Include chord progressions on page 2</span>
          </label>
        </div>
        
        <div className="mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeSectionColors}
              onChange={(e) => setIncludeSectionColors(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600"
            />
            <span>Include section background colors</span>
          </label>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsModal;
