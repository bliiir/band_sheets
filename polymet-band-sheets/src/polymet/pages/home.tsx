import { Link } from "react-router-dom";
import { FileTextIcon, FolderIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MOCK_BAND_SHEETS,
  MOCK_SETLISTS,
} from "@/polymet/data/band-sheet-data";

export default function HomePage() {
  const recentSheets = MOCK_BAND_SHEETS.slice(0, 3);
  const recentSetlists = MOCK_SETLISTS.slice(0, 2);

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
            {recentSheets.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <p className="text-muted-foreground mb-4">
                  You don't have any sheets yet
                </p>
                <Link to="/sheet/new">
                  <Button>
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
              <Button className="w-full">
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
              >
                <FileTextIcon className="h-6 w-6 mb-2" />

                <span>Import Sheet</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-6 flex flex-col items-center justify-center"
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
            {recentSetlists.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-border rounded-md">
                <p className="text-muted-foreground mb-4">
                  You don't have any setlists yet
                </p>
                <Link to="/setlist/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create Your First Setlist
                  </Button>
                </Link>
              </div>
            ) : (
              recentSetlists.map((setlist) => (
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
                      {setlist.sheets.length}{" "}
                      {setlist.sheets.length === 1 ? "sheet" : "sheets"}
                    </p>
                  </div>
                </Link>
              ))
            )}

            <Link to="/setlist/new">
              <Button className="w-full">
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
}
