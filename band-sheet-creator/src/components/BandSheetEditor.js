import React, { useState, useEffect, useRef } from "react";
import { ReactComponent as GripIcon } from "../assets/grip.svg";
import { ReactComponent as MenuIcon } from "../assets/menu.svg";
import { ReactComponent as FolderIcon } from "../assets/folder.svg";
import { ReactComponent as FilePlusIcon } from "../assets/file_plus.svg";
import { ReactComponent as SaveIcon } from "../assets/save.svg";
import { ReactComponent as SaveAllIcon } from "../assets/save_all.svg";
import { ReactComponent as DownloadIcon } from "../assets/download.svg";
import SavedSheetsPanel from './SavedSheetsPanel';


const DropIndicator = () => (
  <div className="drop-indicator" />
);

export default function BandSheetEditor() {
  // Function to get background color based on energy level
  const getEnergyBackgroundColor = (energyLevel) => {
    // Convert energy level (1-10) to CSS gray scale (very light to very dark)
    const grayscaleValue = 235 - (energyLevel - 1) * 20; // 235 (very light) to 55 (very dark)
    return `rgb(${grayscaleValue}, ${grayscaleValue}, ${grayscaleValue})`;
  };
  
  // Adjust textarea height to fit content
  const adjustTextareaHeight = (textarea) => {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(200, textarea.scrollHeight) + 'px';
  };
  
  // Utility for chord transposition
  const transposeChord = (chord, semitones) => {
    if (!chord || semitones === 0) return chord;
    
    // Define the notes in order (including sharps/flats)
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const flatNotes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    
    // Regular expression to find chord root notes
    // Matches C, C#, Db, etc. at the start of a chord or after a space or slash
    return chord.replace(/(?:^|\s|\/)([A-G][b#]?)/g, (match, rootNote) => {
      const useFlats = rootNote.includes('b');
      const noteArray = useFlats ? flatNotes : notes;
      
      // Clean the root note (remove any non-letter characters)
      const cleanRoot = rootNote.charAt(0);
      const accidental = rootNote.substring(1);
      
      // Find the current note index
      let noteIndex;
      if (accidental === '#') {
        noteIndex = notes.indexOf(rootNote);
      } else if (accidental === 'b') {
        noteIndex = flatNotes.indexOf(rootNote);
      } else {
        noteIndex = notes.indexOf(cleanRoot);
      }
      
      if (noteIndex === -1) return match; // If not found, return original
      
      // Calculate new index with modulo to wrap around
      const newIndex = (noteIndex + semitones + 12) % 12;
      
      // Replace the root note but keep the rest of the match
      return match.replace(rootNote, noteArray[newIndex]);
    });
  };
  
  // Generate chord display based on transpose value
  const getTransposedChords = (chords, semitones) => {
    if (!chords) return '';
    
    // Split by spaces or other common chord progression separators
    const chordArray = chords.split(/([|\s-])/);
    return chordArray.map(item => {
      // Only transpose items that look like chords
      if (/^[A-G][b#]?/.test(item)) {
        return transposeChord(item, semitones);
      }
      return item;
    }).join('');
  };

  // Track the currently loaded sheet's ID
  const [currentSheetId, setCurrentSheetId] = useState(null);
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedSheets, setSavedSheets] = useState([]);
  // Parts module state
  const [partsModule, setPartsModule] = useState([]);
  const [transposeValue, setTransposeValue] = useState(0);
  const [editingPartIndex, setEditingPartIndex] = useState(null);
  const [editingPartField, setEditingPartField] = useState(null);
  const [partEditValue, setPartEditValue] = useState('');

  // Fetch saved sheets from localStorage
  // Fetch saved sheets when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      const sheets = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('sheet_')) {
          try {
            const sheet = JSON.parse(localStorage.getItem(key));
            sheets.push(sheet);
          } catch (e) { /* ignore */ }
        }
      }
      // Sort by id descending (most recent first)
      sheets.sort((a, b) => b.id - a.id);
      setSavedSheets(sheets);
    }
  }, [sidebarOpen]);

  // Load a sheet by id
  function loadSheet(id) {
    const raw = localStorage.getItem(`sheet_${id}`);
    if (!raw) return;
    try {
      const sheet = JSON.parse(raw);
      setSongData({ title: sheet.title || '', artist: sheet.artist || '', bpm: sheet.bpm || '' });
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
      // Load parts module if available
      if (sheet.partsModule) {
        setPartsModule(sheet.partsModule);
      } else {
        // Initialize parts module from section parts if needed
        initializePartsModule();
      }
      setTransposeValue(sheet.transposeValue || 0);
      setCurrentSheetId(sheet.id || null);
    } catch (e) {
      alert('Failed to load sheet');
    }
  }

  // ...existing state
  const [songData, setSongData] = useState({ title: "", artist: "", bpm: "" });
  const [sections, setSections] = useState([
  {
    id: Date.now(),
    name: "Verse 1",
    energy: 5,
    parts: [{ id: Date.now() + 1, part: "A", bars: 4, lyrics: "" }],
  },
]);
  
  // Initialize parts module when sections change or on first load
  useEffect(() => {
    if (sections.length > 0 && partsModule.length === 0) {
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
          chords: '',
        }));
        
        if (initialParts.length > 0) {
          setPartsModule(initialParts);
        }
      };
      
      initPartsFromSections();
    }
  }, [sections, partsModule.length]);
  const [editing, setEditing] = useState(null); // {si,pi,field}
  const [editValue, setEditValue] = useState("");
  const [idCounter, setIdCounter] = useState(() => Date.now());
  const [energyDialog, setEnergyDialog] = useState({ open: false, sectionIndex: null, currentValue: 5 });

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null, // 'section' or 'part'
    si: null,
    pi: null,
    isNew: false, // Used for position adjustment
  });
  const contextMenuRef = useRef(null);

  // Hover state tracking
  const [hoverState, setHoverState] = useState({
    type: null, // 'section' or 'part'
    si: null,
    pi: null
  });

  // Placeholder text for empty fields
  const placeholders = {
    lyrics: "Add lyrics here...",
    notes: "Add notes here..."
  };
  
  // Define common widths for consistent columns
  const columnWidths = {
    section: "w-[120px] min-w-[120px]",
    part: "w-[60px] min-w-[60px]",
    bars: "w-[60px] min-w-[60px]",
    lyrics: "flex-1",
    notes: "w-[200px] min-w-[200px]",
    actions: "w-[40px] min-w-[40px]"
  };
  

  // Helper to get a unique ID
  const getNextId = () => {
    setIdCounter((id) => id + 1);
    return idCounter + 1;
  };

  // Immutably update sections
  const updateSections = (cb) =>
    setSections((prev) =>
      cb(prev.map((s) => ({
        ...s,
        parts: s.parts.map((p) => ({ ...p })),
      })))
    );

  // Editing logic for section and parts
  const beginEdit = (si, pi, f, type = 'part') => {
    setEditing({ si, pi, f, type });
    
    if (type === 'section') {
      // For section fields
      setEditValue(String(sections[si][f] ?? ""));
    } else {
      // For part fields
      setEditValue(String(sections[si].parts[pi][f] ?? ""));
    }
    
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
          const newPartExists = partsModule.some(p => p.part === editValue);
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

  const isEditing = (si, pi, f, type = 'part') => {
    if (type === 'partsModule') {
      return editing && 
        editing.type === 'partsModule' && 
        editing.si === pi && 
        editing.f === f;
    }
    
    return editing && 
      editing.si === si && 
      (type === 'section' ? true : editing.pi === pi) && 
      editing.f === f &&
      editing.type === type;
  };
  
  console.log('Current editing state:', editing); // Debugging

  // CRUD
  const addSection = () => {
    const newId = getNextId();
    const partId = getNextId();
    setSections((prev) => [
      ...prev,
      {
        id: newId,
        name: "New Section",
        energy: 5,
        parts: [{ id: partId, part: "A", bars: 4, lyrics: "" }],
      },
    ]);
  };

  const deleteSection = (si) => {
    setSections((prev) => prev.filter((_, idx) => idx !== si));
  };

  const addPart = (si) => {
    const newId = getNextId();
    let newPartLabel = '';
    
    setSections((prev) => {
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
      
      // After updating sections, add this part to the parts module if it doesn't exist
      setTimeout(() => {
        addPartToModule(newPartLabel, 4);
      }, 0);
      
      return updatedSections;
    });
  };
  
  // Add a part to the parts module if it doesn't exist yet
  const addPartToModule = (partLabel, bars = 4) => {
    setPartsModule(prev => {
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
    });
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

  // Cell renderer
  const cell = (si, pi, f, v, cls) => {
    const ed = isEditing(si, pi, f);
    return (
      <div className={cls + (ed ? " editing-cell" : "")} onClick={() => !ed && beginEdit(si, pi, f)}>
        {ed ? (
          f === "lyrics" ? (
            <textarea
              className="lyrics-textarea"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Escape") setEditing(null);
                // Allow Enter key for new lines in lyrics
              }}
              autoFocus
            />
          ) : (
            <input
              className={`cell-input${f === "bars" ? " cell-input--bars" : " cell-input--other"}`}
              type={f === "bars" ? "number" : "text"}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(null);
              }}
              autoFocus
            />
          )
        ) : (
          <div className={f === "lyrics" ? "lyrics-display" : "cell-display"}>
            {v}
          </div>
        )}
      </div>
    );
  };

  // Context menu handlers
  const handleContextMenu = (e, type, si, pi = null) => {
    e.preventDefault();
    
    // Initial positions
    let x = e.clientX;
    let y = e.clientY;
    
    // We'll adjust these after the menu is rendered
    // Set a flag to indicate this is a new menu opening
    setContextMenu({
      visible: true,
      x: x,
      y: y,
      type,
      si,
      pi,
      isNew: true, // Flag to trigger the position adjustment effect
    });
  };

  // Hide context menu on click elsewhere
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu((cm) => ({ ...cm, visible: false }));
      }
    };
    
    // Handle menu positioning to ensure it stays within viewport
    const adjustMenuPosition = () => {
      if (contextMenuRef.current && contextMenu.isNew) {
        const menu = contextMenuRef.current;
        const menuRect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const margin = 10; // Margin from viewport edges (px)
        
        let adjustedX = contextMenu.x;
        let adjustedY = contextMenu.y;
        
        // Check right edge
        if (menuRect.right > viewportWidth - margin) {
          adjustedX = viewportWidth - menuRect.width - margin;
        }
        
        // Check bottom edge
        if (menuRect.bottom > viewportHeight - margin) {
          adjustedY = viewportHeight - menuRect.height - margin;
        }
        
        // Check left edge
        if (adjustedX < margin) {
          adjustedX = margin;
        }
        
        // Check top edge
        if (adjustedY < margin) {
          adjustedY = margin;
        }
        
        // Update menu position if needed
        if (adjustedX !== contextMenu.x || adjustedY !== contextMenu.y) {
          setContextMenu(cm => ({
            ...cm,
            x: adjustedX,
            y: adjustedY,
            isNew: false // Reset the flag
          }));
        } else {
          // No adjustment needed, just reset the flag
          setContextMenu(cm => ({ ...cm, isNew: false }));
        }
      }
    };
    
    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleOutsideClick);
      // Adjust position after render
      adjustMenuPosition();
    }
    
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [contextMenu.visible, contextMenu.x, contextMenu.y, contextMenu.isNew]);

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

  // Energy dialog handlers
  const openEnergyDialog = (sectionIndex) => {
    setEnergyDialog({
      open: true,
      sectionIndex,
      currentValue: sections[sectionIndex].energy
    });
    setContextMenu(null); // Close the context menu
  };

  const closeEnergyDialog = () => {
    setEnergyDialog({ ...energyDialog, open: false });
  };

  const handleEnergyChange = (e) => {
    setEnergyDialog({ ...energyDialog, currentValue: parseInt(e.target.value) });
  };

  const saveEnergyLevel = () => {
    if (energyDialog.sectionIndex !== null) {
      const updatedSections = [...sections];
      updatedSections[energyDialog.sectionIndex] = {
        ...updatedSections[energyDialog.sectionIndex],
        energy: energyDialog.currentValue
      };
      setSections(updatedSections);
    }
    closeEnergyDialog();
  };

  // New Sheet handler
  const handleNewSheet = () => {
    if (window.confirm('Do you want to save your current sheet before starting a new one?')) {
      handleSave();
    }
    // Reset songData and sections to initial state
    setSongData({ title: '', artist: '', bpm: '' });
    const newId = Date.now();
    setSections([
      {
        id: newId,
        name: 'Verse 1',
        energy: 5,
        parts: [{ id: newId + 1, part: 'A', bars: 4, lyrics: '' }],
      },
    ]);
    setPartsModule([
      {
        id: newId + 2,
        part: 'A',
        bars: 4,
        chords: '',
      }
    ]);
    setTransposeValue(0);
    setIdCounter(newId + 3);
    setCurrentSheetId(null);
  };

  // Save sheet abstraction (localStorage for now)
  function saveSheet(sheetData) {
    const id = sheetData.id || Date.now();
    const sheetToSave = { ...sheetData, id };
    localStorage.setItem(`sheet_${id}`, JSON.stringify(sheetToSave));
    return id;
  }
  
  // Initialize or refresh parts module based on current sections
  const initializePartsModule = () => {
    if (!sections || sections.length === 0) return;
    
    // Extract unique part labels from all sections
    const uniqueParts = new Set();
    sections.forEach(section => {
      section.parts.forEach(part => {
        if (part.part) uniqueParts.add(part.part);
      });
    });
    
    // Create parts module entries for each unique part
    const newPartsModule = Array.from(uniqueParts).map(partLabel => ({
      id: Date.now() + Math.floor(Math.random() * 1000),
      part: partLabel,
      bars: sections.find(s => s.parts.find(p => p.part === partLabel))?.parts.find(p => p.part === partLabel)?.bars || 4,
      chords: '',
    }));
    
    // Preserve existing chords from current parts module
    const updatedPartsModule = newPartsModule.map(newPart => {
      const existingPart = partsModule.find(p => p.part === newPart.part);
      if (existingPart && existingPart.chords) {
        return { ...newPart, chords: existingPart.chords };
      }
      return newPart;
    });
    
    setPartsModule(updatedPartsModule);
  };

  // Save handler
  const handleSave = () => {
    // If currentSheetId is set, overwrite that sheet
    const id = currentSheetId || Date.now();
    const sheetToSave = { ...songData, sections, partsModule, transposeValue, id };
    localStorage.setItem(`sheet_${id}`, JSON.stringify(sheetToSave));
    setCurrentSheetId(id);
    alert(`Sheet saved! (id: ${id})`);
  };

  // Save As handler
  const handleSaveAs = () => {
    const id = Date.now();
    const sheetToSave = { ...songData, sections, partsModule, transposeValue, id };
    localStorage.setItem(`sheet_${id}`, JSON.stringify(sheetToSave));
    setCurrentSheetId(id);
    alert(`Sheet saved as new! (id: ${id})`);
  };

  // Export handler that opens a print-friendly version in a new tab
  const handleExport = () => {
    // Filter out placeholder text before exporting
    const processedSections = sections.map(section => ({
      ...section,
      parts: section.parts.map(part => ({
        ...part,
        // Don't export empty strings for lyrics and notes
        lyrics: part.lyrics || '',
        notes: part.notes || ''
      }))
    }));
    
    // Create a new window/tab
    const printWindow = window.open('', '_blank');
    
    // Generate the print-friendly HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${songData.title || 'Untitled'} - Band Sheet</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #333;
              max-width: 900px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 5px;
            }
            .meta {
              display: flex;
              gap: 20px;
              margin-bottom: 25px;
              font-size: 14px;
              color: #555;
            }
            /* Sheet container */
            .sheet-container {
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
            }
            /* Sheet header row */
            .sheet-header {
              display: grid;
              grid-template-columns: 120px 60px 60px 1fr 12.5% auto;
              gap: 10px;
              padding: 8px 16px;
              background-color: #f8f8f8;
              border-bottom: 1px solid #ddd;
              font-weight: bold;
              font-size: 14px;
            }
            /* Section container */
            .section-container {
              display: flex;
              border-bottom: 1px solid #ddd;
            }
            .section-container:last-child {
              border-bottom: none;
            }
            /* Section header */
            .section-header {
              width: 120px;
              min-width: 120px;
              padding: 12px 8px;
              background-color: #f0f0f0;
              border-right: 1px solid #ddd;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
            }
            .section-name {
              font-weight: bold;
            }
            .section-energy {
              font-size: 12px;
              margin-top: 8px;
              color: #666;
            }
            /* Parts container */
            .parts-container {
              flex: 1;
            }
            /* Part row */
            .part-row {
              display: grid;
              grid-template-columns: 60px 60px 1fr 12.5% auto;
              gap: 10px;
              padding: 8px 16px;
              border-bottom: 1px solid #eee;
              align-items: center;
            }
            .part-row:last-child {
              border-bottom: none;
            }
            /* Column styles */
            .lyrics {
              white-space: pre-line;
            }
            .notes {
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              button {
                display: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <h1>${songData.title || 'Untitled'}</h1>
          <div class="meta">
            ${songData.artist ? `<div><strong>Artist:</strong> ${songData.artist}</div>` : ''}
            ${songData.bpm ? `<div><strong>BPM:</strong> ${songData.bpm}</div>` : ''}
            <div class="no-print">
              <button onclick="window.print()" style="padding: 5px 10px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Print PDF
              </button>
            </div>
          </div>
          
          <div class="sheet-container">
            <!-- Sheet header -->
            <div class="sheet-header">
              <div>Section</div>
              <div>Part</div>
              <div>Bars</div>
              <div>Lyrics</div>
              <div>Notes</div>
              <div><!-- Actions placeholder --></div>
            </div>
            
            <!-- Sections -->
            ${processedSections.map((section, si) => `
              <div class="section-container">
                <!-- Section header -->
                <div class="section-header">
                  <div class="section-name">${section.name}</div>
                  <div class="section-energy">Energy: ${section.energy}</div>
                </div>
                
                <!-- Parts container -->
                <div class="parts-container">
                  ${section.parts.map((part, pi) => `
                    <div class="part-row">
                      <div>${part.part}</div>
                      <div>${part.bars}</div>
                      <div class="lyrics">${part.lyrics}</div>
                      <div class="notes">${part.notes || ''}</div>
                      <div><!-- No actions in print view --></div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;
    
    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Automatically trigger print when content is loaded
    printWindow.onload = function() {
      // Give a moment for styles to apply
      setTimeout(() => {
        // printWindow.print();
        // Keep the window/tab open for the user to manually print
      }, 250);
    };
  };

  // JSX
  return (
    <div className="flex h-full min-h-screen bg-white relative">
      {/* Vertical toolbar */}
      <div className="w-14 bg-gray-700 border-r border-gray-800 shadow-md flex flex-col items-center py-4 z-30">
        <button 
          className={`p-2 rounded-md mb-2 transition-colors ${sidebarOpen ? 'bg-white text-gray-700' : 'text-white hover:bg-gray-600'}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title="Saved Sheets"
        >
          <FolderIcon className="w-6 h-6" />
        </button>
        <button 
          className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
          onClick={handleNewSheet}
          title="New Sheet"
        >
          <FilePlusIcon className="w-6 h-6" />
        </button>
        <button 
          className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
          onClick={handleSave}
          title="Save"
        >
          <SaveIcon className="w-6 h-6" />
        </button>
        <button 
          className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
          onClick={handleSaveAs}
          title="Save As"
        >
          <SaveAllIcon className="w-6 h-6" />
        </button>
        <button 
          className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
          onClick={handleExport}
          title="Download"
        >
          <DownloadIcon className="w-6 h-6" />
        </button>
      </div>
      
      {/* Sidebar */}
      <div className={`z-20 transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
        <SavedSheetsPanel
          open={sidebarOpen}
          savedSheets={savedSheets}
          onClose={() => setSidebarOpen(false)}
          onDoubleClickSheet={loadSheet}
          onUpdate={() => {
            // Re-fetch all saved sheets from localStorage
            const sheets = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key.startsWith('sheet_')) {
                try {
                  const sheet = JSON.parse(localStorage.getItem(key));
                  sheets.push(sheet);
                } catch (e) { /* ignore */ }
              }
            }
            sheets.sort((a, b) => b.id - a.id);
            setSavedSheets(sheets);
          }}
        />
        {/* Mobile overlay backdrop */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-10" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
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
        <div className="flex flex-wrap gap-4 items-end p-4 bg-gray-50 border-b border-gray-200 rounded-t-xl shadow-sm">
          <input
            className="flex-1 min-w-[160px] px-3 py-2 rounded border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-lg font-semibold placeholder-gray-400"
            placeholder="Song Title"
            value={songData.title}
            onChange={e => setSongData((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            className="flex-1 min-w-[120px] px-3 py-2 rounded border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-base placeholder-gray-400"
            placeholder="Artist"
            value={songData.artist}
            onChange={e => setSongData((prev) => ({ ...prev, artist: e.target.value }))}
          />
          <div className="flex items-center gap-2">
            <input
              className="w-20 px-2 py-2 rounded border border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-base placeholder-gray-400"
              type="number"
              placeholder="BPM"
              value={songData.bpm}
              onChange={e => setSongData((prev) => ({ ...prev, bpm: e.target.value }))}
            />
            <span className="text-xs text-gray-500">bpm</span>
          </div>
        </div>

        {/* Sheet container */}
        <div className="mt-8 ml-4 mr-4 mb-4 bg-white rounded-md shadow border border-gray-200 overflow-x-auto">
          {/* Sheet header row */}
          <div className="flex border-b border-gray-300 font-bold bg-white text-sm text-gray-800">
            <div className="w-[120px] min-w-[120px] px-4 py-2 flex items-center">Section</div>
            <div className="w-[60px] min-w-[60px] px-4 py-2 flex items-center">Part</div>
            <div className="w-[60px] min-w-[60px] px-2 py-2 flex items-center">Bars</div>
            <div className="flex-1 px-2 py-2 flex items-center">Lyrics</div>
            <div className="w-[200px] min-w-[200px] px-2 py-2 flex items-center">Notes</div>
            <div className="w-[40px] min-w-[40px] px-2 py-2 flex justify-center items-center"></div>
          </div>

          {/* Sections */}
          {sections.map((section, si) => (
            <div key={section.id} className="border-b border-gray-200">
              <div className="flex">
                {/* Section header */}
                <div 
                  className="w-[120px] min-w-[120px] border-r border-gray-300 p-4 flex flex-col justify-between"
                  style={{ backgroundColor: getEnergyBackgroundColor(section.energy) }}
                  onMouseEnter={() => setHoverState({ type: 'section', si, pi: null })}
                  onMouseLeave={() => setHoverState({ type: null, si: null, pi: null })}
                >
                  <div className="flex justify-between items-start">
                    <div 
                      className={`font-semibold flex-1 ${isEditing(si, null, 'name', 'section') ? 'editing-cell' : 'cursor-pointer'}`}
                      onClick={() => !isEditing(si, null, 'name', 'section') && beginEdit(si, null, 'name', 'section')}
                    >
                      {isEditing(si, null, 'name', 'section') ? (
                        <input
                          className="w-full bg-white rounded px-1 py-px text-sm"
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={saveEdit}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") setEditing(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        section.name || "Untitled Section"
                      )}
                    </div>
                    {(hoverState.type === 'section' && hoverState.si === si) && (
                      <div className="cursor-pointer ml-1" onClick={(e) => handleContextMenu(e, "section", si)}>
                        <MenuIcon className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                      </div>
                    )}
                  </div>

                </div>

                {/* Parts container */}
                <div className="flex-1">
                  {section.parts.map((part, pi) => (
                    <div 
                      key={part.id} 
                      className="flex min-h-[40px] border-b border-gray-100 last:border-b-0"
                      onMouseEnter={() => setHoverState({ type: 'part', si, pi })}
                      onMouseLeave={() => setHoverState({ type: null, si: null, pi: null })}
                    >
                      {/* Using the exact same widths as the header */}
                      <div 
                        className="w-[60px] min-w-[60px] px-4 py-2 cursor-pointer flex items-center"
                        onClick={() => !isEditing(si, pi, 'part') && beginEdit(si, pi, 'part')}
                      >
                        {isEditing(si, pi, 'part') ? (
                          <input
                            className="w-full bg-white rounded px-2 py-1 text-sm"
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          part.part || "?"
                        )}
                      </div>
                      
                      <div 
                        className="w-[60px] min-w-[60px] px-2 py-2 cursor-pointer flex items-center"
                        onClick={() => !isEditing(si, pi, 'bars') && beginEdit(si, pi, 'bars')}
                      >
                        {isEditing(si, pi, 'bars') ? (
                          <input
                            className="w-full bg-white rounded px-2 py-1 text-sm"
                            type="number"
                            min="1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditing(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          part.bars
                        )}
                      </div>
                                            <div 
                        className="flex-1 px-2 py-2 text-gray-500 cursor-pointer overflow-y-auto"
                        onClick={() => !isEditing(si, pi, 'lyrics') && beginEdit(si, pi, 'lyrics')}
                      >
                        {isEditing(si, pi, 'lyrics') ? (
                          <textarea
                            className="w-full bg-white rounded px-2 py-1 text-sm min-h-[48px] resize-vertical overflow-y-auto"
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
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditing(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="whitespace-pre-line max-h-[120px] overflow-y-auto">
                            {part.lyrics || <span className="text-gray-400 italic">{placeholders.lyrics}</span>}
                          </div>
                        )}
                      </div>
                      
                      <div 
                        className="w-[200px] min-w-[200px] px-2 py-2 text-xs text-gray-500 cursor-pointer overflow-y-auto"
                        onClick={() => !isEditing(si, pi, 'notes') && beginEdit(si, pi, 'notes')}
                      >
                        {isEditing(si, pi, 'notes') ? (
                          <textarea
                            className="w-full bg-white rounded px-2 py-1 text-xs min-h-[48px] resize-vertical overflow-y-auto"
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
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") setEditing(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="whitespace-pre-line max-h-[120px] overflow-y-auto">
                            {part.notes ? part.notes : <span className="text-gray-400 italic">{placeholders.notes}</span>}
                          </div>
                        )}
                      </div>
                      
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
                  ))}
                </div>
              </div>
            </div>
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
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm ml-2"
                onClick={initializePartsModule}
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
          {partsModule.map((partItem, index) => (
            <div key={partItem.id} className="flex min-h-[40px] border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
              {/* Part */}
              <div className="w-[80px] min-w-[80px] px-4 py-2 flex items-center font-semibold">
                {editingPartIndex === index && editingPartField === 'part' ? (
                  <input
                    className="w-full bg-white rounded px-2 py-1 text-sm border border-gray-300"
                    type="text"
                    value={partEditValue}
                    onChange={(e) => setPartEditValue(e.target.value)}
                    onBlur={() => {
                      // Save edit
                      if (partEditValue) {
                        const updatedParts = [...partsModule];
                        updatedParts[index] = {...updatedParts[index], part: partEditValue};
                        setPartsModule(updatedParts);
                      }
                      setEditingPartIndex(null);
                      setEditingPartField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // Save edit
                        if (partEditValue) {
                          const updatedParts = [...partsModule];
                          updatedParts[index] = {...updatedParts[index], part: partEditValue};
                          setPartsModule(updatedParts);
                        }
                        setEditingPartIndex(null);
                        setEditingPartField(null);
                      }
                      if (e.key === "Escape") {
                        setEditingPartIndex(null);
                        setEditingPartField(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingPartIndex(index);
                      setEditingPartField('part');
                      setPartEditValue(partItem.part || '');
                    }}
                  >
                    {partItem.part}
                  </div>
                )}
              </div>
              
              {/* Bars */}
              <div className="w-[80px] min-w-[80px] px-2 py-2 flex items-center">
                {editingPartIndex === index && editingPartField === 'bars' ? (
                  <input
                    className="w-full bg-white rounded px-2 py-1 text-sm border border-gray-300"
                    type="number"
                    min="1"
                    value={partEditValue}
                    onChange={(e) => setPartEditValue(e.target.value)}
                    onBlur={() => {
                      // Save edit
                      const updatedParts = [...partsModule];
                      updatedParts[index] = {...updatedParts[index], bars: parseInt(partEditValue) || 4};
                      setPartsModule(updatedParts);
                      setEditingPartIndex(null);
                      setEditingPartField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        // Save edit
                        const updatedParts = [...partsModule];
                        updatedParts[index] = {...updatedParts[index], bars: parseInt(partEditValue) || 4};
                        setPartsModule(updatedParts);
                        setEditingPartIndex(null);
                        setEditingPartField(null);
                      }
                      if (e.key === "Escape") {
                        setEditingPartIndex(null);
                        setEditingPartField(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer"
                    onClick={() => {
                      setEditingPartIndex(index);
                      setEditingPartField('bars');
                      setPartEditValue(partItem.bars.toString());
                    }}
                  >
                    {partItem.bars}
                  </div>
                )}
              </div>
              
              {/* Chords */}
              <div className="flex-1 px-2 py-2 overflow-y-auto">
                {editingPartIndex === index && editingPartField === 'chords' ? (
                  <textarea
                    className="w-full bg-white rounded px-2 py-1 text-sm min-h-[40px] resize-vertical border border-gray-300"
                    value={partEditValue}
                    onChange={(e) => {
                      setPartEditValue(e.target.value);
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
                      const updatedParts = [...partsModule];
                      updatedParts[index] = {...updatedParts[index], chords: partEditValue};
                      setPartsModule(updatedParts);
                      setEditingPartIndex(null);
                      setEditingPartField(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setEditingPartIndex(null);
                        setEditingPartField(null);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <div 
                    className="cursor-pointer whitespace-pre-wrap max-h-[120px] overflow-y-auto w-full h-full p-1 hover:bg-gray-100"
                    onClick={() => {
                      setEditingPartIndex(index);
                      setEditingPartField('chords');
                      setPartEditValue(partItem.chords || '');
                    }}
                  >
                    {partItem.chords || <span className="text-gray-400 italic">Click to add chords...</span>}
                  </div>
                )}
              </div>
              
              {/* Transposed Chords */}
              <div className="flex-1 px-2 py-2 overflow-y-auto">
                <div className="font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                  {partItem.chords ? getTransposedChords(partItem.chords, transposeValue) : 
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
        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            className="fixed bg-white border border-gray-300 rounded shadow-lg z-[1000] min-w-[160px] py-1"
            style={{
              top: contextMenu.y,
              left: contextMenu.x
            }}
          >
            {contextMenu.type === "section" && (
              <>
                {/* Only show Move Up if not the first section */}
                {contextMenu.si > 0 && (
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleMenuAction("moveUp")}
                  >
                    Move Up
                  </div>
                )}
                {/* Only show Move Down if not the last section */}
                {contextMenu.si < sections.length - 1 && (
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleMenuAction("moveDown")}
                  >
                    Move Down
                  </div>
                )}
                <div
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleMenuAction("setEnergyLevel")}
                >
                  Set Energy Level
                </div>
                <div
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleMenuAction("duplicate")}
                >
                  Duplicate Section
                </div>
                <div
                  className="px-4 py-2 cursor-pointer text-red-500 hover:bg-gray-100"
                  onClick={() => handleMenuAction("delete")}
                >
                  Delete Section
                </div>
              </>
            )}
            {contextMenu.type === "part" && (
              <>
                {/* Only show Move Up if not the first part */}
                {contextMenu.pi > 0 && (
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleMenuAction("moveUp")}
                  >
                    Move Up
                  </div>
                )}
                {/* Only show Move Down if not the last part */}
                {contextMenu.pi < sections[contextMenu.si]?.parts.length - 1 && (
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleMenuAction("moveDown")}
                  >
                    Move Down
                  </div>
                )}
                <div
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleMenuAction("add")}
                >
                  Add Part
                </div>
                <div
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleMenuAction("duplicate")}
                >
                  Duplicate Part
                </div>
                <div
                  className="px-4 py-2 cursor-pointer text-red-500 hover:bg-gray-100"
                  onClick={() => handleMenuAction("delete")}
                >
                  Delete Part
                </div>
              </>
            )}
          </div>
        )}
        {/* Energy Level Dialog */}
        {energyDialog.open && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
              <h3 className="text-lg font-bold mb-4">Set Energy Level</h3>
              
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Low Energy (1)</span>
                  <span>High Energy (10)</span>
                </div>
                
                <input 
                  type="range"
                  min="1"
                  max="10"
                  value={energyDialog.currentValue}
                  onChange={handleEnergyChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                
                <div className="text-center font-semibold text-lg mt-2">
                  {energyDialog.currentValue}
                </div>
                
                {/* Preview of the section color */}
                <div 
                  className="w-full h-10 mt-4 rounded border border-gray-300"
                  style={{ backgroundColor: getEnergyBackgroundColor(energyDialog.currentValue) }}
                ></div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={closeEnergyDialog}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveEnergyLevel}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
