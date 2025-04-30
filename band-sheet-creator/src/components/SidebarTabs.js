import React, { useState } from 'react';
import SavedSheetsPanel from './SavedSheetsPanel';
import SetlistsPanel from './SetlistsPanel';

const SidebarTabs = ({ 
  sidebarOpen, 
  savedSheets, 
  setSidebarOpen, 
  loadSheet,
  isMobile,
  fetchSavedSheets
}) => {
  const [activeTab, setActiveTab] = useState('sheets'); // 'sheets' or 'setlists'
  
  return (
    <div className={`z-20 transition-all duration-200 ${sidebarOpen ? 'block' : 'hidden'} md:block fixed ${isMobile ? 'left-0 right-0 top-[84px]' : 'left-14 top-[60px] bottom-0'}`}>
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 border-b border-gray-200">
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'sheets' ? 'bg-white text-blue-600 border-t-2 border-blue-500' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('sheets')}
        >
          Sheets
        </button>
        <button
          className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${activeTab === 'setlists' ? 'bg-white text-blue-600 border-t-2 border-blue-500' : 'text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('setlists')}
        >
          Setlists
        </button>
      </div>
      
      {/* Panel Content */}
      {activeTab === 'sheets' ? (
        <SavedSheetsPanel
          open={sidebarOpen}
          savedSheets={savedSheets}
          onClose={() => setSidebarOpen(false)}
          onDoubleClickSheet={loadSheet}
          onUpdate={fetchSavedSheets}
          isMobile={isMobile}
        />
      ) : (
        <SetlistsPanel
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelectSetlist={(setlist) => {
            // Handle setlist selection - this would typically open the setlist
            console.log('Selected setlist:', setlist);
            // Future enhancement: Navigate to a setlist view or display setlist sheets
          }}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default SidebarTabs;
