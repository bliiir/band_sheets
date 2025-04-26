import React, { useEffect } from 'react';
import SavedSheetsPanel from './SavedSheetsPanel';
import { getAllSheets } from '../services/SheetStorageService';
import { useUIState } from '../contexts/UIStateContext';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ 
  sidebarOpen, 
  savedSheets, 
  setSidebarOpen, 
  loadSheet 
}) => {
  // Get UI state methods
  const { setSavedSheets } = useUIState();
  
  // Get auth state to detect changes
  const { authChangeCounter, isAuthenticated } = useAuth();
  
  // Fetch saved sheets directly using the service
  const fetchSavedSheets = async () => {
    try {
      const sheets = await getAllSheets();
      setSavedSheets(sheets);
    } catch (error) {
      console.error('Sidebar: Error fetching sheets:', error);
    }
  };
  
  // Fetch sheets when component mounts or auth state changes
  useEffect(() => {
    // Only fetch sheets if sidebar is open or auth state changed
    if (sidebarOpen || authChangeCounter > 0) {
      console.log('Auth state changed or sidebar opened, fetching sheets');
      fetchSavedSheets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sidebarOpen, authChangeCounter, isAuthenticated]);
  
  return (
    <div className={`z-20 transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden'} md:block fixed left-14 top-[60px] bottom-0`}>
      <SavedSheetsPanel
        open={sidebarOpen}
        savedSheets={savedSheets}
        onClose={() => setSidebarOpen(false)}
        onDoubleClickSheet={loadSheet}
        onUpdate={fetchSavedSheets}
      />
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 md:hidden z-10" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}
    </div>
  );
};

export default Sidebar;
