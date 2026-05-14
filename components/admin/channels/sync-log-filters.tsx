"use client";

import { useState, useEffect } from "react";

type Bucket = "all" | "sync" | "conflict" | "error";

const FILTERS: { key: Bucket; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "sync", label: "Sync" },
  { key: "conflict", label: "Conflit" },
  { key: "error", label: "Erreur" },
];

/**
 * Inline filter chips for the sync log. Hides log rows whose
 * `data-bucket` attribute doesn't match the selected bucket. Filtering
 * happens in the DOM so the parent stays a Server Component.
 */
export function SyncLogFilters() {
  const [active, setActive] = useState<Bucket>("all");

  useEffect(() => {
    const container = document.querySelector("[data-sync-log-rows]");
    if (!container) return;
    const rows = container.querySelectorAll<HTMLElement>("[data-bucket]");
    rows.forEach((row) => {
      const bucket = row.dataset.bucket as Bucket | undefined;
      const match = active === "all" || bucket === active;
      row.style.display = match ? "" : "none";
    });
  }, [active]);

  return (
    <div className="sync-log-filters" role="tablist">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={active === f.key}
          className={active === f.key ? "active" : ""}
          onClick={() => setActive(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
