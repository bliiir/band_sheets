import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getSetlistById, favoriteSetlist } from '../services/SetlistService';
import { getSheetById } from '../services/SheetStorageService';
import { exportSetlistToPDF, exportSheetToPDF } from '../services/ExportService';
import { 
  setCurrentSheetId, 
  setNavigationSource, 
  setLoadedSheetId, 
  setPreviousLocation,
  setNavigationInProgress,
  resetNavigation
} from '../redux/slices/navigationSlice';
import { useAuth } from '../contexts/AuthContext';
import { ReactComponent as StarIcon } from '../assets/list_plus.svg';
import { ReactComponent as BackIcon } from '../assets/arrow_left_from_line.svg';
import { ReactComponent as PrintIcon } from '../assets/print.svg';
import AuthModal from './Auth/AuthModal';
import eventBus from '../utils/EventBus';

const SharedSetlistView = () => {
  const { id } = useParams();
  const setlistId = id; // For backward compatibility with existing code
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loginSuccess } = useAuth();
  
  const [setlist, setSetlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoriteSuccess, setFavoriteSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [printingSheet, setPrintingSheet] = useState(null); // Tracks which sheet is being printed
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Effect to load the setlist
  useEffect(() => {
    if (setlistId) {
      const loadSetlist = async () => {
        try {
          setLoading(true);
          const data = await getSetlistById(setlistId);
          if (data) {
            setSetlist(data);
          } else {
            setError('Setlist not found');
          }
        } catch (err) {
          console.error('Error loading shared setlist:', err);
          setError(err.message || 'Failed to load setlist');
        } finally {
          setLoading(false);
        }
      };

      loadSetlist();
    } else {
      setError('No setlist ID provided');
      setLoading(false);
    }
  }, [setlistId]);
  
  // Log authentication state changes to debug the login flow
  useEffect(() => {
    console.log('AUTH STATE CHANGED: isAuthenticated =', isAuthenticated);
    console.log('Current user token in localStorage:', localStorage.getItem('token') ? 'exists' : 'not found');
  }, [isAuthenticated]);
  
  // Effect to check for pending favorite operations on mount and auth changes
  useEffect(() => {
    console.log('FAVORITE CHECK: Authentication state =', isAuthenticated, 'Setlist ID =', setlistId);
    
    // Only proceed if the user is authenticated
    if (!isAuthenticated) {
      console.log('User not authenticated, skipping favorite check');
      return;
    }
    
    const pendingSetlistId = localStorage.getItem('pendingFavoriteSetlistId');
    console.log('PENDING FAVORITE: Checking localStorage for pending favorite, found:', pendingSetlistId);
    
    // If there's a pending setlist to favorite
    if (pendingSetlistId) {
      console.log('PENDING FAVORITE: Will attempt to favorite setlist:', pendingSetlistId);
      
      // If the pending setlist is the current one being viewed
      if (pendingSetlistId === setlistId) {
        console.log('PENDING FAVORITE: Current setlist matches pending favorite');
        
        // Allow some time for auth state to fully update
        console.log('PENDING FAVORITE: Setting timeout to favorite setlist in 2 seconds');
        const timeoutId = setTimeout(() => {
          console.log('PENDING FAVORITE: Timeout triggered, calling handleFavoriteSetlist()');
          localStorage.removeItem('pendingFavoriteSetlistId');
          handleFavoriteSetlist();
        }, 2000);
        
        // Clean up timeout if component unmounts
        return () => {
          console.log('PENDING FAVORITE: Clearing timeout');
          clearTimeout(timeoutId);
        };
      } else {
        console.log('PENDING FAVORITE: Current setlist does not match pending favorite, clearing');
        localStorage.removeItem('pendingFavoriteSetlistId');
      }
    }
  }, [isAuthenticated, setlistId]); // Run when authentication state changes

  // Handle adding the setlist to user's favorites
  const handleFavoriteSetlist = async () => {
    console.log('Starting to favorite setlist, auth state:', { isAuthenticated });
    console.log('Current setlist ID:', setlistId);
    
    // If not authenticated, show login modal and set flag for auto-favorite
    if (!isAuthenticated) {
      console.log('User not authenticated, showing auth modal');
      showAuthModalForFavorite();
      return;
    }
    
    try {
      // Check if we have a valid setlist ID
      if (!setlistId) {
        console.error('No setlist ID available');
        setError('Cannot add setlist to collection: setlist ID is missing');
        return;
      }
      
      // Check for authentication token
      const token = localStorage.getItem('token');
      console.log('Authentication token exists:', !!token);
      
      if (!token) {
        console.error('No token found despite isAuthenticated being true');
        setError('You must be logged in to add a setlist to your collection.');
        showAuthModalForFavorite();
        return;
      }
      
      // Call the API directly instead of using the service
      const endpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5050/api'}/setlists/${setlistId}/favorite`;
      console.log(`Making direct API request to: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}),
        credentials: 'include'
      });
      
      console.log('API response status:', response.status);
      
      const data = await response.json();
      console.log('API response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add setlist to collection');
      }
      
      // Show success feedback
      setFavoriteSuccess(true);
      
      // Navigate to home to see updated setlists after a brief delay
      setTimeout(() => {
        console.log('Redirecting to home page to show updated setlists');
        setFavoriteSuccess(false);
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Error favoriting setlist:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Provide more specific error messages based on the error
      if (error.message.includes('Authentication required')) {
        setError('Authentication required. Please log in to add this setlist to your collection.');
        navigate(`/login?returnTo=/setlist/${setlistId}`);
      } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        setError('Your login session has expired. Please log in again to add this setlist.');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        navigate(`/login?returnTo=/setlist/${setlistId}`);
      } else {
        setError(`Failed to add setlist to your collection: ${error.message}`);
      }
    }
  };
  
  // Navigate to a sheet using full page reload for guaranteed reliability
  const navigateToSheet = async (sheetId) => {
    try {
      // First verify the sheet exists
      const sheet = await getSheetById(sheetId);
      if (!sheet) {
        console.error('Sheet not found:', sheetId);
        setError(`Sheet not found: ${sheetId}`);
        return;
      }
      
      console.log(`SharedSetlistView: Navigating from setlist ${setlistId} to sheet ${sheetId}`);
      
      // Reset navigation state first
      dispatch(resetNavigation());
      
      // Set navigation in progress
      dispatch(setNavigationInProgress(true));
      
      // Navigate with full page reload
      window.location.href = `/sheet/${sheetId}`;
    } catch (error) {
      console.error('Error navigating to sheet:', error);
      setError('Failed to navigate to sheet. Please try again.');
    }
  };
  
  // Return to home
  const handleBack = () => {
    navigate('/');
  };

  // Handle exporting all sheets in the setlist as a single PDF
  const handleExportSetlist = async () => {
    if (!setlistId || !setlist || !setlist.sheets || setlist.sheets.length === 0) {
      setExportError('No sheets available to export');
      return;
    }

    try {
      setExporting(true);
      setExportError(null);
      
      // Default export options
      const options = {
        includeChordProgressions: true,
        includeSectionColors: true
      };
      
      const result = await exportSetlistToPDF(setlistId, options);
      
      if (result.success) {
        setExportSuccess(true);
        // Clear success message after a few seconds
        setTimeout(() => setExportSuccess(false), 5000);
      } else {
        setExportError(result.error || 'Failed to export setlist');
      }
    } catch (error) {
      console.error('Error exporting setlist to PDF:', error);
      setExportError(error.message || 'An unexpected error occurred during export');
    } finally {
      setExporting(false);
    }
  };
  
  // Handle exporting a single sheet to PDF
  const handlePrintSheet = async (sheetId) => {
    if (!sheetId) {
      setExportError('Invalid sheet ID');
      return;
    }
    
    try {
      setPrintingSheet(sheetId);
      setExportError(null);
      
      // Default export options
      const options = {
        includeChordProgressions: true,
        includeSectionColors: true
      };
      
      const result = await exportSheetToPDF(sheetId, options);
      
      if (!result.success) {
        setExportError(`Failed to export sheet: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error exporting sheet to PDF:', error);
      setExportError(error.message || 'An unexpected error occurred during export');
    } finally {
      // Clear the printing indicator after a short delay
      setTimeout(() => setPrintingSheet(null), 1000);
    }
  };
  
  // Close auth modal
  const closeAuthModal = () => {
    setAuthModalOpen(false);
    // Clear any pending favorite setlist when modal is closed without logging in
    localStorage.removeItem('pendingFavoriteSetlistId');
  };
  
  // Show auth modal and set flag to auto-favorite after login
  const showAuthModalForFavorite = () => {
    // Store the current setlist ID in localStorage to favorite after login
    try {
      console.log('SAVING FAVORITE INTENT: Storing setlist ID in localStorage:', setlistId);
      localStorage.setItem('pendingFavoriteSetlistId', setlistId);
      
      // Double-check that it was saved correctly
      const storedId = localStorage.getItem('pendingFavoriteSetlistId');
      console.log('SAVING FAVORITE INTENT: Verification - stored ID:', storedId);
      
      // Show auth modal
      setAuthModalOpen(true);
    } catch (error) {
      console.error('Error storing pending favorite setlist ID:', error);
      // Show auth modal anyway
      setAuthModalOpen(true);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={closeAuthModal} />

      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading setlist...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-screen">
          <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center">
            <div className="text-red-500 text-5xl mb-4">
              <BackIcon className="w-10 h-10 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button 
              onClick={handleBack}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              Go Home
            </button>
          </div>
        </div>
      ) : setlist ? (
        <div className="container mx-auto px-4 py-8">
          <button 
            onClick={handleBack}
            className="flex items-center text-blue-500 hover:text-blue-700 mb-6 transition duration-150 ease-in-out"
          >
            <BackIcon className="w-5 h-5 mr-2" />
            Back to Home
          </button>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{setlist.name}</h1>
                  <p className="text-lg opacity-90">{setlist.description || 'No description'}</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleExportSetlist}
                    disabled={exporting}
                    className="bg-white text-blue-500 hover:text-blue-700 p-2 rounded-full transition duration-150 ease-in-out mr-2"
                    aria-label="Export all sheets as PDF"
                    title="Export all sheets as PDF"
                  >
                    <PrintIcon className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleFavoriteSetlist}
                    className="bg-white text-pink-500 hover:text-pink-700 p-2 rounded-full transition duration-150 ease-in-out"
                    aria-label="Add to my setlists"
                    title="Add to my setlists"
                  >
                    <StarIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            
            {favoriteSuccess && (
              <div className="p-3 bg-green-100 text-green-700 text-center">
                Setlist added to your collection successfully!
              </div>
            )}
            
            {exportSuccess && (
              <div className="p-3 bg-green-100 text-green-700 text-center">
                All sheets exported successfully! Check your browser's print dialog.
              </div>
            )}
            
            {exportError && (
              <div className="p-3 bg-red-100 text-red-700 text-center">
                {exportError}
              </div>
            )}
            
            {exporting && (
              <div className="p-3 bg-blue-100 text-blue-700 text-center flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                Preparing sheets for export...
              </div>
            )}
            
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Sheets in this setlist</h2>
              
              {setlist.sheets && setlist.sheets.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {setlist.sheets.map((sheet, index) => (
                    <li key={sheet.id || index} className="py-4">
                      <div className="flex w-full items-center">
                        <button 
                          onClick={() => navigateToSheet(sheet.id)}
                          className="flex-grow text-left hover:bg-gray-50 p-2 rounded transition duration-150 ease-in-out"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-semibold">{sheet.title || 'Untitled Sheet'}</h3>
                              <p className="text-gray-600">{sheet.artist || 'Unknown Artist'}</p>
                            </div>
                            <div className="text-sm text-gray-500">
                              {sheet.bpm && `${sheet.bpm} BPM`}
                              {sheet.bpm && sheet.key && ' • '}
                              {sheet.key && `Key: ${sheet.key}`}
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => handlePrintSheet(sheet.id)}
                          disabled={printingSheet === sheet.id}
                          className="ml-2 p-2 bg-gray-200 hover:bg-gray-300 rounded transition duration-150 ease-in-out flex items-center justify-center"
                          aria-label="Print this sheet"
                          title="Print this sheet"
                        >
                          {printingSheet === sheet.id ? (
                            <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-gray-800 rounded-full"></div>
                          ) : (
                            <PrintIcon className="w-4 h-4 text-gray-700" />
                          )}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">This setlist doesn't contain any sheets.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-screen">
          <div className="bg-white p-8 rounded shadow-md max-w-md w-full text-center">
            <div className="text-yellow-500 text-5xl mb-4">
              <BackIcon className="w-10 h-10 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Setlist Not Found</h2>
            <p className="text-gray-600 mb-6">The setlist you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={handleBack}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              Go Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedSetlistView;
