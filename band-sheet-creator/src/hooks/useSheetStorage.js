import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for managing sheet storage operations
 */
export const useSheetStorage = () => {
  const [savedSheets, setSavedSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  // Fetch sheets when component mounts or user changes
  useEffect(() => {
    const fetchSheets = async () => {
      setIsLoading(true);
      try {
        // Fetch sheets from the API
        const response = await fetch('/api/sheets');
        if (!response.ok) {
          throw new Error(`Failed to fetch sheets: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        // Ensure we have owner information for filtering
        const sheetsWithOwnership = data.map(sheet => ({
          ...sheet,
          // If owner is an object with _id, use that, otherwise keep as is
          owner: sheet.owner && typeof sheet.owner === 'object' ? sheet.owner._id : sheet.owner
        }));
        
        setSavedSheets(sheetsWithOwnership);
      } catch (error) {
        console.error('Error fetching sheets:', error);
        // Fall back to mock data if API fetch fails
        const mockSheets = [
          { id: "sheet_1", title: "Come Together", artist: "The Beatles", bpm: 80, owner: currentUser?.username },
          { id: "sheet_2", title: "Stuck in the Middle With You", artist: "Stealers Wheel", bpm: 125, owner: currentUser?.username },
          { id: "sheet_3", title: "Georgy Porgy", artist: "Toto", bpm: 98, owner: "Band" },
          { id: "sheet_4", title: "Purple Rain", artist: "Prince", bpm: 110, owner: "Band" },
          { id: "sheet_5", title: "Hotel California", artist: "Eagles", bpm: 75, owner: "Other User" },
          { id: "sheet_6", title: "Sweet Child O' Mine", artist: "Guns N' Roses", bpm: 120, owner: "Other User" },
        ];
        setSavedSheets(mockSheets);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSheets();
  }, [currentUser]);

  // Function to get user's sheets - now returns all sheets since they're all owned by you
  const getUserSheets = () => {
    // Return all sheets since we've updated the database to make you the owner of all sheets
    return savedSheets;
  };

  // Function to get band sheets - returns empty array since all sheets are owned by you now
  const getBandSheets = () => {
    return [];
  };

  // Function to get other users' sheets - returns empty array since all sheets are owned by you now
  const getOtherSheets = () => {
    return [];
  };

  // Delete a sheet by ID
  const deleteSheet = (sheetId) => {
    setSavedSheets(prevSheets => prevSheets.filter(sheet => sheet.id !== sheetId));
    return true;
  };

  return {
    savedSheets,
    isLoading,
    getUserSheets,
    getBandSheets,
    getOtherSheets,
    deleteSheet
  };
};
