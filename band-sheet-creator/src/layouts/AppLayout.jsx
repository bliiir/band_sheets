import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  FileTextIcon, 
  FolderIcon, 
  ListIcon, 
  PrinterIcon, 
  SettingsIcon, 
  UserIcon 
} from "lucide-react";
import SidebarButton from "../components/SidebarButton";
import AuthModal from "../components/Auth/AuthModal";
import { useAuth } from "../contexts/AuthContext";

/**
 * Main application layout with header and sidebar
 */
const AppLayout = ({ children }) => {
  const location = useLocation();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("sheets");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  // Set active tab based on current route
  useEffect(() => {
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header - extends full width across the top */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 w-full">
        <div className="flex items-center">
          <Link to="/" className="text-primary text-xl font-bold">Band Sheets</Link>
          <p className="text-sm text-muted-foreground ml-4">
            Create and edit song structure sheets for your band
          </p>
        </div>

        <div>
          {isAuthenticated ? (
            <button
              onClick={handleLogoutClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout {currentUser?.username ? `(${currentUser.username})` : ""}
            </button>
          ) : (
            <button
              onClick={handleLoginClick}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* Main content area with sidebar and content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-16 h-full bg-card border-r border-border flex flex-col items-center py-4">
          <div className="flex flex-col items-center gap-2">
            <SidebarButton
              icon={FileTextIcon}
              active={activeTab === "sheets"}
              label="Sheets"
              to="/sheets"
              onClick={() => setActiveTab("sheets")}
            />

            <SidebarButton
              icon={FolderIcon}
              active={activeTab === "setlists"}
              label="Setlists"
              to="/setlists"
              onClick={() => setActiveTab("setlists")}
            />

            <SidebarButton
              icon={ListIcon}
              active={activeTab === "shared"}
              label="Shared"
              onClick={() => setActiveTab("shared")}
            />

            <SidebarButton
              icon={PrinterIcon}
              active={activeTab === "export"}
              label="Export"
              onClick={() => setActiveTab("export")}
            />
          </div>

          <div className="mt-auto flex flex-col items-center gap-2">
            <SidebarButton
              icon={SettingsIcon}
              active={activeTab === "settings"}
              label="Settings"
              onClick={() => setActiveTab("settings")}
            />

            <SidebarButton
              icon={UserIcon}
              active={activeTab === "profile"}
              label="Profile"
              onClick={() => setActiveTab("profile")}
            />
          </div>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-4">{children}</main>
        
        {/* Auth Modal */}
        <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    </div>
  );
};

export default AppLayout;
