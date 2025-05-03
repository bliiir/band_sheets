import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { PlusIcon, SaveIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_BAND_SHEETS } from "@/polymet/data/band-sheet-data";
import BandSheet from "@/polymet/components/band-sheet";

export default function SheetEditorPage() {
  const { sheetId = "" } = useParams();
  const [sheet, setSheet] = useState(MOCK_BAND_SHEETS[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading the sheet data
    setIsLoading(true);

    setTimeout(() => {
      const foundSheet = MOCK_BAND_SHEETS.find((s) => s.id === sheetId);
      if (foundSheet) {
        setSheet(foundSheet);
      }
      setIsLoading(false);
    }, 500);
  }, [sheetId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading sheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Sheet Editor</h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Section
          </Button>

          <Link to="/sheets">
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </Link>

          <Button size="sm">
            <SaveIcon className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <BandSheet sheet={sheet} isEditable={true} />
    </div>
  );
}
