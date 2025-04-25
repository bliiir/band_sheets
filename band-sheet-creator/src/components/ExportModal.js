import React, { useState } from 'react';
import { exportSheets } from '../services/ImportExportService';

const ExportModal = ({ isOpen, onClose, onSuccess }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setMessage('');
      setError('');
      
      const result = await exportSheets();
      setMessage(result.message);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Export Sheets</h2>
        
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
            disabled={isExporting}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded w-full"
          >
            {isExporting ? 'Exporting...' : 'Export All Sheets'}
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

export default ExportModal;
