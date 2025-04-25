import React, { useState, useRef } from 'react';
import { importLocalStorageFile } from '../services/ImportExportService';
import { getAllSheets } from '../services/SheetStorageService';
import ImportDuplicatesModal from './ImportDuplicatesModal';

const LocalStorageImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      setError('Please select one or more files to import');
      return;
    }

    try {
      setIsImporting(true);
      setMessage('');
      setError('');
      
      const files = Array.from(fileInputRef.current.files);
      setProgress({ current: 0, total: files.length });
      
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCurrentFile(file);
        setProgress(prev => ({ ...prev, current: i + 1 }));
        
        try {
          // Import directly to MongoDB with generateNewIds option to avoid conflicts
          const result = await importLocalStorageFile(file, { generateNewIds: true });
          
          if (result.results) {
            importedCount += result.results.imported;
            skippedCount += result.results.skipped;
          }
          
          // Show success message for this file
          setMessage(prev => prev ? `${prev}\n${result.message}` : result.message);
        } catch (err) {
          console.error(`Error importing file ${file.name}:`, err);
          setError(prev => prev ? `${prev}\n${file.name}: ${err.message}` : `${file.name}: ${err.message}`);
          errorCount++;
        }
      }
      
      // Refresh the sheets list to show newly imported sheets
      try {
        console.log('Refreshing sheets list after import');
        
        // Force a UI refresh with sortByNewest=true, skipUIRefresh=false
        const sheets = await getAllSheets(true, false);
        console.log('Fetched sheets after import:', sheets);
        
        // If onUpdate callback is provided (from Sidebar), call it to refresh the panel
        if (onSuccess && onSuccess.onUpdate) {
          console.log('Calling onUpdate callback to refresh sheets panel');
          onSuccess.onUpdate();
        }
      } catch (refreshErr) {
        console.error('Error refreshing sheets list:', refreshErr);
      }
      
      // Final summary message
      setMessage(prev => `${prev}\n\nSummary: ${importedCount} sheets imported, ${skippedCount} skipped, ${errorCount} errors`);
      
      if (onSuccess) onSuccess({ 
        imported: importedCount, 
        skipped: skippedCount, 
        errors: errorCount,
        usingLocalStorage: true // Flag to prevent auto-closing the parent modal
      });
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
      setCurrentFile(null);
    }
  };
  
  const handleDuplicateConfirm = async (options) => {
    if (!currentFile) return;
    
    try {
      // Import with the user's chosen options
      const result = await importLocalStorageFile(currentFile, options);
      
      setShowDuplicatesModal(false);
      setDuplicateData(null);
      
      return result;
    } catch (err) {
      console.error('Error handling duplicates:', err);
      setShowDuplicatesModal(false);
      setDuplicateData(null);
      throw err;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Duplicates Modal */}
      <ImportDuplicatesModal
        isOpen={showDuplicatesModal}
        onClose={() => {
          setShowDuplicatesModal(false);
          setDuplicateData(null);
        }}
        duplicateData={duplicateData}
        onConfirm={handleDuplicateConfirm}
      />
      
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Import Local Storage Files</h2>
        
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
        
        {isImporting && (
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              Importing file {progress.current} of {progress.total}: {currentFile?.name}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Import Local Storage Files</h3>
          <p className="text-gray-600 mb-3">
            Import sheets from JSON files saved from local storage. You can select multiple files at once.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            multiple
            className="mb-3 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
          >
            Import Files
          </button>
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

export default LocalStorageImportModal;
