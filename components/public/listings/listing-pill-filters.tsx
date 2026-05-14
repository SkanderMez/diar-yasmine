"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Pill {
  value: string;
  label: string;
}

interface ListingPillFiltersProps {
  pills: Pill[];
  activeValues: string[];
  paramName?: string;
}

/**
 * Airbnb-style horizontal scrollable pill row. The "Tous" pill (value="")
 * clears the param; other pills toggle on/off and persist as a
 * comma-separated value in `searchParams[paramName]`. Reads from
 * useSearchParams directly so the active state survives back/forward.
 */
export function ListingPillFilters({
  pills,
  activeValues,
  paramName = "tags",
}: ListingPillFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function push(nextValues: string[]) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    if (nextValues.length === 0) {
      params.delete(paramName);
    } else {
      params.set(paramName, nextValues.join(","));
    }
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    });
  }

  function toggle(value: string) {
    if (value === "") {
      push([]);
      return;
    }
    const next = activeValues.includes(value)
      ? activeValues.filter((v) => v !== value)
      : [...activeValues, value];
    push(next);
  }

  return (
    <div
      className="scrollbar-hidden scroll-snap-x flex gap-2 overflow-x-auto border-b border-line-soft py-6"
      role="tablist"
    >
      {pills.map((pill) => {
        const isActive =
          pill.value === ""
            ? activeValues.length === 0
            : activeValues.includes(pill.value);
        return (
          <button
            key={pill.value || "all"}
            type="button"
            onClick={() => toggle(pill.value)}
            aria-pressed={isActive}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[0.85rem] font-medium transition-all",
              isActive
                ? "border-primary bg-primary text-ivory"
                : "border-line bg-card text-charcoal hover:border-charcoal hover:bg-sand",
            )}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
