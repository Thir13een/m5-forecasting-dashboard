export interface InventoryItem {
  item_id: string;
  sku_id: string;
  category: "FOODS" | "HOBBIES" | "HOUSEHOLD";
  dept: string;
  store: string;
  state: string;
  avg_daily_demand: number;
  demand_next_28d: number;
  demand_lead_time: number;
  sigma_daily: number;
  sigma_lead_time: number;
  safety_stock: number;
  reorder_point: number;
  current_stock_sim: number;
  order_qty: number;
  days_until_stockout: number;
  priority: "CRITICAL" | "WARNING" | "OK";
  reorder_flag: number;
}

export interface InventorySummary {
  total: number;
  critical: number;
  warning: number;
  total_order_qty: number;
  avg_safety_stock: number;
}

export interface InventoryResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  page_size: number;
  summary: InventorySummary;
}

export interface ForecastItem {
  item_id: string;
  pred_h01: number;
  pred_h07: number;
  pred_h14: number;
  pred_h28: number;
}

export interface InventoryFilters {
  store?: string;
  category?: string;
  state?: string;
  priority?: string;
  search?: string;
  sort_by?: string;
  sort_dir?: string;
  page?: number;
  page_size?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface UploadResult {
  success: boolean;
  total_items: number;
  critical_count: number;
  warning_count: number;
  total_order_qty: number;
  last_updated: string;
}
