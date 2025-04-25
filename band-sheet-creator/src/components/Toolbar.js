import React, { useState } from "react";
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
import ImportModal from "./ImportModal";
import ExportModal from "./ExportModal";

const Toolbar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  handleNewSheet, 
  handleSave, 
  handleSaveAs, 
  handleExport 
}) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const { currentUser, logout, isAuthenticated } = useAuth();
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
        className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
        onClick={handleSave}
        title="Save"
      >
        <SaveIcon className="w-6 h-6" />
      </button>
      <button 
        className="p-2 rounded-md mb-2 transition-colors text-white hover:bg-gray-600"
        onClick={handleSaveAs}
        title="Save As"
      >
        <SaveAllIcon className="w-6 h-6" />
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
