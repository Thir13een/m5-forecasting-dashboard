import type { Metadata } from "next";
import "./globals.css";
import ChatWindow from "@/components/ChatWindow";
import ScrollArea from "@/components/ScrollArea";

export const metadata: Metadata = {
  title: "M5 Demand Forecasting",
  description: "Retail inventory management powered by LightGBM demand forecasting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header
          className="sticky-top bg-white border-bottom"
          style={{ height: 68, zIndex: 40, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <div className="d-flex align-items-center h-100 px-4 gap-3">
            {/* Logo */}
            <div
              className="d-flex align-items-center justify-content-center rounded-2 text-white fw-bold flex-shrink-0"
              style={{
                width: 38, height: 38,
                background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                fontSize: 13, letterSpacing: 0.5,
              }}
            >
              M5
            </div>

            {/* Title */}
            <div>
              <div className="fw-bold text-dark header-title" style={{ fontSize: 20, lineHeight: 1.2, fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
                Demand Forecasting
              </div>
              <div className="text-muted header-subtitle" style={{ fontSize: 13, lineHeight: 1.3, fontFamily: "'Roboto', sans-serif" }}>
                LightGBM · 30,490 products across 10 stores
              </div>
            </div>
          </div>
        </header>

        {/* ── Main split layout ───────────────────────────────────────── */}
        <div className="d-flex" style={{ height: "calc(100vh - 68px)", overflow: "hidden" }}>

          {/* Left panel — Inventory dashboard (scrollable) */}
          <div className="flex-grow-1" style={{ minWidth: 0, overflow: "hidden" }}>
            <ScrollArea>
              <div style={{ padding: "20px 24px" }}>
                {children}
              </div>
            </ScrollArea>
          </div>

          {/* Divider */}
          <div className="chat-divider" style={{ width: 1, background: "#e5e7eb", flexShrink: 0 }} />

          {/* Right panel — AI Chat */}
          <div
            className="d-flex flex-column bg-white flex-shrink-0 chat-panel"
            style={{ width: 380 }}
          >
            {/* Chat panel header */}
            <div
              className="flex-shrink-0 border-bottom px-4 py-3"
              style={{ background: "#fafafa" }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#22c55e", display: "inline-block",
                      boxShadow: "0 0 0 2px #bbf7d0", flexShrink: 0,
                    }}
                  />
                  <span className="fw-bold text-dark" style={{ fontSize: 14, fontFamily: "'Google Sans', 'Roboto', sans-serif" }}>
                    AI Assistant
                  </span>
                </div>
                {/* Powered by badge */}
                <span style={{
                  fontSize: 10.5, fontFamily: "'Roboto', sans-serif",
                  color: "#6b7280", background: "#f3f4f6",
                  border: "1px solid #e5e7eb", borderRadius: 20,
                  padding: "2px 8px", whiteSpace: "nowrap",
                }}>
                  Qwen3-32B · Groq
                </span>
              </div>
              <div className="text-muted mt-1" style={{ fontSize: 12, fontFamily: "'Roboto', sans-serif" }}>
                Ask about stock levels, reorder quantities, or demand forecasts
              </div>
            </div>

            {/* Chat window fills remaining height */}
            <div className="flex-grow-1 overflow-hidden">
              <ChatWindow />
            </div>
          </div>

        </div>
      </body>
    </html>
  );
}
