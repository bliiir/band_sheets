import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getSetlistById, updateSetlist, savePendingFavoriteSetlistId, getPendingFavoriteSetlistId, clearPendingFavoriteSetlistId } from '../services/SetlistStorageService';
import { favoriteSetlist } from '../services/SetlistService';
import { getSheetById } from '../services/SheetStorageService';
import logger from '../services/LoggingService';
import { getAuthToken } from '../utils/AuthUtils';
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
import { useNotifications } from '../contexts/NotificationContext';
import { ReactComponent as StarIcon } from '../assets/list_plus.svg';
import { ReactComponent as BackIcon } from '../assets/arrow_left_from_line.svg';
import { ReactComponent as PrintIcon } from '../assets/print.svg';
import AuthModal from './Auth/AuthModal';
import eventBus from '../utils/EventBus';

const SharedSetlistView = ({ id: propId, setlistData }) => {
  const { id: paramsId } = useParams();
  
  // Debug logs for ID sources and pre-loaded data
  logger.debug('SharedSetlistView', 'Prop ID received:', propId);
  logger.debug('SharedSetlistView', 'URL params ID:', paramsId);
  logger.debug('SharedSetlistView', 'Pre-loaded setlist data:', setlistData);
  
  // Use prop ID if provided, otherwise fall back to URL params
  const setlistId = propId || paramsId; // Prioritize the prop for better component reuse
  
  // Log the final setlist ID used
  logger.debug('SharedSetlistView', 'Final setlistId to be used:', setlistId);
  console.log('SharedSetlistView - Using setlistId:', setlistId);
  
  // Check what's actually in the URL to help with debugging
  console.log('Current path:', window.location.pathname);
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
  
  // State for sheet management
  const [isReordering, setIsReordering] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [showAddSheetModal, setShowAddSheetModal] = useState(false);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State for editable title and description
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const { showNotification } = useNotifications();
  const [editedDescription, setEditedDescription] = useState('');
  
  // Effect to load the setlist (or use pre-loaded data if available)
  useEffect(() => {
    // If we already have the setlist data passed as a prop, use that
    if (setlistData) {
      console.log('SharedSetlistView - Using pre-loaded setlist data:', setlistData);
      logger.info('SharedSetlistView', 'Using pre-loaded setlist data');
      
      setSetlist(setlistData);
      setEditedTitle(setlistData.name);
      setEditedDescription(setlistData.description || '');
      setLoading(false);
      return; // Skip API call if we already have the data
    }
    
    // Otherwise proceed with loading from API
    if (setlistId) {
      const loadSetlist = async () => {
        try {
          setLoading(true);
          setError(null);
          
          // Log our attempt
          logger.debug('SharedSetlistView', `Loading setlist with ID: ${setlistId}`);
          console.log('SharedSetlistView - API call using ID:', setlistId);
          
          // Get the setlist data using our ID
          const data = await getSetlistById(setlistId);
          
          // Log the response for debugging
          logger.debug('SharedSetlistView', 'API Response:', data);
          console.log('SharedSetlistView - API Response data:', data);
          
          if (data) {
            logger.info('SharedSetlistView', `Setlist loaded successfully: ${data.name || 'Unnamed setlist'}`);
            setSetlist(data);
            setEditedTitle(data.name);
            setEditedDescription(data.description || '');
          } else {
            const errorMsg = `Setlist not found with ID: ${setlistId}`;
            logger.error('SharedSetlistView', errorMsg);
            console.error(errorMsg);
            setError(`${errorMsg}. This may be due to an incorrect ID format or the setlist doesn't exist.`);
          }
        } catch (err) {
          logger.error('SharedSetlistView', 'Error loading shared setlist:', err);
          console.error('Error loading shared setlist:', err);
          setError(`Failed to load setlist: ${err.message || 'Unknown error'}`);
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
    logger.debug('SharedSetlistView', 'AUTH STATE CHANGED: isAuthenticated =', isAuthenticated);
    logger.debug('SharedSetlistView', 'Current user token exists:', !!getAuthToken());
  }, [isAuthenticated]);
  
  // Effect to check for pending favorite operations on mount and auth changes
  useEffect(() => {
    logger.debug('SharedSetlistView', 'FAVORITE CHECK: Authentication state =', isAuthenticated, 'Setlist ID =', setlistId);
    
    // Only process auto-favorite if user is authenticated and we have a setlist
    if (isAuthenticated && setlist) {
      // Check if we have a pending favorite setlist ID using our service method
      const pendingFavoriteId = getPendingFavoriteSetlistId();
      logger.debug('SharedSetlistView', 'FAVORITE CHECK: Pending ID found:', pendingFavoriteId);
      
      if (pendingFavoriteId === setlistId) {
        logger.debug('SharedSetlistView', 'FAVORITE CHECK: Executing pending favorite operation');
        
        // Clear the pending ID first using our service method
        clearPendingFavoriteSetlistId();
        
        // Execute the favorite operation
        favoriteSetlist(setlistId)
          .then(res => {
            setFavoriteSuccess(true);
            setTimeout(() => setFavoriteSuccess(false), 3000);
          })
          .catch(err => logger.error('SharedSetlistView', 'Error favoriting setlist:', err));
      }
    }
  }, [isAuthenticated, setlist, setlistId]);
  
  // Effect to check for pending favorite setlist ID after login
  useEffect(() => {
    // Check if we have a pending favorite setlist ID that we need to process
    const checkPendingFavorite = async () => {
      try {
        const pendingId = await getPendingFavoriteSetlistId();
        console.log('Checking for pending favorite setlist ID:', pendingId);
        logger.debug('SharedSetlistView', 'Pending favorite setlist ID:', pendingId);
        
        if (pendingId && pendingId === setlistId && isAuthenticated) {
          // User is now authenticated, try to favorite the pending setlist
          console.log('Processing pending favorite for setlist:', pendingId);
          logger.debug('SharedSetlistView', 'Processing pending favorite');
          
          // Clear the pending ID first to avoid loops
          await clearPendingFavoriteSetlistId();
          
          // Now favorite the setlist
          handleFavoriteSetlist();
        }
      } catch (error) {
        logger.error('SharedSetlistView', 'Error checking pending favorite:', error);
      }
    };
    
    if (isAuthenticated && setlistId) {
      checkPendingFavorite();
    }
  }, [isAuthenticated, setlistId]);
  
  // Effect to listen for events from the top menu buttons
  useEffect(() => {
    // Listen for events from the top menu buttons
    const addSheetListener = eventBus.on('setlist:addSheet', () => {
      if (setlist) {
        console.log('Add sheet event received');
        setShowAddSheetModal(true);
        loadAvailableSheets();
      }
    });
    
    const toggleReorderListener = eventBus.on('setlist:toggleReorder', () => {
      if (setlist) {
        console.log('Toggle reorder event received');
        setIsReordering(!isReordering);
      }
    });
    
    const openAllListener = eventBus.on('setlist:openAll', () => {
      if (setlist && setlist.sheets && setlist.sheets.length > 0) {
        console.log('Open all event received');
        // Open all sheets in new tabs
        setlist.sheets.forEach((sheet, index) => {
          // Use setTimeout with increasing delay to avoid popup blockers
          setTimeout(() => {
            const sheetUrl = `${window.location.origin}/sheet/${sheet.id}?print=true`;
            window.open(sheetUrl, `_sheet_${sheet.id}`);
          }, 100 * index);
        });
        
        // Show success notification using centralized system
        showNotification(`Opening ${setlist.sheets.length} sheets in print preview`, 'success');
      }
    });
    
    // Clean up the event listeners
    return () => {
      addSheetListener();
      toggleReorderListener();
      openAllListener();
    };
  }, [setlist, isReordering]); // Depend on setlist and isReordering to ensure we have the latest state
  
  // Load available sheets for adding to setlist
  const loadAvailableSheets = async () => {
    try {
      // Import getAllSheets function dynamically
      const { getAllSheets } = await import('../services/SheetStorageService');
      const sheets = await getAllSheets();
      setAvailableSheets(sheets || []);
    } catch (error) {
      console.error('Error loading available sheets:', error);
    }
  };
  
  // Go back to the main setlists page
  const handleBack = () => {
    navigate('/setlists');
  };
  
  // Export the entire setlist as PDF
  const handleExportSetlist = async () => {
    if (!setlist || !setlist.sheets || setlist.sheets.length === 0) {
      setExportError('No sheets to export');
      setTimeout(() => setExportError(null), 3000);
      return;
    }
    
    try {
      setExporting(true);
      const success = await exportSetlistToPDF(setlist);
      if (success) {
        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      } else {
        setExportError('Failed to export setlist');
        setTimeout(() => setExportError(null), 3000);
      }
    } catch (error) {
      console.error('Error exporting setlist:', error);
      setExportError(`Error: ${error.message || 'Failed to export'}`);
      setTimeout(() => setExportError(null), 3000);
    } finally {
      setExporting(false);
    }
  };
  
  // Print a single sheet
  const handlePrintSheet = async (sheetId) => {
    try {
      setPrintingSheet(sheetId);
      const sheet = setlist.sheets.find(s => s.id === sheetId);
      
      if (!sheet) {
        throw new Error('Sheet not found');
      }
      
      await exportSheetToPDF(sheet);
    } catch (error) {
      console.error('Error printing sheet:', error);
      // Note: We don't show an error message here to avoid cluttering the UI
    } finally {
      setPrintingSheet(null);
    }
  };
  
  // Navigate to a sheet with simplified approach
  const navigateToSheet = (sheetId) => {
    // Skip if reordering mode is active
    if (isReordering) return;
    
    // Use direct navigation without complex state management
    // This avoids potential issues with the routing system
    window.location.href = `/sheet/${sheetId}`;
    
    // Note: This approach loses the back navigation state
    // but provides more reliable sheet opening
  };
  
  // Move a sheet up or down in the setlist
  const moveSheet = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= setlist.sheets.length) return;
    
    // Create a copy of the sheets array
    const items = Array.from(setlist.sheets);
    
    // Swap the items
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
    // Update local state only
    setSetlist({
      ...setlist,
      sheets: items
    });
    
    // Mark that we have unsaved changes
    setHasUnsavedChanges(true);
  };
  
  // Save changes to the setlist
  const saveSetlistChanges = async (updatedSetlist) => {
    if (!updatedSetlist || !isAuthenticated) {
      setSaveError('You must be logged in to save changes');
      return;
    }
    
    try {
      setIsSaving(true);
      setSaveError(null);
      
      // Send update to API
      const result = await updateSetlist(updatedSetlist.id, updatedSetlist);
      if (result) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        
        // Reset unsaved changes flag
        setHasUnsavedChanges(false);
      } else {
        setSaveError('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving setlist changes:', error);
      setSaveError(`Error: ${error.message || 'Failed to save changes'}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle favorite button
  const handleFavoriteSetlist = () => {
    if (!isAuthenticated) {
      saveSetlistIdAndOpenAuth();
      return;
    }
    
    favoriteSetlist(setlistId)
      .then(res => {
        setFavoriteSuccess(true);
        setTimeout(() => setFavoriteSuccess(false), 3000);
      })
      .catch(err => console.error('Error favoriting setlist:', err));
  };
  
  // Handle title editing
  const startTitleEdit = () => {
    setIsEditingTitle(true);
  };

  const saveTitleEdit = () => {
    if (editedTitle.trim() === '') return;
    
    setIsEditingTitle(false);
    if (setlist) {
      // Update local state only
      setSetlist(prev => ({
        ...prev,
        name: editedTitle.trim()
      }));
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
    }
  };

  // Handle description editing
  const startDescriptionEdit = () => {
    setIsEditingDescription(true);
  };

  const saveDescriptionEdit = () => {
    setIsEditingDescription(false);
    if (setlist) {
      // Update local state only
      setSetlist(prev => ({
        ...prev,
        description: editedDescription.trim()
      }));
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
    }
  };
  
  // Remove a sheet from the setlist
  const removeSheetFromSetlist = async (sheetId) => {
    try {
      const updatedSheets = setlist.sheets.filter(sheet => sheet.id !== sheetId);
      const updatedSetlist = {
        ...setlist,
        sheets: updatedSheets
      };
      
      // Update local state only
      setSetlist(updatedSetlist);
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error removing sheet from setlist:', error);
      setSaveError(`Error: ${error.message || 'Failed to remove sheet'}`);
    }
  };

  // Close auth modal
  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };
  
  // Add a sheet to the setlist
  const addSheetToSetlist = async (sheetId) => {
    try {
      // Import getSheetById function dynamically
      const { getSheetById } = await import('../services/SheetStorageService');
      const sheetToAdd = await getSheetById(sheetId);
      
      if (!sheetToAdd) {
        setSaveError('Sheet not found');
        return;
      }
      
      const updatedSheets = [...setlist.sheets, sheetToAdd];
      const updatedSetlist = {
        ...setlist,
        sheets: updatedSheets
      };
      
      // Update local state only
      setSetlist(updatedSetlist);
      
      // Mark that we have unsaved changes
      setHasUnsavedChanges(true);
      
      // Close modal
      setShowAddSheetModal(false);
    } catch (error) {
      console.error('Error adding sheet to setlist:', error);
      setSaveError(`Error: ${error.message || 'Failed to add sheet'}`);
    }
  };
  
  // Save setlist ID using our centralized service and open auth modal
  const saveSetlistIdAndOpenAuth = () => {
    try {
      savePendingFavoriteSetlistId(setlistId);
      setAuthModalOpen(true);
    } catch (error) {
      logger.error('SharedSetlistView', 'Error storing pending favorite setlist ID:', error);
      setAuthModalOpen(true);
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
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
        <div className="min-h-screen bg-white">
          {/* Top navigation/action bar */}
          <div className="flex items-center justify-between py-4 px-6 border-b">
            <div className="flex items-center">
              <button 
                onClick={handleBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mr-4 transition duration-150 ease-in-out"
              >
                <BackIcon className="w-5 h-5 mr-2" />
                Back
              </button>
              <h1 className="text-xl font-bold">{setlist.name}</h1>
            </div>
            
            <div className="flex space-x-2">
              {/* Action buttons moved to top menu */}
              <button 
                onClick={() => saveSetlistChanges(setlist)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out ${hasUnsavedChanges ? 'bg-black hover:bg-gray-800 text-white' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                disabled={isSaving || !hasUnsavedChanges}
                title={hasUnsavedChanges ? 'Save your changes' : 'No unsaved changes'}
              >
                {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'No Changes'}
              </button>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="container mx-auto px-6 py-6">
            {/* Status messages */}
            {favoriteSuccess && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 text-center rounded">
                Setlist added to your collection successfully!
              </div>
            )}
            
            {exportSuccess && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 text-center rounded">
                All sheets exported successfully! Check your browser's print dialog.
              </div>
            )}
            
            {exportError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 text-center rounded">
                {exportError}
              </div>
            )}
            
            {saveSuccess && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 text-center rounded">
                Setlist updated successfully!
              </div>
            )}
            
            {saveError && (
              <div className="mb-4 p-2 bg-red-100 text-red-700 text-center rounded">
                {saveError}
              </div>
            )}
            
            {/* Description */}
            {setlist.description && (
              <p className="text-gray-500 mb-6">{setlist.description}</p>
            )}
            
            {/* Sheets list section */}
            <h2 className="text-xl font-semibold mb-4">Sheets in this setlist</h2>
            
            {setlist.sheets && setlist.sheets.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {setlist.sheets.map((sheet, index) => (
                  <li 
                    key={sheet.id || index}
                    className={`py-3 ${isReordering ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex w-full items-center">
                      {isReordering && (
                        <div className="flex flex-col mr-2">
                          <button
                            onClick={() => moveSheet(index, 'up')}
                            disabled={index === 0}
                            className={`p-1 ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Move up"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveSheet(index, 'down')}
                            disabled={index === setlist.sheets.length - 1}
                            className={`p-1 ${index === setlist.sheets.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700'}`}
                            title="Move down"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => navigateToSheet(sheet.id)}
                        className="flex-grow text-left hover:bg-gray-50 p-2 rounded transition duration-150 ease-in-out"
                        disabled={isReordering}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{sheet.title || 'Untitled Sheet'}</h3>
                            <p className="text-sm text-gray-600">{sheet.artist || 'Unknown Artist'}</p>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {sheet.bpm && `${sheet.bpm} BPM`}
                          </div>
                        </div>
                      </button>
                      
                      {!isReordering && (
                        <div className="flex">
                          <button
                            onClick={() => removeSheetFromSetlist(sheet.id)}
                            className="ml-2 p-2 text-gray-500 hover:text-red-500 transition duration-150 ease-in-out"
                            aria-label="Remove sheet"
                            title="Remove sheet"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="bg-gray-50 p-6 text-center rounded-lg">
                <p className="text-gray-500">No sheets in this setlist yet.</p>
                <button
                  onClick={() => {
                    setShowAddSheetModal(true);
                    loadAvailableSheets();
                  }}
                  className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                >
                  Add your first sheet
                </button>
              </div>
            )}
            
            {/* Add Sheet Modal */}
            {showAddSheetModal && (
              <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" onClick={() => setShowAddSheetModal(false)}></div>
                <div className="bg-white rounded-lg max-w-lg w-full mx-auto p-6 relative z-10">
                  <h3 className="text-lg font-medium mb-4">Add Sheets to Setlist</h3>
                  
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search sheets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto mb-4">
                    {availableSheets.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {availableSheets
                          .filter(sheet => 
                            !setlist.sheets.some(s => s.id === sheet.id) &&
                            (sheet.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             sheet.artist?.toLowerCase().includes(searchTerm.toLowerCase()))
                          )
                          .map(sheet => (
                            <li key={sheet.id} className="py-2">
                              <button
                                onClick={() => addSheetToSetlist(sheet.id)}
                                className="w-full text-left p-2 hover:bg-gray-50 rounded transition duration-150 ease-in-out"
                              >
                                <div>
                                  <p className="font-medium">{sheet.title || 'Untitled Sheet'}</p>
                                  <p className="text-sm text-gray-600">{sheet.artist || 'Unknown Artist'}</p>
                                </div>
                              </button>
                            </li>
                          ))
                        }
                      </ul>
                    ) : (
                      <p className="text-center text-gray-500 py-4">Loading available sheets...</p>
                    )}
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowAddSheetModal(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
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
