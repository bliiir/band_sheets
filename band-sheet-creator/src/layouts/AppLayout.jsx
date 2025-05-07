import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import eventBus from "../utils/EventBus";
import { 
  FileTextIcon, 
  FolderIcon, 
  ListIcon, 
  PrinterIcon, 
  SettingsIcon, 
  UserIcon,
  FilePlusIcon,
  SaveIcon,
  ImportIcon,
  UploadIcon,
  FolderPlusIcon
} from "lucide-react";
import SidebarButton from "../components/SidebarButton";
import AuthModal from "../components/Auth/AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { useSetlistActions } from "../contexts/SetlistActionsContext";
import { useSheetActions } from "../contexts/SheetActionsContext";

/**
 * Main application layout with header and sidebar
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 * @param {Function} [props.handleNewSheet] Function to create a new sheet
 * @param {Function} [props.handleSave] Function to save the current sheet
 * @param {Function} [props.handleImport] Function to import sheets
 * @param {Function} [props.handleExport] Function to export sheets
 */
const AppLayout = ({ children }) => {
  // State for modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const location = useLocation();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("sheets");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isSetlists, setIsSetlists] = useState(false);
  const [isSheets, setIsSheets] = useState(false);
  const navigate = useNavigate();
  const { setlistActions } = useSetlistActions();
  const { handleCreateSheet } = useSheetActions();
  
  // Set active tab based on current route and check if we're in the editor
  useEffect(() => {
    // Check if we're in the editor view (single sheet editor)
    const inEditor = location.pathname.match(/\/sheet\/[a-zA-Z0-9_-]+/);
    const isInEditor = !!inEditor;
    console.log('Current path:', location.pathname, 'isEditor:', isInEditor);
    setIsEditor(isInEditor);
    
    // Check if we're in the setlists view
    const inSetlists = location.pathname === "/setlists";
    console.log('Current path:', location.pathname, 'isSetlists:', inSetlists);
    setIsSetlists(inSetlists);
    
    // Check if we're in the sheets view
    const inSheets = location.pathname === "/sheets";
    console.log('Current path:', location.pathname, 'isSheets:', inSheets);
    setIsSheets(inSheets);
    
    // Set active tab
    if (location.pathname.includes("/sheets") || location.pathname.includes("/sheet/")) {
      setActiveTab("sheets");
    } else if (location.pathname.includes("/setlists") || location.pathname.includes("/setlist/")) {
      setActiveTab("setlists");
    }
  }, [location.pathname]);

  const handleLoginClick = () => {
    setAuthModalOpen(true);
  };

  const handleLogoutClick = () => {
    logout();
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Header - fixed at the top */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-card flex items-center justify-between px-4 w-full bg-background">
        <div className="flex items-center">
          <Link to="/" className="text-primary text-xl font-bold">Band Sheets</Link>
        </div>

        <div className="flex items-center space-x-2">
          {/* Main Navigation - moved to right side */}
          <nav className="hidden md:flex space-x-1 mr-2">
            {/* Page-specific actions */}
            {/* Editor-specific actions */}
            {isEditor && (
              <div className="flex items-center space-x-1 mr-3 border-r border-gray-300 pr-3">
                <button
                  onClick={() => eventBus.emit('editor:new')}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="New Sheet"
                >
                  <FilePlusIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => eventBus.emit('editor:save')}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Save Sheet"
                >
                  <SaveIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => eventBus.emit('editor:import')}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Import Sheet"
                >
                  <ImportIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => eventBus.emit('editor:export')}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Export Sheet"
                >
                  <UploadIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => {
                    console.log('PDF button clicked');
                    // Get the sheet ID from the current URL
                    const match = location.pathname.match(/\/sheet\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      const sheetId = match[1];
                      // Open the print view directly in a new tab
                      const printUrl = `/sheet/${sheetId}?print=true&color=true&chords=true`;
                      window.open(printUrl, '_blank');
                    } else {
                      console.error('Could not determine sheet ID from URL');
                    }
                  }}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="PDF"
                >
                  <PrinterIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Sheets-specific actions */}
            {isSheets && (
              <div className="flex items-center space-x-1 mr-3 border-r border-gray-300 pr-3">
                <button
                  onClick={() => {
                    console.log('Create sheet button clicked');
                    if (handleCreateSheet) {
                      handleCreateSheet();
                    } else {
                      console.error('handleCreateSheet not available');
                    }
                  }}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Create Sheet"
                >
                  <FilePlusIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Setlist-specific actions */}
            {isSetlists && (
              <div className="flex items-center space-x-1 mr-3 border-r border-gray-300 pr-3">
                <button
                  onClick={() => {
                    console.log('Create setlist button clicked');
                    if (setlistActions && setlistActions.handleCreateSetlist) {
                      setlistActions.handleCreateSetlist();
                    } else {
                      console.error('handleCreateSetlist not available');
                    }
                  }}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Create Setlist"
                >
                  <FolderPlusIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Main navigation tabs */}
            <SidebarButton
              icon={FileTextIcon}
              active={activeTab === "sheets"}
              label="Sheets"
              to="/sheets"
              onClick={() => setActiveTab("sheets")}
              variant="horizontal"
            />

            <SidebarButton
              icon={FolderIcon}
              active={activeTab === "setlists"}
              label="Setlists"
              to="/setlists"
              onClick={() => setActiveTab("setlists")}
              variant="horizontal"
            />
          </nav>
          
          {/* Account Menu */}
          <div className="relative">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  Account
                </button>
                
                {/* Account Dropdown Menu */}
                {accountMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white shadow-lg rounded-md py-1 z-50">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setActiveTab("profile");
                        console.log('Navigate to profile page');
                      }}
                    >
                      <UserIcon className="w-4 h-4 mr-2" />
                      Profile
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        setActiveTab("settings");
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
                        setAccountMenuOpen(false);
                        handleLogoutClick();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Logout ({currentUser?.username})
                    </button>
                  </div>
                )}
                
                {/* Click outside to close menu */}
                {accountMenuOpen && (
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setAccountMenuOpen(false)}
                  ></div>
                )}
              </>
            ) : (
              <button
                onClick={handleLoginClick}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content area with content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Content area - this is where scrolling should happen */}
        <main className="flex-1 w-full h-full overflow-auto">{children}</main>
        
        {/* Auth Modal */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    </div>
  );
};

export default AppLayout;
