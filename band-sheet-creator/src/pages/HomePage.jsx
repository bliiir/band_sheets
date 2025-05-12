import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileTextIcon, FolderIcon, PlusIcon, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { getAllSheets } from "../services/SheetStorageService";
import { getAllSetlists } from "../services/SetlistStorageService";
import eventBus from "../utils/EventBus";
import logger from "../services/LoggingService";

/**
 * Home page component displaying recent sheets and setlists
 */
const HomePage = () => {
  // State to hold actual user data
  const [recentSheets, setRecentSheets] = useState([]);
  const [recentSetlists, setRecentSetlists] = useState([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(true);
  const [isLoadingSetlists, setIsLoadingSetlists] = useState(true);
  
  // Fetch sheets from the API
  useEffect(() => {
    const fetchSheets = async () => {
      setIsLoadingSheets(true);
      try {
        // Get all sheets from the API
        const sheets = await getAllSheets();
        logger.debug('HomePage', 'Fetched sheets from API:', sheets);
        
        // Process sheets to ensure they have the necessary properties
        const processedSheets = sheets.map(sheet => {
          // Extract song information from the sheet data
          if (Array.isArray(sheet.sections) && sheet.sections.length > 0) {
            // Get BPM from various possible locations
            const songBpm = sheet.bpm || 
                          (sheet.song?.bpm) || 
                          (sheet.songInfo?.bpm) || 
                          (sheet.sections[0]?.bpm) || 
                          null;
            
            return {
              ...sheet,
              // Ensure these properties are accessible for display
              bpm: songBpm,
              title: sheet.title || (sheet.song?.title) || 'Untitled',
              artist: sheet.artist || (sheet.song?.artist) || 'Unknown Artist'
            };
          }
          return sheet;
        });
        
        // Just display the most recent 3 sheets
        setRecentSheets(processedSheets.slice(0, 3));
      } catch (error) {
        logger.error('HomePage', 'Error fetching sheets:', error);
        setRecentSheets([]);
      } finally {
        setIsLoadingSheets(false);
      }
    };
    
    fetchSheets();
  }, []);
  
  // Fetch setlists from the API
  useEffect(() => {
    const fetchSetlists = async () => {
      setIsLoadingSetlists(true);
      try {
        // Get all setlists from the API
        const setlists = await getAllSetlists();
        logger.debug('HomePage', 'Fetched setlists from API:', setlists);
        
        // Normalize the setlists to ensure they have a consistent id property
        const normalizedSetlists = setlists.map(setlist => {
          // If there's only _id but no id, use _id as id
          if (setlist._id && !setlist.id) {
            return { ...setlist, id: setlist._id };
          }
          return setlist;
        });
        
        logger.debug('HomePage', 'Normalized setlists:', normalizedSetlists);
        
        // Just display the most recent 3 setlists
        setRecentSetlists(normalizedSetlists.slice(0, 3));
      } catch (error) {
        logger.error('HomePage', 'Error fetching setlists:', error);
        setRecentSetlists([]);
      } finally {
        setIsLoadingSetlists(false);
      }
    };
    
    fetchSetlists();
  }, []);

  const { isAuthenticated, showAuthModal } = useAuth();

  const handleCreateSheet = () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    // Navigation will be handled by the Link component
  };

  const handleCreateSetlist = () => {
    if (!isAuthenticated) {
      showAuthModal();
      return;
    }
    // Navigation will be handled by the Link component
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left column */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Sheets</h2>
            <Link to="/sheets">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {isLoadingSheets ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentSheets.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <p className="text-muted-foreground mb-4">
                  You don't have any sheets yet
                </p>
                <Link to="/sheet/new">
                  <Button onClick={handleCreateSheet}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Your First Sheet
                  </Button>
                </Link>
              </div>
            ) : (
              recentSheets.map((sheet) => (
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
                    <p className="text-sm text-muted-foreground">
                      {sheet.artist}
                    </p>
                  </div>
                  <div className="text-sm font-medium">{sheet.bpm} BPM</div>
                </Link>
              ))
            )}

            <Link to="/sheet/new">
              <Button className="w-full" onClick={handleCreateSheet}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Create New Sheet
              </Button>
            </Link>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col items-center justify-center"
                onClick={() => {
                  console.log('HomePage: Import Sheet quick action clicked');
                  eventBus.emit('app:import');
                }}
              >
                <FileTextIcon className="h-6 w-6 mb-2" />
                <span>Import Sheet</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col items-center justify-center"
                onClick={() => {
                  console.log('HomePage: Export All quick action clicked');
                  eventBus.emit('app:export');
                }}
              >
                <FolderIcon className="h-6 w-6 mb-2" />
                <span>Export All</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Setlists</h2>
            <Link to="/setlists">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {isLoadingSetlists ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentSetlists.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <p className="text-muted-foreground mb-4">
                  You don't have any setlists yet
                </p>
                <Link to="/setlist/new">
                  <Button onClick={handleCreateSetlist}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Your First Setlist
                  </Button>
                </Link>
              </div>
            ) : (
              recentSetlists.map((setlist) => {
                // Debug log the setlist data in more detail
                console.log('HomePage - Full setlist object:', setlist);
                console.log('HomePage - Setlist metadata:', {
                  id: setlist.id,
                  _id: setlist._id,
                  owner: setlist.owner,
                  name: setlist.name,
                  sheetsCount: setlist.sheets ? setlist.sheets.length : 0
                });
                logger.debug('HomePage', 'Setlist data:', setlist);
                
                // Get a simple representation of the setlist for debugging
                console.log('HomePage - Setlist being rendered:', {
                  id: setlist.id || 'none',
                  _id: setlist._id || 'none',
                  name: setlist.name,
                  sheets: setlist.sheets ? setlist.sheets.length : 0
                });
                
                // IMPORTANT: For MongoDB, we need to use a very specific approach
                let idToUse = '';
                
                // Use a simple approach - prefer id over _id, and stringify it
                if (setlist.id) {
                  idToUse = setlist.id.toString();
                } else if (setlist._id) {
                  idToUse = setlist._id.toString();
                }
                
                console.log('HomePage - Using this ID for link:', idToUse);
                
                return (
                <Link
                  key={idToUse}
                  to={`/setlist/${idToUse}`}
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
                      {setlist.sheets.length}{" "}
                      {setlist.sheets.length === 1 ? "sheet" : "sheets"}
                    </p>
                  </div>
                </Link>
              );
              })
            )}

            <Link to="/setlist/new">
              <Button className="w-full" onClick={handleCreateSetlist}>
                <PlusIcon className="h-4 w-4 mr-1" />
                Create New Setlist
              </Button>
            </Link>
          </div>

          <div className="mt-8 bg-muted/30 border border-border rounded-md p-6">
            <h2 className="text-lg font-semibold mb-2">
              Welcome to Sheet Creator
            </h2>
            <p className="text-muted-foreground mb-4">
              Create and edit song structure sheets for your band. Organize your
              sheets into setlists and share them with your bandmates.
            </p>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
