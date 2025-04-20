import React from 'react';
import { ReactComponent as MenuIcon } from "../assets/menu.svg";
import Part from './Part';
import EditableCell from './EditableCell';
import SectionHeader from './SectionHeader';

/**
 * Section component for rendering a band sheet section with its parts
 * 
 * @param {Object} props
 * @param {Object} props.section - The section data object
 * @param {number} props.sectionIndex - Index of the section in the sections array
 * @param {Object} props.hoverState - Current hover state object
 * @param {function} props.setHoverState - Function to update hover state
 * @param {function} props.handleContextMenu - Function to handle context menu
 * @param {function} props.isEditing - Function to check if an element is being edited
 * @param {function} props.beginEdit - Function to begin editing an element
 * @param {function} props.saveEdit - Function to save edits
 * @param {string} props.editValue - Current edit value
 * @param {function} props.setEditValue - Function to update edit value
 * @param {Object} props.placeholders - Placeholder texts for empty fields
 * @param {function} props.getEnergyBackgroundColor - Function to get background color based on energy level
 */
const Section = ({
  section,
  sectionIndex: si,
  hoverState,
  setHoverState,
  handleContextMenu,
  isEditing,
  beginEdit,
  saveEdit,
  editValue,
  setEditValue,
  placeholders,
  getEnergyBackgroundColor,
  setEditing
}) => {
  return (
    <div key={section.id} className="border-b border-gray-200">
      <div className="flex">
        {/* Section header */}
        <SectionHeader
          section={section}
          sectionIndex={si}
          hoverState={hoverState}
          setHoverState={setHoverState}
          handleContextMenu={handleContextMenu}
          isEditing={isEditing}
          beginEdit={beginEdit}
          saveEdit={saveEdit}
          editValue={editValue}
          setEditValue={setEditValue}
          setEditing={setEditing}
          getEnergyBackgroundColor={getEnergyBackgroundColor}
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
              isEditing={isEditing}
              beginEdit={beginEdit}
              saveEdit={saveEdit}
              editValue={editValue}
              setEditValue={setEditValue}
              placeholders={placeholders}
              setEditing={setEditing}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Section;
