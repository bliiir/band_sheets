import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllSheets, saveSheet, deleteSheet } from '../../services/SheetStorageService';
import { useUIState } from '../../contexts/UIStateContext';

/**
 * Component for testing API connectivity
 * This is a debug component for verifying backend integration
 */
const ApiConnectionTest = () => {
  const { isAuthenticated, currentUser, login, logout } = useAuth();
  const { isLoading, apiError, beginApiCall, endApiCall } = useUIState();
  
  const [sheets, setSheets] = useState([]);
  const [testStatus, setTestStatus] = useState({ success: null, message: '' });
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');

  // Test login
  const handleTestLogin = async () => {
    beginApiCall();
    setTestStatus({ success: null, message: 'Attempting login...' });
    
    try {
      const result = await login(testEmail, testPassword);
      
      if (result) {
        setTestStatus({ 
          success: true, 
          message: `Logged in successfully as: ${currentUser?.username || currentUser?.email}` 
        });
      } else {
        setTestStatus({ 
          success: false, 
          message: 'Login failed' 
        });
      }
    } catch (error) {
      setTestStatus({ 
        success: false, 
        message: `Login error: ${error.message}` 
      });
    } finally {
      endApiCall();
    }
  };
  
  // Test logout
  const handleTestLogout = async () => {
    beginApiCall();
    setTestStatus({ success: null, message: 'Logging out...' });
    
    try {
      await logout();
      setTestStatus({ 
        success: true, 
        message: 'Logged out successfully' 
      });
    } catch (error) {
      setTestStatus({ 
        success: false, 
        message: `Logout error: ${error.message}` 
      });
    } finally {
      endApiCall();
    }
  };
  
  // Test getting all sheets
  const handleGetSheets = async () => {
    beginApiCall();
    setTestStatus({ success: null, message: 'Fetching sheets...' });
    
    try {
      const allSheets = await getAllSheets();
      setSheets(allSheets);
      setTestStatus({ 
        success: true, 
        message: `Successfully fetched ${allSheets.length} sheets` 
      });
    } catch (error) {
      setTestStatus({ 
        success: false, 
        message: `Error fetching sheets: ${error.message}` 
      });
    } finally {
      endApiCall();
    }
  };
  
  // Test creating a new sheet
  const handleCreateSheet = async () => {
    beginApiCall();
    setTestStatus({ success: null, message: 'Creating test sheet...' });
    
    try {
      const testSheet = {
        title: `Test Sheet ${new Date().toISOString()}`,
        artist: 'API Test',
        bpm: 120,
        sections: [
          {
            id: Date.now(),
            name: 'Test Section',
            energy: 5,
            parts: [
              {
                id: Date.now() + 1,
                part: 'A',
                bars: 4,
                notes: 'API test part'
              }
            ]
          }
        ],
        partsModule: [
          {
            id: Date.now() + 2,
            part: 'A',
            bars: 4,
            chords: 'C G Am F'
          }
        ],
        transposeValue: 0
      };
      
      const savedSheet = await saveSheet(testSheet, true);
      setTestStatus({ 
        success: true, 
        message: `Created sheet with ID: ${savedSheet.id}` 
      });
      
      // Refresh sheet list
      await handleGetSheets();
    } catch (error) {
      setTestStatus({ 
        success: false, 
        message: `Error creating sheet: ${error.message}` 
      });
    } finally {
      endApiCall();
    }
  };
  
  // Test deleting a sheet
  const handleDeleteSheet = async (id) => {
    beginApiCall();
    setTestStatus({ success: null, message: `Deleting sheet ${id}...` });
    
    try {
      await deleteSheet(id);
      setTestStatus({ 
        success: true, 
        message: `Deleted sheet ${id}` 
      });
      
      // Refresh sheet list
      await handleGetSheets();
    } catch (error) {
      setTestStatus({ 
        success: false, 
        message: `Error deleting sheet: ${error.message}` 
      });
    } finally {
      endApiCall();
    }
  };
  
  // Styling
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    },
    header: {
      borderBottom: '1px solid #eee',
      paddingBottom: '10px',
      marginBottom: '20px'
    },
    section: {
      marginBottom: '20px',
      padding: '15px',
      borderRadius: '5px',
      backgroundColor: '#f8f9fa'
    },
    button: {
      padding: '8px 12px',
      margin: '0 8px 8px 0',
      background: '#4a6ee0',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
      marginTop: '15px'
    },
    th: {
      textAlign: 'left',
      borderBottom: '2px solid #ddd',
      padding: '8px'
    },
    td: {
      borderBottom: '1px solid #ddd',
      padding: '8px'
    },
    input: {
      padding: '8px',
      marginRight: '10px',
      borderRadius: '4px',
      border: '1px solid #ddd'
    },
    status: {
      padding: '15px',
      marginTop: '10px',
      borderRadius: '4px',
      backgroundColor: (testStatus.success === true) ? '#d4edda' : 
                     (testStatus.success === false) ? '#f8d7da' : '#e2e3e5',
      color: (testStatus.success === true) ? '#155724' : 
            (testStatus.success === false) ? '#721c24' : '#383d41'
    },
    loading: {
      marginTop: '10px',
      padding: '10px',
      backgroundColor: '#cce5ff',
      color: '#004085',
      borderRadius: '4px'
    }
  };
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>API Connection Test</h1>
        <p>Use this component to verify backend integration</p>
      </div>
      
      <div style={styles.section}>
        <h2>Authentication</h2>
        <p>Status: {isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}</p>
        {isAuthenticated && (
          <p>Logged in as: {currentUser?.username || currentUser?.email}</p>
        )}
        
        {!isAuthenticated ? (
          <div>
            <input
              type="email"
              placeholder="Email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              style={styles.input}
            />
            <input
              type="password"
              placeholder="Password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleTestLogin} style={styles.button}>
              Test Login
            </button>
          </div>
        ) : (
          <button onClick={handleTestLogout} style={styles.button}>
            Test Logout
          </button>
        )}
      </div>
      
      <div style={styles.section}>
        <h2>Sheet Operations</h2>
        <button 
          onClick={handleGetSheets} 
          style={styles.button}
          disabled={!isAuthenticated}
        >
          Get All Sheets
        </button>
        <button 
          onClick={handleCreateSheet} 
          style={styles.button}
          disabled={!isAuthenticated}
        >
          Create Test Sheet
        </button>
        
        {sheets.length > 0 && (
          <div>
            <h3>Sheet List ({sheets.length})</h3>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Artist</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sheets.map(sheet => (
                  <tr key={sheet.id}>
                    <td style={styles.td}>{sheet.id}</td>
                    <td style={styles.td}>{sheet.title}</td>
                    <td style={styles.td}>{sheet.artist}</td>
                    <td style={styles.td}>
                      <button 
                        onClick={() => handleDeleteSheet(sheet.id)}
                        style={{ ...styles.button, backgroundColor: '#dc3545' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Status and loading indicators */}
      {testStatus.message && (
        <div style={styles.status}>
          {testStatus.message}
        </div>
      )}
      
      {isLoading && (
        <div style={styles.loading}>
          Loading... Please wait.
        </div>
      )}
      
      {apiError && (
        <div style={{ ...styles.status, backgroundColor: '#f8d7da', color: '#721c24' }}>
          API Error: {apiError.message}
        </div>
      )}
    </div>
  );
};

export default ApiConnectionTest;
