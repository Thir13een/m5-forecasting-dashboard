import type { InventoryFilters, InventoryResponse, ForecastItem, UploadResult } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getInventory(filters: InventoryFilters = {}): Promise<InventoryResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  });
  const res = await fetch(`${API}/api/inventory?${params}`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function getItemForecast(itemId: string): Promise<ForecastItem> {
  const res = await fetch(`${API}/api/forecast/${encodeURIComponent(itemId)}`);
  if (!res.ok) throw new Error("Forecast not found");
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API}/api/health`);
  return res.json();
}

export async function uploadSalesFile(
  file: File,
  onDone: (result: UploadResult) => void,
  onError: (msg: string) => void
): Promise<void> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch(`${API}/api/upload`, { method: "POST", body: form });
    if (!res.ok) {
      const err = await res.json();
      onError(err.detail ?? "Upload failed");
      return;
    }
    onDone(await res.json());
  } catch (e) {
    onError(String(e));
  }
}

export async function* streamChat(
  message: string,
  history: { role: string; content: string }[]
): AsyncGenerator<string> {
  const res = await fetch(`${API}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") return;
      try {
        const obj = JSON.parse(payload);
        if (obj.text) yield obj.text;
      } catch {
        // ignore malformed
      }
    }
  }
}
