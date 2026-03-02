"use client";
import { Package, AlertTriangle, ShoppingCart, Shield } from "lucide-react";
import type { InventorySummary } from "@/lib/types";
import { fmtInt, fmt } from "@/lib/utils";

interface Props {
  summary: InventorySummary;
}

export default function StatsCards({ summary }: Props) {
  const cards = [
    {
      label: "Total Products Tracked",
      sublabel: "across all stores",
      value: fmtInt(summary.total),
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Need Ordering Now",
      sublabel: "stock running out soon",
      value: fmtInt(summary.critical),
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      label: "Total Units to Order",
      sublabel: "across all urgent products",
      value: fmtInt(summary.total_order_qty),
      icon: ShoppingCart,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "Average Safety Buffer",
      sublabel: "extra units kept just in case",
      value: fmt(summary.avg_safety_stock) + " units",
      icon: Shield,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500" style={{ fontFamily: "'Roboto', sans-serif" }}>
              {c.label}
            </span>
            <div className={`rounded-xl flex items-center justify-center shrink-0 ${c.bg}`} style={{ width: 36, height: 36 }}>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
          </div>
          <p className={`mt-2 text-2xl font-bold ${c.color}`} style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>{c.value}</p>
          <p className="mt-0.5 text-xs text-gray-400" style={{ fontFamily: "'Roboto', sans-serif" }}>{c.sublabel}</p>
        </div>
      ))}
    </div>
  );
}
