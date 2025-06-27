import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import eventBus from "../utils/EventBus";
import { 
  FileText as FileTextIcon, 
  Folder as FolderIcon, 
  List as ListIcon, 
  Printer as PrinterIcon, 
  Settings as SettingsIcon, 
  User as UserIcon,
  FilePlus as FilePlusIcon,
  Save as SaveIcon,
  Import as ImportIcon,
  Upload as UploadIcon,
  FolderPlus as FolderPlusIcon,
  ListPlus,
  Edit,
  ExternalLink
} from "lucide-react";
import SidebarButton from "../components/SidebarButton";
import AuthModal from "../components/Auth/AuthModal";
import ImportModal from "../components/ImportModal";
import ExportModal from "../components/ExportModal";
import { useAuth } from "../contexts/AuthContext";
import { useSetlistActions, useSheetActions } from "../contexts/ActionsContext";
import logo from "../assets/logo.png";

/**
 * Main application layout with header and sidebar
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 * @param {Function} [props.handleNewSheet] Function to create a new sheet
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
  
  // Set up event listeners for import/export functionality
  useEffect(() => {
    console.log('Setting up event listeners in AppLayout');
    
    // Add event listeners with explicit debug logging
    const importListener = eventBus.on('app:import', () => {
      console.log('*** Import event received in AppLayout ***');
      setImportModalOpen(true);
    });

    const exportListener = eventBus.on('app:export', () => {
      console.log('*** Export event received in AppLayout ***');
      setExportModalOpen(true);
    });
    
    // Log all registered event listeners for debugging
    console.log('Current event listeners:', eventBus.listeners);

    // Clean up
    return () => {
      console.log('Cleaning up event listeners in AppLayout');
      importListener();
      exportListener();
    };
  }, []);

  // Set active tab based on current route and check if we're in the editor
  useEffect(() => {
    // Check if we're in the editor view (single sheet editor)
    const inEditor = location.pathname.match(/\/sheet\/[a-zA-Z0-9_-]+/);
    const isInEditor = !!inEditor;
    console.log('Current path:', location.pathname, 'isEditor:', isInEditor);
    setIsEditor(isInEditor);
    
    // Check if we're in the setlists view or viewing a specific setlist
    const inSetlists = location.pathname === "/setlists" || (location.pathname.includes('/setlist/') && !location.pathname.includes('/setlists'));
    console.log('Current path:', location.pathname, 'isSetlists:', inSetlists);
    setIsSetlists(inSetlists);
    
    // Check if we're in the sheets view
    const inSheets = location.pathname === "/sheets";
    console.log('Current path:', location.pathname, 'isSheets:', inSheets);
    setIsSheets(inSheets);
    
    // Set active tab - but more specific now to differentiate sheet editor from sheets list
    if (location.pathname === "/sheets") {
      // Only the sheets listing page, not the editor
      setActiveTab("sheets");
    } else if (location.pathname.includes("/setlists") || location.pathname.includes("/setlist/")) {
      setActiveTab("setlists");
    } else if (location.pathname.includes("/sheet/")) {
      // In editor - don't highlight any main tab
      setActiveTab("none");
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
      <div className="sticky top-0 z-50 flex flex-col border-b border-border bg-card w-full bg-background">
        {/* Main header row */}
        <header className="h-14 flex items-center justify-between px-4 w-full">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img src={logo} alt="Band Sheets" className="h-8 w-auto" />
              <span className="text-primary text-xl font-bold">Band Sheets</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {/* Page-specific actions for desktop - hidden on mobile */}
            {isEditor && (
              <div className="hidden md:flex items-center space-x-1 mr-3 border-r border-gray-300 pr-3">
                <button
                  onClick={() => eventBus.emit('editor:new')}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="New Sheet"
                >
                  <FilePlusIcon className="w-5 h-5" />
                  <span className="ml-1 text-sm hidden sm:inline">New</span>
                </button>
                
                <button
                  onClick={() => eventBus.emit('editor:save')}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Save Sheet"
                >
                  <SaveIcon className="w-5 h-5" />
                  <span className="ml-1 text-sm hidden sm:inline">Save</span>
                </button>
                
                <button
                  onClick={() => {
                    console.log('PDF button clicked');
                    const match = location.pathname.match(/\/sheet\/([a-zA-Z0-9_-]+)/);
                    if (match && match[1]) {
                      const sheetId = match[1];
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
                  <span className="ml-1 text-sm hidden sm:inline">PDF</span>
                </button>
              </div>
            )}
            
            {/* Sheets-specific actions for desktop */}
            {isSheets && (
              <div className="hidden md:flex items-center space-x-1 mr-3 border-r border-gray-300 pr-3">
                <button
                  onClick={() => {
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
                  <span className="ml-1 text-sm hidden sm:inline">New Sheet</span>
                </button>
                
                <button
                  onClick={() => {
                    console.log('Import button clicked - emitting app:import event');
                    // Emit event and log the result
                    eventBus.emit('app:import');
                    console.log('Event bus after import emit:', eventBus.listeners);
                  }}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Import Sheets"
                >
                  <ImportIcon className="w-5 h-5" />
                  <span className="ml-1 text-sm hidden sm:inline">Import</span>
                </button>
                
                <button
                  onClick={() => {
                    console.log('Export button clicked - emitting app:export event');
                    // Emit event and log the result
                    eventBus.emit('app:export');
                    console.log('Event bus after export emit:', eventBus.listeners);
                  }}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Export Sheets"
                >
                  <UploadIcon className="w-5 h-5" />
                  <span className="ml-1 text-sm hidden sm:inline">Export</span>
                </button>
              </div>
            )}
            
            {/* Setlist-specific actions for desktop */}
            {isSetlists && (
              <div className="hidden md:flex items-center space-x-1 mr-3 border-r border-gray-300 pr-3">
                <button
                  onClick={() => {
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
                  <span className="ml-1 text-sm hidden sm:inline">New Setlist</span>
                </button>
                
                {/* Create Setlist button is always visible */}
                
                {/* The following buttons are only shown when viewing a specific setlist */}
                {location.pathname.match(/\/setlist\/[a-zA-Z0-9_-]+/) && (
                  <>
                    <button
                      onClick={() => eventBus.emit('setlist:addSheet')}
                      className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                      title="Add Sheet to Setlist"
                    >
                      <ListPlus className="w-5 h-5" />
                      <span className="ml-1 text-sm hidden sm:inline">Add Sheet</span>
                    </button>
                    
                    <button
                      onClick={() => eventBus.emit('setlist:toggleReorder')}
                      className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                      title="Reorder Sheets"
                    >
                      <Edit className="w-5 h-5" />
                      <span className="ml-1 text-sm hidden sm:inline">Reorder</span>
                    </button>
                    
                    <button
                      onClick={() => eventBus.emit('setlist:openAll')}
                      className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                      title="Open All Sheets"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span className="ml-1 text-sm hidden sm:inline">Open All</span>
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Main Navigation - visible on both mobile and desktop */}
            <nav className="flex space-x-1 mr-2">
              {/* Navigation tabs - always visible */}
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
                    <span className="hidden sm:inline">Account</span>
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
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Login</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Second row for page-specific actions - only shown on mobile */}
        {(isEditor || isSheets || isSetlists) && (
          <div className="md:hidden flex items-center justify-start px-4 py-2 border-t border-border bg-background/50 overflow-x-auto">
            {/* Editor-specific actions - mobile only */}
            {isEditor && (
              <div className="flex items-center space-x-1">
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
            
            {/* Sheets-specific actions - mobile only */}
            {isSheets && (
              <div className="flex items-center space-x-1">
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
                
                <button
                  onClick={() => {
                    console.log('Mobile import button clicked - emitting app:import event');
                    eventBus.emit('app:import');
                    console.log('Event bus after mobile import emit:', eventBus.listeners);
                  }}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Import Sheets"
                >
                  <ImportIcon className="w-5 h-5" />
                </button>
                
                <button
                  onClick={() => {
                    console.log('Mobile export button clicked - emitting app:export event');
                    eventBus.emit('app:export');
                    console.log('Event bus after mobile export emit:', eventBus.listeners);
                  }}
                  className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                  title="Export Sheets"
                >
                  <UploadIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Setlist-specific actions - mobile only */}
            {isSetlists && (
              <div className="flex items-center space-x-1">
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
                
                {/* Only show these buttons when viewing a specific setlist - mobile */}
                {location.pathname.match(/\/setlist\/[a-zA-Z0-9_-]+/) && (
                  <>
                    <button
                      onClick={() => eventBus.emit('setlist:addSheet')}
                      className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                      title="Add Sheet to Setlist"
                    >
                      <ListPlus className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => eventBus.emit('setlist:toggleReorder')}
                      className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                      title="Reorder Sheets"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => eventBus.emit('setlist:openAll')}
                      className="p-2 rounded-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition duration-150 ease-in-out"
                      title="Open All Sheets"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main content area with content */}
      <div className="flex flex-1 overflow-hidden">

        {/* Content area - this is where scrolling should happen */}
        <main className="flex-1 w-full h-full overflow-auto">{children}</main>
        
        {/* Auth Modal */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        
        {/* Import/Export Modals */}
        <ImportModal 
          isOpen={importModalOpen} 
          onClose={() => setImportModalOpen(false)}
          onSuccess={() => {
            setImportModalOpen(false);
            // Refresh sheet list after successful import
            if (location.pathname === '/sheets') {
              window.location.reload();
            }
          }}
        />
        <ExportModal 
          isOpen={exportModalOpen} 
          onClose={() => setExportModalOpen(false)} 
        />
      </div>
    </div>
  );
};

export default AppLayout;
