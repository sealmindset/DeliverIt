"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";

interface ExportButtonProps {
  /** The API path segment: "tasks", "projects", or "dashboard" */
  resource: string;
}

export function ExportButton({ resource }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleExport = async (fmt: "csv" | "pdf") => {
    setOpen(false);
    setDownloading(true);
    try {
      const res = await fetch(`/api/export/${resource}/${fmt}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.download = match ? match[1] : `export.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail -- could add toast later
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-md border border-[var(--input)] px-3 py-2 text-sm font-medium hover:bg-[var(--accent)] disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {downloading ? "Downloading..." : "Export"}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-36 rounded-md border border-[var(--border)] bg-[var(--card)] shadow-lg">
          <button
            onClick={() => handleExport("csv")}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--accent)] rounded-t-md"
          >
            Download CSV
          </button>
          <button
            onClick={() => handleExport("pdf")}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--accent)] rounded-b-md"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
}
