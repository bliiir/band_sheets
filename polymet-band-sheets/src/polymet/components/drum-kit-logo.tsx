import { cn } from "@/lib/utils";

interface DrumKitLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function DrumKitLogo({
  className,
  size = "md",
}: DrumKitLogoProps) {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src="/drum-kit.png"
        alt="Drum Kit Logo"
        className={cn(sizeClasses[size])}
      />
    </div>
  );
}
