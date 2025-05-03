import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileTextIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";

/**
 * Page displaying all available sheets
 */
const SheetsPage = () => {
  const [sheets, setSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { isAuthenticated, showAuthModal } = useAuth();

  // Fetch sheets on component mount
  useEffect(() => {
    // In a real implementation, this would call the SheetStorageService
    // For now, we'll use placeholder data
    const mockSheets = [
      { id: "sheet_1", title: "Come Together", artist: "The Beatles", bpm: 80 },
      { id: "sheet_2", title: "Stuck in the Middle With You", artist: "Stealers Wheel", bpm: 125 },
      { id: "sheet_3", title: "Georgy Porgy", artist: "Toto", bpm: 98 },
      { id: "sheet_4", title: "Purple Rain", artist: "Prince", bpm: 110 },
      { id: "sheet_5", title: "Hotel California", artist: "Eagles", bpm: 75 },
      { id: "sheet_6", title: "Sweet Child O' Mine", artist: "Guns N' Roses", bpm: 120 },
    ];
    
    setTimeout(() => {
      setSheets(mockSheets);
      setIsLoading(false);
    }, 500); // Simulate network delay
  }, []);

  // Filter sheets based on search term
  const filteredSheets = sheets.filter(sheet => 
    sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sheet.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSheet = () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    // Navigation will be handled by the Link component
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sheets</h1>
        <Link to="/sheet/new">
          <Button onClick={handleCreateSheet}>
            <PlusIcon className="h-4 w-4 mr-1" />
            Create New Sheet
          </Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search sheets..."
          className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : filteredSheets.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-md">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No sheets found matching your search" : "You don't have any sheets yet"}
          </p>
          {!searchTerm && (
            <Link to="/sheet/new">
              <Button onClick={handleCreateSheet}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Create Your First Sheet
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSheets.map((sheet) => (
            <Link
              key={sheet.id}
              to={`/sheet/${sheet.id}`}
              className="flex items-center p-4 border border-border rounded-md hover:bg-muted/50"
            >
              <div className="mr-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileTextIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{sheet.title}</h3>
                <p className="text-sm text-muted-foreground">{sheet.artist}</p>
              </div>
              <div className="text-sm font-medium">{sheet.bpm} BPM</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SheetsPage;
