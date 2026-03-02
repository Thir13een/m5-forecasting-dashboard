"use client";
import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import ScrollArea from "./ScrollArea";
import type { InventoryItem, InventoryFilters, ForecastItem } from "@/lib/types";
import { fmt, fmtInt, priorityColor, priorityDot, priorityLabel } from "@/lib/utils";
import { getItemForecast } from "@/lib/api";
import DemandChart from "./DemandChart";

interface Props {
  items: InventoryItem[];
  total: number;
  filters: InventoryFilters;
  onFiltersChange: (f: InventoryFilters) => void;
  onRowClick?: (item: InventoryItem) => void;
  loading?: boolean;
}

const PAGE_SIZE = 50;

function SortIcon({ col, filters }: { col: string; filters: InventoryFilters }) {
  if (filters.sort_by !== col) return <ChevronUp className="h-3 w-3 text-gray-300" />;
  return filters.sort_dir === "asc"
    ? <ChevronUp className="h-3 w-3 text-blue-500" />
    : <ChevronDown className="h-3 w-3 text-blue-500" />;
}

const PX = 16; // uniform horizontal padding throughout the panel

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 0", borderBottom: "1px solid #f1f5f9",
    }}>
      <span style={{ fontSize: 12, color: "#64748b", fontFamily: "'Roboto', sans-serif" }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: highlight ? "#dc2626" : "#0f172a", fontFamily: "'Roboto', sans-serif" }}>{value}</span>
    </div>
  );
}

function CloseButton({ onClose }: { onClose: (e: React.MouseEvent) => void }) {
  return (
    <button
      onClick={onClose}
      style={{
        position: "relative",
        width: 28, height: 28,
        borderRadius: "50%",
        background: "#e2e8f0",
        border: "none",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#fecaca")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#e2e8f0")}
    >
      <svg
        width="10" height="10" viewBox="0 0 10 10" fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        <line x1="1" y1="1" x2="9" y2="9" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="9" y1="1" x2="1" y2="9" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

function ExpandedRowPanel({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const [forecast, setForecast] = useState<ForecastItem | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setFetching(true);
    getItemForecast(item.item_id)
      .then(setForecast)
      .catch(() => setForecast(null))
      .finally(() => setFetching(false));
  }, [item.item_id]);

  return (
    <div style={{
      background: "#f8fafc",
      borderLeft: "4px solid #3b82f6",
      borderTop: "1px solid #dbeafe",
      fontFamily: "'Roboto', sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `10px ${PX}px`,
        borderBottom: "1px solid #e2e8f0",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
            {item.item_id.replace(/_/g, "-")}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityColor(item.priority)}`} style={{ whiteSpace: "nowrap" }}>
            <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(item.priority)}`} />
            {priorityLabel(item.priority)}
          </span>
          <span style={{ fontSize: 11.5, color: "#94a3b8", whiteSpace: "nowrap" }}>
            {item.store.replace(/_/g, "-")} · {item.dept.replace(/_/g, "-")} · {item.state}
          </span>
        </div>
        <CloseButton onClose={(e) => { e.stopPropagation(); onClose(); }} />
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", minHeight: 196 }}>

        {/* Chart — 55% */}
        <div style={{ width: "55%", padding: `12px ${PX}px 12px ${PX}px`, borderRight: "1px solid #e2e8f0" }}>
          {fetching && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            </div>
          )}
          {!fetching && forecast && (
            <DemandChart forecast={forecast} reorderPoint={item.reorder_point} />
          )}
          {!fetching && !forecast && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 12, color: "#94a3b8" }}>
              Forecast unavailable
            </div>
          )}
        </div>

        {/* Metrics — 45% */}
        <div style={{ width: "45%", padding: `12px ${PX}px` }}>
          <MetricRow label="Avg Daily Sales"   value={fmt(item.avg_daily_demand) + " / day"} />
          <MetricRow label="28-day Demand"     value={fmtInt(item.demand_next_28d) + " units"} />
          <MetricRow label="Safety Buffer"     value={fmtInt(item.safety_stock) + " units"} />
          <MetricRow label="Reorder Point"     value={fmtInt(item.reorder_point) + " units"} />
          <MetricRow label="Stock on Hand"     value={fmtInt(item.current_stock_sim) + " units"} />
          <MetricRow
            label="Days Until Empty"
            value={item.days_until_stockout >= 999 ? "No risk" : fmt(item.days_until_stockout, 1) + " days"}
            highlight={item.days_until_stockout < 7}
          />
        </div>
      </div>

      {/* ── Order bar ── */}
      {item.order_qty > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: `8px ${PX}px`,
          background: "#fef2f2",
          borderTop: "1px solid #fecaca",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", flexShrink: 0, display: "inline-block" }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: "#dc2626" }}>
            Recommended Order: {fmtInt(item.order_qty)} units
          </span>
        </div>
      )}
    </div>
  );
}

