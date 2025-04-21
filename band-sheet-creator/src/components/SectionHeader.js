import React from 'react';
import { ReactComponent as MenuIcon } from "../assets/menu.svg";
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
  handleContextMenu
}) => {
  // Use the EditingContext to access editing state and functions
  const { isEditing, beginEdit, saveEdit, editValue, setEditValue, setEditing } = useEditing();
  return (
    <div 
      className="w-[120px] min-w-[120px] border-r border-gray-300 p-4 flex flex-col justify-between relative"
      onMouseEnter={() => setHoverState({ type: 'section', si, pi: null })}
      onMouseLeave={() => setHoverState({ type: null, si: null, pi: null })}
    >
      <div className="flex justify-between items-start">
        <div className="font-semibold flex-1">
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
            className="font-semibold"
          />
        </div>
        {(hoverState.type === 'section' && hoverState.si === si) && (
          <div className="cursor-pointer ml-1" onClick={(e) => handleContextMenu(e, "section", si)}>
            <MenuIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
          </div>
        )}
      </div>
      
      {/* Energy indicator - black line at bottom with width based on energy level */}
      <div 
        className="absolute bottom-0 left-0 bg-black energy-indicator"
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
