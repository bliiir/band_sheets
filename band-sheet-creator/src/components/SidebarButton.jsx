import React from "react";
import { Link } from "react-router-dom";
import { cn } from "../utils/cn";

/**
 * Button component for the sidebar navigation
 */
const SidebarButton = ({ icon: Icon, active, label, to, onClick }) => {
  const baseClasses = cn(
    "relative flex items-center justify-center w-10 h-10 rounded-md text-muted-foreground transition-colors group",
    active
      ? "bg-primary/10 text-primary"
      : "hover:bg-muted hover:text-foreground"
  );

  const Content = (
    <>
      <Icon className="h-5 w-5" />
      <span className="absolute left-full ml-2 px-2 py-1 rounded bg-popover text-popover-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        {label}
      </span>
    </>
  );

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
