import { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_SETLISTS } from "@/polymet/data/band-sheet-data";
import SetlistCard from "@/polymet/components/setlist-card";

export default function SetlistsPage() {
  const [expandedSetlists, setExpandedSetlists] = useState<
    Record<string, boolean>
  >({});

  const toggleExpand = (id: string) => {
    setExpandedSetlists((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Setlists</h1>

        <Link to="/setlist/new">
          <Button>
            <PlusIcon className="h-4 w-4 mr-1" />
            Create New Setlist
          </Button>
        </Link>
      </div>

      {MOCK_SETLISTS.length === 0 ? (
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
        <div className="space-y-4">
          {MOCK_SETLISTS.map((setlist) => (
            <SetlistCard
              key={setlist.id}
              setlist={setlist}
              isExpanded={!!expandedSetlists[setlist.id]}
              onToggleExpand={() => toggleExpand(setlist.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
