import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

/**
 * Button component for navigation that can be used in sidebar (vertical) or header (horizontal)
 */
const SidebarButton = ({ icon: Icon, active, label, to, onClick, variant = "vertical" }) => {
  // Handle different styles based on variant (vertical or horizontal)
  const baseClasses = cn(
    "relative flex items-center transition-colors group",
    variant === "vertical" && "justify-center w-10 h-10 rounded-md",
    variant === "horizontal" && "px-3 py-2 gap-2 rounded",
    active
      ? "text-primary" // Removed bg-primary/10 to eliminate the grey background
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

  // Different content layouts for vertical vs horizontal
  const verticalContent = (
    <>
      <Icon className="h-5 w-5" />
      <span className="absolute left-full ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        {label}
      </span>
    </>
  );
  
  const horizontalContent = (
    <>
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline text-sm font-medium">{label}</span>
    </>
  );
  
  const Content = variant === "vertical" ? verticalContent : horizontalContent;

  if (to) {
    return (
      <Link to={to} className={baseClasses} onClick={onClick}>
        {Content}
      </Link>
    );
  }

  return (
    <button className={baseClasses} onClick={onClick}>
      {Content}
    </button>
  );
};

export default SidebarButton;
