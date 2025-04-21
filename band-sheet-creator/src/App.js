// src/App.js
import React, { useState } from 'react';
import BandSheetEditor from './components/BandSheetEditor';
import AuthButton from './components/Auth/AuthButton';
import ApiConnectionTest from './components/debug/ApiConnectionTest';
import Logo from './assets/logo3.png';
import AppProviders from './contexts/AppProviders';

function App() {
  const [showApiTest, setShowApiTest] = useState(false);
  
  // Check if the URL has the apitest query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const apiTestParam = urlParams.get('apitest');
  
  // Show API test if URL parameter exists
  React.useEffect(() => {
    if (apiTestParam === 'true') {
      setShowApiTest(true);
    }
  }, [apiTestParam]);
  
  // Toggle API test view
  const toggleApiTest = () => {
    setShowApiTest(prev => !prev);
  };
  
  return (
    <div className="flex flex-col min-h-screen w-full">
      <header className="bg-gray-800 text-white p-4 flex items-center">
        <div className="flex-shrink-0 mr-6">
          <img src={Logo} alt="Band Sheet Creator" className="h-12" />
        </div>
        <div className="text-left flex-1">
          <span className="text-xl font-bold mr-6">Band Sheet Creator</span>
          <span className="opacity-80">Create and edit song structure sheets for your band</span>
        </div>
        <button 
          onClick={toggleApiTest}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
        >
          {showApiTest ? 'Show Editor' : 'API Test'}
        </button>
      </header>
      <main className="flex-1 min-w-0 min-h-0 m-0 p-0 bg-white">
        <AppProviders>
          {showApiTest ? (
            <ApiConnectionTest />
          ) : (
            <>
              <BandSheetEditor />
              <AuthButton />
            </>
          )}
        </AppProviders>
      </main>
      <footer className="p-4 text-center text-gray-500 text-xs bg-gray-100 mt-auto">
        <p>Band Sheet Creator - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
