import React, { useState, useEffect, useRef } from "react";

import { ReactComponent as GripIcon } from "../assets/grip.svg";
import { ReactComponent as MenuIcon } from "../assets/menu.svg";
import SavedSheetsPanel from './SavedSheetsPanel';
// import { ReactComponent as TrashIcon } from "../assets/trash.svg";
// import { ReactComponent as CopyPlusIcon } from "../assets/copy_plus.svg";
// import { ReactComponent as ListPlusIcon } from "../assets/list_plus.svg";

/**
 * BandSheetEditor – full compile‑ready file
 * Sections each have their own header bar with: ⇅ title energy + ×
 * Part rows list: Part | Bars | Lyrics | ⇅ + ×
 * Drag‑and‑drop: reorder sections and rows within a section
 */

const DropIndicator = () => (
  <div className="drop-indicator" />
);

export default function BandSheetEditor() {
  // Track the currently loaded sheet's ID
  const [currentSheetId, setCurrentSheetId] = useState(null);
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedSheets, setSavedSheets] = useState([]);

  // Fetch saved sheets from localStorage
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
      setSections(sheet.sections || []);
      setIdCounter(sheet.id ? sheet.id + 2 : Date.now());
      setCurrentSheetId(sheet.id || null);
    } catch (e) {
      alert('Failed to load sheet');
    }
  }
  // ...existing state
  const [draggingSectionIndex, setDraggingSectionIndex] = useState(null);
  const [draggingPart, setDraggingPart] = useState(null);
  const [partDragReady, setPartDragReady] = useState(null);
  // State
  const [songData, setSongData] = useState({ title: "", artist: "", bpm: "" });
  const [sections, setSections] = useState([]);
  const [editing, setEditing] = useState(null); // {si,pi,field}
  const [editValue, setEditValue] = useState("");
  const [dragInfo, setDragInfo] = useState(null); // { type:'section'|'part', si, pi }
  const [indicator, setIndicator] = useState(null); // {type,index,si}
  const [idCounter, setIdCounter] = useState(() => Date.now());

  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null, // 'section' or 'part'
    si: null,
    pi: null,
  });
  const contextMenuRef = useRef(null);

  // Only add the initial section on mount
  useEffect(() => {
    if (sections.length === 0) {
      setSections([
        {
          id: idCounter,
          name: "Verse 1",
          energy: 5,
          parts: [{ id: idCounter + 1, part: "A", bars: 4, lyrics: "" }],
        },
      ]);
      setIdCounter((id) => id + 2);
      setCurrentSheetId(null);
    }
    // eslint-disable-next-line
  }, []);

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

  // Editing logic
  const beginEdit = (si, pi, f) => {
    setEditing({ si, pi, f });
    setEditValue(String(sections[si].parts[pi][f] ?? ""));
  };

  const saveEdit = () => {
    if (!editing) return;
    const { si, pi, f } = editing;
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
    setEditing(null);
  };

  const isEditing = (si, pi, f) =>
    editing && editing.si === si && editing.pi === pi && editing.f === f;

  // Drag helpers
  const gap = (e, idx) =>
    e.clientY - e.currentTarget.getBoundingClientRect().top >
      e.currentTarget.getBoundingClientRect().height / 2
      ? idx + 1
      : idx;

  const clearDrag = () => {
    setDragInfo(null);
    setIndicator(null);
    setDraggingSectionIndex(null);
    setDraggingPart(null);
    setPartDragReady(null);
  };

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
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== si) return section;
        const p = section.parts;
        const next = String.fromCharCode(
          (p[p.length - 1]?.part.charCodeAt(0) ?? 64) + 1,
        );
        return {
          ...section,
          parts: [
            ...section.parts,
            { id: newId, part: next, bars: 4, lyrics: "" },
          ],
        };
      }),
    );
  };

  const deletePart = (si, pi) => {
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== si) return section;
        return {
          ...section,
          parts: section.parts.filter((_, pidx) => pidx !== pi),
        };
      }),
    );
  };

  // Drag handlers
  const startSectionDrag = (e, si) => {
    e.dataTransfer.effectAllowed = "move";
    setDragInfo({ type: "section", si });
  };

  const overSection = (e, hoverSi) => {
    if (dragInfo?.type !== "section") return;
    e.preventDefault();
    // If this is a drop zone before a section, set index directly
    if (e.currentTarget.classList.contains('section-drop-zone')) {
      setIndicator({ type: "section", index: hoverSi });
      return;
    }
    const g = gap(e, hoverSi);
    setIndicator({ type: "section", index: g });
  };

  const dropSection = () => {
    if (dragInfo?.type !== "section" || !indicator) return;
    setSections((prev) => {
      const arr = prev.slice();
      const [moved] = arr.splice(dragInfo.si, 1);
      let tgt = indicator.index;
      if (dragInfo.si < tgt) tgt -= 1;
      arr.splice(tgt, 0, moved);
      return arr;
    });
    clearDrag();
  };

  const startPartDrag = (e, si, pi) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    setDragInfo({ type: "part", si, pi });
    setDraggingPart({ si, pi });
    console.log('startPartDrag', { si, pi });
  };

  const overPart = (e, si, hoverPi) => {
    e.preventDefault(); // Always call preventDefault
    if (dragInfo?.type !== "part" || dragInfo.si !== si) return;
    // If this is a drop zone before a part, set index directly
    if (e.currentTarget.classList.contains('part-drop-zone')) {
      setIndicator({ type: "part", si, index: hoverPi });
      console.log('overPart (drop zone)', { si, hoverPi });
      return;
    }
    const g = gap(e, hoverPi);
    setIndicator({ type: "part", si, index: g });
    console.log('overPart (gap)', { si, hoverPi, g });
  };

  const dropPart = (si) => {
    console.log('dropPart', { dragInfo, indicator, si });
    if (dragInfo?.type !== "part" || !indicator || dragInfo.si !== si) return;
    setSections((prev) =>
      prev.map((section, idx) => {
        if (idx !== si) return section;
        const arr = section.parts.slice();
        const [moved] = arr.splice(dragInfo.pi, 1);
        let tgt = indicator.index;
        if (dragInfo.pi < tgt) tgt -= 1;
        arr.splice(tgt, 0, moved);
        return { ...section, parts: arr };
      }),
    );
    clearDrag();
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
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      si,
      pi,
    });
  };

  // Hide context menu on click elsewhere
  useEffect(() => {
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu((cm) => ({ ...cm, visible: false }));
      }
    };
    if (contextMenu.visible) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [contextMenu.visible]);

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
          }),
        );
      } else if (action === "delete") {
        deletePart(si, pi);
      }
    }
    setContextMenu((cm) => ({ ...cm, visible: false }));
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
    setIdCounter(newId + 2);
    setCurrentSheetId(null);
  };

  // Save sheet abstraction (localStorage for now)
  function saveSheet(sheetData) {
    const id = sheetData.id || Date.now();
    const sheetToSave = { ...sheetData, id };
    localStorage.setItem(`sheet_${id}`, JSON.stringify(sheetToSave));
    return id;
  }

  // Save handler
  const handleSave = () => {
    // If currentSheetId is set, overwrite that sheet
    const id = currentSheetId || Date.now();
    const sheetToSave = { ...songData, sections, id };
    localStorage.setItem(`sheet_${id}`, JSON.stringify(sheetToSave));
    setCurrentSheetId(id);
    alert(`Sheet saved! (id: ${id})`);
  };

  // Save As handler
  const handleSaveAs = () => {
    const id = Date.now();
    const sheetToSave = { ...songData, sections, id };
    localStorage.setItem(`sheet_${id}`, JSON.stringify(sheetToSave));
    setCurrentSheetId(id);
    alert(`Sheet saved as new! (id: ${id})`);
  };

  // Export handler for clarity
  const handleExport = () => {
    console.log({ ...songData, sections });
  };

  // JSX
  return (
    <div className="flex h-full min-h-screen bg-white relative" onDragEnd={clearDrag}>
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

        {/* Sheet grid container */}
        <div className="w-full mt-8 bg-white rounded-xl shadow p-0 border border-gray-200 overflow-x-auto">
          {/* Sheet Header */}
          <div className="grid grid-cols-5 px-4 py-2 border-b border-gray-300 font-bold bg-white text-sm text-gray-800">
            <div>Part</div>
            <div>Bars</div>
            <div>Lyrics</div>
            <div>Notes</div>
            <div className="text-center">Actions</div>
          </div>

          {/* Sections */}
          {/* (Old section/part rendering code removed; now handled by new grid layout above) */}



        {indicator?.type === "section" &&
          indicator.index === sections.length && <DropIndicator />}

        {/* Add new section button at the bottom */}
        <div className="flex flex-col items-center justify-center mt-6 cursor-pointer select-none group" onClick={addSection}>
          <div className="text-2xl font-bold text-blue-600 group-hover:text-blue-800 leading-none">+</div>
          <div className="text-xs text-gray-500 group-hover:text-blue-700">Add Section</div>
        </div>

        {/* Action buttons row, right-aligned under the sheet */}
        <div className="flex justify-end gap-3 mt-8 mb-2">
          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-medium"
            onClick={handleNewSheet}
          >
            New Sheet
          </button>
          <button
            type="button"
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition font-medium"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            type="button"
            className="bg-yellow-400 text-gray-900 px-4 py-2 rounded shadow hover:bg-yellow-500 transition font-medium"
            onClick={handleSaveAs}
          >
            Save As
          </button>
          <button
            type="button"
            className="bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-900 transition font-medium"
            onClick={handleExport}
          >
            Export
          </button>
        </div>

      </div>
      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="custom-context-menu"
          style={{
            position: "fixed",
            top: contextMenu.y,
            left: contextMenu.x,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            zIndex: 1000,
            minWidth: 160,
            padding: "4px 0",
          }}
        >
          {contextMenu.type === "section" && (
            <>
              <div
                className="context-menu-item"
                style={{ padding: "8px 16px", cursor: "pointer" }}
                onClick={() => handleMenuAction("duplicate")}
              >
                Duplicate section
              </div>
              <div
                className="context-menu-item"
                style={{ padding: "8px 16px", cursor: "pointer", color: "#e74c3c" }}
                onClick={() => handleMenuAction("delete")}
              >
                Delete section
              </div>
            </>
          )}
          {contextMenu.type === "part" && (
            <>
              <div
                className="context-menu-item"
                style={{ padding: "8px 16px", cursor: "pointer" }}
                onClick={() => handleMenuAction("add")}
              >
                Add part
              </div>
              <div
                className="context-menu-item"
                style={{ padding: "8px 16px", cursor: "pointer" }}
                onClick={() => handleMenuAction("duplicate")}
              >
                Duplicate part
              </div>
              <div
                className="context-menu-item"
                style={{ padding: "8px 16px", cursor: "pointer", color: "#e74c3c" }}
                onClick={() => handleMenuAction("delete")}
              >
                Delete part
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </div>
  );
}