export default function InventoryGrid({
  items, total, filters, onFiltersChange, loading,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const page = filters.page ?? 1;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const toggleSort = (col: string) => {
    const dir = filters.sort_by === col && filters.sort_dir === "desc" ? "asc" : "desc";
    onFiltersChange({ ...filters, sort_by: col, sort_dir: dir, page: 1 });
  };

  const headers: { label: string; tooltip: string; key: string; align?: string }[] = [
    { label: "Product ID",          tooltip: "Unique product + store identifier",                    key: "item_id" },
    { label: "Store",               tooltip: "Which store this product belongs to",                  key: "store" },
    { label: "Category",            tooltip: "Product category",                                     key: "category" },
    { label: "Avg Daily Sales",     tooltip: "How many units are sold on an average day",            key: "avg_daily_demand",    align: "right" },
    { label: "Expected (28 days)",  tooltip: "Total units expected to sell over the next 28 days",   key: "demand_next_28d",     align: "right" },
    { label: "Units to Order",      tooltip: "How many units you should order today",                key: "order_qty",           align: "right" },
    { label: "Days Until Empty",    tooltip: "How many days before this product runs out of stock",  key: "days_until_stockout", align: "right" },
    { label: "Stock Status",        tooltip: "Whether you need to order now, soon, or are fine",     key: "priority" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <ScrollArea style={{ maxHeight: "none" }}>
        <table className="w-full text-sm" style={{ minWidth: 700, fontFamily: "'Roboto', sans-serif" }}>
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              {headers.map((h) => (
                <th
                  key={h.key}
                  onClick={() => toggleSort(h.key)}
                  className={`cursor-pointer select-none px-4 py-3 font-medium text-gray-600 hover:bg-gray-100 ${h.align === "right" ? "text-right" : "text-left"}`}
                  style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}
                >
                  <span className="inline-flex items-center gap-1" title={h.tooltip}>
                    {h.label}
                    <SortIcon col={h.key} filters={filters} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  No items match your filters.
                </td>
              </tr>
            )}
            {!loading && items.flatMap((item) => {
              const isExpanded = expandedId === item.item_id;
              const rows = [
                <tr
                  key={item.item_id}
                  onClick={() => setExpandedId(prev => prev === item.item_id ? null : item.item_id)}
                  className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-blue-50 last:border-0 ${isExpanded ? "bg-blue-50" : ""}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-800">{item.item_id.replace(/_/g, "-")}</td>
                  <td className="px-4 py-3 text-gray-600">{item.store.replace(/_/g, "-")}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt(item.avg_daily_demand)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmtInt(item.demand_next_28d)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${item.order_qty > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {fmtInt(item.order_qty)}
                  </td>
                  <td className={`px-4 py-3 text-right ${item.days_until_stockout < 7 ? "font-semibold text-red-600" : "text-gray-700"}`}>
                    {item.days_until_stockout >= 999 ? "∞" : fmt(item.days_until_stockout, 1)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${priorityColor(item.priority)}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${priorityDot(item.priority)}`} />
                      {priorityLabel(item.priority)}
                    </span>
                  </td>
                </tr>,
              ];
              if (isExpanded) {
                rows.push(
                  <tr key={item.item_id + "_exp"}>
                    <td colSpan={8} style={{ padding: 0 }}>
                      <ExpandedRowPanel item={item} onClose={() => setExpandedId(null)} />
                    </td>
                  </tr>
                );
              }
              return rows;
            })}
          </tbody>
        </table>
      </ScrollArea>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600" style={{ fontFamily: "'Roboto', sans-serif" }}>
        <span>{total.toLocaleString()} products</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onFiltersChange({ ...filters, page: page - 1 })}
            disabled={page <= 1}
            className="rounded-2xl border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span style={{ fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>Page {page} of {totalPages || 1}</span>
          <button
            onClick={() => onFiltersChange({ ...filters, page: page + 1 })}
            disabled={page >= totalPages}
            className="rounded-2xl border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
            style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", padding: 0, lineHeight: 1, flexShrink: 0 }}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
