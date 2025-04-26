import React, { useState, useEffect } from "react";
import { ReactComponent as FolderIcon } from "../assets/folder.svg";
import { ReactComponent as FilePlusIcon } from "../assets/file_plus.svg";
import { ReactComponent as SaveIcon } from "../assets/save.svg";
import { ReactComponent as SaveAllIcon } from "../assets/save_all.svg";
import { ReactComponent as PrintIcon } from "../assets/print.svg";
import { ReactComponent as UserIcon } from "../assets/user.svg";
import { ReactComponent as ArrowLeftFromLineIcon } from "../assets/arrow_left_from_line.svg";
import { ReactComponent as ArrowRightFromLineIcon } from "../assets/arrow_right_from_line.svg";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./Auth/AuthModal";
import AuthRequiredModal from "./AuthRequiredModal";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
import eventBus from "../utils/EventBus";

/**
 * Toolbar component with authentication-aware save buttons
 */
const Toolbar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  handleNewSheet, 
  handleSave, 
  handleSaveAs, 
  handleExport 
}) => {
  // State for modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRequiredModalOpen, setAuthRequiredModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // State for authentication
  const [isAuthEnabled, setIsAuthEnabled] = useState(false);
  
  // Get authentication state directly from context
  const { currentUser, logout, isAuthenticated } = useAuth();
  
  // Initialize auth state
  useEffect(() => {
    setIsAuthEnabled(isAuthenticated);
  }, [isAuthenticated]);
  
  // Listen for auth change events
  useEffect(() => {
    const handleAuthChange = (data) => {
      console.log('Toolbar received auth change event:', data);
      setIsAuthEnabled(data.isAuthenticated);
    };
    
    // Subscribe to auth change events
    eventBus.on('auth-change', handleAuthChange);
    
    // Cleanup subscription
    return () => {
      // No need to unsubscribe as eventBus handles this
    };
  }, []);
  
  // Wrapper functions to check authentication before actions
  const handleSaveClick = () => {
    if (isAuthenticated) {
      handleSave();
    } else {
      setAuthRequiredModalOpen(true);
    }
  };
  
  const handleSaveAsClick = () => {
    if (isAuthenticated) {
      handleSaveAs();
    } else {
      setAuthRequiredModalOpen(true);
    }
  };
  return (
    <div className="w-14 bg-gray-700 border-r border-gray-800 shadow-md flex flex-col items-center pt-8 pb-4 z-30 fixed left-0 top-[60px] bottom-0">
      <button 
        className={`p-2 rounded-md mb-2 transition-colors ${sidebarOpen ? 'bg-white text-gray-700' : 'text-white hover:bg-gray-600'}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title="Saved Sheets"
      >
        <FolderIcon className="w-6 h-6" />
      </button>
      <button 
        className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
        onClick={handleNewSheet}
        title="New Sheet"
      >
        <FilePlusIcon className="w-6 h-6" />
      </button>
      <button 
        className={`p-2 rounded-md mb-2 transition-colors ${isAuthEnabled ? 'text-white hover:bg-gray-600' : 'text-gray-400 cursor-not-allowed relative'}`}
        onClick={handleSaveClick}
        disabled={!isAuthEnabled}
        title={isAuthEnabled ? "Save" : "Login to Save"}
      >
        <SaveIcon className="w-6 h-6" />
        {!isAuthEnabled && (
          <span className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
        )}
      </button>
      <button 
        className={`p-2 rounded-md mb-2 transition-colors ${isAuthEnabled ? 'text-white hover:bg-gray-600' : 'text-gray-400 cursor-not-allowed relative'}`}
        onClick={handleSaveAsClick}
        disabled={!isAuthEnabled}
        title={isAuthEnabled ? "Save As" : "Login to Save As"}
      >
        <SaveAllIcon className="w-6 h-6" />
        {!isAuthEnabled && (
          <span className="absolute -top-1 -right-1 bg-gray-800 rounded-full p-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
        )}
      </button>
      <button 
        className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
        onClick={handleExport}
        title="PDF"
      >
        <PrintIcon className="w-6 h-6" />
      </button>

      <button 
        className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
        onClick={() => setImportModalOpen(true)}
        title="Import Sheets"
      >
        <ArrowLeftFromLineIcon className="w-6 h-6" />
      </button>
      
      <button 
        className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
        onClick={() => setExportModalOpen(true)}
        title="Export Sheets"
      >
        <ArrowRightFromLineIcon className="w-6 h-6" />
      </button>
      
      {/* Spacer */}
      <div className="flex-grow"></div>
      
      {/* Auth Button */}
      <button 
        className={`p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600 ${isAuthenticated ? 'bg-green-600 hover:bg-green-700' : ''}`}
        onClick={() => isAuthenticated ? logout() : setAuthModalOpen(true)}
        title={isAuthenticated ? `Logout ${currentUser?.username}` : "Login/Register"}
      >
        <UserIcon className="w-6 h-6" />
      </button>
      
      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      
      {/* Auth Required Modal */}
      <AuthRequiredModal 
        isOpen={authRequiredModalOpen} 
        onClose={() => setAuthRequiredModalOpen(false)}
        onLogin={() => {
          setAuthRequiredModalOpen(false);
          setAuthModalOpen(true);
        }}
        onRegister={() => {
          setAuthRequiredModalOpen(false);
          setAuthModalOpen(true);
        }}
      />
      
      {/* Import Modal */}
      <ImportModal 
        isOpen={importModalOpen} 
        onClose={() => setImportModalOpen(false)} 
        onSuccess={(result) => {
          // Don't automatically close the modal
          // Let the user close it manually
        }}
      />
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={exportModalOpen} 
        onClose={() => setExportModalOpen(false)} 
        onSuccess={(result) => {
          // Don't automatically close the modal
          // Let the user close it manually
        }}
      />
    </div>
  );
};

export default Toolbar;
