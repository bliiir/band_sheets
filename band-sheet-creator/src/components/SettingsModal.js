import React, { useState, useEffect } from 'react';
import { XIcon } from 'lucide-react';

/**
 * Settings Modal component
 * Allows users to set application-wide preferences like print view options
 */
const SettingsModal = ({ isOpen, onClose }) => {
  // Print view settings
  const [includeChordProgressions, setIncludeChordProgressions] = useState(true);
  const [includeSectionColors, setIncludeSectionColors] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    if (!isOpen) return; // Only load when modal opens to get fresh data
    
    const savedChordProgressions = localStorage.getItem('includeChordProgressions');
    const savedSectionColors = localStorage.getItem('includeSectionColors');
    
    if (savedChordProgressions !== null) {
      setIncludeChordProgressions(savedChordProgressions === 'true');
    }
    
    if (savedSectionColors !== null) {
      setIncludeSectionColors(savedSectionColors === 'true');
    }
  }, [isOpen]);

  // Save settings to localStorage
  const handleSaveSettings = () => {
    localStorage.setItem('includeChordProgressions', includeChordProgressions.toString());
    localStorage.setItem('includeSectionColors', includeSectionColors.toString());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <XIcon size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <h3 className="text-md font-semibold mb-4">Print View Defaults</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include-chord-progressions"
                checked={includeChordProgressions}
                onChange={(e) => setIncludeChordProgressions(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="include-chord-progressions" className="ml-2 block text-sm text-gray-900">
                Include chord progressions on a last page
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include-section-colors"
                checked={includeSectionColors}
                onChange={(e) => setIncludeSectionColors(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              <label htmlFor="include-section-colors" className="ml-2 block text-sm text-gray-900">
                Include section background colors
              </label>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-gray-500">
            These settings will be used as defaults when printing or exporting band sheets.
          </div>
        </div>
        
        <div className="px-4 py-3 bg-gray-50 text-right rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded text-gray-800 mr-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-white"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
