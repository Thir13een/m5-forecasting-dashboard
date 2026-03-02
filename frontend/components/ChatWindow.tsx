"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChat } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import ScrollArea from "./ScrollArea";

const SUGGESTIONS = [
  "What are the top 10 most urgent items to order?",
  "Which store needs the most attention right now?",
  "Break down critical items by category",
  "Which items will stock out within 3 days?",
];

const RB = "'Roboto', sans-serif";
const GS = "'Google Sans', 'Roboto', sans-serif";


function AssistantMessage({ content, isStreaming }: { content: string; isStreaming: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Paragraphs
        p: ({ children }) => (
          <p style={{ margin: "0 0 10px 0", lineHeight: 1.65, fontFamily: RB, fontSize: 14 }}>{children}</p>
        ),
        // Bold
        strong: ({ children }) => (
          <strong style={{ fontFamily: GS, fontWeight: 600, color: "#111827" }}>{children}</strong>
        ),
        // Tables
        table: ({ children }) => (
          <div style={{ overflowX: "auto", margin: "12px 0" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse", fontSize: 13.5,
              fontFamily: RB, borderRadius: 8, overflow: "hidden",
              border: "1px solid #e5e7eb",
            }}>
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead style={{ background: "#f3f4f6" }}>{children}</thead>
        ),
        th: ({ children }) => (
          <th style={{
            padding: "9px 14px", textAlign: "left", fontFamily: GS,
            fontWeight: 600, fontSize: 13, color: "#111827",
            borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap",
          }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{
            padding: "8px 14px", color: "#374151", fontFamily: RB,
            borderBottom: "1px solid #f3f4f6", fontSize: 13.5,
          }}>
            {children}
          </td>
        ),
        tr: ({ children }) => (
          <tr style={{ transition: "background 0.1s" }}>{children}</tr>
        ),
        // Lists
        ul: ({ children }) => (
          <ul style={{ margin: "6px 0 10px 0", paddingLeft: 20, fontFamily: RB, lineHeight: 1.75 }}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol style={{ margin: "6px 0 10px 0", paddingLeft: 20, fontFamily: RB, lineHeight: 1.75 }}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li style={{ marginBottom: 4, color: "#1f2937", fontSize: 14 }}>{children}</li>
        ),
        // Headings
        h1: ({ children }) => (
          <p style={{ fontFamily: GS, fontWeight: 700, fontSize: 17, margin: "12px 0 6px", color: "#111827" }}>{children}</p>
        ),
        h2: ({ children }) => (
          <p style={{ fontFamily: GS, fontWeight: 600, fontSize: 15.5, margin: "10px 0 5px", color: "#1f2937" }}>{children}</p>
        ),
        h3: ({ children }) => (
          <p style={{ fontFamily: GS, fontWeight: 600, fontSize: 14.5, margin: "8px 0 4px", color: "#374151" }}>{children}</p>
        ),
        // Inline code
        code: ({ children }) => (
          <code style={{
            background: "#eff6ff", borderRadius: 4, padding: "2px 6px",
            fontSize: 13, fontFamily: "monospace", color: "#1d4ed8",
          }}>
            {children}
          </code>
        ),
        // Horizontal rule
        hr: () => <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "12px 0" }} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    let buffer = "";
    try {
      for await (const chunk of streamChat(text, history)) {
        buffer += chunk;
      }
    } finally {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: buffer };
        return next;
      });
      setStreaming(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea>
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {messages.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 24, textAlign: "center" }}>
                <div>
                  <p style={{ fontFamily: GS, fontWeight: 600, fontSize: 17, color: "#111827", margin: 0 }}>
                    M5 Inventory AI
                  </p>
                  <p style={{ fontFamily: RB, fontSize: 14, color: "#9ca3af", marginTop: 5, marginBottom: 0 }}>
                    Ask anything about your inventory, forecasts, or reorder priorities.
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        fontFamily: RB, fontSize: 13.5, color: "#374151",
                        background: "#fff", border: "1px solid #e5e7eb",
                        borderRadius: 20, padding: "7px 14px", cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                        transition: "border-color 0.15s, background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#93c5fd"; e.currentTarget.style.background = "#f0f9ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.background = "#fff"; }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "88%",
                    borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    padding: m.role === "user" ? "10px 14px" : "12px 14px",
                    background: m.role === "user" ? "#2563eb" : "#f8fafc",
                    border: m.role === "user" ? "none" : "1px solid #e5e7eb",
                    color: m.role === "user" ? "#fff" : "#1f2937",
                    fontFamily: RB,
                    fontSize: 14.5,
                    lineHeight: 1.55,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  {m.role === "assistant" ? (
                    m.content === "" && streaming && i === messages.length - 1 ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: "50%",
                          border: "2.5px solid #e5e7eb",
                          borderTopColor: "#3b82f6",
                          display: "inline-block",
                          animation: "spin 0.75s linear infinite",
                          flexShrink: 0,
                        }} />
                        <span style={{ fontFamily: RB, fontSize: 13.5, color: "#9ca3af" }}>Thinking…</span>
                      </div>
                    ) : (
                      <AssistantMessage content={m.content} isStreaming={false} />
                    )
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "12px 16px" }}>
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about inventory, forecasts, or reorders..."
            disabled={streaming}
            style={{
              flex: 1, borderRadius: 20, border: "1px solid #e5e7eb",
              background: "#fff", padding: "10px 16px", fontSize: 14,
              color: "#1f2937", fontFamily: RB, outline: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              opacity: streaming ? 0.6 : 1,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(59,130,246,0.2)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "#e5e7eb"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)"; }}
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            style={{
              background: "#2563eb", border: "none", borderRadius: 20,
              padding: "9px 14px", color: "#fff", cursor: "pointer",
              opacity: !input.trim() || streaming ? 0.4 : 1,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "opacity 0.15s, background 0.15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (input.trim() && !streaming) e.currentTarget.style.background = "#1d4ed8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#2563eb"; }}
          >
            <Send style={{ width: 15, height: 15 }} />
          </button>
        </form>
      </div>
    </div>
  );
}
