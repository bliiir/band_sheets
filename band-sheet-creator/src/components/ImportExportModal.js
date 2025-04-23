import React, { useState, useRef } from 'react';
import { exportSheets, importSheets } from '../services/ImportExportService';
import { getAllSheets } from '../services/SheetStorageService';
import ImportDuplicatesModal from './ImportDuplicatesModal';

const ImportExportModal = ({ isOpen, onClose, onSuccess }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsImporting(true);
      setMessage('');
      setError('');
      
      const result = await exportSheets();
      setMessage(result.message);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    if (!fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      setError('Please select a file to import');
      return;
    }

    try {
      setIsImporting(true);
      setMessage('');
      setError('');
      
      const file = fileInputRef.current.files[0];
      setImportFile(file); // Save the file for later use
      
      // First attempt to import without options to check for duplicates
      const result = await importSheets(file);
      
      // Check if we need user input for duplicates
      if (result.needsUserInput && result.duplicateCheck) {
        setDuplicateData(result);
        setShowDuplicatesModal(true);
        setIsImporting(false);
        return;
      }
      
      // If no duplicates or user already made a choice, proceed with import
      // Refresh the sheets list to show newly imported sheets
      await getAllSheets(true, false); // Force a UI refresh
      
      setMessage(`${result.results.imported} sheets imported, ${result.results.skipped} skipped`);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };
  
  const handleDuplicateConfirm = async (options) => {
    if (!importFile) return;
    
    try {
      setIsImporting(true);
      setMessage('');
      setError('');
      
      // Import with the user's chosen options
      const result = await importSheets(importFile, options);
      
      // Refresh the sheets list to show newly imported sheets
      await getAllSheets(true, false); // Force a UI refresh
      
      setMessage(`${result.results.imported} sheets imported, ${result.results.skipped} skipped`);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setIsImporting(false);
      setDuplicateData(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Duplicates Modal */}
      <ImportDuplicatesModal
        isOpen={showDuplicatesModal}
        onClose={() => setShowDuplicatesModal(false)}
        duplicateData={duplicateData}
        onConfirm={handleDuplicateConfirm}
      />
      
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Import/Export Sheets</h2>
        
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
          <h3 className="font-semibold mb-2">Export Sheets</h3>
          <p className="text-gray-600 mb-3">
            Export all your sheets to a JSON file that you can save as a backup or transfer to another device.
          </p>
          <button
            onClick={handleExport}
            disabled={isImporting}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
          >
            Export All Sheets
          </button>
        </div>
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Import Sheets</h3>
          <p className="text-gray-600 mb-3">
            Import sheets from a previously exported JSON file. Sheets with duplicate IDs will be skipped.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
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
            Import Sheets
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

export default ImportExportModal;
