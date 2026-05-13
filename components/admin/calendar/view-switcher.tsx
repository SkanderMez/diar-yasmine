"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addDays, format } from "date-fns";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEWS = [14, 30, 90] as const;

interface ViewSwitcherProps {
  start: string; // YYYY-MM-DD
  days: number;
}

export function ViewSwitcher({ start, days }: ViewSwitcherProps) {
  const router = useRouter();
  const search = useSearchParams();

  function navigate(nextStart: string, nextDays: number) {
    const params = new URLSearchParams(search?.toString());
    params.set("start", nextStart);
    params.set("days", String(nextDays));
    router.push(`?${params.toString()}`);
  }

  function shift(delta: number) {
    const base = new Date(`${start}T00:00:00`);
    const next = addDays(base, delta);
    navigate(format(next, "yyyy-MM-dd"), days);
  }

  function jumpToToday() {
    navigate(format(new Date(), "yyyy-MM-dd"), days);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => shift(-days)}
          aria-label="Période précédente"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={jumpToToday}
          className="gap-1"
        >
          <RotateCcw className="size-3" /> Aujourd&apos;hui
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => shift(days)}
          aria-label="Période suivante"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1">
        {VIEWS.map((v) => (
          <Button
            key={v}
            size="xs"
            variant={v === days ? "default" : "ghost"}
            onClick={() => navigate(start, v)}
          >
            {v}j
          </Button>
        ))}
      </div>
    </div>
  );
}
