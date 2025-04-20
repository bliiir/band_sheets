import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { adjustTextareaHeight } from '../services/StyleService';
import { useSheetData } from './SheetDataContext';

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
  
  // Get sections and parts module from SheetDataContext
  const { 
    sections, setSections, 
    partsModule, setPartsModule 
  } = useSheetData();

  /**
   * Check if a specific item is currently being edited
   * 
   * @param {number} sectionIndex - Index of the section
   * @param {number|null} partIndex - Index of the part, or null if not a part
   * @param {string} field - Field being edited (e.g., 'name', 'part', 'bars', etc.)
   * @param {string} [type='part'] - Type of item ('section', 'part', or 'partsModule')
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
    
    // For parts module edits
    if (type === 'partsModule') {
      return editing && 
        editing.type === 'partsModule' && 
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
   * @param {string} [type='part'] - Type of item ('section', 'part', or 'partsModule')
   * @param {string|number} initialValue - Initial value for the edit
   */
  const beginEdit = useCallback((sectionIndex, partIndex, field, type = 'part') => {
    let initialValue = "";
    
    // Get initial value based on type
    if (type === 'section') {
      // For section fields
      initialValue = String(sections[sectionIndex][field] ?? "");
    } else if (type === 'partsModule' && partsModule) {
      // For parts module fields
      initialValue = String(partsModule[sectionIndex]?.[field] ?? "");
    } else {
      // For part fields
      initialValue = String(sections[sectionIndex]?.parts[partIndex]?.[field] ?? "");
    }
    
    // Set editing state
    setEditing({
      type,
      si: sectionIndex,
      pi: partIndex,
      f: field
    });
    
    // Set the initial edit value
    setEditValue(initialValue);
    
    // Wait for the textarea to be rendered, then adjust height
    setTimeout(() => {
      const activeTextarea = document.querySelector('.editing-cell textarea');
      if (activeTextarea && (field === 'lyrics' || field === 'notes' || field === 'chords')) {
        adjustTextareaHeight(activeTextarea);
      }
    }, 10);
  }, [sections, partsModule]);
  
  /**
   * Save the current edit
   */
  const saveEdit = useCallback(() => {
    if (!editing) return;
    
    const { si, pi, f, type } = editing;
    
    if (type === 'section') {
      // For section fields
      setSections((prev) => {
        const next = prev.map((section, sidx) => {
          if (sidx !== si) return section;
          return {
            ...section,
            [f]: f === "energy" ? parseInt(editValue || "5", 10) : editValue,
          };
        });
        return next;
      });
    } else if (type === 'partsModule') {
      // For parts module fields
      const updatedParts = [...partsModule];
      
      if (f === 'part' || f === 'bars') {
        updatedParts[si] = {
          ...updatedParts[si],
          [f]: f === 'bars' ? parseInt(editValue || '0', 10) : editValue
        };
      } else if (f === 'chords') {
        updatedParts[si] = {
          ...updatedParts[si],
          chords: editValue
        };
      }
      
      setPartsModule(updatedParts);
    } else {
      // For part fields
      let oldPartLabel = null;
      if (f === 'part') {
        // If we're editing the part label, store the old value for checking later
        oldPartLabel = sections[si].parts[pi].part;
      }
      
      setSections((prev) => {
        const next = prev.map((section, sidx) => {
          if (sidx !== si) return section;
          return {
            ...section,
            parts: section.parts.map((part, pidx) => {
              if (pidx !== pi) return part;
              return {
                ...part,
                [f]: f === "bars" ? parseInt(editValue || "0", 10) : editValue,
              };
            }),
          };
        });
        return next;
      });
      
      // If we changed a part label, update the parts module
      if (f === 'part' && oldPartLabel !== editValue) {
        // Check if the old part label still exists anywhere in sections
        const oldPartStillExists = sections.some(section => 
          section.parts.some(part => 
            part !== sections[si].parts[pi] && part.part === oldPartLabel
          )
        );
        
        // If old part doesn't exist anymore, remove it and add the new one
        if (!oldPartStillExists) {
          setTimeout(() => {
            setPartsModule(prev => {
              // Find the entry for the old part label
              const oldPartEntry = prev.find(p => p.part === oldPartLabel);
              // If found, update it; otherwise do nothing
              if (oldPartEntry) {
                const updatedParts = prev.filter(p => p.part !== oldPartLabel);
                // Add new entry with the updated label but same content
                updatedParts.push({
                  ...oldPartEntry,
                  id: Date.now(), // New ID
                  part: editValue, // New part label
                  bars: sections[si].parts[pi].bars // Update bars too
                });
                return updatedParts;
              }
              return prev;
            });
          }, 0);
        } else {
          // If old part still exists elsewhere and the new one doesn't,
          // add the new part to the module
          const newPartExists = partsModule?.some(p => p.part === editValue) || false;
          if (!newPartExists) {
            setTimeout(() => {
              setPartsModule(prev => [
                ...prev,
                {
                  id: Date.now(),
                  part: editValue,
                  bars: sections[si].parts[pi].bars,
                  chords: ''
                }
              ]);
            }, 0);
          }
        }
      }
    }
    
    // Clear editing state
    setEditing(null);
  }, [editing, editValue, sections, partsModule, setSections, setPartsModule]);
  
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
    saveEdit,
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
