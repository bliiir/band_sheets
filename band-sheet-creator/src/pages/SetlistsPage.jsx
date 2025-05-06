import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FolderIcon, PlusIcon, SearchIcon, MoreVertical, Edit, Copy, Trash, Share, Download, ListPlus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useUIState } from "../contexts/UIStateContext";
import { getAllSetlists, deleteSetlist, updateSetlist } from "../services/SetlistStorageService";
import ConfirmModal from "../components/ConfirmModal";

/**
 * Page displaying all available setlists categorized by ownership
 */
// Separate component for editing setlist names to isolate state and prevent unwanted re-renders
const EditableSetlistName = ({ name, isEditing, onSubmit, onCancel }) => {
  const [value, setValue] = useState(name || "");
  const inputRef = useRef(null);
  
  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleSubmit = () => {
    onSubmit(value.trim());
  };
  
  if (!isEditing) {
    return <h2 className="text-lg font-medium truncate">{name || 'Untitled'}</h2>;
  }
  
  return (
    <div 
      className="w-full" 
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
      }}
    >
      <input
        ref={inputRef}
        type="text"
        className="w-full border border-primary rounded px-2 py-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            handleSubmit();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={handleSubmit}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
      />
    </div>
  );
};

const SetlistsPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated, showAuthModal, authChangeCounter } = useAuth();
  const { handleContextMenu: uiHandleContextMenu } = useUIState();
  const [isLoading, setIsLoading] = useState(true);
  const [mySetlists, setMySetlists] = useState([]);
  const [bandSetlists, setBandSetlists] = useState([]);
  const [otherSetlists, setOtherSetlists] = useState([]);
  
  // State for setlist editing and dropdown menu
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef(null);
  
  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    setlistId: null
  });
  
  // Fetch setlists from the API directly
  useEffect(() => {
    const fetchSetlists = async () => {
      setIsLoading(true);
      try {
        // Get current authentication status
        const token = localStorage.getItem('token');
        console.log('Current auth state before fetching setlists:', {
          isAuthenticated: !!token,
          tokenExists: !!token,
          tokenFirstChars: token ? token.substring(0, 10) + '...' : 'N/A'
        });
        
        // Get all setlists from the API
        console.log('Attempting to fetch setlists from MongoDB...');
        const setlists = await getAllSetlists();
        console.log('Fetched setlists from API:', setlists);
        console.log('Number of setlists retrieved:', setlists ? setlists.length : 0);
        console.log('Setlist data type:', typeof setlists);
        
        if (setlists && setlists.length > 0) {
          console.log('First setlist preview:', {
            id: setlists[0].id,
            name: setlists[0].name,
            sheetCount: setlists[0].sheets ? setlists[0].sheets.length : 0
          });
        }
        
        // Now that we've fixed the API response format, we should get real setlists
        console.log('Using setlists from MongoDB');
        setMySetlists(setlists || []);
        setBandSetlists([]);
        setOtherSetlists([]);
      } catch (error) {
        console.error('Error fetching setlists:', error);
        // Try to get more info about the error
        if (error.response) {
          console.error('Response error data:', error.response.data);
          console.error('Response error status:', error.response.status);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSetlists();
  }, [authChangeCounter]); // Refetch when auth state changes

  // Define the context menu items for different setlist types
  const getContextMenuItems = (setlistId, category) => {
    const menuItems = [
      {
        label: "Edit",
        action: () => navigate(`/setlist/${setlistId}`),
        icon: "edit"
      },
      {
        label: "Duplicate",
        action: () => alert(`Duplicating setlist ${setlistId} (mock function)`),
        icon: "copy"
      },
      {
        label: "Share",
        action: () => alert(`Sharing setlist ${setlistId} (mock function)`),
        icon: "share"
      }
    ];
    
    // Only show delete option for user's own setlists
    if (category === 'my') {
      menuItems.push({
        label: "Delete",
        action: () => {
          deleteSetlist(setlistId);
          alert(`Setlist ${setlistId} deleted`);
        },
        icon: "trash",
        danger: true
      });
    }
    
    return menuItems;
  };
  
  // This function is no longer needed as we're using inline dropdown menus now

  // Filter setlists based on search term
  const filterSetlists = (setlists) => {
    if (!searchTerm) return setlists;
    return setlists.filter(setlist => 
      setlist.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Helper to handle renaming a setlist
  const handleRename = (setlist) => {
    setEditingId(setlist.id);
    setEditingValue(setlist.name || "");
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
        console.log(`Saving setlist rename to MongoDB: ${setlist.name} → ${newName}`);
        
        // Create updated setlist object with new name
        const updatedSetlist = { ...setlist, name: newName };
        
        // Save to MongoDB
        await updateSetlist(setlist.id, updatedSetlist);
        
        // Also update local state for immediate UI response
        setMySetlists(prevSetlists =>
          prevSetlists.map(s => s.id === setlist.id ? { ...s, name: newName } : s)
        );
        
        console.log('Setlist rename saved successfully');
      } catch (error) {
        console.error('Error updating setlist name:', error);
        alert('Failed to update setlist name. Please try again.');
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

  // Helper to duplicate a setlist
  const handleDuplicate = (setlist) => {
    // In a real implementation, this would call the API to duplicate the setlist
    alert(`Duplicating setlist ${setlist.id} (feature coming soon)`);
  };
  
  // Function for opening the delete confirmation dialog
  const confirmDeleteSetlist = (id) => {
    try {
      // Find the setlist in the mySetlists array
      const setlist = mySetlists.find(s => s.id === id);
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
            // Close the dialog
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            // Update local state
            setMySetlists(prevSetlists => 
              prevSetlists.filter(s => s.id !== id)
            );
          } catch (error) {
            console.error('Error deleting setlist:', error);
            alert('Failed to delete setlist. Please try again.');
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
        },
        setlistId: id
      });
    } catch (error) {
      console.error('Error preparing delete confirmation:', error);
    }
  };

  const handleCreateSetlist = () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    // Navigation will be handled by the Link component
  };

  // Define the setlist card component with dropdown menu
  const SetlistCard = ({ setlist, category }) => {
    // Check if this setlist is currently being edited
    const isEditing = editingId === setlist.id;
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
        className={`border border-border rounded-md p-4 bg-card ${isEditing ? '' : 'hover:bg-card/80'} transition-colors relative`}
        onClick={(e) => {
          // Prevent navigation when editing
          if (isEditing) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          navigate(`/setlist/${setlist.id}`);
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center overflow-hidden">
            <FolderIcon className="h-5 w-5 mr-2 flex-shrink-0 text-muted-foreground" />
            <EditableSetlistName
              name={setlist.name}
              isEditing={isEditing}
              onSubmit={(newName) => {
                if (newName && newName !== setlist.name) {
                  // Create an updated setlist with the new name
                  const updatedSetlist = { ...setlist, name: newName };
                  // Save to MongoDB
                  updateSetlist(setlist.id, updatedSetlist)
                    .then(() => {
                      // Update local state
                      setMySetlists(prevSetlists =>
                        prevSetlists.map(s => s.id === setlist.id ? { ...s, name: newName } : s)
                      );
                    })
                    .catch(err => {
                      console.error('Error updating setlist name:', err);
                      alert('Failed to update setlist name');
                    });
                }
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          </div>
          
          {/* Dropdown menu */}
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
                    handleRename(setlist);
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
                    // Use timeout to ensure dropdown is closed before navigation
                    setTimeout(() => navigate(`/setlist/${setlist.id}`), 10);
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
                    
                    // Create the shareable URL
                    const shareUrl = `${window.location.origin}/setlist/${setlist.id}`;
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(shareUrl)
                      .then(() => {
                        // Show success notification
                        const notification = document.createElement('div');
                        notification.className = 'fixed right-4 top-20 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
                        notification.innerHTML = `<p>Setlist link copied to clipboard!</p>`;
                        document.body.appendChild(notification);
                        
                        // Remove after 3 seconds
                        setTimeout(() => {
                          notification.remove();
                        }, 3000);
                      })
                      .catch((err) => {
                        console.error('Could not copy text: ', err);
                        alert('Failed to copy link to clipboard');
                      });
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </button>
                
                <button 
                  className="flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowDropdown(false);
                    confirmDeleteSetlist(setlist.id);
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
        <div className="text-sm text-muted-foreground">{setlist.sheets ? setlist.sheets.length : 0} sheets</div>
        {setlist.owner && (
          <div className="mt-1 text-xs text-muted-foreground">
            Owner: {typeof setlist.owner === 'object' ? 
              (setlist.owner.email || setlist.owner.name || 'Unknown') : 
              setlist.owner}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Setlists</h1>
        <Link to="/setlist/new">
          <Button onClick={handleCreateSetlist}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Setlist
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search setlists..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Loading setlists...</p>
        </div>
      ) : (
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="my">My Setlists</TabsTrigger>
            <TabsTrigger value="band">Band Setlists</TabsTrigger>
            <TabsTrigger value="other">Other Setlists</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my">
            {filterSetlists(mySetlists).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-md bg-background">
                <p className="text-muted-foreground">You don't have any setlists yet</p>
                <Link to="/setlist/new" className="mt-2 inline-block">
                  <Button variant="outline" size="sm" className="mt-2">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Setlist
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSetlists(mySetlists).map(setlist => (
                  <div key={setlist.id}>
                    <SetlistCard setlist={setlist} category="my" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="band">
            {filterSetlists(bandSetlists).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-md bg-background">
                <p className="text-muted-foreground">No band setlists available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSetlists(bandSetlists).map(setlist => (
                  <div key={setlist.id}>
                    <SetlistCard setlist={setlist} category="band" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="other">
            {filterSetlists(otherSetlists).length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-md bg-background">
                <p className="text-muted-foreground">No other setlists available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSetlists(otherSetlists).map(setlist => (
                  <div key={setlist.id}>
                    <SetlistCard setlist={setlist} category="other" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default SetlistsPage;
