import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FolderIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

/**
 * Page displaying all available setlists
 */
const SetlistsPage = () => {
  const [setlists, setSetlists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated, showAuthModal } = useAuth();

  // Fetch setlists on component mount
  useEffect(() => {
    // In a real implementation, this would call a storage service
    // For now, we'll use placeholder data
    const mockSetlists = [
      { id: "setlist_1", name: "50th", sheets: [{ id: "sheet_1" }, { id: "sheet_2" }] },
      { id: "setlist_2", name: "Jazz Night", sheets: [{ id: "sheet_3" }] },
      { id: "setlist_3", name: "Rock Classics", sheets: [{ id: "sheet_4" }, { id: "sheet_5" }, { id: "sheet_6" }] },
      { id: "setlist_4", name: "Summer Festival", sheets: [{ id: "sheet_1" }, { id: "sheet_3" }, { id: "sheet_5" }] },
    ];
    
    setTimeout(() => {
      setSetlists(mockSetlists);
      setIsLoading(false);
    }, 500); // Simulate network delay
  }, []);

  // Filter setlists based on search term
  const filteredSetlists = setlists.filter(setlist => 
    setlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSetlist = () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    // Navigation will be handled by the Link component
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Setlists</h1>
        <Link to="/setlist/new">
          <Button onClick={handleCreateSetlist}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Create New Setlist
          </Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search setlists..."
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredSetlists.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-md">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No setlists found matching your search" : "You don't have any setlists yet"}
          </p>
          {!searchTerm && (
            <Link to="/setlist/new">
              <Button onClick={handleCreateSetlist}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Create Your First Setlist
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSetlists.map((setlist) => (
            <Link
              key={setlist.id}
              to={`/setlist/${setlist.id}`}
              className="flex items-center p-4 border border-border rounded-md hover:bg-muted/50"
            >
              <div className="mr-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <FolderIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{setlist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {setlist.sheets.length} {setlist.sheets.length === 1 ? "sheet" : "sheets"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SetlistsPage;
