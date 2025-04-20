import React from 'react';
import SavedSheetsPanel from './SavedSheetsPanel';

const Sidebar = ({ 
  sidebarOpen, 
  savedSheets, 
  setSidebarOpen, 
  loadSheet, 
  fetchSavedSheets 
}) => {
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
