import React, { useState, useEffect, useRef } from "react";
import {
  FilePlusIcon, 
  SaveIcon, 
  SaveAllIcon, 
  PrinterIcon, 
  UserIcon, 
  ImportIcon, 
  UploadIcon,
  PlusCircleIcon,
  LockIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon
} from "lucide-react";
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
  handleExport,
  isMobile,
  setlistsPanelOpen,
  setSetlistsPanelOpen
}) => {
  // State for modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authRequiredModalOpen, setAuthRequiredModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // State for account dropdown
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  // Ref for detecting clicks outside of the account menu
  const accountMenuRef = useRef(null);
  
  // State for authentication
  const [isAuthEnabled, setIsAuthEnabled] = useState(false);
  
  // Get authentication state directly from context
  const { currentUser, logout, isAuthenticated } = useAuth();
  
  // Handle clicks outside the account menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    }

    // Add event listener when menu is open
    if (showAccountMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAccountMenu]);
  
  // Initialize auth state
  useEffect(() => {
    setIsAuthEnabled(isAuthenticated);
  }, [isAuthenticated]);

  // Toggle account menu
  const toggleAccountMenu = () => {
    if (isAuthenticated) {
      setShowAccountMenu(!showAccountMenu);
    } else {
      setAuthModalOpen(true);
    }
  };
  
  // Handle save button click with authentication check
  const handleSaveClick = () => {
    if (isAuthEnabled) {
      handleSave();
    } else {
      setAuthRequiredModalOpen(true);
    }
  };
  
  // Handle save as button click with authentication check
  const handleSaveAsClick = () => {
    if (isAuthEnabled) {
      handleSaveAs();
    } else {
      setAuthRequiredModalOpen(true);
    }
  };

  return (
    <div className={`bg-card shadow-md z-50 flex items-center ${isMobile ? 'w-full fixed top-[48px] left-0 right-0 px-2 py-1 flex-row justify-around' : 'w-16 fixed left-0 top-[60px] bottom-0 flex-col pt-8 pb-4 border-r border-border'}`}>
      <button 
        className={`p-2 rounded-md flex items-center justify-center ${isMobile ? 'mx-1' : 'mb-2'} transition-colors text-muted-foreground hover:bg-muted hover:text-foreground`}
        onClick={handleNewSheet}
        title="New Sheet"
      >
        <FilePlusIcon className="w-5 h-5" />
      </button>
      
      <button 
        className={`p-2 rounded-md flex items-center justify-center ${isMobile ? 'mx-1' : 'mb-2'} transition-colors relative ${isAuthEnabled ? 'text-muted-foreground hover:bg-muted hover:text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'}`}
        onClick={handleSaveClick}
        disabled={!isAuthEnabled}
        title={isAuthEnabled ? "Save" : "Login to Save"}
      >
        <SaveIcon className="w-5 h-5" />
        {!isAuthEnabled && (
          <span className="absolute -top-1 -right-1 bg-background text-muted-foreground rounded-full p-0.5">
            <LockIcon className="h-3 w-3" />
          </span>
        )}
      </button>
      
      <button 
        className={`p-2 rounded-md flex items-center justify-center ${isMobile ? 'mx-1' : 'mb-2'} transition-colors relative ${isAuthEnabled ? 'text-muted-foreground hover:bg-muted hover:text-foreground' : 'text-muted-foreground/50 cursor-not-allowed'}`}
        onClick={handleSaveAsClick}
        disabled={!isAuthEnabled}
        title={isAuthEnabled ? "Save As" : "Login to Save As"}
      >
        <SaveAllIcon className="w-5 h-5" />
        {!isAuthEnabled && (
          <span className="absolute -top-1 -right-1 bg-background text-muted-foreground rounded-full p-0.5">
            <LockIcon className="h-3 w-3" />
          </span>
        )}
      </button>
      
      <button 
        className={`p-2 rounded-md flex items-center justify-center ${isMobile ? 'mx-1' : 'mb-2'} transition-colors text-muted-foreground hover:bg-muted hover:text-foreground`}
        onClick={handleExport}
        title="PDF"
      >
        <PrinterIcon className="w-5 h-5" />
      </button>

      <button 
        className={`p-2 rounded-md flex items-center justify-center ${isMobile ? 'mx-1' : 'mb-2'} transition-colors text-muted-foreground hover:bg-muted hover:text-foreground`}
        onClick={() => setImportModalOpen(true)}
        title="Import Sheets"
      >
        <ImportIcon className="w-5 h-5" />
      </button>
      
      <button 
        className={`p-2 rounded-md flex items-center justify-center ${isMobile ? 'mx-1' : 'mb-2'} transition-colors text-muted-foreground hover:bg-muted hover:text-foreground`}
        onClick={() => setExportModalOpen(true)}
        title="Export Sheets"
      >
        <UploadIcon className="w-5 h-5" />
      </button>
      
      {/* Spacer - only show on desktop */}
      {!isMobile && <div className="flex-grow"></div>}
      
      {/* Account Button/Dropdown */}
      <div className="relative" ref={accountMenuRef}>
        <button 
          className={`p-2 rounded-md flex items-center justify-center ${isMobile ? 'mx-1' : 'mb-2'} transition-colors ${isAuthenticated ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          onClick={toggleAccountMenu}
          title={isAuthenticated ? "Account" : "Login/Register"}
        >
          <UserIcon className="w-5 h-5" />
        </button>
        
        {/* Account Dropdown Menu */}
        {isAuthenticated && showAccountMenu && (
          <div className={`absolute ${isMobile ? 'bottom-full right-0 mb-2' : 'left-full top-0 ml-2'} w-40 bg-white shadow-lg rounded-md py-1 z-50`}>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={() => {
                setShowAccountMenu(false);
                console.log('Navigate to profile page');
              }}
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={() => {
                setShowAccountMenu(false);
                console.log('Navigate to settings page');
              }}
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
              onClick={() => {
                setShowAccountMenu(false);
                logout();
              }}
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              Logout ({currentUser?.username})
            </button>
          </div>
        )}
      </div>
      
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
        }}
      />
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={exportModalOpen} 
        onClose={() => setExportModalOpen(false)} 
        onSuccess={(result) => {
          // Don't automatically close the modal
        }}
      />
    </div>
  );
};

export default Toolbar;
