import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { ReactComponent as MenuIcon } from '../assets/menu.svg';
import ConfirmModal from "./ConfirmModal";
import { useSetlist } from "../contexts/SetlistContext";
import { useAuth } from "../contexts/AuthContext";
import { useSheetData } from "../contexts/SheetDataContext";
import SetlistModal from "./SetlistModal";

export default function SetlistsPanel({
  open,
  onClose,
  onSelectSetlist,
  isMobile,
}) {
  // State to track the currently expanded setlist
  const [expandedSetlistId, setExpandedSetlistId] = useState(null);
  const [deleteSetlistId, setDeleteSetlistId] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [setlistModalOpen, setSetlistModalOpen] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState(null);
  const inputRef = useRef();
  const panelRef = useRef();
  const navigate = useNavigate();
  
  // Get setlist context
  const { 
    setlists, 
    updateSetlist, 
    deleteSetlist, 
    addSheetToSetlist,
    removeSheetFromSetlist,
    reorderSetlistSheets,
    isLoading,
    error,
    loadAllSetlists
  } = useSetlist();
  
  // Get current sheet data
  const { currentSheetId, songData } = useSheetData();

  // Get auth context
  const { isAuthenticated } = useAuth();

  // State for custom confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    setlistId: null
  });

  // Start inline editing for rename
  const handleRename = (setlist) => {
    setEditingId(setlist.id);
    setEditingValue(setlist.name || "");
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
  const commitRename = async (setlist) => {
    const newName = editingValue.trim();
    if (newName && newName !== setlist.name) {
      try {
        const updatedSetlist = { 
          ...setlist, 
          name: newName 
        };
        await updateSetlist(setlist.id, updatedSetlist);
        // Refresh setlists after update
        loadAllSetlists();
      } catch (error) {
        console.error('Error updating setlist name:', error);
      }
    }
    setEditingId(null);
    setEditingValue("");
  };

  // Cancel rename
  const cancelRename = () => {
    setEditingId(null);
    setEditingValue("");
  };

  // Function to open the edit modal
  const handleEditSetlist = (setlist) => {
    setEditingSetlist(setlist);
    setSetlistModalOpen(true);
    setMenuOpenId(null);
  };

  // Function for opening the delete confirmation dialog
  const confirmDeleteSetlist = (id) => {
    try {
      // Find the setlist in the setlists array
      const setlist = setlists.find(s => s.id === id);
      if (!setlist) return;
      
      const name = setlist.name || 'Untitled';
      
      // Show custom confirmation dialog
      setConfirmDialog({
        isOpen: true,
        title: "Delete Setlist",
        message: `Are you sure you want to delete "${name}"?`,
        onConfirm: async () => {
          try {
            await deleteSetlist(id);
            // Close the dialog first to avoid UI glitches
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            // Force a small delay to ensure the dialog is closed before refreshing
            setTimeout(() => {
              // Refresh the setlist list
              loadAllSetlists();
            }, 100);
          } catch (error) {
            console.error('SetlistsPanel: Error deleting setlist:', error);
            alert('Failed to delete setlist. Please try again.');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        },
        setlistId: id
      });
    } catch (err) {
      console.error('Error preparing setlist deletion:', err);
    }
  };
  
  // Function to close the confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Close menu on outside click/touch, scroll, or resize
  useEffect(() => {
    if (!menuOpenId) return;
    const handleClickOutside = (e) => {
      // Find if the click/touch was inside the menu
      const isMenuClick = e.target.closest('.setlist-menu-container');
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

  // Render the menu directly in the component instead of using a portal
  const renderMenu = () => {
    if (!menuOpenId) return null;
    
    return (
      <div
        className="setlist-menu-container absolute bg-white shadow-lg rounded-md py-1 z-50 min-w-[150px]"
        style={{
          top: menuPos.y,
          left: menuPos.x,
        }}
      >
        <div
          className="px-4 py-2 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const setlist = setlists.find((s) => s.id === menuOpenId);
            if (setlist) {
              handleRename(setlist);
            }
          }}
        >
          Rename
        </div>
        <div
          className="px-4 py-2 cursor-pointer whitespace-nowrap hover:bg-gray-100 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const setlist = setlists.find((s) => s.id === menuOpenId);
            if (setlist) {
              handleEditSetlist(setlist);
            }
          }}
        >
          Edit
        </div>
        <div
          className="px-4 py-2 cursor-pointer whitespace-nowrap text-red-500 hover:bg-red-50 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Get the setlist ID before closing menu
            const setlistId = menuOpenId;
            
            // Close menu immediately to avoid conflicts
            setMenuOpenId(null);
            
            // Delay delete to next event cycle
            setTimeout(() => {
              confirmDeleteSetlist(setlistId);
            }, 100);
          }}
        >
          Delete
        </div>
      </div>
    );
  };

  // Create a new setlist
  const handleCreateSetlist = () => {
    setEditingSetlist(null);
    setSetlistModalOpen(true);
  };
  
  // Toggle setlist expansion
  const toggleSetlistExpansion = (setlistId) => {
    if (expandedSetlistId === setlistId) {
      setExpandedSetlistId(null); // Collapse if already expanded
    } else {
      setExpandedSetlistId(setlistId); // Expand this setlist
    }
  };
  
  // Handle adding current sheet to setlist
  const handleAddCurrentSheet = async (setlistId) => {
    if (!setlistId) {
      console.error('No setlist ID provided');
      return;
    }
    
    if (!currentSheetId) {
      alert('No sheet is currently open');
      return;
    }
    
    try {
      const sheet = {
        id: currentSheetId,
        title: songData.title || 'Untitled',
        artist: songData.artist || '',
        bpm: songData.bpm || ''
      };
      
      await addSheetToSetlist(setlistId, sheet);
      // Refresh setlists after adding sheet
      loadAllSetlists();
    } catch (error) {
      console.error('Error adding sheet to setlist:', error);
    }
  };
  
  // Handle removing a sheet from setlist
  const handleRemoveSheet = async (setlistId, sheetId) => {
    try {
      await removeSheetFromSetlist(setlistId, sheetId);
      // Refresh setlists after removing sheet
      loadAllSetlists();
    } catch (error) {
      console.error('Error removing sheet from setlist:', error);
    }
  };
  
  // Handle sheet reordering
  const handleMoveSheet = async (setlistId, sheetIndex, direction) => {
    const setlist = setlists.find(s => s.id === setlistId);
    if (!setlist || !setlist.sheets) return;
    
    const newIndex = direction === 'up' ? sheetIndex - 1 : sheetIndex + 1;
    
    // Don't move if already at the top/bottom
    if (newIndex < 0 || newIndex >= setlist.sheets.length) {
      return;
    }
    
    try {
      await reorderSetlistSheets(setlistId, sheetIndex, newIndex);
      // Refresh setlists after reordering
      loadAllSetlists();
    } catch (error) {
      console.error('Error reordering sheets:', error);
    }
  };

  return (
    <div
      className={`flex flex-col transition-all duration-200 overflow-hidden bg-white shadow-lg ${isMobile ? 'max-h-[70vh] rounded-b-2xl' : 'h-full rounded-r-2xl'} ${open ? (isMobile ? "w-full border-b border-gray-200" : "w-[350px] border-r border-gray-200") : "w-0 border-none"} relative z-30`}
    >
      <div className="px-4 py-4 border-b border-gray-100 font-semibold flex items-center justify-between sticky top-0 bg-white z-20 shadow-sm">
        <span className="tracking-wide text-lg text-gray-800">
          Setlists
        </span>
        {isMobile && (
          <button 
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onClose}
            aria-label="Close panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Create New Setlist Button */}
      {isAuthenticated && (
        <div className="px-4 py-2 border-b border-gray-100">
          <button
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors text-sm font-medium"
            onClick={handleCreateSetlist}
          >
            Create New Setlist
          </button>
        </div>
      )}

      {/* Login prompt when not authenticated */}
      {!isAuthenticated && (
        <div className="px-4 py-3 bg-yellow-50 text-yellow-800 text-sm border-b border-yellow-100">
          <p>Please log in to create and manage setlists.</p>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto pb-2 ${isMobile ? 'max-h-[calc(70vh-60px)]' : ''}`}>
        {(!setlists || !Array.isArray(setlists) || setlists.length === 0) && (
          <div className="px-4 py-8 text-center text-gray-400 italic select-none">
            {isAuthenticated ? "No setlists created yet" : "Log in to view your setlists"}
          </div>
        )}
        {Array.isArray(setlists) && setlists.map((setlist) => (
          <div key={setlist.id} className="border-b border-gray-100">
            <div
              className="group px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors flex items-center gap-2"
              onClick={() => {
                // Toggle expansion on click
                toggleSetlistExpansion(setlist.id);
              }}
            >
              <div className="flex-1 min-w-0">
                {editingId === setlist.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editingValue}
                    className="w-full font-medium text-base px-1 border-b border-blue-200 focus:border-blue-500 focus:bg-blue-50 outline-none bg-transparent transition-all rounded"
                    onChange={(e) => setEditingValue(e.target.value)}
                    onBlur={() => commitRename(setlist)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(setlist);
                      if (e.key === "Escape") cancelRename();
                    }}
                  />
                ) : (
                  <div className="font-medium flex items-center">
                    {/* Expansion indicator */}
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 mr-1 transition-transform ${expandedSetlistId === setlist.id ? 'transform rotate-90' : ''}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    {setlist.name || "(Untitled Setlist)"}
                  </div>
                )}
                <div className="text-xs text-gray-500">{setlist.description || ""}</div>
                <div className="text-[11px] text-gray-400">{setlist.sheets?.length || 0} sheets</div>
              </div>
              <button
                className="bg-none border-none cursor-pointer p-1 ml-2 hover:bg-gray-200 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (menuOpenId === setlist.id) {
                    setMenuOpenId(null);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuOpenId(setlist.id);
                    
                    // Get viewport dimensions
                    const viewportWidth = window.innerWidth;
                    
                    // Calculate menu position
                    // For mobile devices, position the menu to the left of the button instead of right
                    const isTouchDevice = 'ontouchstart' in window || window.innerWidth < 768;
                    const menuWidth = 150; // Approximate width of the menu
                    
                    // If positioning at rect.right would push the menu off-screen, position it to the left
                    const xPos = (rect.right + menuWidth > viewportWidth) 
                      ? rect.left - menuWidth 
                      : rect.right;
                    
                    setMenuPos({ 
                      x: xPos, 
                      y: isTouchDevice ? rect.top : rect.bottom 
                    });
                  }
                }}
                aria-label="Setlist menu"
              >
                <MenuIcon style={{ width: 20, height: 20, color: "#888" }} />
              </button>
            </div>
            
            {/* Expanded view showing sheets in the setlist */}
            {expandedSetlistId === setlist.id && (
              <div className="border-t border-gray-100">
                {/* Add current sheet button */}
                {isAuthenticated && currentSheetId && (
                  <div className="p-3 bg-gray-50 border-b border-gray-100">
                    <button
                      onClick={() => handleAddCurrentSheet(setlist.id)}
                      className="w-full px-3 py-2 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm font-medium flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Current Sheet
                    </button>
                  </div>
                )}
                
                <div className="max-h-[300px] overflow-y-auto">
                  {setlist.sheets && setlist.sheets.length > 0 ? (
                    setlist.sheets.map((sheet, index) => (
                      <div 
                        key={`${setlist.id}_sheet_${index}`}
                        className="px-4 py-2 border-b border-gray-100 hover:bg-blue-50 flex items-center"
                      >
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => {
                            // Navigate to the sheet when clicked
                            if (sheet.id) {
                              window.location.href = `/sheet/${sheet.id}`;
                            }
                          }}
                        >
                          <div className="font-medium text-sm">{sheet.title || "(Untitled)"}</div>
                          {sheet.artist && <div className="text-xs text-gray-500">{sheet.artist}</div>}
                          {sheet.bpm && <div className="text-xs text-gray-400">{sheet.bpm} BPM</div>}
                        </div>
                        
                        {/* Sheet controls */}
                        {isAuthenticated && (
                          <div className="flex items-center space-x-1">
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleMoveSheet(setlist.id, index, 'up')}
                                disabled={index === 0}
                                className={`text-gray-500 p-1 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-700 hover:bg-gray-200 rounded'}`}
                                aria-label="Move up"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                </svg>
                              </button>
                              <button
                                onClick={() => handleMoveSheet(setlist.id, index, 'down')}
                                disabled={index === setlist.sheets.length - 1}
                                className={`text-gray-500 p-1 ${index === setlist.sheets.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-700 hover:bg-gray-200 rounded'}`}
                                aria-label="Move down"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveSheet(setlist.id, sheet.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                              aria-label="Remove sheet"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400 w-5 text-center">{index + 1}</div>
                      </div>
                    ))
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-400 italic">
                      No sheets in this setlist
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {renderMenu()}
      
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
      
      {/* Setlist Modal */}
      {setlistModalOpen && (
        <SetlistModal 
          isOpen={setlistModalOpen} 
          onClose={() => {
            setSetlistModalOpen(false);
            setEditingSetlist(null);
            // Refresh setlists after closing modal
            loadAllSetlists();
          }}
          initialSetlist={editingSetlist}
        />
      )}
    </div>
  );
}
