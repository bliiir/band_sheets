import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon, GripVerticalIcon } from "lucide-react";
import { useState } from "react";

export interface SectionCardProps {
  type: string;
  color?: string;
  energyLevel?: number;
  isCollapsible?: boolean;
  children?: React.ReactNode;
  className?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export default function SectionCard({
  type,
  color = "#f3f4f6",
  energyLevel = 0,
  isCollapsible = false,
  children,
  className,
  onMoveUp,
  onMoveDown,
}: SectionCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Generate energy level indicator
  const renderEnergyIndicator = () => {
    if (energyLevel <= 0) return null;

    return (
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-start h-1">
        <div
          className="bg-black dark:bg-white h-0.5"
          style={{ width: `${energyLevel * 20}%` }}
        />
      </div>
    );
  };

  return (
    <div
      className={cn("relative border-b border-border", className)}
      style={{ backgroundColor: color }}
    >
      <div className="flex items-center p-2 gap-2">
        <div className="flex items-center gap-1">
          <GripVerticalIcon className="h-4 w-4 text-muted-foreground cursor-move" />
          <span className="font-medium">{type}</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {onMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            >
              <ChevronUpIcon className="h-4 w-4" />
            </button>
          )}

          {onMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            >
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          )}

          {isCollapsible && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            >
              {isCollapsed ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronUpIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && children}
      {renderEnergyIndicator()}
    </div>
  );
}
