import React, { useState, useEffect, useRef } from "react";
import {
  FilePlusIcon, 
  SaveIcon, 
  PrinterIcon, 
  UserIcon, 
  ImportIcon, 
  UploadIcon,
  PlusCircleIcon,
  LockIcon,
  SettingsIcon,
  LogOutIcon
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSheetData } from "../contexts/SheetDataContext";
import AuthModal from "./Auth/AuthModal";
import AuthRequiredModal from "./AuthRequiredModal";
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";
import SettingsModal from "./SettingsModal";
import logger from '../services/LoggingService';
import { isAuthenticated as checkAuth } from '../utils/AuthUtils';
import eventBus from "../utils/EventBus";

/**
 * Toolbar component with authentication-aware save button
 */
const Toolbar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  handleNewSheet, 
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
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  
  // State for account dropdown
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  
  // Ref for detecting clicks outside of the account menu
  const accountMenuRef = useRef(null);
  
  // Get auth state and actions from context
  const { isAuthenticated, currentUser, logout } = useAuth();
  
  // Get sheet data context values for saving
  const { currentSheetId, saveCurrentSheet } = useSheetData();
  
  // Track if authentication is enabled
  const [isAuthEnabled, setIsAuthEnabled] = useState(false);
  
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
  
  // Log authentication status for debugging
  useEffect(() => {
    logger.debug('Toolbar', `Auth status changed: isAuthenticated=${isAuthenticated}, currentUser=${!!currentUser}`);
    logger.debug('Toolbar', 'Current authentication source is from useAuth() hook');
    
    // Log token state directly for comparison
    try {
      const token = localStorage.getItem('token');
      const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('clientToken='));
      logger.debug('Toolbar', `Direct token check: localStorage=${!!token}, cookie=${!!cookieToken}`);
      
      if (token) {
        logger.debug('Toolbar', `Token length: ${token.length}`);
      }
    } catch (err) {
      logger.debug('Toolbar', 'Error checking direct token:', err);
    }
    
    // Update the state to match current authentication
    setIsAuthEnabled(isAuthenticated);
  }, [isAuthenticated, currentUser]);

  // Toggle account menu
  const toggleAccountMenu = () => {
    if (isAuthenticated) {
      setShowAccountMenu(!showAccountMenu);
    } else {
      setAuthModalOpen(true);
    }
  };
  
  // Handle save button click using the same event as keyboard shortcut
  const handleSaveClick = () => {
    if (checkAuth()) {
      // Use the same event bus mechanism as the keyboard shortcut
      eventBus.emit('editor:save');
    } else {
      eventBus.emit('show-notification', {
        message: 'Please log in to save your sheet',
        type: 'error'
      });
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
      
      {/* Save As button has been removed */}
      
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
                setSettingsModalOpen(true);
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
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />
    </div>
  );
};

export default Toolbar;
