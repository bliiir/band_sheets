// src/App.js
import React from 'react';
import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import AppProviders from './contexts/AppProviders';
import AppLayout from './layouts/AppLayout';
import HomePage from './pages/HomePage';
import SheetsPage from './pages/SheetsPage';
import SetlistsPage from './pages/SetlistsPage';
import NewSheetPage from './pages/NewSheetPage';
import NewSetlistPage from './pages/NewSetlistPage';
import SheetEditorPage from './pages/SheetEditorPage';
import SetlistViewPage from './pages/SetlistViewPage';
import BandSheetEditor from './components/BandSheetEditor';
import SharedSetlistView from './components/SharedSetlistView';
import GlobalAuthModal from './components/Auth/GlobalAuthModal';

// SheetEditor component with ID parameter
// Using a key based on sheetId forces component to remount when sheet changes
// This is critical for correct navigation behavior
const SheetEditorWithId = () => {
  const { sheetId } = useParams();
  return <BandSheetEditor initialSheetId={sheetId} key={`sheet-${sheetId}`} />;
};

// Main App component
function App() {
  // Check if we're in print mode based on URL parameters
  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get('print') === 'true';
  
  // If in print mode, render just the editor without the layout
  if (isPrintMode) {
    return (
      <AppProviders>
        <Routes>
          <Route path="/" element={<BandSheetEditor />} />
          <Route path="/sheet/:sheetId" element={<SheetEditorWithId />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    );
  }
  
  // Normal mode with full layout
  return (
    <AppProviders>
      {/* Add GlobalAuthModal outside of Routes but inside AppProviders 
          to ensure it can be triggered from anywhere */}
      <GlobalAuthModal />
      
      <Routes>
        <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/sheets" element={<AppLayout><SheetsPage /></AppLayout>} />
        <Route path="/setlists" element={<AppLayout><SetlistsPage /></AppLayout>} />
        <Route path="/sheet/new" element={<AppLayout><NewSheetPage /></AppLayout>} />
        <Route path="/sheet/:sheetId" element={<AppLayout><SheetEditorPage /></AppLayout>} />
        <Route path="/setlist/new" element={<AppLayout><NewSetlistPage /></AppLayout>} />
        <Route path="/setlist/:id" element={<AppLayout><SetlistViewPage /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppProviders>
  );
}

export default App;
