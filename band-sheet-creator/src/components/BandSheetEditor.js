import React, { useState, useEffect, useRef } from "react";
import { ReactComponent as MenuIcon } from "../assets/menu.svg";
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import SongInfoBar from './SongInfoBar';
import SheetHeader from './SheetHeader';
import Section from './Section';
import ContextMenu from './ContextMenu';
import EnergyDialog from './EnergyDialog';
import { useEditing } from '../contexts/EditingContext';
import { useSheetData } from '../contexts/SheetDataContext';
import { useUIState } from '../contexts/UIStateContext';
import { exportToPDF } from '../services/ExportService';
import { saveSheet, getSheetById, getAllSheets, createNewSheet } from '../services/SheetStorageService';
import { getTransposedChords } from '../services/ChordService';
import { getEnergyBackgroundColor, adjustTextareaHeight } from '../services/StyleService';


export default function BandSheetEditor() {
  // Use SheetDataContext directly for all sheet data
  const { 
    sections, setSections,
    songData, setSongData,
    partsModule, setPartsModule,
    transposeValue, setTransposeValue,
    currentSheetId, setCurrentSheetId,
    // Use the context's version of initializePartsModule, renamed to avoid conflicts
    initializePartsModule: contextInitializePartsModule
  } = useSheetData();
  
  // Use EditingContext for editing state
  const { 
    editing, setEditing, 
    editValue, setEditValue, 
    isEditing: contextIsEditing, 
    beginEdit: contextBeginEdit,
    saveEdit: contextSaveEdit
  } = useEditing();
  
  // Use UIStateContext for UI-related state
  const {
    // Sidebar state
    sidebarOpen, setSidebarOpen, savedSheets, setSavedSheets,
    // Context menu state
    contextMenu, setContextMenu, showContextMenu, hideContextMenu,
    // Hover state
    hoverState, setHoverState, setHover, clearHover,
    // Energy dialog state
    energyDialog, setEnergyDialog, openEnergyDialog, closeEnergyDialog
  } = useUIState();
  
  // Fetch saved sheets from localStorage
  // Fetch saved sheets when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      // Use the storage service to fetch all sheets
      const sheets = getAllSheets();
      setSavedSheets(sheets);
    }
  }, [sidebarOpen]);

  // Load a sheet by id
  function loadSheet(id) {
    const sheet = getSheetById(id);
    if (!sheet) {
      alert('Failed to load sheet');
      return;
    }
    
    // Set song metadata from sheet
    setSongData({ 
      title: sheet.title || '', 
      artist: sheet.artist || '', 
      bpm: sheet.bpm || '' 
    });
    
    // Set sections or create default if none exist
    if (!sheet.sections || sheet.sections.length === 0) {
      const newId = Date.now();
      setSections([
        {
          id: newId,
          name: "Verse 1",
          energy: 5,
          parts: [{ id: newId + 1, part: "A", bars: 4, lyrics: "" }],
        },
      ]);
      setIdCounter(newId + 2);
    } else {
      setSections(sheet.sections);
      setIdCounter(sheet.id ? sheet.id + 2 : Date.now());
    }
    
    // Update current sheet ID
    setCurrentSheetId(id);
    setSidebarOpen(false); // Close sidebar after loading
    
    // Load parts module if available
    if (sheet.partsModule) {
      setPartsModule(sheet.partsModule);
    } else {
      // No parts module provided, generate one based on section parts
      contextInitializePartsModule();
    }
    
    setTransposeValue(sheet.transposeValue || 0);
    setCurrentSheetId(sheet.id || null);
  }

  // Initialize parts module when sections change or on first load
  useEffect(() => {
    if (sections?.length > 0 && partsModule?.length === 0) {
      // Use a function for initialization to avoid direct dependency issues
      const initPartsFromSections = () => {
        // Extract unique part labels from all sections
        const uniqueParts = new Set();
        sections.forEach(section => {
          section.parts.forEach(part => {
            if (part.part) uniqueParts.add(part.part);
          });
        });
        
        // Create initial parts module entries
        const initialParts = Array.from(uniqueParts).map(partLabel => ({
          id: Date.now() + Math.floor(Math.random() * 1000),
          part: partLabel,
          bars: sections.find(s => s.parts.find(p => p.part === partLabel))?.parts.find(p => p.part === partLabel)?.bars || 4,
          chords: ''
        }));
        
        if (initialParts.length > 0) {
          setPartsModule(initialParts);
        }
      };
      
      initPartsFromSections();
    }
  }, [sections, partsModule?.length]);

  // Note: UI state (context menu, energy dialog, hover state) now comes from UIStateContext
  // Only keep component-specific state that isn't managed by contexts
  const [idCounter, setIdCounter] = useState(() => Date.now());

  // Placeholder text for empty fields
  const placeholders = {
    lyrics: "Add lyrics here...",
    notes: "Add notes here..."
  };
  

  // Helper to get a unique ID
  const getNextId = () => {
    setIdCounter((id) => id + 1);
    return idCounter + 1;
  };

  // Helper to update sections using a callback, creating new references for all objects
  // This ensures React will detect the changes and trigger re-renders appropriately
  const updateSections = (cb) => {
    // Create a properly cloned version of sections with new references
    const createNewReferences = (prev) => 
      prev.map((s) => ({
        ...s,
        parts: s.parts.map((p) => ({ ...p })),
      }));
    
    // Update context state (which is now our source of truth)
    setSections((prev) => cb(createNewReferences(prev)));
  };

  // Editing logic for section and parts - beginEdit now calls the context function
  const beginEdit = (si, pi, f, type = 'part') => {
    let initialValue = "";
    
    if (type === 'section') {
      // For section fields
      initialValue = String(sections[si][f] ?? "");
    } else {
      // For part fields
      initialValue = String(sections[si].parts[pi][f] ?? "");
    }
    
    // Use the context function to begin editing
    contextIsEditing(si, pi, f, type) || setEditValue(initialValue);
    setEditing({ type, si, pi, f });
    
    // Wait for the textarea to be rendered, then adjust height
    setTimeout(() => {
      const activeTextarea = document.querySelector('.editing-cell textarea');
      if (activeTextarea && (f === 'lyrics' || f === 'notes')) {
        adjustTextareaHeight(activeTextarea);
      }
    }, 10);
  };

  const saveEdit = () => {
    if (!editing) return;
    // Use editing state from the context
    const { si, pi, f, type } = editing;
    
    if (type === 'section') {
      // For section fields
      updateSections((prev) => {
        const next = prev.map((section, sidx) => {
          if (sidx !== si) return section;
          return {
            ...section,
            [f]: f === "energy" ? parseInt(editValue || "5", 10) : editValue,
          };
        });
        return next;
      });
    } else {
      // For part fields
      let oldPartLabel = null;
      if (f === 'part') {
        // If we're editing the part label, store the old value for checking later
        oldPartLabel = sections[si].parts[pi].part;
      }
      
      updateSections((prev) => {
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
    
    setEditing(null);
  };

  // Now we just delegate to the contextIsEditing function
  const isEditing = (si, pi, f, type = 'part') => {
    if (type === 'partsModule') {
      // Special case for parts module editing
      return contextIsEditing(si, null, f, 'partsModule');
    }
    
    // Use the context's isEditing function for everything else
    return contextIsEditing(si, pi, f, type);
  };
  
  // Helper function for beginning editing of parts module items
  const beginPartModuleEdit = (index, field, initialValue) => {
    beginEdit(index, null, field, 'partsModule');
    setEditValue(initialValue || '');
  };
  
  // Helper function for saving parts module edits
  const savePartModuleEdit = (index, field) => {
    const updatedParts = [...partsModule];
    
    if (field === 'part' || field === 'bars') {
      updatedParts[index] = {
        ...updatedParts[index],
        [field]: field === 'bars' ? parseInt(editValue || '0', 10) : editValue
      };
    } else if (field === 'chords') {
      updatedParts[index] = {
        ...updatedParts[index],
        chords: editValue
      };
    }
    
    setPartsModule(updatedParts);
    setEditing(null); // Clear editing state
  };
  
  // Debugging if needed can be done through browser devtools

  // CRUD
  const addSection = () => {
    const newId = getNextId();
    const partId = getNextId();
    const newSection = {
      id: newId,
      name: "New Section",
      energy: 5,
      parts: [{ id: partId, part: "A", bars: 4, lyrics: "" }],
    };
    
    // Update sections in context
    setSections((prev) => [...prev, newSection]);
  };

  const deleteSection = (si) => {
    // Use context directly
    setSections((prev) => prev.filter((_, idx) => idx !== si));
  };

  const addPart = (si) => {
    const newId = getNextId();
    let newPartLabel = '';
    
    // Create a function to handle the section update logic
    const updateSectionWithNewPart = (prev) => {
      const updatedSections = prev.map((section, idx) => {
        if (idx !== si) return section;
        const p = section.parts;
        const next = String.fromCharCode(
          (p[p.length - 1]?.part.charCodeAt(0) ?? 64) + 1,
        );
        
        // Store the new part label to use outside this function
        newPartLabel = next;
        
        return {
          ...section,
          parts: [
            ...section.parts,
            { id: newId, part: next, bars: 4, lyrics: "" },
          ],
        };
      });
      
      return updatedSections;
    };
    
    // Update sections in context
    setSections(updateSectionWithNewPart);
    
    // After updating sections, add this part to the parts module if it doesn't exist
    setTimeout(() => {
      addPartToModule(newPartLabel, 4);
    }, 0);
  };
  
  // Add a part to the parts module if it doesn't exist yet
  const addPartToModule = (partLabel, bars = 4) => {
    // Create a function to handle the parts module update logic
    const updatePartsModule = (prev) => {
      // Check if this part label already exists
      const partExists = prev.some(p => p.part === partLabel);
      if (partExists) return prev; // Don't add duplicates
      
      // Add the new part
      const newPart = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        part: partLabel,
        bars,
        chords: ''
      };
      
      return [...prev, newPart];
    };
    
    // Update parts module in context
    setPartsModule(updatePartsModule);
  };

  const deletePart = (si, pi) => {
    // Get the part label before deleting
    const partToDelete = sections[si].parts[pi].part;
    
    setSections(prev => {
      // Create the new sections array with the part removed
      const updatedSections = [...prev];
      updatedSections[si] = {
        ...updatedSections[si],
        parts: updatedSections[si].parts.filter((_, pidx) => pidx !== pi)
      };
      
      // Check if this part still exists in any section after the deletion
      const partStillExists = updatedSections.some(section => 
        section.parts.some(part => part.part === partToDelete)
      );
      
      // If the part is no longer used in any section, remove it from parts module
      if (!partStillExists) {
        // Use setTimeout to ensure state updates happen after the sections update
        setTimeout(() => {
          setPartsModule(prevPartsModule => 
            prevPartsModule.filter(p => p.part !== partToDelete)
          );
        }, 0);
      }
      
      return updatedSections;
    });
  };

  // Move section up or down
  const moveSection = (si, direction) => {
    if ((direction === 'up' && si === 0) || (direction === 'down' && si === sections.length - 1)) {
      // Can't move first section up or last section down
      return;
    }
    
    setSections(prev => {
      const newSections = [...prev];
      const targetIndex = direction === 'up' ? si - 1 : si + 1;
      
      // Swap the sections
      [newSections[si], newSections[targetIndex]] = [newSections[targetIndex], newSections[si]];
      
      return newSections;
    });
  };
  
  // Move part up or down within a section
  const movePart = (si, pi, direction) => {
    const section = sections[si];
    if ((direction === 'up' && pi === 0) || (direction === 'down' && pi === section.parts.length - 1)) {
      // Can't move first part up or last part down
      return;
    }
    
    setSections(prev => {
      return prev.map((section, sectionIndex) => {
        if (sectionIndex !== si) return section;
        
        const newParts = [...section.parts];
        const targetIndex = direction === 'up' ? pi - 1 : pi + 1;
        
        // Swap the parts
        [newParts[pi], newParts[targetIndex]] = [newParts[targetIndex], newParts[pi]];
        
        return { ...section, parts: newParts };
      });
    });
  };


  // Context menu handler - delegates to UIStateContext's showContextMenu
  const handleContextMenu = (e, type, si, pi = null) => {
    // Use the showContextMenu function from UIStateContext
    showContextMenu(e, type, si, pi);
  };
  
  // Get context menu items based on context type
  const getContextMenuItems = () => {
    const { type, si, pi } = contextMenu;
    const menuItems = [];
    
    if (type === 'section') {
      // Only show Move Up if not the first section
      if (si > 0) {
        menuItems.push({
          label: 'Move Up',
          action: () => handleMenuAction('moveUp')
        });
      }
      
      // Only show Move Down if not the last section
      if (si < sections.length - 1) {
        menuItems.push({
          label: 'Move Down',
          action: () => handleMenuAction('moveDown')
        });
      }
      
      menuItems.push({
        label: 'Set Energy Level',
        action: () => handleMenuAction('setEnergyLevel')
      });
      
      menuItems.push({
        label: 'Duplicate Section',
        action: () => handleMenuAction('duplicate')
      });
      
      menuItems.push({
        label: 'Delete Section',
        action: () => handleMenuAction('delete'),
        danger: true
      });
    } else if (type === 'part') {
      // Only show Move Up if not the first part
      if (pi > 0) {
        menuItems.push({
          label: 'Move Up',
          action: () => handleMenuAction('moveUp')
        });
      }
      
      // Only show Move Down if not the last part
      if (pi < sections[si]?.parts.length - 1) {
        menuItems.push({
          label: 'Move Down',
          action: () => handleMenuAction('moveDown')
        });
      }
      
      menuItems.push({
        label: 'Add Part',
        action: () => handleMenuAction('add')
      });
      
      menuItems.push({
        label: 'Duplicate Part',
        action: () => handleMenuAction('duplicate')
      });
      
      menuItems.push({
        label: 'Delete Part',
        action: () => handleMenuAction('delete'),
        danger: true
      });
    }
    
    return menuItems;
  };

  // Menu actions
  const handleMenuAction = (action) => {
    const { type, si, pi } = contextMenu;
    if (type === "section") {
      if (action === "duplicate") {
        const newId = getNextId();
        setSections((prev) => {
          const sectionToCopy = {
            ...prev[si],
            id: newId,
            parts: prev[si].parts.map((p) => ({
              ...p,
              id: getNextId(),
            })),
          };
          const arr = prev.slice();
          arr.splice(si + 1, 0, sectionToCopy);
          return arr;
        });
      } else if (action === "delete") {
        deleteSection(si);
      } else if (action === "moveUp") {
        moveSection(si, 'up');
      } else if (action === "moveDown") {
        moveSection(si, 'down');
      } else if (action === "setEnergyLevel") {
        openEnergyDialog(si);
      }
    } else if (type === "part") {
      if (action === "add") {
        addPart(si);
      } else if (action === "duplicate") {
        setSections((prev) =>
          prev.map((section, idx) => {
            if (idx !== si) return section;
            const partToCopy = { ...section.parts[pi], id: getNextId() };
            const arr = section.parts.slice();
            arr.splice(pi + 1, 0, partToCopy);
            return { ...section, parts: arr };
          })
        );
      } else if (action === "delete") {
        deletePart(si, pi);
      } else if (action === "moveUp") {
        movePart(si, pi, 'up');
      } else if (action === "moveDown") {
        movePart(si, pi, 'down');
      }
    }
    setContextMenu((cm) => ({ ...cm, visible: false }));
  };

  // Note: Energy dialog functions have been moved to the EnergyDialog component

  // New Sheet handler
  const handleNewSheet = () => {
    if (window.confirm('Do you want to save your current sheet before starting a new one?')) {
      handleSave();
    }
    
    // Create a new sheet using the service
    const newSheet = createNewSheet();
    
    // Update component state with the new sheet data
    setSongData({ title: newSheet.title, artist: newSheet.artist, bpm: newSheet.bpm });
    setSections(newSheet.sections);
    setPartsModule(newSheet.partsModule);
    setTransposeValue(newSheet.transposeValue);
    setIdCounter(newSheet.nextIdCounter);
    setCurrentSheetId(null);
  };



  // Save handler
  const handleSave = () => {
    // Prepare sheet data
    const sheetData = { 
      ...songData, 
      sections, 
      partsModule, 
      transposeValue, 
      id: currentSheetId 
    };
    
    // Use service to save
    const savedSheet = saveSheet(sheetData, false);
    setCurrentSheetId(savedSheet.id);
    alert(`Sheet saved! (id: ${savedSheet.id})`);
  };

  // Save As handler
  const handleSaveAs = () => {
    // Prepare sheet data using context state
    const sheetData = { 
      ...songData, 
      sections, 
      partsModule, 
      transposeValue 
    };
    
    // Use service to save as new sheet
    const savedSheet = saveSheet(sheetData, true);
    setCurrentSheetId(savedSheet.id);
    alert(`Sheet saved as new! (id: ${savedSheet.id})`);
  };

  // Export handler that uses the ExportService to generate a print-friendly version
  const handleExport = () => {
    // Use context state for exporting
    exportToPDF(songData, sections, transposeValue);
  };

  // JSX
  return (
    <div className="flex h-full min-h-screen bg-white relative">
      {/* Toolbar Component */}
      <Toolbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleNewSheet={handleNewSheet}
        handleSave={handleSave}
        handleSaveAs={handleSaveAs}
        handleExport={handleExport}
      />
      
      {/* Sidebar */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        savedSheets={savedSheets}
        setSidebarOpen={setSidebarOpen}
        loadSheet={loadSheet}
        fetchSavedSheets={() => {
          // Use the storage service to get all sheets
          const sheets = getAllSheets();
          setSavedSheets(sheets);
        }}
      />
      {/* Main content area */}
      <div className="flex-1 min-w-0 relative">
        {/* Sidebar open button (mobile only) */}
        {!sidebarOpen && (
          <button
            className="absolute top-4 left-4 z-10 p-2 rounded bg-white shadow hover:bg-gray-100 text-2xl text-gray-600 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <span className="sr-only">Open sidebar</span>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        )}

        {/* Song info bar */}
        <SongInfoBar songData={songData} setSongData={setSongData} />

        {/* Sheet container */}
        <div className="mt-8 ml-4 mr-4 mb-4 bg-white rounded-md shadow border border-gray-200 overflow-x-auto">
          {/* Sheet header row */}
          <SheetHeader />

          {/* Sections */}
          {sections.map((section, si) => (
            <Section
              key={section.id}
              section={section}
              sectionIndex={si}
              hoverState={hoverState}
              setHoverState={setHoverState}
              handleContextMenu={handleContextMenu}
              placeholders={placeholders}
              getEnergyBackgroundColor={getEnergyBackgroundColor}
              // No longer passing editing-related props - they'll come from EditingContext
            />
          ))}
          {/* Add new section button at the bottom */}
          <div className="flex flex-col items-center justify-center mt-6 mb-4 cursor-pointer select-none group" onClick={addSection}>
            <div className="text-2xl font-bold text-blue-600 group-hover:text-blue-800 leading-none">+</div>
            <div className="text-xs text-gray-500 group-hover:text-blue-700">Add Section</div>
          </div>

          {/* No action buttons needed here since they are in the toolbar */}
        </div>

        {/* Parts Module */}
        <div className="mt-6 mb-6 ml-4 mr-4 bg-white rounded-md shadow border border-gray-200 overflow-x-auto">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-bold">Chord progressions</h2>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Transpose:</label>
              <div className="flex items-center">
                <button 
                  className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300 text-gray-700 font-bold"
                  onClick={() => setTransposeValue(prev => Math.max(-12, prev - 1))}
                >
                  -
                </button>
                <span className="w-10 text-center">{transposeValue > 0 ? `+${transposeValue}` : transposeValue}</span>
                <button 
                  className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300 text-gray-700 font-bold"
                  onClick={() => setTransposeValue(prev => Math.min(12, prev + 1))}
                >
                  +
                </button>
              </div>
              <button 
                className="ml-2 px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                onClick={contextInitializePartsModule}
              >
                Refresh Parts
              </button>
            </div>
          </div>
          
          {/* Parts table header */}
          <div className="flex border-b border-gray-300 font-bold bg-white text-sm text-gray-800">
            <div className="w-[80px] min-w-[80px] px-4 py-2 flex items-center">Part</div>
            <div className="w-[80px] min-w-[80px] px-2 py-2 flex items-center">Bars</div>
            <div className="flex-1 px-2 py-2 flex items-center">Original Chords</div>
            <div className="flex-1 px-2 py-2 flex items-center">Transposed Chords</div>
            <div className="w-[40px] min-w-[40px] px-2 py-2 flex justify-center items-center"></div>
          </div>
          
          {/* Parts list */}
          {partsModule?.map((partItem, index) => (
            <div key={partItem.id} className="flex min-h-[40px] border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
              {/* Part */}
              <div className="w-[80px] min-w-[80px] px-4 py-2 flex items-center font-semibold">
                {isEditing(index, null, 'part', 'partsModule') ? (
                  <input
                    className="w-full bg-white rounded px-2 py-1 text-sm border border-gray-300"
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      // Save edit
                      if (editValue) {
                        savePartModuleEdit(index, 'part');
                      } else {
                        setEditing(null); // Cancel edit if empty
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // Save edit
                        if (editValue) {
                          savePartModuleEdit(index, 'part');
                        } else {
                          setEditing(null);
                        }
                      }
                      if (e.key === "Escape") {
                        setEditing(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => beginPartModuleEdit(index, 'part', partItem.part || '')}
                  >
                    {partItem.part}
                  </div>
                )}
              </div>
              
              {/* Bars */}
              <div className="w-[80px] min-w-[80px] px-2 py-2 flex items-center">
                {isEditing(index, null, 'bars', 'partsModule') ? (
                  <input
                    className="w-full bg-white rounded px-2 py-1 text-sm border border-gray-300"
                    type="number"
                    min="1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => {
                      // Save edit - default to 4 bars if value is invalid
                      savePartModuleEdit(index, 'bars');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // Save edit
                        savePartModuleEdit(index, 'bars');
                      }
                      if (e.key === "Escape") {
                        setEditing(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => beginPartModuleEdit(index, 'bars', partItem.bars.toString())}
                  >
                    {partItem.bars}
                  </div>
                )}
              </div>
              
              {/* Chords */}
              <div className="flex-1 px-2 py-2 overflow-y-auto">
                {isEditing(index, null, 'chords', 'partsModule') ? (
                  <textarea
                    className="w-full bg-white rounded px-2 py-1 text-sm min-h-[40px] resize-vertical border border-gray-300"
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                      // Auto-resize the textarea
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
                    }}
                    onFocus={(e) => {
                      // Auto-resize on focus too
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(200, e.target.scrollHeight) + 'px';
                    }}
                    onBlur={() => {
                      // Save edit
                      savePartModuleEdit(index, 'chords');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setEditing(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer whitespace-pre-wrap max-h-[120px] overflow-y-auto w-full h-full p-1 hover:bg-gray-100"
                    onClick={() => beginPartModuleEdit(index, 'chords', partItem.chords || '')}
                  >
                    {partItem.chords || <span className="text-gray-400 italic">Click to add chords...</span>}
                  </div>
                )}
              </div>
              
              {/* Transposed Chords */}
              <div className="flex-1 px-2 py-2 overflow-y-auto">
                <div className="font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                  {partItem.chords ? 
                    /* Use a simple arrow function to ensure we don't close over any stale variables */
                    (() => getTransposedChords(partItem.chords, transposeValue))() : 
                    <span className="text-gray-400 italic">Transposed chords will appear here</span>
                  }
                </div>
              </div>
              
              {/* Actions */}
              <div className="w-[40px] min-w-[40px] px-2 py-2 flex justify-center items-center">
                <button 
                  className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 rounded"
                  onClick={() => {
                    // Don't allow manual deletion from parts module anymore
                    // Parts should only be managed through the main sheet
                    alert('Parts are automatically managed based on the sheet structure. Delete the part from the sheet if needed.');
                  }}
                  title="Remove part"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          
          {/* No add part button - parts are added automatically when editing the sheet */}
        </div>
        {/* Context Menu - now gets state from UIStateContext */}
        <ContextMenu menuItems={getContextMenuItems()} />
        {/* Energy Dialog component - extracted to its own file */}
        <EnergyDialog />
      </div>

    </div>
  );
}
