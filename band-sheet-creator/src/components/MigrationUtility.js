import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllSheets, saveSheet } from '../services/SheetStorageService';

/**
 * Utility component to migrate sheets from localStorage to the server
 */
const MigrationUtility = () => {
  const { currentUser } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState('idle');
  const [results, setResults] = useState(null);

  const migrateSheets = async () => {
    if (!currentUser) {
      setMigrationStatus('error');
      setResults({ error: 'You must be logged in to migrate sheets' });
      return;
    }

    setMigrationStatus('migrating');
    setResults(null);

    try {
      // Get all sheets from localStorage
      const localSheets = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('sheet_')) {
          try {
            const sheet = JSON.parse(localStorage.getItem(key));
            localSheets.push(sheet);
          } catch (e) {
            console.error(`Error parsing sheet ${key}:`, e);
          }
        }
      }

      console.log(`Found ${localSheets.length} sheets in localStorage`);

      // Save each sheet to the server
      let successCount = 0;
      const migrationResults = [];

      for (const sheet of localSheets) {
        try {
          // Create a new sheet with a new ID to avoid conflicts
          const newSheet = {
            ...sheet,
            id: `sheet_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            dateModified: new Date()
          };

          // Use the application's saveSheet function which handles auth properly
          const savedSheet = await saveSheet(newSheet, true);
          
          migrationResults.push({
            title: sheet.title || sheet.id,
            success: true
          });
          
          successCount++;
        } catch (error) {
          migrationResults.push({
            title: sheet.title || sheet.id,
            success: false,
            error: error.message
          });
        }
      }

      setMigrationStatus('complete');
      setResults({
        total: localSheets.length,
        success: successCount,
        details: migrationResults
      });
    } catch (error) {
      setMigrationStatus('error');
      setResults({ error: error.message });
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sheet Migration Utility</h2>
      
      {!currentUser && (
        <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 rounded">
          You must be logged in to migrate sheets
        </div>
      )}
      
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        onClick={migrateSheets}
        disabled={!currentUser || migrationStatus === 'migrating'}
      >
        {migrationStatus === 'migrating' ? 'Migrating...' : 'Migrate Local Sheets to Server'}
      </button>
      
      {migrationStatus === 'error' && (
        <div className="mt-4 p-2 bg-red-100 text-red-800 rounded">
          Error: {results.error}
        </div>
      )}
      
      {migrationStatus === 'complete' && (
        <div className="mt-4">
          <p className="font-bold">
            Migration complete! Successfully migrated {results.success} out of {results.total} sheets.
          </p>
          
          {results.details.length > 0 && (
            <div className="mt-2">
              <h3 className="font-bold">Details:</h3>
              <ul className="mt-1 max-h-60 overflow-y-auto">
                {results.details.map((result, index) => (
                  <li key={index} className={`py-1 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.title}: {result.success ? 'Success' : `Failed - ${result.error}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MigrationUtility;
