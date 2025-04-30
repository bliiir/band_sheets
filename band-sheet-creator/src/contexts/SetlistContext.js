import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  getAllSetlists, 
  createSetlist, 
  updateSetlist, 
  deleteSetlist,
  addSheetToSetlist,
  removeSheetFromSetlist,
  reorderSetlistSheets
} from '../services/SetlistService';
import { useAuth } from './AuthContext';

// Create the SetlistContext
const SetlistContext = createContext(null);

/**
 * SetlistProvider component for managing setlist state
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 */
export function SetlistProvider({ children }) {
  // State for setlists
  const [setlists, setSetlists] = useState([]);
  const [currentSetlist, setCurrentSetlist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Get authentication state
  const { isAuthenticated } = useAuth();
  
  // Load setlists
  const loadSetlists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedSetlists = await getAllSetlists();
      setSetlists(loadedSetlists);
    } catch (err) {
      console.error('Error loading setlists:', err);
      setError('Failed to load setlists');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Load setlists on mount and when auth state changes
  useEffect(() => {
    loadSetlists();
  }, [loadSetlists, isAuthenticated]);
  
  // Create a new setlist
  const handleCreateSetlist = async (setlistData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Note: We're allowing creation without authentication for now
      // This will use localStorage for unauthenticated users
      const newSetlist = await createSetlist(setlistData);
      setSetlists(prev => [...prev, newSetlist]);
      return newSetlist;
    } catch (err) {
      console.error('Error creating setlist:', err);
      // Use the specific error message from the service if available
      setError(err.message || 'Failed to create setlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a setlist
  const handleUpdateSetlist = async (setlistId, setlistData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSetlist = await updateSetlist(setlistId, setlistData);
      setSetlists(prev => 
        prev.map(setlist => 
          setlist.id === setlistId ? updatedSetlist : setlist
        )
      );
      
      // Update current setlist if it's the one being updated
      if (currentSetlist && currentSetlist.id === setlistId) {
        setCurrentSetlist(updatedSetlist);
      }
      
      return updatedSetlist;
    } catch (err) {
      console.error('Error updating setlist:', err);
      setError('Failed to update setlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a setlist
  const handleDeleteSetlist = async (setlistId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteSetlist(setlistId);
      setSetlists(prev => prev.filter(setlist => setlist.id !== setlistId));
      
      // Clear current setlist if it's the one being deleted
      if (currentSetlist && currentSetlist.id === setlistId) {
        setCurrentSetlist(null);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting setlist:', err);
      setError('Failed to delete setlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add a sheet to a setlist
  const handleAddSheetToSetlist = async (setlistId, sheet) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSetlist = await addSheetToSetlist(setlistId, sheet);
      setSetlists(prev => 
        prev.map(setlist => 
          setlist.id === setlistId ? updatedSetlist : setlist
        )
      );
      
      // Update current setlist if it's the one being modified
      if (currentSetlist && currentSetlist.id === setlistId) {
        setCurrentSetlist(updatedSetlist);
      }
      
      return updatedSetlist;
    } catch (err) {
      console.error('Error adding sheet to setlist:', err);
      setError('Failed to add sheet to setlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Remove a sheet from a setlist
  const handleRemoveSheetFromSetlist = async (setlistId, sheetId) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSetlist = await removeSheetFromSetlist(setlistId, sheetId);
      setSetlists(prev => 
        prev.map(setlist => 
          setlist.id === setlistId ? updatedSetlist : setlist
        )
      );
      
      // Update current setlist if it's the one being modified
      if (currentSetlist && currentSetlist.id === setlistId) {
        setCurrentSetlist(updatedSetlist);
      }
      
      return updatedSetlist;
    } catch (err) {
      console.error('Error removing sheet from setlist:', err);
      setError('Failed to remove sheet from setlist');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Reorder sheets in a setlist
  const handleReorderSetlistSheets = async (setlistId, oldIndex, newIndex) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSetlist = await reorderSetlistSheets(setlistId, oldIndex, newIndex);
      setSetlists(prev => 
        prev.map(setlist => 
          setlist.id === setlistId ? updatedSetlist : setlist
        )
      );
      
      // Update current setlist if it's the one being modified
      if (currentSetlist && currentSetlist.id === setlistId) {
        setCurrentSetlist(updatedSetlist);
      }
      
      return updatedSetlist;
    } catch (err) {
      console.error('Error reordering setlist sheets:', err);
      setError('Failed to reorder setlist sheets');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set the current active setlist
  const setActiveSetlist = (setlistId) => {
    const setlist = setlists.find(s => s.id === setlistId);
    setCurrentSetlist(setlist || null);
  };
  
  // Create the context value
  const value = {
    setlists,
    currentSetlist,
    isLoading,
    error,
    loadSetlists,
    createSetlist: handleCreateSetlist,
    updateSetlist: handleUpdateSetlist,
    deleteSetlist: handleDeleteSetlist,
    addSheetToSetlist: handleAddSheetToSetlist,
    removeSheetFromSetlist: handleRemoveSheetFromSetlist,
    reorderSetlistSheets: handleReorderSetlistSheets,
    setActiveSetlist
  };
  
  return (
    <SetlistContext.Provider value={value}>
      {children}
    </SetlistContext.Provider>
  );
}

/**
 * Custom hook to access the setlist context
 * @returns {Object} The setlist context value
 */
export function useSetlist() {
  const context = useContext(SetlistContext);
  
  if (!context) {
    throw new Error('useSetlist must be used within a SetlistProvider');
  }
  
  return context;
}
