"use client";
import Select, { StylesConfig, components, MenuListProps } from "react-select";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Search } from "lucide-react";
import type { InventoryFilters } from "@/lib/types";

const STORES     = ["CA_1","CA_2","CA_3","CA_4","TX_1","TX_2","TX_3","WI_1","WI_2","WI_3"];
const CATEGORIES = ["FOODS","HOBBIES","HOUSEHOLD"];
const STATES     = ["CA","TX","WI"];
const PRIORITIES = ["CRITICAL","WARNING","OK"];

const RB = "'Roboto', sans-serif";

interface Props {
  filters: InventoryFilters;
  onChange: (f: InventoryFilters) => void;
}

type Option = { value: string; label: string };

function makeOptions(items: string[], display?: (v: string) => string): Option[] {
  return items.map((v) => ({ value: v, label: display ? display(v) : v }));
}

// Custom MenuList using SimpleBar so the scrollbar matches the rest of the app
function MenuList({ children }: MenuListProps<Option, false>) {
  return (
    <SimpleBar style={{ maxHeight: 240 }} autoHide={false}>
      {children}
    </SimpleBar>
  );
}

const selectStyles: StylesConfig<Option, false> = {
  control: (base, state) => ({
    ...base,
    fontFamily: RB,
    fontSize: 14,
    minWidth: 130,
    borderRadius: 16,
    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(59,130,246,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
    cursor: "pointer",
    "&:hover": { borderColor: "#d1d5db" },
  }),
  placeholder: (base) => ({ ...base, color: "#9ca3af", fontFamily: RB }),
  singleValue: (base) => ({ ...base, color: "#1f2937", fontFamily: RB }),
  menu: (base) => ({
    ...base,
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    border: "1px solid #e5e7eb",
    overflow: "hidden",
    zIndex: 9999,
  }),
  // No padding — items go edge-to-edge so rounded menu corners clip them cleanly
  menuList: (base) => ({ ...base, padding: 0 }),
  option: (base, state) => ({
    ...base,
    fontFamily: RB,
    fontSize: 14,
    cursor: "pointer",
    backgroundColor: state.isSelected
      ? "#eff6ff"
      : state.isFocused
      ? "#f0f9ff"
      : "transparent",
    color: state.isSelected ? "#2563eb" : "#374151",
    fontWeight: state.isSelected ? 500 : 400,
    "&:active": { backgroundColor: "#dbeafe" },
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#9ca3af", padding: "0 8px" }),
  clearIndicator: (base) => ({ ...base, color: "#9ca3af", cursor: "pointer" }),
  valueContainer: (base) => ({ ...base, padding: "2px 12px" }),
};

interface DropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  display?: (v: string) => string;
}

function Dropdown({ label, value, options, onChange, display }: DropdownProps) {
  const opts = makeOptions(options, display);
  const selected = opts.find((o) => o.value === value) ?? null;

  return (
    <Select<Option, false>
      options={opts}
      value={selected}
      onChange={(opt) => onChange(opt?.value ?? "")}
      placeholder={label}
      isClearable={!!value}
      styles={selectStyles}
      isSearchable={false}
      components={{ MenuList }}
      classNamePrefix="sel"
    />
  );
}

export default function InventoryFilters({ filters, onChange }: Props) {
  const set = (key: keyof InventoryFilters, val: string) =>
    onChange({ ...filters, [key]: val, page: 1 });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dropdown
        label="All Stores"
        value={filters.store ?? ""}
        options={STORES}
        display={(v) => v.replace(/_/g, "-")}
        onChange={(v) => set("store", v)}
      />
      <Dropdown
        label="All Categories"
        value={filters.category ?? ""}
        options={CATEGORIES}
        onChange={(v) => set("category", v)}
      />
      <Dropdown
        label="All States"
        value={filters.state ?? ""}
        options={STATES}
        onChange={(v) => set("state", v)}
      />
      <Dropdown
        label="All Priorities"
        value={filters.priority ?? ""}
        options={PRIORITIES}
        onChange={(v) => set("priority", v)}
      />

      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" style={{ width: 14, height: 14 }} />
        <input
          type="text"
          placeholder="Search product ID..."
          value={filters.search ?? ""}
          onChange={(e) => set("search", e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ fontFamily: RB }}
        />
      </div>

      {(filters.store || filters.category || filters.state || filters.priority || filters.search) && (
        <button
          onClick={() => onChange({ page: 1, page_size: filters.page_size })}
          className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-600 hover:bg-blue-100 transition-colors"
          style={{ fontFamily: RB }}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
