"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Map } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
}

interface ListingToolbarProps {
  resultCount: number;
  label: string;
  dateLabel?: string;
  sortOptions: SortOption[];
  /** Initial view; toolbar manages its own state from here. */
  view?: "grid" | "map";
  /** Optional callback fired when the view toggle changes. Pages can ignore
   *  this for now (map view ships in a later iteration). */
  onViewChange?: (v: "grid" | "map") => void;
}

/**
 * Sits above the cards grid: result count + optional date subline on the
 * left; sort select + Grille/Carte view toggle on the right. The sort
 * select writes to `searchParams.sort` so the server can re-order results.
 */
export function ListingToolbar({
  resultCount,
  label,
  dateLabel,
  sortOptions,
  view: initialView = "grid",
  onViewChange,
}: ListingToolbarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [view, setView] = useState<"grid" | "map">(initialView);

  const currentSort = sp?.get("sort") ?? sortOptions[0]?.value ?? "";

  function pushSort(value: string) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    if (!value || value === sortOptions[0]?.value) {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    });
  }

  function switchView(next: "grid" | "map") {
    setView(next);
    onViewChange?.(next);
  }

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="text-[0.9rem] text-muted-foreground">
        <strong className="text-charcoal">
          {resultCount} {label}
        </strong>{" "}
        disponible{resultCount === 1 ? "" : "s"}
        {dateLabel && <span> · {dateLabel}</span>}
      </div>
      <div className="flex items-center gap-3">
        <select
          value={currentSort}
          onChange={(e) => pushSort(e.target.value)}
          className="rounded-full border border-line bg-card px-3.5 py-2.5 text-[0.85rem] text-charcoal outline-none transition-colors hover:border-charcoal focus:border-primary"
          aria-label="Tri"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex rounded-full bg-sand p-1">
          <button
            type="button"
            onClick={() => switchView("grid")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.85rem] font-medium transition-all",
              view === "grid"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-charcoal",
            )}
          >
            <LayoutGrid className="size-3.5" />
            Grille
          </button>
          <button
            type="button"
            onClick={() => switchView("map")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[0.85rem] font-medium transition-all",
              view === "map"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-charcoal",
            )}
          >
            <Map className="size-3.5" />
            Carte
          </button>
        </div>
      </div>
    </div>
  );
}
