import React, { useEffect } from 'react';
import { ReactComponent as MenuIcon } from "../assets/menu.svg";
import EditableCell from './EditableCell';
import { useEditing } from '../contexts/EditingContext';
import { useUIState } from '../contexts/UIStateContext';
import { useSheetData } from '../contexts/SheetDataContext';

/**
 * Part component for rendering a band sheet part
 * 
 * @param {Object} props
 * @param {Object} props.part - The part data object
 * @param {number} props.sectionIndex - Index of the section in the sections array
 * @param {number} props.partIndex - Index of the part in the section's parts array
 * @param {Object} props.hoverState - Current hover state object
 * @param {function} props.setHoverState - Function to update hover state
 * @param {function} props.handleContextMenu - Function to handle context menu
 * @param {function} props.isEditing - Function to check if an element is being edited
 * @param {function} props.beginEdit - Function to begin editing an element
 * @param {function} props.saveEdit - Function to save edits
 * @param {string} props.editValue - Current edit value
 * @param {function} props.setEditValue - Function to update edit value
 * @param {Object} props.placeholders - Placeholder texts for empty fields
 * @param {function} props.setEditing - Function to update editing state
 */
const Part = ({
  part,
  sectionIndex: si,
  partIndex: pi,
  hoverState,
  setHoverState,
  handleContextMenu,
  placeholders
  // Removed editing-related props as they come from EditingContext
}) => {
  // Use the EditingContext to access editing state and functions
  const { isEditing, beginEdit, saveEdit, editValue, setEditValue, setEditing, editing } = useEditing();
  
  // Get selection state and functions from UIStateContext
  const { 
    isItemSelected, 
    toggleItemSelection,
    selectedItems,
    setSelectedItems
  } = useUIState();
  
  // Get part operations from SheetDataContext
  const { 
    deletePart, 
    duplicatePart,
    movePart,
    sections
  } = useSheetData();
  
  // Handle keyboard shortcuts for selected items
  useEffect(() => {
    // Store references to the current state and functions to use in the event handler
    // This prevents closure issues with stale references
    const currentSelectedItems = selectedItems;
    const currentSetSelectedItems = setSelectedItems;
    
    const handleKeyDown = (e) => {
      // Only handle if we have selected items
      if (currentSelectedItems.length === 0) return;
      
      // Don't process keyboard shortcuts if we're currently editing a cell
      if (editing !== null) return;
      
      // Delete key - delete selected parts
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        
        // Process parts
        const selectedParts = currentSelectedItems
          .filter(item => item.type === 'part')
          .sort((a, b) => {
            // Sort by section index first
            if (a.sectionIndex !== b.sectionIndex) {
              return b.sectionIndex - a.sectionIndex;
            }
            // Then by part index (from bottom to top)
            return b.partIndex - a.partIndex;
          });
          
        selectedParts.forEach(item => {
          deletePart(item.sectionIndex, item.partIndex);
        });
      }
      
      // Cmd+D - duplicate selected parts
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        // Don't process if we're currently editing a cell
        if (editing !== null) return;
        
        e.preventDefault();
        
        // Process parts
        const selectedParts = currentSelectedItems
          .filter(item => item.type === 'part')
          .sort((a, b) => {
            // Sort by section index first
            if (a.sectionIndex !== b.sectionIndex) {
              return a.sectionIndex - b.sectionIndex;
            }
            // Then by part index (from top to bottom within each section)
            return a.partIndex - b.partIndex;
          });
          
        selectedParts.forEach(item => {
          duplicatePart(item.sectionIndex, item.partIndex);
        });
      }
      
      // Option/Alt+Arrow Down - move selected parts down
      if (e.altKey && e.key === 'ArrowDown') {
        // Don't process if we're currently editing a cell
        if (editing !== null) return;
        
        e.preventDefault();
        
        // Only process parts (sections are handled in the Section component)
        const selectedParts = currentSelectedItems
          .filter(item => item.type === 'part')
          .sort((a, b) => {
            // Sort by section index first
            if (a.sectionIndex !== b.sectionIndex) {
              return b.sectionIndex - a.sectionIndex;
            }
            // Then by part index (from bottom to top within each section)
            return b.partIndex - a.partIndex;
          });
        
        selectedParts.forEach(item => {
          // Check if this is the last part in the section
          const sectionParts = sections[item.sectionIndex]?.parts || [];
          if (item.partIndex < sectionParts.length - 1) {
            movePart(item.sectionIndex, item.partIndex, 'down');
          }
        });
        
        // Update selection to reflect the new positions
        const updatedSelection = currentSelectedItems.map(item => {
          if (item.type === 'part') {
            const sectionParts = sections[item.sectionIndex]?.parts || [];
            return {
              ...item,
              partIndex: Math.min(item.partIndex + 1, sectionParts.length - 1)
            };
          }
          return item;
        });
        
        // Update selection state
        currentSetSelectedItems(updatedSelection);
      }
      
      // Option/Alt+Arrow Up - move selected parts up
      if (e.altKey && e.key === 'ArrowUp') {
        // Don't process if we're currently editing a cell
        if (editing !== null) return;
        
        e.preventDefault();
        
        // Only process parts (sections are handled in the Section component)
        const selectedParts = currentSelectedItems
          .filter(item => item.type === 'part')
          .sort((a, b) => {
            // Sort by section index first
            if (a.sectionIndex !== b.sectionIndex) {
              return a.sectionIndex - b.sectionIndex;
            }
            // Then by part index (from top to bottom within each section)
            return a.partIndex - b.partIndex;
          });
        
        selectedParts.forEach(item => {
          // Only move if not the first part
          if (item.partIndex > 0) {
            movePart(item.sectionIndex, item.partIndex, 'up');
          }
        });
        
        // Update selection to reflect the new positions
        const updatedSelection = currentSelectedItems.map(item => {
          if (item.type === 'part') {
            return {
              ...item,
              partIndex: Math.max(item.partIndex - 1, 0)
            };
          }
          return item;
        });
        
        // Update selection state
        currentSetSelectedItems(updatedSelection);
      }
    };
    
    // Add the event listener to the window
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItems, deletePart, duplicatePart, movePart, sections, editing, setSelectedItems]);
  // Determine if this part is selected
  const isPartSelected = isItemSelected('part', si, pi);
  
  // Handle part click with selection support
  const handlePartClick = (e) => {
    // Don't trigger selection when clicking on editable cells
    if (e.target.closest('.editable-cell')) return;
    
    // Toggle selection with Cmd/Ctrl for multi-select
    toggleItemSelection('part', si, pi, e.metaKey || e.ctrlKey);
    
    // Stop propagation to prevent section selection
    e.stopPropagation();
  };
  
  // No dynamic height calculation needed
  
  // We'll use a simpler approach with fixed row heights
  // No dynamic height calculation

  return (
    <div 
      key={part.id} 
      className={`flex min-h-[40px] border-b border-gray-100 last:border-b-0 ${isPartSelected ? 'bg-blue-50' : ''}`}
      onMouseEnter={() => setHoverState({ type: 'part', si, pi })}
      onMouseLeave={() => setHoverState({ type: null, si: null, pi: null })}
      onClick={handlePartClick}
    >
      {/* Part label cell */}
      <div className="w-[60px] min-w-[60px] px-4 py-1 flex items-center">
        <EditableCell
          type="text"
          isEditing={isEditing(si, pi, 'part')}
          onBeginEdit={() => beginEdit(si, pi, 'part')}
          value={part.part}
          editValue={editValue}
          setEditValue={setEditValue}
          saveEdit={saveEdit}
          setEditing={setEditing}
          placeholder="?"
        />
      </div>
      
      {/* Bars cell */}
      <div className="w-[60px] min-w-[60px] px-2 py-1 flex items-center">
        <EditableCell
          type="number"
          isEditing={isEditing(si, pi, 'bars')}
          onBeginEdit={() => beginEdit(si, pi, 'bars')}
          value={part.bars}
          editValue={editValue}
          setEditValue={setEditValue}
          saveEdit={saveEdit}
          setEditing={setEditing}
        />
      </div>
      
      {/* Lyrics cell */}
      <div className="flex-1 px-2 py-1 text-gray-500 overflow-y-auto font-['Inconsolata']">
        <EditableCell
          type="textarea"
          contentType="lyrics"
          isEditing={isEditing(si, pi, 'lyrics')}
          onBeginEdit={() => beginEdit(si, pi, 'lyrics')}
          value={part.lyrics}
          editValue={editValue}
          setEditValue={setEditValue}
          saveEdit={saveEdit}
          setEditing={setEditing}
          placeholder={placeholders.lyrics}
        />
      </div>
      
      {/* Notes cell */}
      <div className="w-[200px] min-w-[200px] px-2 py-1 text-xs text-gray-500 overflow-y-auto">
        <EditableCell
          type="textarea"
          isEditing={isEditing(si, pi, 'notes')}
          onBeginEdit={() => beginEdit(si, pi, 'notes')}
          value={part.notes}
          editValue={editValue}
          setEditValue={setEditValue}
          saveEdit={saveEdit}
          setEditing={setEditing}
          placeholder={placeholders.notes}
          small={true}
        />
      </div>
      
      {/* Actions cell */}
      <div className="w-[40px] min-w-[40px] px-2 py-1 flex justify-center items-center">
        {(hoverState.type === 'part' && hoverState.si === si && hoverState.pi === pi) && (
          <div
            onClick={(e) => handleContextMenu(e, "part", si, pi)}
            className="cursor-pointer"
          >
            <MenuIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Part;
