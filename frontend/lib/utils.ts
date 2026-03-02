import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number, decimals = 1): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function priorityColor(priority: string) {
  switch (priority) {
    case "CRITICAL": return "bg-red-100 text-red-700 border-red-200";
    case "WARNING":  return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default:         return "bg-green-100 text-green-700 border-green-200";
  }
}

export function priorityDot(priority: string) {
  switch (priority) {
    case "CRITICAL": return "bg-red-500";
    case "WARNING":  return "bg-yellow-500";
    default:         return "bg-green-500";
  }
}

export function priorityLabel(priority: string) {
  switch (priority) {
    case "CRITICAL": return "Order Now";
    case "WARNING":  return "Order Soon";
    default:         return "Well Stocked";
  }
}
