import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context for managing editing state across the application
 */
const EditingContext = createContext(null);

/**
 * Provider component for EditingContext
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 */
export const EditingProvider = ({ children }) => {
  // State for tracking what is being edited
  const [editing, setEditing] = useState(null);
  
  // State for the current value being edited
  const [editValue, setEditValue] = useState('');

  /**
   * Check if a specific item is currently being edited
   * 
   * @param {number} sectionIndex - Index of the section
   * @param {number|null} partIndex - Index of the part, or null if not a part
   * @param {string} field - Field being edited (e.g., 'name', 'part', 'bars', etc.)
   * @param {string} [type='part'] - Type of item ('section' or 'part')
   * @returns {boolean} - Whether the specified item is being edited
   */
  const isEditing = useCallback((sectionIndex, partIndex, field, type = 'part') => {
    if (!editing) return false;
    
    // For section edits
    if (type === 'section') {
      return editing.type === 'section' && 
        editing.si === sectionIndex && 
        editing.f === field;
    }
    
    // For part edits
    return editing && 
      editing.si === sectionIndex && 
      editing.pi === partIndex && 
      editing.f === field &&
      editing.type === type;
  }, [editing]);
  
  /**
   * Start editing an item
   * 
   * @param {number} sectionIndex - Index of the section
   * @param {number|null} partIndex - Index of the part, or null if not a part
   * @param {string} field - Field to edit
   * @param {string} [type='part'] - Type of item ('section' or 'part')
   * @param {string|number} initialValue - Initial value for the edit
   */
  const beginEdit = useCallback((sectionIndex, partIndex, field, type = 'part', initialValue = '') => {
    // Set what we're editing
    setEditing({
      type,
      si: sectionIndex,
      pi: partIndex,
      f: field
    });
    
    // Set the initial edit value
    setEditValue(initialValue);
  }, []);
  
  /**
   * Clear the current editing state
   */
  const cancelEdit = useCallback(() => {
    setEditing(null);
    setEditValue('');
  }, []);
  
  // Value object to be provided by context
  const contextValue = {
    // State
    editing,
    editValue,
    
    // Setters
    setEditing,
    setEditValue,
    
    // Helper functions
    isEditing,
    beginEdit,
    cancelEdit
  };
  
  return (
    <EditingContext.Provider value={contextValue}>
      {children}
    </EditingContext.Provider>
  );
};

/**
 * Custom hook to use the EditingContext
 * 
 * @returns {Object} - Editing context value
 */
export const useEditing = () => {
  const context = useContext(EditingContext);
  if (context === null) {
    throw new Error('useEditing must be used within an EditingProvider');
  }
  return context;
};
