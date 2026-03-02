"use client";
import { useRef, useState } from "react";
import { Upload, CheckCircle, XCircle } from "lucide-react";
import { uploadSalesFile } from "@/lib/api";
import type { UploadResult } from "@/lib/types";

interface Props {
  onSuccess: (result: UploadResult) => void;
}

export default function FileUpload({ onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [summary, setSummary] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handle = (file: File) => {
    setState("uploading");
    uploadSalesFile(
      file,
      (result) => {
        setState("done");
        setSummary(`${result.total_items.toLocaleString()} items · ${result.critical_count} critical`);
        onSuccess(result);
      },
      (err) => {
        setState("error");
        setErrorMsg(err);
      }
    );
  };

  const reset = () => {
    setState("idle");
    setSummary("");
    setErrorMsg("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (state === "uploading") return;
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  };

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      accept=".csv,.parquet"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handle(file);
      }}
    />
  );

  if (state === "done") {
    return (
      <div style={{ fontFamily: "'Roboto', sans-serif" }}>
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2"
          style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
        >
          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          <span style={{ fontSize: 13, color: "#15803d" }}>{summary}</span>
        </div>
        <button
          onClick={reset}
          style={{
            fontSize: 11.5, color: "#6b7280", marginTop: 4,
            display: "block", width: "100%", textAlign: "center",
            background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
          }}
        >
          Upload another
        </button>
        {hiddenInput}
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ fontFamily: "'Roboto', sans-serif" }}>
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2"
          style={{ background: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <span style={{ fontSize: 13, color: "#dc2626" }} className="truncate">
            {errorMsg || "Upload failed"}
          </span>
        </div>
        <button
          onClick={reset}
          style={{
            fontSize: 11.5, color: "#6b7280", marginTop: 4,
            display: "block", width: "100%", textAlign: "center",
            background: "none", border: "none", cursor: "pointer", textDecoration: "underline",
          }}
        >
          Try again
        </button>
        {hiddenInput}
      </div>
    );
  }

  // idle or uploading
  return (
    <div>
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => state === "idle" && inputRef.current?.click()}
        className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm text-white transition-colors ${
          state === "idle" ? "cursor-pointer hover:bg-blue-700" : "cursor-default"
        }`}
        style={{
          fontFamily: "'Roboto', sans-serif",
          background: state === "uploading" ? "#60a5fa" : "#2563eb",
        }}
      >
        {state === "uploading" ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent flex-shrink-0" />
        ) : (
          <Upload className="h-4 w-4 flex-shrink-0" />
        )}
        <span>
          {state === "idle"      && "Upload sales data"}
          {state === "uploading" && "Running forecasts… may take 30–60 s"}
        </span>
      </div>
      {hiddenInput}
    </div>
  );
}
