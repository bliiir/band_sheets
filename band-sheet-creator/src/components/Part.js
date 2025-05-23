import React, { useEffect } from 'react';
import { MoreVertical } from "lucide-react";
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
      className={`flex flex-col md:flex-row min-h-[40px] border-b border-border/50 last:border-b-0 ${isPartSelected ? 'bg-primary/5' : ''}`}
      onMouseEnter={() => setHoverState({ type: 'part', si, pi })}
      onMouseLeave={() => setHoverState({ type: null, si: null, pi: null })}
      onClick={handlePartClick}
    >
      {/* Mobile view: Part and Bars in one row */}
      <div className="flex md:hidden w-full border-b border-border/30 md:border-b-0">
        {/* Part label cell */}
        <div className="w-1/2 px-4 py-2 flex items-center">
          <div className="text-xs text-muted-foreground mr-2 font-medium">Part:</div>
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
        <div className="w-1/2 px-2 py-2 flex items-center">
          <div className="text-xs text-muted-foreground mr-2 font-medium">Bars:</div>
          <EditableCell
            type="number"
            isEditing={isEditing(si, pi, 'bars')}
            onBeginEdit={() => beginEdit(si, pi, 'bars')}
            value={part.bars}
            editValue={editValue}
            setEditValue={setEditValue}
            saveEdit={saveEdit}
            setEditing={setEditing}
            placeholder="#"
          />
        </div>
      </div>
      
      {/* Desktop view: Part label cell */}
      <div className="hidden md:flex w-[80px] min-w-[80px] px-4 py-1 items-center">
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
      
      {/* Desktop view: Bars cell */}
      <div className="hidden md:flex w-[80px] min-w-[80px] px-2 py-1 items-center">
        <EditableCell
          type="number"
          isEditing={isEditing(si, pi, 'bars')}
          onBeginEdit={() => beginEdit(si, pi, 'bars')}
          value={part.bars}
          editValue={editValue}
          setEditValue={setEditValue}
          saveEdit={saveEdit}
          setEditing={setEditing}
          placeholder="#"
        />
      </div>
      
      {/* Lyrics cell */}
      <div className="w-full md:flex-1 px-2 py-2 md:py-1 text-foreground font-['Inconsolata'] lyrics-cell">
        <div className="block md:hidden text-xs text-muted-foreground mb-1 font-medium">Lyrics:</div>
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
      <div className="w-full md:w-[300px] md:min-w-[300px] px-2 py-2 md:py-1 text-xs text-muted-foreground notes-cell">
        <div className="block md:hidden text-xs text-muted-foreground mb-1 font-medium">Notes:</div>
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
      
      {/* Actions cell - always visible on both mobile and desktop */}
      <div className="w-full md:w-[40px] md:min-w-[40px] px-2 py-2 md:py-1 pr-6 flex justify-end md:justify-center items-center">
        <div
          onClick={(e) => handleContextMenu(e, "part", si, pi)}
          className="cursor-pointer"
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default Part;
