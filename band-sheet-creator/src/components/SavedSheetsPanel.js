import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from 'react-router-dom';
import { ReactComponent as MenuIcon } from '../assets/menu.svg';
import ConfirmModal from "./ConfirmModal";
import { deleteSheet } from "../services/SheetStorageService";

export default function SavedSheetsPanel({
  open,
  savedSheets,
  onClose,
  onDoubleClickSheet,
  onUpdate,
  onSheetSelect,
}) {
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef();
  const panelRef = useRef();
  const navigate = useNavigate();

  // State for custom confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    sheetId: null
  });

  // Helper to update a sheet's title in localStorage
  // Start inline editing for rename
  const handleRename = (sheet) => {
    setEditingId(sheet.id);
    setEditingValue(sheet.title || "");
    setMenuOpenId(null);
  };

  // Focus the input when editingId changes
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Commit rename
  const commitRename = (sheet) => {
    const newTitle = editingValue.trim();
    if (newTitle && newTitle !== sheet.title) {
      const updated = { ...sheet, title: newTitle };
      localStorage.setItem(`sheet_${sheet.id}`, JSON.stringify(updated));
      if (onUpdate) onUpdate();
    }
    setEditingId(null);
    setEditingValue("");
  };

  // Cancel rename
  const cancelRename = () => {
    setEditingId(null);
    setEditingValue("");
  };

  // Helper to duplicate a sheet in localStorage
  const handleDuplicate = (sheet) => {
    const newId = Date.now();
    const duplicatedSheet = {
      ...sheet, 
      id: newId,
      title: `${sheet.title || 'Untitled'} (copy)`
    };
    localStorage.setItem(`sheet_${newId}`, JSON.stringify(duplicatedSheet));
    if (onUpdate) onUpdate();
    setMenuOpenId(null);
  };
  
  // Function for opening the delete confirmation dialog
  const confirmDeleteSheet = (id) => {
    try {
      // Find the sheet in the savedSheets array
      const sheet = savedSheets.find(s => s.id === id);
      if (!sheet) return;
      
      const title = sheet.title || 'Untitled';
      
      // Show custom confirmation dialog
      setConfirmDialog({
        isOpen: true,
        title: "Delete Sheet",
        message: `Are you sure you want to delete "${title}"?`,
        onConfirm: async () => {
          try {
            await deleteSheet(id);
            // Close the dialog first to avoid UI glitches
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            // Force a small delay to ensure the dialog is closed before refreshing
            setTimeout(() => {

              // Update the sheet list
              if (onUpdate) {
                onUpdate();
              }
            }, 100);
          } catch (error) {
            console.error('SavedSheetsPanel: Error deleting sheet:', error);
            alert('Failed to delete sheet. Please try again.');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        },
        sheetId: id
      });
    } catch (err) {
      console.error('Error preparing sheet deletion:', err);
    }
  };
  
  // Function to close the confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };
  

  // Listen for storage changes to update the panel
  useEffect(() => {
    const update = () => {
      if (panelRef.current) panelRef.current.forceUpdate?.();
    };
    window.addEventListener("storage", update);
    return () => window.removeEventListener("storage", update);
  }, []);

  // Close menu on outside click/touch, scroll, or resize
  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = (e) => {
      // Find if the click/touch was inside the menu
      const isMenuClick = e.target.closest('.sheet-menu-container');
      if (!isMenuClick) {
        setMenuOpenId(null);
      }
    };
    
    const handleScroll = () => setMenuOpenId(null);
    const handleResize = () => setMenuOpenId(null);
    
    // Delay adding the listener to prevent immediate closing
    const timer = setTimeout(() => {
      // Handle both mouse and touch events
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
      window.addEventListener("resize", handleResize);
    }, 50);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [menuOpenId]);

  // Render the menu as a portal
  const menuPortal = menuOpenId
    ? ReactDOM.createPortal(
      <div
        className="fixed bg-white border border-gray-300 rounded shadow-lg z-[9999] sheet-menu-container"
        style={{ left: menuPos.x, top: menuPos.y }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div
          className="px-4 py-2 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.preventDefault(); // Prevent focus change
            e.stopPropagation(); // Stop event bubbling
            const sheet = savedSheets.find((s) => s.id === menuOpenId);
            if (sheet) {
              handleRename(sheet);
            }
          }}
        >
          Rename
        </div>
        <div
          className="px-4 py-2 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.preventDefault(); // Prevent focus change
            e.stopPropagation(); // Stop event bubbling
            const sheet = savedSheets.find((s) => s.id === menuOpenId);
            if (sheet) {
              handleDuplicate(sheet);
            }
          }}
        >
          Duplicate
        </div>
        <div
          className="px-4 py-2 cursor-pointer whitespace-nowrap text-red-500 hover:bg-red-50 transition-colors"
          onClick={(e) => {
            e.preventDefault(); // Prevent focus change
            e.stopPropagation(); // Stop event bubbling
            
            // Get the sheet ID before closing menu
            const sheetId = menuOpenId;
            
            // Close menu immediately to avoid conflicts
            setMenuOpenId(null);
            
            // Delay delete to next event cycle
            setTimeout(() => {
              confirmDeleteSheet(sheetId);
            }, 100);
          }}
        >
          Delete
        </div>
      </div>,
      document.body,
    )
    : null;

  return (
    <div
      className={`h-full flex flex-col transition-all duration-200 overflow-hidden bg-white shadow-lg rounded-r-2xl ${open ? "w-[260px] border-r border-gray-200" : "w-0 border-none"
        } relative z-30`}
    >
      <div className="px-4 py-6 pt-10 border-b border-gray-100 font-semibold flex items-center justify-between sticky top-0 bg-white z-20 shadow-sm">
        <span className="tracking-wide text-lg text-gray-800">
          Saved Sheets
        </span>
      </div>
      <div className="flex-1 overflow-y-auto pb-2">
        {(!savedSheets || !Array.isArray(savedSheets) || savedSheets.length === 0) && (
          <div className="px-4 py-8 text-center text-gray-400 italic select-none">
            No saved sheets
          </div>
        )}
        {Array.isArray(savedSheets) && savedSheets.map((sheet) => (
          <div
            key={sheet.id}
            className="group px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2"
            onDoubleClick={() => {
              // Navigate to the sheet URL
              navigate(`/sheet/${sheet.id}`);
              // Also call the original handler
              onDoubleClickSheet(sheet.id);
            }}
          >
            <div className="flex-1 min-w-0">
              {editingId === sheet.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editingValue}
                  className="w-full font-medium text-base px-1 border-b border-blue-200 focus:border-blue-500 focus:bg-blue-50 outline-none bg-transparent transition-all rounded"
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={() => commitRename(sheet)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(sheet);
                    if (e.key === "Escape") cancelRename();
                  }}
                />
              ) : (
                <div className="font-medium">{sheet.title || "(Untitled)"}</div>
              )}
              <div className="text-xs text-gray-500">{sheet.artist || ""}</div>
              <div className="text-[11px] text-gray-400">ID: {sheet.id}</div>
            </div>
            <button
              className="bg-none border-none cursor-pointer p-1 ml-2 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (menuOpenId === sheet.id) {
                  setMenuOpenId(null);
                } else {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuOpenId(sheet.id);
                  // Position menu slightly above on touch devices to avoid finger occlusion
                  const isTouchDevice = 'ontouchstart' in window;
                  setMenuPos({ 
                    x: rect.right, 
                    y: isTouchDevice ? rect.top : rect.bottom 
                  });
                }
              }}
              aria-label="Sheet menu"
            >
              <MenuIcon style={{ width: 20, height: 20, color: "#888" }} />
            </button>
          </div>
        ))}
      </div>
      {menuPortal}
      
      {/* Custom confirmation dialog */}
      <ConfirmModal 
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirmDialog}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
}
