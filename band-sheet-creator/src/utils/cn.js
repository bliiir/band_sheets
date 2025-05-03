import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS support using clsx and tailwind-merge.
 * This prevents issues with conflicting Tailwind classes.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
