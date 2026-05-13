"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PRESETS = [
  { label: "Aujourd'hui", days: 0 },
  { label: "7 jours", days: 7 },
  { label: "30 jours", days: 30 },
] as const;

const METHODS = [
  "CASH",
  "CARD",
  "TRANSFER",
  "STRIPE",
  "FLOUCI",
  "KONNECT",
  "OTHER",
] as const;

const STATUSES = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
] as const;

interface PaymentsFiltersProps {
  defaults: {
    start: string;
    end: string;
    method?: string;
    status?: string;
    q?: string;
  };
}

export function PaymentsFilters({ defaults }: PaymentsFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();

  function setParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(sp?.toString());
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, value);
    router.push(`?${params.toString()}`);
  }

  function applyPreset(days: number) {
    const end = format(new Date(), "yyyy-MM-dd");
    const start = format(subDays(new Date(), days), "yyyy-MM-dd");
    const params = new URLSearchParams(sp?.toString());
    params.set("start", start);
    params.set("end", end);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-end gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.days}
            size="sm"
            variant="outline"
            onClick={() => applyPreset(p.days)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="start" className="text-xs">
          Du
        </Label>
        <Input
          id="start"
          type="date"
          defaultValue={defaults.start}
          onChange={(e) => setParam("start", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="end" className="text-xs">
          Au
        </Label>
        <Input
          id="end"
          type="date"
          defaultValue={defaults.end}
          onChange={(e) => setParam("end", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="method" className="text-xs">
          Méthode
        </Label>
        <Select
          defaultValue={defaults.method ?? "ALL"}
          onValueChange={(v) => setParam("method", v === "ALL" ? undefined : v)}
        >
          <SelectTrigger id="method" className="min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            {METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status" className="text-xs">
          Statut
        </Label>
        <Select
          defaultValue={defaults.status ?? "ALL"}
          onValueChange={(v) => setParam("status", v === "ALL" ? undefined : v)}
        >
          <SelectTrigger id="status" className="min-w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="q" className="text-xs">
          Recherche
        </Label>
        <Input
          id="q"
          type="search"
          placeholder="Code DY-…, téléphone, nom, référence"
          defaultValue={defaults.q ?? ""}
          onChange={(e) => setParam("q", e.target.value || undefined)}
        />
      </div>
    </div>
  );
}
