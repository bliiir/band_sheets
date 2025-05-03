import { Link } from "react-router-dom";
import { useState } from "react";
import {
  FileTextIcon,
  FolderIcon,
  ListIcon,
  PrinterIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import Logo from "@/polymet/components/logo";
import SidebarButton from "@/polymet/components/sidebar-button";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState("sheets");

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header - now extends full width across the top */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 w-full">
        <div className="flex items-center">
          <Logo size="sm" className="text-primary" />

          <p className="text-sm text-muted-foreground ml-4">
            Create and edit song structure sheets for your band
          </p>
        </div>

        <div>
          {isLoggedIn ? (
            <button
              onClick={() => setIsLoggedIn(false)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              Logout (billir)
            </button>
          ) : (
            <button
              onClick={() => setIsLoggedIn(true)}
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
      </div>
    </div>
  );
}
