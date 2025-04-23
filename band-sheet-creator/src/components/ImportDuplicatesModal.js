import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Modal component for handling duplicate sheets during import
 */
const ImportDuplicatesModal = ({ 
  isOpen, 
  onClose, 
  duplicateData, 
  onConfirm 
}) => {
  const [importOption, setImportOption] = useState('skip');
  
  if (!isOpen || !duplicateData) return null;
  
  const { duplicateCheck } = duplicateData;
  const { potentialDuplicates, newSheets } = duplicateCheck;
  
  const handleConfirm = () => {
    onConfirm({
      generateNewIds: importOption === 'createNew'
    });
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Import Sheets</h2>
        
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            Found {potentialDuplicates.length} sheets that already exist in your collection.
            {newSheets.length > 0 && ` Also found ${newSheets.length} new sheets.`}
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800">
              How would you like to handle the duplicate sheets?
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="importOption"
                value="skip"
                checked={importOption === 'skip'}
                onChange={() => setImportOption('skip')}
                className="mt-1 mr-2"
              />
              <div>
                <p className="font-medium">Skip duplicates</p>
                <p className="text-sm text-gray-600">
                  Only import new sheets. Sheets with the same ID will be skipped.
                </p>
              </div>
            </label>
            
            <label className="flex items-start cursor-pointer">
              <input
                type="radio"
                name="importOption"
                value="createNew"
                checked={importOption === 'createNew'}
                onChange={() => setImportOption('createNew')}
                className="mt-1 mr-2"
              />
              <div>
                <p className="font-medium">Create new copies</p>
                <p className="text-sm text-gray-600">
                  Import all sheets and generate new IDs for duplicates, creating copies.
                </p>
              </div>
            </label>
          </div>
        </div>
        
        {potentialDuplicates.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Potential duplicates:</h3>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {potentialDuplicates.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{item.importSheet.title}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.importSheet.dateModified).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

ImportDuplicatesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  duplicateData: PropTypes.object,
  onConfirm: PropTypes.func.isRequired
};

export default ImportDuplicatesModal;
