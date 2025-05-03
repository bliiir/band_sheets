import { cn } from "@/lib/utils";
import { GripVerticalIcon } from "lucide-react";

export interface PartRowProps {
  name: string;
  bars: number;
  lyrics?: string;
  notes?: string;
  className?: string;
}

export default function PartRow({
  name,
  bars,
  lyrics = "",
  notes = "",
  className,
}: PartRowProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-[auto,60px,1fr,1fr] gap-2 items-center border-t border-border/50 py-2 px-2",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <GripVerticalIcon className="h-4 w-4 text-muted-foreground cursor-move" />
        <span className="font-medium w-6">{name}</span>
      </div>

      <div className="text-center">{bars}</div>

      <div className="min-h-[24px]">
        {lyrics ? (
          <p className="text-sm">{lyrics}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">No lyrics</p>
        )}
      </div>

      <div className="min-h-[24px]">
        {notes ? (
          <p className="text-sm">{notes}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Add notes here...
          </p>
        )}
      </div>
    </div>
  );
}
