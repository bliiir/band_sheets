import { cn } from "@/lib/utils";
import DrumKitLogo from "@/polymet/components/drum-kit-logo";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({
  className,
  size = "md",
  showText = true,
}: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DrumKitLogo size={size} />
      {showText && (
        <span
          className={cn(
            "font-semibold",
            size === "sm" && "text-sm",
            size === "md" && "text-lg",
            size === "lg" && "text-xl"
          )}
        >
          Band Sheet Creator
        </span>
      )}
    </div>
  );
}
