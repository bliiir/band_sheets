// src/App.js
import React from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import BandSheetEditor from './components/BandSheetEditor';
import AuthButton from './components/Auth/AuthButton';
import Logo from './assets/logo3.png';
import AppProviders from './contexts/AppProviders';

// Sheet editor with URL parameter
function SheetEditorWithId() {
  const { sheetId } = useParams();
  return <BandSheetEditor initialSheetId={sheetId} />;
}

// Main App component
function App() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="bg-gray-800 text-white p-4 flex items-center sticky top-0 z-50">
        <div className="flex-shrink-0 mr-6">
          <img src={Logo} alt="Band Sheet Creator" className="h-12" />
        </div>
        <div className="text-left flex-1">
          <span className="text-xl font-bold mr-6">Band Sheet Creator</span>
          <span className="opacity-80">Create and edit song structure sheets for your band</span>
        </div>
        <AppProviders>
          <AuthButton />
        </AppProviders>
      </header>
      <main className="flex-1 min-w-0 min-h-0 m-0 p-0 bg-white">
        <AppProviders>
          <Routes>
            <Route path="/" element={<BandSheetEditor />} />
            <Route path="/sheet/:sheetId" element={<SheetEditorWithId />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProviders>
      </main>
      <footer className="p-4 text-center text-gray-500 text-xs bg-gray-100 mt-auto">
        <p>Band Sheet Creator - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
