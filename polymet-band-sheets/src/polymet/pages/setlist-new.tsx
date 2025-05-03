import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon, PlusIcon, SaveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_BAND_SHEETS } from "@/polymet/data/band-sheet-data";
import { FileTextIcon } from "lucide-react";

export default function NewSetlistPage() {
  const [name, setName] = useState("New Setlist");
  const [description, setDescription] = useState("");
  const [selectedSheets, setSelectedSheets] = useState<string[]>([]);

  const toggleSheetSelection = (sheetId: string) => {
    setSelectedSheets((prev) =>
      prev.includes(sheetId)
        ? prev.filter((id) => id !== sheetId)
        : [...prev, sheetId]
    );
  };

  const handleSave = () => {
    // Here you would save the setlist to your backend
    const newSetlist = {
      id: `setlist-${Date.now()}`,
      name,
      description,
      sheets: MOCK_BAND_SHEETS.filter((sheet) =>
        selectedSheets.includes(sheet.id)
      ),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
    };

    console.log("Saving setlist:", newSetlist);
    // After saving, you could redirect to the setlist view page
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to="/setlists"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Setlists
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Setlist</h1>

        <div className="flex items-center gap-2">
          <Link to="/setlists">
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

      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Setlist Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter setlist name"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-1"
            >
              Description (optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this setlist"
              rows={3}
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-medium mb-4">Add Sheets to Setlist</h2>

          <div className="space-y-2">
            {MOCK_BAND_SHEETS.map((sheet) => (
              <div
                key={sheet.id}
                className={`flex items-center p-4 border rounded-md cursor-pointer ${
                  selectedSheets.includes(sheet.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => toggleSheetSelection(sheet.id)}
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
              </div>
            ))}
          </div>

          <Link to="/sheet/new" className="block mt-4">
            <Button variant="outline" className="w-full">
              <PlusIcon className="h-4 w-4 mr-1" />
              Create New Sheet
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
