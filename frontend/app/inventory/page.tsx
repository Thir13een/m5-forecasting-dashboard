"use client";
import { useCallback, useEffect, useState } from "react";
import { getInventory, getHealth } from "@/lib/api";
import type { InventoryFilters, InventoryResponse } from "@/lib/types";
import AlertBanner from "@/components/AlertBanner";
import StatsCards from "@/components/StatsCards";
import InventoryFiltersBar from "@/components/InventoryFilters";
import InventoryGrid from "@/components/InventoryGrid";
import FileUpload from "@/components/FileUpload";
import { Calendar, RefreshCw, TrendingUp } from "lucide-react";

const DEFAULT_FILTERS: InventoryFilters = {
  page: 1,
  page_size: 50,
  sort_by: "order_qty",
  sort_dir: "desc",
};

const GS: React.CSSProperties = { fontFamily: "'Google Sans', 'Roboto', sans-serif" };
const RB: React.CSSProperties = { fontFamily: "'Roboto', sans-serif" };

function formatLastUpdated(raw: string | null): { date: string; source: string } {
  if (!raw) return { date: "—", source: "unknown" };
  const match = raw.match(/^(.+?)\s*\((.+?)\)$/);
  const iso = match ? match[1] : raw;
  const source = match ? match[2] : "upload";
  try {
    const d = new Date(iso);
    const date = d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    return { date, source };
  } catch {
    return { date: raw, source };
  }
}

function DateBadge({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string;
}) {
  return (
    <div
      className="d-flex align-items-center gap-2 rounded-2xl px-3 py-2"
      style={{ background: "#f8faff", border: "1px solid #e0e7ff" }}
    >
      <Icon style={{ width: 14, height: 14, color }} />
      <span style={{ ...RB, fontSize: 11.5, color: "#6b7280" }}>{label}</span>
      <span style={{ ...GS, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{value}</span>
    </div>
  );
}

export default function InventoryPage() {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [filters, setFilters] = useState<InventoryFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async (f: InventoryFilters) => {
    setLoading(true);
    try {
      const res = await getInventory(f);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(filters); }, [filters]);

  useEffect(() => {
    getHealth().then((h) => setLastUpdated(h.last_updated ?? null)).catch(() => {});
  }, []);

  const handleFiltersChange = (f: InventoryFilters) => setFilters(f);

  const summary = data?.summary ?? {
    total: 0, critical: 0, warning: 0, total_order_qty: 0, avg_safety_stock: 0,
  };

  const today = new Date().toLocaleString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });

  const { date: updatedDate, source: updatedSource } = formatLastUpdated(lastUpdated);

  return (
    <div className="space-y-4">

      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            style={{
              ...GS,
              fontSize: 22,
              fontWeight: 700,
              background: "linear-gradient(90deg, #1d4ed8 0%, #0ea5e9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            Never run out. Always know what to order.
          </h1>
          <p className="mt-1" style={{ ...RB, fontSize: 13, color: "#6b7280" }}>
            AI-powered forecasts across{" "}
            <strong style={{ color: "#374151" }}>30,490 products</strong> ·
            reorder alerts, quantities &amp; stockout timelines — all in one place.
          </p>

          {/* Date indicators */}
          <div className="d-flex flex-wrap gap-2 mt-2">
            <DateBadge
              icon={Calendar}
              label="Viewing on"
              value={today}
              color="#3b82f6"
            />
            <DateBadge
              icon={RefreshCw}
              label="Forecasts last run"
              value={updatedDate}
              color="#10b981"
            />
            <DateBadge
              icon={TrendingUp}
              label="Forecast window"
              value="28 days ahead"
              color="#8b5cf6"
            />
          </div>
        </div>
        <div className="flex-shrink-0 mt-1">
          <FileUpload onSuccess={() => {
            fetchData(filters);
            getHealth().then((h) => setLastUpdated(h.last_updated ?? null)).catch(() => {});
          }} />
          {updatedSource && (
            <p className="text-center mt-1" style={{ ...RB, fontSize: 10.5, color: "#9ca3af" }}>
              source: {updatedSource}
            </p>
          )}
        </div>
      </div>

      <AlertBanner critical={summary.critical} warning={summary.warning} />
      <StatsCards summary={summary} />
      <InventoryFiltersBar filters={filters} onChange={handleFiltersChange} />

      <InventoryGrid
        items={data?.items ?? []}
        total={data?.total ?? 0}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />
    </div>
  );
}
