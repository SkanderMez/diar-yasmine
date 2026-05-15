"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Minus, Plus, Search, Users } from "lucide-react";
import { DateRangePicker } from "@/components/public/date-range-picker";
import { cn } from "@/lib/utils";

interface SortOption {
  value: string;
  label: string;
}

interface FloatingFilterBarProps {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialMaxPrice?: number;
  sortOptions: SortOption[];
}

/**
 * White rounded filter bar that overlaps the hero by -50px. Cells:
 * Dates / Voyageurs / Capacité min / Prix max / Tri / Rechercher. The
 * Rechercher button commits everything to URL search params and the
 * server re-fetches. Selects also commit immediately so the user gets
 * instant feedback when switching sort / capacity / etc.
 */
export function FloatingFilterBar({
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialMaxPrice,
  sortOptions,
}: FloatingFilterBarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const [checkIn, setCheckIn] = useState(initialCheckIn ?? "");
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? "");
  const [guests, setGuests] = useState(initialGuests ?? 2);
  const [capacity, setCapacity] = useState(sp?.get("capacity") ?? "");
  const [maxPrice, setMaxPrice] = useState(
    initialMaxPrice ? String(initialMaxPrice) : "",
  );
  const [sort, setSort] = useState(
    sp?.get("sort") ?? sortOptions[0]?.value ?? "",
  );

  function buildParams(overrides: Partial<Record<string, string>> = {}) {
    const params = new URLSearchParams();
    const merged: Record<string, string> = {
      checkIn,
      checkOut,
      guests: guests > 1 ? String(guests) : "",
      capacity,
      maxPrice,
      sort: sort && sort !== sortOptions[0]?.value ? sort : "",
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v);
    }
    // Preserve any other filter params (amenities, pool, etc.) coming from
    // the sidebar so the two filter surfaces don't fight each other.
    sp?.forEach((value, key) => {
      if (!(key in merged)) params.set(key, value);
    });
    return params;
  }

  function pushParams(params: URLSearchParams) {
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `?${qs}` : "?", { scroll: false });
    });
  }

  function apply() {
    pushParams(buildParams());
  }

  return (
    <div className="container-x relative z-[3] -mt-[50px]">
      <div
        className={cn(
          "relative rounded-2xl bg-card p-3 shadow-lg",
          "grid grid-cols-1 gap-2 md:grid-cols-2 lg:[grid-template-columns:1.4fr_1.2fr_1fr_1fr_1fr_auto]",
        )}
      >
        <div className="filter-bar-date-wrap">
          <DateRangePicker
            variant="compact"
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(r) => {
              setCheckIn(r.checkIn);
              setCheckOut(r.checkOut);
            }}
          />
        </div>

        <GuestsField guests={guests} onChange={setGuests} />

        <SelectField
          label="Capacité min."
          value={capacity}
          onChange={(v) => {
            setCapacity(v);
            pushParams(buildParams({ capacity: v }));
          }}
          options={[
            { value: "", label: "Indifférent" },
            { value: "2", label: "2 voyageurs" },
            { value: "4", label: "4 voyageurs" },
            { value: "6", label: "6 voyageurs" },
            { value: "8", label: "8+ voyageurs" },
          ]}
        />

        <PriceField value={maxPrice} onChange={setMaxPrice} onCommit={apply} />

        <SelectField
          label="Tri"
          value={sort}
          onChange={(v) => {
            setSort(v);
            pushParams(
              buildParams({
                sort: v && v !== sortOptions[0]?.value ? v : "",
              }),
            );
          }}
          options={sortOptions}
        />

        <button
          type="button"
          onClick={apply}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-7 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-bougainvillier hover:shadow-md"
        >
          <Search className="size-[18px]" />
          <span>Rechercher</span>
        </button>
      </div>
    </div>
  );
}

function FieldWrapper({
  children,
  withDivider = true,
}: {
  children: React.ReactNode;
  withDivider?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative cursor-pointer rounded-md px-4 py-3 transition-colors hover:bg-sand",
        withDivider &&
          "lg:after:absolute lg:after:bottom-[20%] lg:after:right-[-1px] lg:after:top-[20%] lg:after:w-px lg:after:bg-line lg:after:content-['']",
      )}
    >
      {children}
    </div>
  );
}

function GuestsField({
  guests,
  onChange,
}: {
  guests: number;
  onChange: (n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <FieldWrapper>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="block w-full text-left"
        >
          <span className="mb-[2px] block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Voyageurs
          </span>
          <span className="flex items-center gap-1.5 text-[0.9rem] font-medium text-charcoal">
            <Users className="size-3.5 text-muted-foreground" />
            <span>
              {guests} voyageur{guests > 1 ? "s" : ""}
            </span>
          </span>
        </button>
      </FieldWrapper>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl bg-card p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Voyageurs</p>
              <p className="text-xs text-muted-foreground">
                Adultes et enfants
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onChange(Math.max(1, guests - 1))}
                disabled={guests <= 1}
                className="inline-flex size-9 items-center justify-center rounded-full border border-line text-foreground transition-colors hover:border-foreground hover:bg-sand disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Moins"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-6 text-center text-sm font-medium">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => onChange(Math.min(20, guests + 1))}
                disabled={guests >= 20}
                className="inline-flex size-9 items-center justify-center rounded-full border border-line text-foreground transition-colors hover:border-foreground hover:bg-sand disabled:cursor-not-allowed disabled:opacity-30"
                aria-label="Plus"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <FieldWrapper>
      <label className="block w-full cursor-pointer">
        <span className="mb-[2px] block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span className="flex items-center justify-between gap-1.5 text-[0.9rem] font-medium text-charcoal">
          <span>{current?.label}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={label}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </FieldWrapper>
  );
}

function PriceField({
  value,
  onChange,
  onCommit,
}: {
  value: string;
  onChange: (v: string) => void;
  onCommit: () => void;
}) {
  return (
    <FieldWrapper>
      <label className="block w-full cursor-pointer">
        <span className="mb-[2px] block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Prix max
        </span>
        <span className="flex items-baseline gap-1 text-[0.9rem] font-medium text-charcoal">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onCommit}
            placeholder="0"
            className="w-full bg-transparent text-charcoal outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-muted-foreground">TND</span>
        </span>
      </label>
    </FieldWrapper>
  );
}
