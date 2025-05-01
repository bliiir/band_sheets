import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSetlistById, favoriteSetlist } from '../services/SetlistService';
import { useAuth } from '../contexts/AuthContext';
import { ReactComponent as StarIcon } from '../assets/list_plus.svg'; // Using list_plus instead of star
import { ReactComponent as BackIcon } from '../assets/arrow_left_from_line.svg'; // Using arrow_left_from_line instead of arrow_left
import { getSheetById } from '../services/SheetStorageService';

export default function SharedSetlistView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [setlist, setSetlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteSuccess, setFavoriteSuccess] = useState(false);
  
  // Load the setlist data
  useEffect(() => {
    const loadSetlist = async () => {
      try {
        setLoading(true);
        const data = await getSetlistById(id);
        console.log('Loaded setlist data:', data);
        
        if (data && data.sheets) {
          console.log('Sheets in setlist:');
          data.sheets.forEach((sheet, index) => {
            console.log(`Sheet ${index + 1}:`, sheet);
            console.log(`- ID: ${sheet.id}`);
            console.log(`- Title: ${sheet.title}`);
          });
        }
        
        setSetlist(data);
        setError(null);
      } catch (err) {
        console.error('Error loading shared setlist:', err);
        setError('Failed to load the setlist. It may not exist or you may not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };
    
    loadSetlist();
  }, [id]);
  
  // Handle adding the setlist to user's favorites
  const handleFavoriteSetlist = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate(`/login?returnTo=/setlist/${id}`);
      return;
    }
    
    try {
      await favoriteSetlist(id);
      setFavoriteSuccess(true);
      setTimeout(() => {
        setFavoriteSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error favoriting setlist:', error);
      setError('Failed to add setlist to your collection. Please try again.');
    }
  };
  
  // Navigate to a sheet
  const navigateToSheet = async (sheetId) => {
    if (sheetId) {
      console.log('Navigating to sheet:', sheetId);
      
      // Ensure the sheet ID is properly formatted
      const formattedSheetId = sheetId.toString();
      
      // Instead of using React Router navigation, use direct browser navigation
      // This forces a complete page reload and avoids any state issues
      const sheetUrl = `${window.location.origin}/sheet/${formattedSheetId}`;
      console.log('Navigating to URL:', sheetUrl);
      
      // Use window.location.href to force a full page reload
      window.location.href = sheetUrl;
    }
  };
  
  // Return to home
  const handleBack = () => {
    navigate('/');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading setlist...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-xl font-bold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!setlist) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md p-6 bg-yellow-50 rounded-lg">
          <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <h2 className="text-xl font-bold text-yellow-700 mb-2">Setlist Not Found</h2>
          <p className="text-yellow-600">The setlist you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button 
          onClick={handleBack}
          className="p-2 mr-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          aria-label="Back"
        >
          <BackIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold flex-1">Shared Setlist</h1>
      </div>
      
      {/* Setlist details */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{setlist.name}</h2>
            <button
              onClick={handleFavoriteSetlist}
              disabled={favoriteSuccess}
              className={`px-4 py-2 rounded flex items-center ${
                favoriteSuccess 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <StarIcon className="w-4 h-4 mr-2" />
              {favoriteSuccess ? 'Added to My Setlists' : 'Add to My Setlists'}
            </button>
          </div>
          {setlist.creator && (
            <p className="text-gray-600 mt-1">Created by: {setlist.creator.username || 'Unknown'}</p>
          )}
          <p className="text-gray-500 mt-1">{setlist.sheets?.length || 0} sheets</p>
        </div>
        
        {/* List of sheets */}
        <div className="divide-y divide-gray-200">
          {setlist.sheets && setlist.sheets.length > 0 ? (
            setlist.sheets.map((sheet, index) => (
              <div 
                key={`sheet-${index}`}
                className="p-4 hover:bg-blue-50 cursor-pointer"
                onClick={() => navigateToSheet(sheet.id)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium mr-3">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{sheet.title || '(Untitled)'}</h3>
                    {sheet.artist && <p className="text-sm text-gray-600">{sheet.artist}</p>}
                    {sheet.bpm && <p className="text-xs text-gray-500">{sheet.bpm} BPM</p>}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 italic">
              This setlist doesn't contain any sheets.
            </div>
          )}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-700 mb-2">What you can do:</h3>
        <ul className="list-disc list-inside text-blue-600 space-y-1">
          <li>Click on any sheet to view it</li>
          <li>Add this setlist to your collection with the "Add to My Setlists" button</li>
          <li>Once added, you can find it in your setlist panel</li>
        </ul>
      </div>
    </div>
  );
}
