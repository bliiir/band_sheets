import React from 'react';
import { useEditing } from '../contexts/EditingContext';
import { useSheetData } from '../contexts/SheetDataContext';
import EditableField from './EditableField';
import EditableCell from './EditableCell';
import TransposeControls from './TransposeControls';

/**
 * PartsModule component for displaying and editing chord progressions
 * This component handles the chord progressions section of the band sheet
 */
const PartsModule = () => {
  // Get sheet data and operations from context
  const {
    partsModule,
    initializePartsModule,
    getTransposedChordsForPart
  } = useSheetData();

  // Get editing functionality from context
  const {
    beginEdit,
    isEditing,
    editValue,
    setEditValue,
    saveEdit,
    setEditing
  } = useEditing();

  // Helper function for beginning editing of parts module items
  const beginPartModuleEdit = (index, field) => {
    beginEdit(index, null, field, 'partsModule');
  };

  return (
    <div className="bg-white rounded-md shadow border border-gray-200">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-bold">Chord progressions</h2>
        <div className="flex items-center gap-3">
          <TransposeControls />
          <button 
            className="ml-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
            onClick={initializePartsModule}
          >
            Refresh Parts
          </button>
        </div>
      </div>
      
      {/* Parts table header - only visible on md+ screens */}
      <div className="hidden md:flex border-b border-gray-300 font-bold bg-white text-sm text-gray-800">
        <div className="w-[80px] min-w-[80px] px-4 py-2 flex items-center">Part</div>
        <div className="w-[80px] min-w-[80px] px-2 py-2 flex items-center">Bars</div>
        <div className="flex-1 px-2 py-2 flex items-center">Original Chords</div>
        <div className="flex-1 px-2 py-2 flex items-center">Transposed Chords</div>
        <div className="w-[40px] min-w-[40px] px-2 py-2 pr-6 flex justify-center items-center"></div>
      </div>
      
      {/* Parts list */}
      {partsModule?.map((partItem, index) => (
        <div key={partItem.id} className="flex flex-col md:flex-row min-h-[40px] border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
          {/* Part and Bars - displayed in a row on both mobile and desktop */}
          <div className="flex flex-row mb-2 md:mb-0">
            {/* Part */}
            <div className="md:w-[80px] md:min-w-[80px] px-4 py-2 flex flex-col md:flex-row md:items-center">
              <div className="font-semibold md:hidden mb-1">Part:</div>
              <EditableField
                value={partItem.part}
                type="text"
                indices={{ sectionIndex: index, partIndex: null, field: 'part', editType: 'partsModule' }}
                inputClassName="px-2 py-1 text-sm"
                onClickView={() => beginPartModuleEdit(index, 'part')}
              />
            </div>
            {/* Bars */}
            <div className="md:w-[80px] md:min-w-[80px] px-4 md:px-2 py-2 flex flex-col md:flex-row md:items-center">
              <div className="font-semibold md:hidden mb-1">Bars:</div>
              <EditableField
                value={partItem.bars}
                type="number"
                indices={{ sectionIndex: index, partIndex: null, field: 'bars', editType: 'partsModule' }}
                inputClassName="px-2 py-1 text-sm"
                inputProps={{ min: "1" }}
                placeholder="#"
                onClickView={() => beginPartModuleEdit(index, 'bars')}
              />
            </div>
          </div>
          {/* Chords */}
          <div className="md:flex-1 px-4 md:px-2 py-2">
            <div className="font-semibold md:hidden mb-1">Original Chords:</div>
            <EditableCell
              type="textarea"
              contentType="chords"
              isEditing={isEditing(index, null, 'chords', 'partsModule')}
              onBeginEdit={() => beginEdit(index, null, 'chords', 'partsModule')}
              value={partItem.chords}
              editValue={editValue}
              setEditValue={setEditValue}
              saveEdit={saveEdit}
              setEditing={setEditing}
              placeholder="Click to add chords..."
              className=""
            />
          </div>
          {/* Transposed Chords */}
          <div className="md:flex-1 px-4 md:px-2 py-2">
            <div className="font-semibold md:hidden mb-1">Transposed Chords:</div>
            <div className="font-['Inconsolata'] whitespace-pre-wrap">
              {partItem.chords ? 
                getTransposedChordsForPart(partItem.chords) : 
                <span className="text-gray-400 italic">Transposed chords will appear here</span>
              }
            </div>
          </div>
          
          {/* Actions - will be hidden on mobile as it's not essential */}
          <div className="hidden md:flex md:w-[40px] md:min-w-[40px] md:px-2 md:py-2 md:pr-6 justify-center items-center">
            <button 
              className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 rounded"
              onClick={() => {
                // Don't allow manual deletion from parts module anymore
                // Parts should only be managed through the main sheet
                alert('Parts are automatically managed based on the sheet structure. Delete the part from the sheet if needed.');
              }}
              title="Remove part"
            >
              ×
            </button>
          </div>
          
          {/* Mobile separator */}
          <div className="md:hidden h-[1px] bg-gray-200 my-2 mx-4"></div>
        </div>
      ))}
    </div>
  );
};

export default PartsModule;
