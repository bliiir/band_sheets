import React, { useState, useEffect } from 'react';
import { useSetlist } from '../contexts/SetlistContext';
import { useSheetData } from '../contexts/SheetDataContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

/**
 * Modal component for managing setlists
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Object} [props.initialSheet] - Optional initial sheet to add to a setlist
 */
const SetlistModal = ({ isOpen, onClose, initialSheet }) => {
  // States for the modal
  const [activeTab, setActiveTab] = useState('view'); // 'view', 'create', 'edit'
  const [selectedSetlistId, setSelectedSetlistId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [setlistToDelete, setSetlistToDelete] = useState(null);
  
  // Get setlist context
  const { 
    setlists = [], 
    createSetlist, 
    updateSetlist, 
    deleteSetlist,
    addSheetToSetlist,
    removeSheetFromSetlist,
    reorderSetlistSheets,
    isLoading,
    error 
  } = useSetlist();
  
  // Get authentication context
  const { isAuthenticated } = useAuth();
  
  // Get current sheet data
  const { currentSheetId, songData } = useSheetData();
  
  // Reset form when opening the modal
  useEffect(() => {
    if (isOpen) {
      // If initialSheet is provided, we're adding a sheet to a setlist
      if (initialSheet) {
        setActiveTab('view'); // Show the setlist view to select which setlist to add to
      } else {
        setActiveTab('view');
      }
      setSelectedSetlistId(null);
      setFormData({ name: '', description: '' });
    }
  }, [isOpen, initialSheet]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle create setlist form submission
  const handleCreateSetlist = async (e) => {
    e.preventDefault();
    
    try {
      await createSetlist(formData);
      setActiveTab('view');
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating setlist:', error);
    }
  };
  
  // Handle edit setlist form submission
  const handleUpdateSetlist = async (e) => {
    e.preventDefault();
    
    try {
      await updateSetlist(selectedSetlistId, formData);
      setActiveTab('view');
      setSelectedSetlistId(null);
      setFormData({ name: '', description: '' });
    } catch (error) {
      console.error('Error updating setlist:', error);
    }
  };
  
  // Handle initiating setlist deletion (shows confirmation dialog)
  const handleInitiateDelete = (setlistId) => {
    setSetlistToDelete(setlistId);
    setShowDeleteConfirm(true);
  };

  // Handle actual setlist deletion after confirmation
  const handleConfirmDelete = async () => {
    try {
      await deleteSetlist(setlistToDelete);
      setSelectedSetlistId(null);
      setShowDeleteConfirm(false);
      setSetlistToDelete(null);
    } catch (error) {
      console.error('Error deleting setlist:', error);
      setShowDeleteConfirm(false);
    }
  };

  // Handle cancellation of setlist deletion
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setSetlistToDelete(null);
  };
  
  // Handle adding current sheet to setlist
  const handleAddCurrentSheet = async (setlistId) => {
    if (!setlistId) {
      console.error('No setlist ID provided');
      return;
    }
    // If initialSheet is provided, use that instead of the current sheet
    if (initialSheet) {
      try {
        await addSheetToSetlist(setlistId, initialSheet);
        // Close the modal after adding the sheet
        onClose();
      } catch (error) {
        console.error('Error adding sheet to setlist:', error);
      }
      return;
    }
    
    // Otherwise use the current sheet
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
    } catch (error) {
      console.error('Error adding sheet to setlist:', error);
    }
  };
  
  // Handle removing a sheet from setlist
  const handleRemoveSheet = async (setlistId, sheetId) => {
    try {
      await removeSheetFromSetlist(setlistId, sheetId);
    } catch (error) {
      console.error('Error removing sheet from setlist:', error);
    }
  };
  
  // Handle sheet reordering
  const handleMoveSheet = async (setlistId, sheetIndex, direction) => {
    const newIndex = direction === 'up' ? sheetIndex - 1 : sheetIndex + 1;
    
    // Don't move if already at the top/bottom
    if (newIndex < 0 || newIndex >= setlists.find(s => s.id === setlistId).sheets.length) {
      return;
    }
    
    try {
      await reorderSetlistSheets(setlistId, sheetIndex, newIndex);
    } catch (error) {
      console.error('Error reordering sheets:', error);
    }
  };
  
  // Handle edit setlist button
  const handleEditSetlist = (setlist) => {
    setFormData({
      name: setlist.name,
      description: setlist.description
    });
    setSelectedSetlistId(setlist.id);
    setActiveTab('edit');
  };
  
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {activeTab === 'view' && 'Setlists'}
            {activeTab === 'create' && 'Create New Setlist'}
            {activeTab === 'edit' && 'Edit Setlist'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Tabs for different views */}
        {activeTab === 'view' && (
          <div>
            <div className="flex justify-between mb-4">
              {isAuthenticated ? (
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Create New Setlist
                </button>
              ) : (
                <div className="flex flex-col space-y-2">
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                    disabled
                  >
                    Create New Setlist
                  </button>
                  <div className="text-sm text-gray-600">
                    You must be <Link to="/login" className="text-blue-500 hover:underline" onClick={onClose}>logged in</Link> to create setlists
                  </div>
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div className="text-center py-4">Loading setlists...</div>
            ) : !setlists || setlists.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No setlists found. Create your first setlist!
              </div>
            ) : (
              <div className="space-y-4">
                {setlists.map(setlist => setlist && (
                  <div key={setlist?.id || `setlist-${Math.random()}`} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">{setlist?.name || 'Untitled Setlist'}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditSetlist(setlist)}
                          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                          disabled={!setlist}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleInitiateDelete(setlist?.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                          disabled={!setlist}
                        >
                          Delete
                        </button>
                        {initialSheet ? (
                          <button
                            onClick={() => handleAddCurrentSheet(setlist.id)}
                            className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm font-medium"
                          >
                            Add to this setlist
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAddCurrentSheet(setlist.id)}
                            className="px-3 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm"
                            disabled={!currentSheetId}
                          >
                            Add Current Sheet
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {setlist?.description && (
                      <p className="text-gray-600 mb-2">{setlist.description}</p>
                    )}
                    
                    <div className="mt-2">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Sheets:</h4>
                      {!setlist?.sheets || setlist.sheets.length === 0 ? (
                        <p className="text-gray-500 text-sm">No sheets in this setlist</p>
                      ) : (
                        <ul className="space-y-2">
                          {setlist.sheets.map((sheet, index) => sheet && (
                            <li
                              key={sheet?.id || `sheet-${index}-${Math.random()}`}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded border"
                            >
                              <div className="flex-1">
                                <span className="font-medium">{sheet?.title || 'Untitled'}</span>
                                {sheet?.artist && (
                                  <span className="text-gray-600 ml-2">by {sheet.artist}</span>
                                )}
                                {sheet?.bpm && (
                                  <span className="text-gray-500 ml-2">{sheet.bpm} BPM</span>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="flex flex-col">
                                  <button
                                    onClick={() => handleMoveSheet(setlist?.id, index, 'up')}
                                    disabled={index === 0}
                                    className={`text-gray-500 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-700'}`}
                                    aria-label="Move up"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleMoveSheet(setlist?.id, index, 'down')}
                                    disabled={index === setlist.sheets.length - 1}
                                    className={`text-gray-500 ${index === setlist.sheets.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-700'}`}
                                    aria-label="Move down"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleRemoveSheet(setlist?.id, sheet?.id)}
                                  className="text-red-500 hover:text-red-700"
                                  aria-label="Remove sheet"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Create Setlist Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateSetlist}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                Setlist Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Setlist'}
              </button>
            </div>
          </form>
        )}
        
        {/* Edit Setlist Form */}
        {activeTab === 'edit' && (
          <form onSubmit={handleUpdateSetlist}>
            <div className="mb-4">
              <label htmlFor="edit-name" className="block text-gray-700 font-medium mb-2">
                Setlist Name
              </label>
              <input
                type="text"
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="edit-description" className="block text-gray-700 font-medium mb-2">
                Description (Optional)
              </label>
              <textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('view')}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Setlist'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Setlist"
        message="Are you sure you want to delete this setlist?"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="red"
      />
    </div>
  );
};

export default SetlistModal;
