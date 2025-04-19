// src/App.js
import React from 'react';
import './App.css';
import BandSheetEditor from './components/BandSheetEditor';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Band Sheet Creator</h1>
        <p>Create and edit song structure sheets for your band</p>
      </header>
      <main>
        <BandSheetEditor />
      </main>
      <footer className="app-footer">
        <p>Band Sheet Creator - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
