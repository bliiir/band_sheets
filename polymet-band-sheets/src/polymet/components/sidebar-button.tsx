import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes } from "react";
import { Link } from "react-router-dom";

interface SidebarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  active?: boolean;
  label?: string;
  to?: string;
}

export default function SidebarButton({
  icon: Icon,
  active = false,
  label,
  to,
  className,
  ...props
}: SidebarButtonProps) {
  const buttonClasses = cn(
    "flex items-center justify-center w-10 h-10 rounded-md transition-all",
    "hover:bg-accent hover:text-accent-foreground",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    active && "bg-primary text-primary-foreground hover:bg-primary/90",
    className
  );

  if (to) {
    return (
      <Link to={to} className={buttonClasses}>
        <Icon size={20} />
        {label && <span className="sr-only">{label}</span>}
      </Link>
    );
  }

  return (
    <button className={buttonClasses} {...props}>
      <Icon size={20} />
      {label && <span className="sr-only">{label}</span>}
    </button>
  );
}
