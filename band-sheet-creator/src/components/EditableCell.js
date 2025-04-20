import React from 'react';
import { useEditing } from '../contexts/EditingContext';

/**
 * EditableCell component that provides a common interface for all editable cells
 * in the band sheet editor. It handles displaying both read and edit modes.
 * 
 * @param {Object} props
 * @param {string} props.type - Type of cell ('text', 'number', or 'textarea')
 * @param {boolean} props.isEditing - Whether the cell is currently being edited
 * @param {function} props.onBeginEdit - Function to call when editing begins
 * @param {string|number} props.value - Current value of the cell
 * @param {string} props.editValue - Current edit value (when in edit mode)
 * @param {function} props.setEditValue - Function to update edit value
 * @param {function} props.saveEdit - Function to save edits
 * @param {function} props.setEditing - Function to update editing state
 * @param {string} props.placeholder - Placeholder text for empty cell
 * @param {string} props.className - Additional class names for the cell
 * @param {boolean} props.small - Whether to use smaller text (for notes)
 */
const EditableCell = ({
  type = 'text',
  isEditing,
  onBeginEdit,
  value,
  editValue,
  setEditValue,
  saveEdit,
  setEditing,
  placeholder,
  className = '',
  small = false
}) => {
  // We could use EditingContext here, but for now, we'll keep this component flexible
  // by continuing to use props. This allows it to be used in places where we might not
  // want to use the EditingContext.
  // Base style classes
  const baseClassName = `${className} ${isEditing ? 'editing-cell' : 'cursor-pointer'}`;
  
  // Handle click to begin editing
  const handleClick = () => {
    if (!isEditing) {
      onBeginEdit();
    }
  };

  // Handle key events
  const handleKeyDown = (e) => {
    if (e.key === "Escape") setEditing(null);
    if (e.key === "Enter" && type !== 'textarea') saveEdit();
  };

  // Auto-resize textarea
  const handleTextareaChange = (e) => {
    setEditValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
  };

  // Auto-resize textarea on focus
  const handleTextareaFocus = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
  };

  // Render edit mode
  const renderEditMode = () => {
    switch (type) {
      case 'number':
        return (
          <input
            className="w-full bg-white rounded px-2 py-1 text-sm"
            type="number"
            min="1"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        );
      case 'textarea':
        return (
          <textarea
            className={`w-full bg-white rounded px-2 py-1 ${small ? 'text-xs' : 'text-sm'} min-h-[48px] resize-vertical overflow-y-auto`}
            value={editValue}
            onChange={handleTextareaChange}
            onFocus={handleTextareaFocus}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        );
      case 'text':
      default:
        return (
          <input
            className={`w-full bg-white rounded px-2 py-1 ${small ? 'text-xs' : 'text-sm'}`}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        );
    }
  };

  // Render display mode
  const renderDisplayMode = () => {
    if (type === 'textarea') {
      return (
        <div className="whitespace-pre-line max-h-[120px] overflow-y-auto">
          {value || (placeholder && <span className="text-gray-400 italic">{placeholder}</span>)}
        </div>
      );
    }
    
    return value || (placeholder && <span className="text-gray-400 italic">{placeholder}</span>) || '';
  };

  return (
    <div className={baseClassName} onClick={handleClick}>
      {isEditing ? renderEditMode() : renderDisplayMode()}
    </div>
  );
};

export default EditableCell;
