import React, { useState, useRef } from 'react';
import { importSheets } from '../services/ImportService';
import { getAllSheets } from '../services/SheetStorageService';
import { useUIState } from '../contexts/UIStateContext';

const ImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState(null);
  const [importOption, setImportOption] = useState('skip'); // Default to skip
  const fileInputRef = useRef();

  // Access the UIState to update the saved sheets list
  const { setSavedSheets } = useUIState();

  if (!isOpen) return null;

  // Check for duplicates when a file is selected
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setSelectedFile(file);
    setDuplicates(null);
    setMessage('');
    setError('');
    
    try {
      // First try to do a preliminary import to check for duplicates
      const prelimResult = await importSheets(file);
      
      // If the import needs user input for duplicates, show the options
      if (prelimResult.needsUserInput && prelimResult.duplicateCheck) {
        console.log('Duplicate check result:', prelimResult.duplicateCheck);
        setDuplicates(prelimResult.duplicateCheck);
      }
    } catch (err) {
      // If there's an error in the preliminary check, we'll handle it during the actual import
      console.log('Preliminary duplicate check error:', err);
      // Don't show the error yet, as we'll retry during the actual import
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      setMessage('');
      setError('');
      
      // Pass the selected import option to handle duplicates
      const importOptions = { 
        generateNewIds: importOption === 'rename',
        skipDuplicates: importOption === 'skip',
        overwriteDuplicates: importOption === 'overwrite'
      };
      
      console.log('Importing with options:', importOptions);
      const result = await importSheets(selectedFile, importOptions);
      
      // Log the full import result for debugging
      console.log('Import result:', result);
      if (result.results) {
        console.log('Import results detail:', result.results);
      }
      
      if (result.needsUserInput) {
        // This is handled by the duplicate detection
        setMessage(result.message);
      } else if (result.success) {
        // Always display the message returned from the import function
        setMessage(result.message);
        
        // Clear the file input to allow for another import
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
          setSelectedFile(null);
        }
      } else {
        // No sheets were imported and no duplicates were found
        setMessage('Import complete, but no sheets were imported. Please check the file format.');
      }
      
      setDuplicates(null); // Clear duplicates after successful import
      
      // Refresh the sheet list to show newly imported sheets
      try {
        const updatedSheets = await getAllSheets(true); // Force refresh from storage
        console.log('Sheet list refreshed after import');
        
        // Directly update the saved sheets in the UI
        if (updatedSheets && Array.isArray(updatedSheets)) {
          setSavedSheets(updatedSheets);
          console.log('UI sheet list updated with', updatedSheets.length, 'sheets');
        }
      } catch (refreshError) {
        console.error('Error refreshing sheet list:', refreshError);
      }
      
      // Notify parent component of success
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Import Sheets</h2>
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Import Sheets</h3>
          <p className="text-gray-600 mb-3">
            Import sheets from a JSON file. The system will automatically detect the file type.
          </p>
          <form onSubmit={handleImport}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="file">
                Select File
              </label>
              <input
                type="file"
                id="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            {duplicates && duplicates.hasDuplicates && (
              <div className="mb-4">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  Found {duplicates.duplicates.length} potential duplicate sheet{duplicates.duplicates.length !== 1 ? 's' : ''}. Please choose how to handle them:
                </div>
                
                <div className="flex flex-col space-y-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="importOption"
                      value="skip"
                      checked={importOption === 'skip'}
                      onChange={() => setImportOption('skip')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Skip duplicates</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="importOption"
                      value="rename"
                      checked={importOption === 'rename'}
                      onChange={() => setImportOption('rename')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Import with new IDs (create copies)</span>
                  </label>
                  
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="importOption"
                      value="overwrite"
                      checked={importOption === 'overwrite'}
                      onChange={() => setImportOption('overwrite')}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2 text-gray-700">Overwrite existing sheets</span>
                  </label>
                </div>
              </div>
            )}
            <button
              type="submit"
              disabled={isImporting}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded w-full"
            >
              {isImporting ? 'Importing...' : 'Import Sheets'}
            </button>
          </form>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
