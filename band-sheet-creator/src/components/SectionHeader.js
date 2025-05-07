import React from 'react';
import { MoreVertical } from "lucide-react";
import EditableCell from './EditableCell';
import { useEditing } from '../contexts/EditingContext';
import { getEnergyLineWidth, ENERGY_LINE_CONFIG } from '../services/StyleService';

/**
 * SectionHeader component for rendering a band sheet section header
 * 
 * @param {Object} props
 * @param {Object} props.section - The section data object
 * @param {number} props.sectionIndex - Index of the section in the sections array
 * @param {Object} props.hoverState - Current hover state object
 * @param {function} props.setHoverState - Function to update hover state
 * @param {function} props.handleContextMenu - Function to handle context menu
 */
const SectionHeader = ({
  section,
  sectionIndex: si,
  hoverState,
  setHoverState,
  handleContextMenu,
  backgroundColor
}) => {
  // Use the EditingContext to access editing state and functions
  const { isEditing, beginEdit, saveEdit, editValue, setEditValue, setEditing } = useEditing();
  return (
    <div 
      className="md:w-[120px] md:min-w-[120px] w-full border-r-0 md:border-r border-b md:border-b-0 border-border bg-card p-4 flex flex-col justify-between relative"
      onMouseEnter={() => setHoverState({ type: 'section', si, pi: null })}
      onMouseLeave={() => setHoverState({ type: null, si: null, pi: null })}
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      <div className="flex justify-between items-start">
        <div className="font-medium flex-1">
          <EditableCell
            type="text"
            isEditing={isEditing(si, null, 'name', 'section')}
            onBeginEdit={() => beginEdit(si, null, 'name', 'section')}
            value={section.name}
            editValue={editValue}
            setEditValue={setEditValue}
            saveEdit={saveEdit}
            setEditing={setEditing}
            placeholder="Untitled Section"
            className="font-medium text-foreground"
          />
        </div>
        <div 
          className="cursor-pointer ml-1" 
          onClick={(e) => {
            console.log(`SectionHeader: Context menu trigger clicked for section ${si}`);
            // Log the handleContextMenu function to ensure it's defined
            console.log('handleContextMenu function:', typeof handleContextMenu);
            try {
              handleContextMenu(e, "section", si);
              console.log(`SectionHeader: handleContextMenu called successfully`);
            } catch (error) {
              console.error(`SectionHeader: Error calling handleContextMenu:`, error);
            }
          }}
        >
          <MoreVertical className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </div>
      
      {/* Energy indicator - accent colored line at bottom with width based on energy level */}
      <div 
        className="absolute bottom-0 left-0 bg-primary energy-indicator"
        style={{ 
          width: getEnergyLineWidth(section.energy),
          height: `${ENERGY_LINE_CONFIG.HEIGHT}px`
        }}
        data-energy-level={section.energy}
        aria-label={`Energy level: ${section.energy}`}
      />
    </div>
  );
};



export default SectionHeader;
