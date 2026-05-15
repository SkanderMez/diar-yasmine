"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SortOption {
  value: string;
  label: string;
}

interface ListingToolbarProps {
  resultCount: number;
  label: string;
  dateLabel?: string;
  sortOptions: SortOption[];
}

/**
 * Sits above the cards grid: result count + optional date subline on the
 * left; sort select on the right. The sort select writes to
 * `searchParams.sort` so the server can re-order results.
 */
export function ListingToolbar({
  resultCount,
  label,
  dateLabel,
  sortOptions,
}: ListingToolbarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

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

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="text-[0.9rem] text-muted-foreground">
        <strong className="text-charcoal">
          {resultCount} {label}
        </strong>{" "}
        disponible{resultCount === 1 ? "" : "s"}
        {dateLabel && <span> · {dateLabel}</span>}
      </div>
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
    </div>
  );
}
