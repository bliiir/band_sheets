import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeftIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_SETLISTS } from "@/polymet/data/band-sheet-data";

export default function SetlistViewPage() {
  const { setlistId = "" } = useParams();
  const [setlist, setSetlist] = useState(MOCK_SETLISTS[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading the setlist data
    setIsLoading(true);

    setTimeout(() => {
      const foundSetlist = MOCK_SETLISTS.find((s) => s.id === setlistId);
      if (foundSetlist) {
        setSetlist(foundSetlist);
      }
      setIsLoading(false);
    }, 500);
  }, [setlistId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading setlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="bg-primary/10 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{setlist.name}</h1>

          <Button variant="ghost" size="icon">
            <MoreHorizontalIcon className="h-5 w-5" />
          </Button>
        </div>

        <p className="text-muted-foreground">
          {setlist.description || "No description"}
        </p>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">Sheets in this setlist</h2>

        <div className="space-y-2">
          {setlist.sheets.map((sheet, index) => (
            <Link
              key={sheet.id}
              to={`/sheet/${sheet.id}`}
              className="flex items-center justify-between p-4 border border-border rounded-md hover:bg-muted/50"
            >
              <div>
                <h3 className="font-medium">{sheet.title}</h3>
                <p className="text-sm text-muted-foreground">{sheet.artist}</p>
              </div>
              <div className="text-sm font-medium">{sheet.bpm} BPM</div>
            </Link>
          ))}
        </div>

        <Button variant="outline" className="mt-4">
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Sheet
        </Button>
      </div>
    </div>
  );
}
