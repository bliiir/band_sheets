import { Link } from "react-router-dom";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { useState } from "react";
import { Setlist } from "@/polymet/data/band-sheet-data";

interface SetlistCardProps {
  setlist: Setlist;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export default function SetlistCard({
  setlist,
  isExpanded = false,
  onToggleExpand,
}: SetlistCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      {/* Setlist header */}
      <div className="bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleExpand}
            className="p-1 hover:bg-muted rounded-md"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>

          <div>
            <h3 className="font-medium">{setlist.name}</h3>
            <p className="text-sm text-muted-foreground">
              {setlist.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {setlist.sheets.length}{" "}
            {setlist.sheets.length === 1 ? "sheet" : "sheets"}
          </span>

          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 hover:bg-muted rounded-md"
            >
              <MoreHorizontalIcon className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-md z-10">
                <div className="py-1">
                  <Link
                    to={`/setlist/${setlist.id}`}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    View setlist
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Handle edit action
                    }}
                  >
                    Edit setlist
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Handle share action
                    }}
                  >
                    Share setlist
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted text-red-500"
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Handle delete action
                    }}
                  >
                    Delete setlist
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          {setlist.sheets.map((sheet) => (
            <Link
              key={sheet.id}
              to={`/sheet/${sheet.id}`}
              className="flex items-center justify-between p-4 hover:bg-muted border-b border-border/50 last:border-b-0"
            >
              <div>
                <h4 className="font-medium">{sheet.title}</h4>
                <p className="text-sm text-muted-foreground">{sheet.artist}</p>
              </div>
              <div className="text-sm">{sheet.bpm} BPM</div>
            </Link>
          ))}

          <div className="p-4 border-t border-border bg-muted/30">
            <button className="text-sm text-primary hover:underline">
              + Add Current Sheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
