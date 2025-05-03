import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing setlist storage operations
 */
export const useSetlistStorage = () => {
  const [savedSetlists, setSavedSetlists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  // Fetch setlists when component mounts or user changes
  useEffect(() => {
    const fetchSetlists = async () => {
      setIsLoading(true);
      try {
        // Mock data for now - with proper ownership categories
        const mockSetlists = [
          { id: "setlist_1", name: "50th", sheets: [{ id: "sheet_1" }, { id: "sheet_2" }], owner: currentUser?.username },
          { id: "setlist_2", name: "Jazz Night", sheets: [{ id: "sheet_3" }], owner: currentUser?.username },
          { id: "setlist_3", name: "Rock Classics", sheets: [{ id: "sheet_4" }, { id: "sheet_5" }, { id: "sheet_6" }], owner: "Band" },
          { id: "setlist_4", name: "Summer Festival", sheets: [{ id: "sheet_1" }, { id: "sheet_3" }, { id: "sheet_5" }], owner: "Other User" },
        ];
        
        // Simulate API delay
        setTimeout(() => {
          setSavedSetlists(mockSetlists);
          setIsLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching setlists:', error);
        setIsLoading(false);
      }
    };

    fetchSetlists();
  }, [currentUser]);

  // Function to get user's setlists
  const getUserSetlists = () => {
    // If currentUser isn't available, use a fallback to show all relevant setlists
    if (!currentUser?.username) {
      console.log('currentUser not available, showing mock user setlists');
      return savedSetlists.filter(setlist => 
        setlist.id === "setlist_1" || setlist.id === "setlist_2"
      );
    }
    return savedSetlists.filter(setlist => setlist.owner === currentUser.username);
  };

  // Function to get band setlists
  const getBandSetlists = () => {
    return savedSetlists.filter(setlist => setlist.owner === "Band");
  };

  // Function to get other users' setlists
  const getOtherSetlists = () => {
    return savedSetlists.filter(setlist => setlist.owner !== currentUser?.username && setlist.owner !== "Band");
  };

  // Delete a setlist by ID
  const deleteSetlist = (setlistId) => {
    setSavedSetlists(prevSetlists => prevSetlists.filter(setlist => setlist.id !== setlistId));
    return true;
  };

  return {
    savedSetlists,
    isLoading,
    getUserSetlists,
    getBandSetlists,
    getOtherSetlists,
    deleteSetlist
  };
};
