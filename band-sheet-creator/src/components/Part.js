import React from 'react';
import { ReactComponent as MenuIcon } from "../assets/menu.svg";
import EditableCell from './EditableCell';
import { useEditing } from '../contexts/EditingContext';

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
  const { isEditing, beginEdit, saveEdit, editValue, setEditValue, setEditing } = useEditing();
  return (
    <div 
      key={part.id} 
      className="flex min-h-[40px] border-b border-gray-100 last:border-b-0"
      onMouseEnter={() => setHoverState({ type: 'part', si, pi })}
      onMouseLeave={() => setHoverState({ type: null, si: null, pi: null })}
    >
      {/* Part label cell */}
      <div className="w-[60px] min-w-[60px] px-4 py-2 flex items-center">
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
      <div className="w-[60px] min-w-[60px] px-2 py-2 flex items-center">
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
      <div className="flex-1 px-2 py-2 text-gray-500 overflow-y-auto">
        <EditableCell
          type="textarea"
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
      <div className="w-[200px] min-w-[200px] px-2 py-2 text-xs text-gray-500 overflow-y-auto">
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
      <div className="w-[40px] min-w-[40px] px-2 py-2 flex justify-center items-center">
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
