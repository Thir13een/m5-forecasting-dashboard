"use client";
import { AlertTriangle } from "lucide-react";

interface Props {
  critical: number;
  warning: number;
}

export default function AlertBanner({ critical, warning }: Props) {
  if (critical === 0 && warning === 0) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
      <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
      <span className="text-sm font-medium">
        {critical > 0 && (
          <span>
            <strong>{critical.toLocaleString()}</strong> products need to be ordered right away — stock will run out soon
          </span>
        )}
        {critical > 0 && warning > 0 && <span className="mx-3">·</span>}
        {warning > 0 && (
          <span>
            <strong>{warning.toLocaleString()}</strong> products are getting low — consider ordering soon
          </span>
        )}
      </span>
    </div>
  );
}
