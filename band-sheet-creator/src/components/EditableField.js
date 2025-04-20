import React from 'react';
import { useEditing } from '../contexts/EditingContext';

/**
 * EditableField component for displaying editable content
 * Provides a standardized interface for editing text, numbers and multi-line content
 * 
 * @param {Object} props
 * @param {string|number} props.value - The current value to display
 * @param {string} props.type - The field type: 'text', 'number', or 'textarea'
 * @param {Object} props.indices - The indices for editing context: { sectionIndex, partIndex, field, editType }
 * @param {string} props.placeholder - Placeholder text when value is empty
 * @param {string} props.className - Additional CSS class for the container
 * @param {string} props.inputClassName - Additional CSS class for the input element
 * @param {Object} props.inputProps - Additional props to pass to the input element
 * @param {Function} props.onClickView - Optional callback when clicking on the view mode
 */
const EditableField = ({
  value,
  type = 'text',
  indices,
  placeholder = '',
  className = '',
  inputClassName = '',
  inputProps = {},
  onClickView
}) => {
  const { sectionIndex, partIndex, field, editType = 'part' } = indices;
  
  // Get editing context
  const {
    isEditing,
    beginEdit,
    saveEdit,
    editValue,
    setEditValue
  } = useEditing();
  
  // Determine if this field is currently being edited
  const isBeingEdited = isEditing(sectionIndex, partIndex, field, editType);
  
  // Handle click on view mode
  const handleViewClick = () => {
    // Call custom click handler if provided
    if (onClickView) {
      onClickView();
    }
    
    // Begin editing
    beginEdit(sectionIndex, partIndex, field, editType);
  };
  
  // Handle changes to the edit value
  const handleChange = (e) => {
    setEditValue(e.target.value);
    
    // Handle textarea auto-sizing
    if (type === 'textarea' && e.target.tagName.toLowerCase() === 'textarea') {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
    }
  };
  
  // Handle blur event (losing focus)
  const handleBlur = () => {
    if (editValue.trim() === '' && type !== 'number') {
      beginEdit(null); // Cancel edit if empty for non-number fields
    } else {
      saveEdit();
    }
  };
  
  // Handle key events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      // For single-line inputs, save on Enter
      if (editValue.trim() === '' && type !== 'number') {
        beginEdit(null);
      } else {
        saveEdit();
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      // Cancel on Escape
      beginEdit(null);
      e.preventDefault();
    }
  };
  
  // Auto-size textarea on focus
  const handleFocus = (e) => {
    if (type === 'textarea' && e.target.tagName.toLowerCase() === 'textarea') {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
    }
  };
  
  // Base styling for all edit fields
  const baseInputClass = 'bg-white rounded border border-gray-300 ' + inputClassName;
  
  // Return edit mode or view mode based on current state
  return isBeingEdited ? (
    // Edit mode
    <>
      {type === 'textarea' ? (
        <textarea
          className={`${baseInputClass} resize-vertical w-full p-2 min-h-[40px] text-sm`}
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          autoFocus
          {...inputProps}
        />
      ) : type === 'number' ? (
        <input
          type="number"
          min="0"
          className={`${baseInputClass} w-full p-2 text-sm`}
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          {...inputProps}
        />
      ) : (
        <input
          type="text"
          className={`${baseInputClass} w-full p-2 text-sm`}
          value={editValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          {...inputProps}
        />
      )}
    </>
  ) : (
    // View mode
    <div 
      className={`cursor-pointer ${className}`}
      onClick={handleViewClick}
    >
      {value || <span className="text-gray-400 italic">{placeholder}</span>}
    </div>
  );
};

export default EditableField;
