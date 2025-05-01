// src/App.js
import React from 'react';
import { Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
import BandSheetEditor from './components/BandSheetEditor';
import SharedSetlistView from './components/SharedSetlistView';
import AuthButton from './components/Auth/AuthButton';
import Logo from './assets/logo3.png';
import AppProviders from './contexts/AppProviders';

// Sheet editor with URL parameter
function SheetEditorWithId() {
  const { sheetId } = useParams();
  // Use a key based on sheetId to force complete remount when the ID changes
  // This ensures the component's state is completely reset between navigations
  return <BandSheetEditor key={sheetId} initialSheetId={sheetId} />;
}

// Main App component
function App() {
  // Check if we're in print mode based on URL parameters
  const [searchParams] = useSearchParams();
  const isPrintMode = searchParams.get('print') === 'true';
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Only show header and footer when not in print mode */}
      {!isPrintMode && (
        <header className="bg-gray-800 text-white p-2 md:p-4 flex items-center sticky top-0 z-50">
          <div className="flex-shrink-0 mr-2 md:mr-6">
            <img src={Logo} alt="Band Sheet Creator" className="h-8 md:h-12" />
          </div>
          <div className="text-left flex-1 flex flex-nowrap items-center">
            <span className="text-xs md:text-xl font-bold mr-2 md:mr-6 whitespace-nowrap">Band Sheet Creator</span>
            <span className="hidden md:inline opacity-80">Create and edit song structure sheets for your band</span>
          </div>
          <AppProviders>
            <AuthButton />
          </AppProviders>
        </header>
      )}
      <main className={`flex-1 min-w-0 min-h-0 m-0 p-0 bg-white ${isPrintMode ? 'pt-0' : ''}`}>
        <AppProviders>
          <Routes>
            <Route path="/" element={<BandSheetEditor />} />
            <Route path="/sheet/:sheetId" element={<SheetEditorWithId />} />
            <Route path="/setlist/:id" element={<SharedSetlistView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProviders>
      </main>
      {!isPrintMode && (
        <footer className="p-4 text-center text-gray-500 text-xs bg-gray-100 mt-auto">
          <p>Band Sheet Creator - {new Date().getFullYear()}</p>
        </footer>
      )}
    </div>
  );
}

export default App;
