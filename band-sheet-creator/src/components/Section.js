import React, { useEffect } from 'react';
import Part from './Part';
import SectionHeader from './SectionHeader';
import { useEditing } from '../contexts/EditingContext';
import { useUIState } from '../contexts/UIStateContext';
import { useSheetData } from '../contexts/SheetDataContext';

/**
 * Section component for rendering a band sheet section with its parts
 * 
 * @param {Object} props
 * @param {Object} props.section - The section data object
 * @param {number} props.sectionIndex - Index of the section in the sections array
 * @param {Object} props.hoverState - Current hover state object
 * @param {function} props.setHoverState - Function to update hover state
 * @param {function} props.handleContextMenu - Function to handle context menu
 * @param {Object} props.placeholders - Placeholder texts for empty fields
 */
const Section = ({
  section,
  sectionIndex: si,
  hoverState,
  setHoverState,
  handleContextMenu,
  placeholders
  // Removed editing-related props as they come from EditingContext
}) => {
  // Use the EditingContext to access editing state and functions
  const { editing } = useEditing(); // Get the current editing state
  
  // Get selection state and functions from UIStateContext
  const { 
    isItemSelected, 
    toggleItemSelection, 
    selectedItems,
    setSelectedItems,
    clearSelection 
  } = useUIState();
  
  // Get section operations from SheetDataContext
  const { 
    deleteSection, 
    duplicateSection,
    moveSection,
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
      
      // Delete key - delete selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        
        // Process sections first (to avoid index shifting issues)
        const selectedSections = selectedItems
          .filter(item => item.type === 'section')
          .sort((a, b) => b.sectionIndex - a.sectionIndex); // Delete from bottom to top
          
        selectedSections.forEach(item => {
          deleteSection(item.sectionIndex);
        });
        
        // Process parts
        const selectedParts = selectedItems
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
          // We'll handle parts in the Part component
        });
        
        // Clear selection after operations
        clearSelection();
      }
      
      // Cmd+D - duplicate selected items
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        // Don't process if we're currently editing a cell
        if (editing !== null) return;
        
        e.preventDefault();
        
        // Process sections
        const selectedSections = selectedItems
          .filter(item => item.type === 'section')
          .sort((a, b) => a.sectionIndex - b.sectionIndex); // Duplicate from top to bottom
          
        selectedSections.forEach(item => {
          duplicateSection(item.sectionIndex);
        });
        
        // Process parts
        const selectedParts = selectedItems
          .filter(item => item.type === 'part');
          
        selectedParts.forEach(item => {
          // We'll handle parts in the Part component
        });
        
        // Clear selection after operations
        clearSelection();
      }
      
      // Option/Alt+Arrow Down - move selected sections down
      if (e.altKey && e.key === 'ArrowDown') {
        // Don't process if we're currently editing a cell
        if (editing !== null) return;
        
        e.preventDefault();
        
        // Process sections from bottom to top to avoid index shifting issues
        const selectedSections = currentSelectedItems
          .filter(item => item.type === 'section')
          .sort((a, b) => b.sectionIndex - a.sectionIndex); // Sort from bottom to top
        
        selectedSections.forEach(item => {
          moveSection(item.sectionIndex, 'down');
        });
        
        // Update selection to reflect the new positions
        const updatedSelection = currentSelectedItems.map(item => {
          if (item.type === 'section') {
            return {
              ...item,
              sectionIndex: Math.min(item.sectionIndex + 1, sections.length - 1)
            };
          }
          return item;
        });
        
        // Update selection state
        currentSetSelectedItems(updatedSelection);
      }
      
      // Option/Alt+Arrow Up - move selected sections up
      if (e.altKey && e.key === 'ArrowUp') {
        // Don't process if we're currently editing a cell
        if (editing !== null) return;
        
        e.preventDefault();
        
        // Process sections from top to bottom to avoid index shifting issues
        const selectedSections = currentSelectedItems
          .filter(item => item.type === 'section')
          .sort((a, b) => a.sectionIndex - b.sectionIndex); // Sort from top to bottom
        
        selectedSections.forEach(item => {
          moveSection(item.sectionIndex, 'up');
        });
        
        // Update selection to reflect the new positions
        const updatedSelection = currentSelectedItems.map(item => {
          if (item.type === 'section') {
            return {
              ...item,
              sectionIndex: Math.max(item.sectionIndex - 1, 0)
            };
          }
          return item;
        });
        
        // Update selection state
        currentSetSelectedItems(updatedSelection);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, deleteSection, duplicateSection, clearSelection]);
  // Determine if this section is selected
  const isSectionSelected = isItemSelected('section', si);
  
  // Handle section click with selection support
  const handleSectionClick = (e) => {
    // Toggle selection with Cmd/Ctrl for multi-select
    toggleItemSelection('section', si, null, e.metaKey || e.ctrlKey);
  };
  
  return (
    <div 
      key={section.id} 
      className={`border-b border-gray-200 ${isSectionSelected ? 'bg-blue-50' : ''}`}
      onClick={handleSectionClick}
    >
      <div className="flex">
        {/* Section header */}
        <SectionHeader
          section={section}
          sectionIndex={si}
          hoverState={hoverState}
          setHoverState={setHoverState}
          handleContextMenu={handleContextMenu}
          // No longer passing editing-related props - they come from EditingContext
        />

        {/* Parts container */}
        <div className="flex-1">
          {section.parts.map((part, pi) => (
            <Part
              key={part.id}
              part={part}
              sectionIndex={si}
              partIndex={pi}
              hoverState={hoverState}
              setHoverState={setHoverState}
              handleContextMenu={handleContextMenu}
              placeholders={placeholders}
              // No longer passing editing-related props - they come from EditingContext
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Section;
