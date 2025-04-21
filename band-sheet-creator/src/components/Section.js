import React from 'react';
import Part from './Part';
import SectionHeader from './SectionHeader';
import { useEditing } from '../contexts/EditingContext';

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
  useEditing(); // Keep the context connection without destructuring
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
