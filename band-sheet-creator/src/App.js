// src/App.js
import React from 'react';
import BandSheetEditor from './components/BandSheetEditor';

function App() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="bg-gray-800 text-white p-6 text-center">
        <h1 className="m-0 text-2xl font-bold">Band Sheet Creator</h1>
        <p className="mt-1 opacity-80">Create and edit song structure sheets for your band</p>
      </header>
      <main className="flex-1 min-w-0 min-h-0 m-0 p-0 bg-white">
        <BandSheetEditor />
      </main>
      <footer className="p-4 text-center text-gray-500 text-xs bg-gray-100 mt-auto">
        <p>Band Sheet Creator - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
