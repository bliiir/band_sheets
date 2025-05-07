import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileTextIcon, PlusIcon, SearchIcon, MoreVertical, Edit, Copy, Trash, Share, Download, ListPlus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useUIState } from "../contexts/UIStateContext";
import { getAllSheets, deleteSheet } from "../services/SheetStorageService";
import { exportSingleSheet } from "../services/ExportService";
import { useSetlist } from "../contexts/SetlistContext";
import ConfirmModal from "../components/ConfirmModal";
import SetlistModal from "../components/SetlistModal";

/**
 * Page displaying all available sheets categorized by ownership
 */
const SheetsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated, showAuthModal, authChangeCounter } = useAuth();
  const { handleContextMenu: uiHandleContextMenu } = useUIState();
  const [isLoading, setIsLoading] = useState(true);
  const [mySheets, setMySheets] = useState([]);
  const [bandSheets, setBandSheets] = useState([]);
  const [otherSheets, setOtherSheets] = useState([]);
  
  // Context menu state
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [exportStatus, setExportStatus] = useState({ message: '', error: '' });
  const [setlistModalOpen, setSetlistModalOpen] = useState(false);
  const [selectedSheetForSetlist, setSelectedSheetForSetlist] = useState(null);
  const inputRef = useRef();
  
  // Get setlist context
  const { addSheetToSetlist } = useSetlist();
  
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    sheetId: null
  });
  
  // Fetch sheets from the API directly
  useEffect(() => {
    const fetchSheets = async () => {
      setIsLoading(true);
      try {
        // Get all sheets from the API
        const sheets = await getAllSheets();
        console.log('Fetched sheets from API:', sheets);
        
        // Detailed logging to find the exact location of BPM in the sheet structure
        if (sheets.length > 0) {
          console.log('COMPLETE SHEET DATA:', JSON.stringify(sheets[0]));
          
          // Top-level properties
          console.log('TOP LEVEL KEYS:', Object.keys(sheets[0]));
          
          // Check common locations for BPM
          console.log('Direct sheet.bpm:', sheets[0].bpm);
          
          // Log each top-level property to find where BPM might be hiding
          Object.keys(sheets[0]).forEach(key => {
            const value = sheets[0][key];
            console.log(`PROPERTY: ${key}`, typeof value, value);
          });
          
          // Special properties check
          if (sheets[0]._doc) console.log('_doc exists, BPM:', sheets[0]._doc.bpm);
          if (sheets[0].song) console.log('song exists, BPM:', sheets[0].song.bpm);
          if (sheets[0].info) console.log('info exists, BPM:', sheets[0].info.bpm);
          if (sheets[0].sections && sheets[0].sections.length > 0) {
            console.log('sections[0] exists, checking for BPM:', sheets[0].sections[0].bpm);
          }
          
          // Check if the data is nested inside a property named 'data'
          if (sheets[0].data) {
            console.log('data property exists, BPM:', sheets[0].data.bpm);
            console.log('data keys:', Object.keys(sheets[0].data));
          }
        }
        
        // Process sheets to ensure they have the necessary properties
        const processedSheets = sheets.map(sheet => {
          // Extract song information from the sheet data
          // Check if we're dealing with legacy data format
          if (Array.isArray(sheet.sections) && sheet.sections.length > 0) {
            // Get BPM from various possible locations
            const songBpm = sheet.bpm || // Direct BPM
                          (sheet.song?.bpm) || // In song object
                          (sheet.songInfo?.bpm) || // In songInfo object
                          (sheet.sections[0]?.bpm) || // In the first section
                          null; // Default to null if not found
            
            return {
              ...sheet,
              // Ensure these properties are accessible for display
              bpm: songBpm,
              title: sheet.title || (sheet.song?.title) || 'Untitled',
              artist: sheet.artist || (sheet.song?.artist) || 'Unknown Artist'
            };
          }
          return sheet;
        });
        
        console.log('Processed sheets:', processedSheets.slice(0, 2)); // Log first 2 sheets
        
        // All sheets are now owned by the user, so put them all in mySheets
        setMySheets(processedSheets);
        setBandSheets([]);
        setOtherSheets([]);
      } catch (error) {
        console.error('Error fetching sheets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSheets();
  }, [authChangeCounter]); // Refetch when auth state changes

  // Define the context menu items for different sheet types
  const getContextMenuItems = (sheetId, category) => {
    const menuItems = [
      {
        label: "Edit",
        action: () => navigate(`/sheet/${sheetId}`),
        icon: "edit"
      },
      {
        label: "Duplicate",
        action: () => alert(`Duplicating sheet ${sheetId} (mock function)`),
        icon: "copy"
      },
      {
        label: "Share",
        action: () => alert(`Sharing sheet ${sheetId} (mock function)`),
        icon: "share"
      }
    ];
    
    // Only show delete option for user's own sheets
    if (category === 'my') {
      menuItems.push({
        label: "Delete",
        action: () => handleSheetDelete(sheetId),
        icon: "trash",
        danger: true
      });
    }
    
    return menuItems;
  };

  const handleSheetDelete = async (sheetId) => {
    console.log('handleSheetDelete called with ID:', sheetId);
    
    try {
      // Call the actual service function from SheetStorageService
      console.log('Calling deleteSheet service function...');
      const success = await deleteSheet(sheetId);
      console.log('deleteSheet result:', success);
      
      if (success) {
        console.log('Sheet deleted successfully, updating UI state...');
        // Update local state by removing the deleted sheet
        setMySheets(prevSheets => {
          console.log('Current sheets count:', prevSheets.length);
          const filteredSheets = prevSheets.filter(sheet => {
            console.log('Comparing sheet.id:', sheet.id, 'with sheetId:', sheetId);
            return sheet.id !== sheetId;
          });
          console.log('New sheets count:', filteredSheets.length);
          return filteredSheets;
        });
        alert(`Sheet deleted successfully`);
      } else {
        console.error('deleteSheet returned false');
        alert('Failed to delete sheet. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSheetDelete:', error);
      console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      alert('Error deleting sheet: ' + (error.message || 'Unknown error'));
    }
  };

  // Function to open context menu for a sheet
  const openSheetContextMenu = (e, sheetId, category) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Call our local handleOpenContextMenu instead of the UIStateContext's handleContextMenu
    handleOpenContextMenu(e, sheetId);
  };

  // Filter sheets based on search term
  const filterSheets = (sheets) => {
    if (!searchTerm) return sheets;
    return sheets.filter(sheet => 
      sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Helper to handle renaming a sheet
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
  const commitRename = async (sheet) => {
    const newTitle = editingValue.trim();
    if (newTitle && newTitle !== sheet.title) {
      try {
        // Update the sheet in the database
        const updated = { ...sheet, title: newTitle };
        // Call API to update sheet
        // For now, just update local state
        setMySheets(prevSheets =>
          prevSheets.map(s => s.id === sheet.id ? { ...s, title: newTitle } : s)
        );
      } catch (error) {
        console.error('Error updating sheet title:', error);
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

  // Helper to duplicate a sheet
  const handleDuplicate = (sheet) => {
    // In a real implementation, this would call the API to duplicate the sheet
    alert(`Duplicating sheet ${sheet.id} (feature coming soon)`);
    setMenuOpenId(null);
  };
  
  // Helper to open setlist modal for adding a sheet to a setlist
  const handleAddToSetlist = (sheet) => {
    setSelectedSheetForSetlist(sheet);
    setSetlistModalOpen(true);
    setMenuOpenId(null);
  };
  
  // Helper to export a single sheet
  const handleExportSheet = async (sheet) => {
    try {
      setExportStatus({ message: '', error: '' });
      const result = await exportSingleSheet(sheet.id);
      setExportStatus({ message: result.message, error: '' });
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setExportStatus({ message: '', error: '' });
      }, 3000);
    } catch (error) {
      setExportStatus({ message: '', error: error.message });
      
      // Clear the error message after 5 seconds
      setTimeout(() => {
        setExportStatus({ message: '', error: '' });
      }, 5000);
    }
    setMenuOpenId(null);
  };
  
  // Function for opening the delete confirmation dialog
  const confirmDeleteSheet = (id) => {
    console.log('confirmDeleteSheet called with sheet ID:', id);
    try {
      // Find the sheet in the mySheets array
      const sheet = mySheets.find(s => s.id === id);
      console.log('Found sheet:', sheet ? 'Yes' : 'No');
      
      if (!sheet) {
        console.error('Sheet not found in mySheets array');
        console.log('Current mySheets:', mySheets);
        return;
      }
      
      const title = sheet.title || 'Untitled';
      console.log('Preparing confirmation dialog for sheet:', title);
      
      // Show custom confirmation dialog
      console.log('Setting confirm dialog state to open');
      setConfirmDialog({
        isOpen: true,
        title: "Delete Sheet",
        message: `Are you sure you want to delete "${title}"?`,
        onConfirm: async () => {
          console.log('Confirmation dialog confirmed for sheet ID:', id);
          try {
            console.log('Calling handleSheetDelete with ID:', id);
            await handleSheetDelete(id);
            console.log('handleSheetDelete completed successfully');
            // Close the dialog
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          } catch (error) {
            console.error('Error in confirmation dialog onConfirm function:', error);
            alert('Failed to delete sheet. Please try again.');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        },
        sheetId: id
      });
      console.log('Confirm dialog state set, dialog should be visible');
    } catch (error) {
      console.error('Error preparing delete confirmation:', error);
    }
  };
  
  // Handle opening context menu
  const handleOpenContextMenu = (e, sheetId) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ensure the position is correct
    const menuWidth = 150; // Same as in the CSS for the menu
    let x = e.clientX;
    const y = e.clientY;
    
    // Adjust x if it would make the menu go off-screen
    const windowWidth = window.innerWidth;
    if (x + menuWidth > windowWidth) {
      x = windowWidth - menuWidth - 10; // 10px buffer
    }
    
    setMenuPos({ x, y });
    setMenuOpenId(sheetId);
  };
  
  // Handle click outside menu to close it
  useEffect(() => {
    if (!menuOpenId) return;
    
    const handleClickOutside = (e) => {
      // Don't close if clicking inside the menu
      if (e.target.closest('.context-menu-container')) {
        return;
      }
      setMenuOpenId(null);
    };
    
    // Add event listeners for mouse and touch events with a slight delay to avoid immediate closing
    setTimeout(() => {
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("touchstart", handleClickOutside);
    }, 100);
    
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("touchstart", handleClickOutside);
    };
  }, [menuOpenId]);
  
  const handleCreateSheet = () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    // Navigation will be handled by the Link component
  };

  // Helper function to traverse the sheet object and find the BPM
  const getBpm = (sheet) => {
    // Standard extraction pattern based on the console logs
    try {
      // Check for direct BPM property
      if (sheet && typeof sheet.bpm !== 'undefined') {
        return sheet.bpm;
      }
      
      // MongoDB might store the actual document in _doc
      if (sheet && sheet._doc && typeof sheet._doc.bpm !== 'undefined') {
        return sheet._doc.bpm;
      }
      
      // Check for BPM in song property
      if (sheet && sheet.song && typeof sheet.song.bpm !== 'undefined') {
        return sheet.song.bpm;
      }
      
      // Some sheets might store BPM in songInfo
      if (sheet && sheet.songInfo && typeof sheet.songInfo.bpm !== 'undefined') {
        return sheet.songInfo.bpm;
      }
      
      // Check for BPM in sections
      if (sheet && Array.isArray(sheet.sections) && sheet.sections.length > 0) {
        // Try each section for a BPM property
        for (const section of sheet.sections) {
          if (section && typeof section.bpm !== 'undefined') {
            return section.bpm;
          }
        }
      }
    } catch (error) {
      console.error("Error extracting BPM:", error);
    }
    
    // If we can't find a BPM, return a dash
    return "-";
  };

  // Define the sheet card component for reuse
  const SheetCard = ({ sheet, category }) => {
    // Check if this sheet is currently being edited
    const isEditing = editingId === sheet.id;
    // State for showing the dropdown menu
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    
    // Close dropdown when clicking outside
    useEffect(() => {
      if (!showDropdown) return;
      
      const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
          setShowDropdown(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown]);
    
    return (
      <div 
        className="border border-border rounded-md p-4 bg-card hover:bg-card/80 transition-colors relative"
        onClick={() => isEditing ? null : navigate(`/sheet/${sheet.id}`)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center overflow-hidden">
            <FileTextIcon className="h-5 w-5 mr-2 flex-shrink-0 text-muted-foreground" />
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                className="w-full border border-primary rounded px-2 py-1"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitRename(sheet);
                  } else if (e.key === "Escape") {
                    cancelRename();
                  }
                }}
                onBlur={() => commitRename(sheet)}
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <h2 className="text-lg font-medium truncate">{sheet.title || 'Untitled'}</h2>
            )}
          </div>
          
          {/* Simple dropdown menu with proper event handling */}
          <div 
            className="relative" 
            ref={dropdownRef}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDropdown(!showDropdown);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md hover:bg-background flex-shrink-0"
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
            
            {showDropdown && (
              <div 
                className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-border"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDropdown(false);
                    // Use timeout to ensure dropdown is closed before navigation
                    setTimeout(() => navigate(`/sheet/${sheet.id}`), 10);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDropdown(false);
                    handleRename(sheet);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </button>
                
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDropdown(false);
                    handleDuplicate(sheet);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </button>
                
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDropdown(false);
                    handleExportSheet(sheet);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Sheet
                </button>
                
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDropdown(false);
                    handleAddToSetlist(sheet);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <ListPlus className="h-4 w-4 mr-2" />
                  Add to Setlist
                </button>
                
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDropdown(false);
                    // Add logging to track the sheet ID before deletion
                    console.log('Delete button clicked for sheet ID:', sheet.id);
                    console.log('Sheet data:', sheet);
                    confirmDeleteSheet(sheet.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground truncate">{sheet.artist || 'Unknown Artist'}</div>
        
        {sheet.owner && <div className="mt-1 text-xs text-muted-foreground">Owner: {sheet.owner}</div>}
      </div>
    );
  };



  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sheets</h1>
        <Link to="/sheet/new">
          <Button onClick={handleCreateSheet}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Sheet
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search sheets..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Loading sheets...</p>
        </div>
      ) : (
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my">My Sheets</TabsTrigger>
            <TabsTrigger value="band">Band Sheets</TabsTrigger>
            <TabsTrigger value="other">Other Sheets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my">
            {filterSheets(mySheets).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-md bg-background">
                <p className="text-muted-foreground">You don't have any sheets yet</p>
                <Link to="/sheet/new" className="mt-2 inline-block">
                  <Button variant="outline" size="sm" className="mt-2">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Sheet
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSheets(mySheets).map(sheet => (
                  <Link to={`/sheet/${sheet.id}`} key={sheet.id}>
                    <SheetCard sheet={sheet} category="my" />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="band">
            {filterSheets(bandSheets).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-md bg-background">
                <p className="text-muted-foreground">No band sheets available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSheets(bandSheets).map(sheet => (
                  <Link to={`/sheet/${sheet.id}`} key={sheet.id}>
                    <SheetCard sheet={sheet} category="band" />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="other">
            {filterSheets(otherSheets).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-md bg-background">
                <p className="text-muted-foreground">No other sheets available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSheets(otherSheets).map(sheet => (
                  <Link to={`/sheet/${sheet.id}`} key={sheet.id}>
                    <SheetCard sheet={sheet} category="other" />
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
      
      {/* Setlist Modal */}
      {setlistModalOpen && (
        <SetlistModal
          isOpen={setlistModalOpen}
          onClose={() => setSetlistModalOpen(false)}
          sheet={selectedSheetForSetlist}
          onAddToSetlist={addSheetToSetlist}
        />
      )}
    </div>
  );
};

export default SheetsPage;
