import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import BandSheet from "@/polymet/components/band-sheet";
import {
  BandSheet as BandSheetType,
  Section,
} from "@/polymet/data/band-sheet-data";

export default function NewSheetPage() {
  const [sheet, setSheet] = useState<BandSheetType>({
    id: `sheet-${Date.now()}`,
    title: "New Sheet",
    artist: "",
    bpm: 120,
    sections: [
      {
        id: `section-${Date.now()}`,
        type: "Verse",
        color: "#e5e7eb",
        energyLevel: 3,
        parts: [
          {
            name: "A",
            bars: 4,
            lyrics: "",
            notes: "",
          },
        ],
      },
    ],

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSave = () => {
    // Here you would save the sheet to your backend
    console.log("Saving sheet:", sheet);
    // After saving, you could redirect to the sheet editor page
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          to="/sheets"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Sheets
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Sheet</h1>

        <div className="flex items-center gap-2">
          <Link to="/sheets">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>

          <Button size="sm" onClick={handleSave}>
            <SaveIcon className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <BandSheet sheet={sheet} isEditable={true} />
    </div>
  );
}
