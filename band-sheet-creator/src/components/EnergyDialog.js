import React from 'react';
import { useUIState } from '../contexts/UIStateContext';
import { useSheetData } from '../contexts/SheetDataContext';
import { getEnergyBackgroundColor } from '../services/StyleService';

/**
 * Energy Dialog component for adjusting section energy levels
 * Uses UIStateContext and SheetDataContext for state management
 */
const EnergyDialog = () => {
  // Get dialog state from UIStateContext
  const { 
    energyDialog, 
    setEnergyDialog, 
    closeEnergyDialog 
  } = useUIState();
  
  // Get sections from SheetDataContext
  const { sections, setSections } = useSheetData();
  
  // If dialog is not open, don't render anything
  if (!energyDialog.open) {
    return null;
  }
  
  // Handle energy level change
  const handleEnergyChange = (e) => {
    setEnergyDialog(prev => ({ 
      ...prev, 
      currentValue: parseInt(e.target.value, 10) 
    }));
  };
  
  // Save the energy level and close the dialog
  const saveEnergyLevel = () => {
    if (energyDialog.sectionIndex !== null) {
      // Update sections using the SheetDataContext
      setSections(prevSections => {
        const updatedSections = [...prevSections];
        updatedSections[energyDialog.sectionIndex] = {
          ...updatedSections[energyDialog.sectionIndex],
          energy: energyDialog.currentValue
        };
        return updatedSections;
      });
      
      // Close the dialog
      closeEnergyDialog();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-bold mb-4">Set Energy Level</h3>
        
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Low Energy (1)</span>
            <span>High Energy (10)</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={energyDialog.currentValue}
            onChange={handleEnergyChange}
            className="w-full"
          />
        </div>
        
        <div 
          className="h-16 mb-4 rounded flex items-center justify-center text-white font-bold"
          style={{ 
            backgroundColor: getEnergyBackgroundColor(energyDialog.currentValue) 
          }}
        >
          Energy Level: {energyDialog.currentValue}
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
            onClick={closeEnergyDialog}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            onClick={saveEnergyLevel}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnergyDialog;
