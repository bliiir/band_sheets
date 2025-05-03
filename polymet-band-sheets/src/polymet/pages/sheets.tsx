import { useState } from "react";
import { Link } from "react-router-dom";
import { FileTextIcon, PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOCK_BAND_SHEETS } from "@/polymet/data/band-sheet-data";

export default function SheetsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSheets = MOCK_BAND_SHEETS.filter(
    (sheet) =>
      sheet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sheet.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sheets</h1>

        <Link to="/sheet/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-1" />
            Create New Sheet
          </Button>
        </Link>
      </div>

      <div className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search sheets by title or artist..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredSheets.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-md">
          {searchQuery ? (
            <p className="text-muted-foreground">
              No sheets found matching "{searchQuery}"
            </p>
          ) : (
            <>
              <p className="text-muted-foreground mb-4">
                You don't have any sheets yet
              </p>
              <Link to="/sheet/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Create Your First Sheet
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSheets.map((sheet, index) => (
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
}
