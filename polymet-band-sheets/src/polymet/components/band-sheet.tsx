import { useState } from "react";
import { BandSheet, Section } from "@/polymet/data/band-sheet-data";
import SectionCard from "@/polymet/components/section-card";
import PartRow from "@/polymet/components/part-row";

interface BandSheetProps {
  sheet: BandSheet;
  isEditable?: boolean;
}

export default function BandSheet({
  sheet,
  isEditable = true,
}: BandSheetProps) {
  const [title, setTitle] = useState(sheet.title);
  const [artist, setArtist] = useState(sheet.artist);
  const [bpm, setBpm] = useState(sheet.bpm);
  const [sections, setSections] = useState<Section[]>(sheet.sections);

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    if (!isEditable) return;

    const newSections = [...sections];
    if (direction === "up" && index > 0) {
      [newSections[index], newSections[index - 1]] = [
        newSections[index - 1],
        newSections[index],
      ];
    } else if (direction === "down" && index < sections.length - 1) {
      [newSections[index], newSections[index + 1]] = [
        newSections[index + 1],
        newSections[index],
      ];
    }
    setSections(newSections);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Song info bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => isEditable && setTitle(e.target.value)}
            className="w-full p-2 text-xl font-bold bg-transparent border border-border rounded-md"
            disabled={!isEditable}
            placeholder="Song Title"
          />
        </div>

        <div className="flex-1">
          <input
            type="text"
            value={artist}
            onChange={(e) => isEditable && setArtist(e.target.value)}
            className="w-full p-2 bg-transparent border border-border rounded-md"
            disabled={!isEditable}
            placeholder="Artist"
          />
        </div>

        <div className="w-24 flex items-center">
          <input
            type="number"
            value={bpm}
            onChange={(e) => isEditable && setBpm(parseInt(e.target.value))}
            className="w-16 p-2 bg-transparent border border-border rounded-md text-center"
            disabled={!isEditable}
            min="1"
            max="300"
          />
          <span className="ml-2 text-sm text-muted-foreground">bpm</span>
        </div>
      </div>

      {/* Sheet header */}
      <div className="grid grid-cols-[1fr,60px,1fr,1fr] gap-2 bg-muted/50 p-2 rounded-t-md">
        <div className="font-medium">Section</div>
        <div className="text-center font-medium">Bars</div>
        <div className="font-medium">Lyrics</div>
        <div className="font-medium">Notes</div>
      </div>

      {/* Sections */}
      <div className="border border-border rounded-b-md overflow-hidden">
        {sections.map((section, sectionIndex) => (
          <SectionCard
            key={section.id}
            type={section.type}
            color={section.color}
            energyLevel={section.energyLevel}
            isCollapsible={isEditable}
            onMoveUp={
              sectionIndex > 0 && isEditable
                ? () => handleMoveSection(sectionIndex, "up")
                : undefined
            }
            onMoveDown={
              sectionIndex < sections.length - 1 && isEditable
                ? () => handleMoveSection(sectionIndex, "down")
                : undefined
            }
          >
            {section.parts.map((part, partIndex) => (
              <PartRow
                key={`${section.id}-part-${partIndex}`}
                name={part.name}
                bars={part.bars}
                lyrics={part.lyrics}
                notes={part.notes}
              />
            ))}
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
