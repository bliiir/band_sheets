import React, { useState } from "react";
import { ReactComponent as FolderIcon } from "../assets/folder.svg";
import { ReactComponent as FilePlusIcon } from "../assets/file_plus.svg";
import { ReactComponent as SaveIcon } from "../assets/save.svg";
import { ReactComponent as SaveAllIcon } from "../assets/save_all.svg";
import { ReactComponent as DownloadIcon } from "../assets/download.svg";
import { ReactComponent as UserIcon } from "../assets/user.svg";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "./Auth/AuthModal";

const Toolbar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  handleNewSheet, 
  handleSave, 
  handleSaveAs, 
  handleExport 
}) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
        title="Download"
      >
        <DownloadIcon className="w-6 h-6" />
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
    </div>
  );
};

export default Toolbar;
