import React from 'react';
import SavedSheetsPanel from './SavedSheetsPanel';
import { getAllSheets } from '../services/SheetStorageService';
import { useUIState } from '../contexts/UIStateContext';

const Sidebar = ({ 
  sidebarOpen, 
  savedSheets, 
  setSidebarOpen, 
  loadSheet 
}) => {
  // Get UI state methods
  const { setSavedSheets } = useUIState();
  
  // Fetch saved sheets directly using the service
  const fetchSavedSheets = () => {
    const sheets = getAllSheets();
    setSavedSheets(sheets);
  };
  return (
    <div className={`z-20 transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden'} md:block`}>
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
