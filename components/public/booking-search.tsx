"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Home,
  Minus,
  Plus,
  Search,
  Users,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRangePicker } from "./date-range-picker";

type TypeKey = "all" | "chalets" | "bungalows";

interface TypeOption {
  value: TypeKey;
  label: string;
  hint: string;
  icon: React.ReactNode;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "all",
    label: "Tous les hébergements",
    hint: "Chalets + bungalows",
    icon: <Home className="size-4" />,
  },
  {
    value: "chalets",
    label: "Les Chalets",
    hint: "Pieds dans l'eau",
    icon: <Waves className="size-4" />,
  },
  {
    value: "bungalows",
    label: "Les Bungalows",
    hint: "Au cœur du jardin",
    icon: <Home className="size-4" />,
  },
];

/**
 * Hero booking widget — matches the maquette `.booking-widget`.
 *
 * Layout: white pill, 4 segments separated by hairline dividers, primary
 * search CTA on the right. The Hébergement select is a custom popover
 * (modern look + supports icons + hints). The date range picker opens a
 * portaled modal calendar; the guests popover is also portaled so it
 * floats above any section below the hero.
 */
export function BookingSearch() {
  const router = useRouter();
  const [type, setType] = useState<TypeKey>("all");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  // Renamed from `children` to avoid colliding with React's reserved
  // children prop in the popover component below.
  const [childrenCount, setChildrenCount] = useState(0);

  function submit() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    const total = adults + childrenCount;
    if (total > 1) params.set("guests", String(total));
    const qs = params.toString();
    const destination = type === "all" ? "/search" : `/${type}`;
    router.push(`${destination}${qs ? `?${qs}` : ""}`);
  }

  const guestsLabel =
    childrenCount > 0
      ? `${adults} adulte${adults > 1 ? "s" : ""}, ${childrenCount} enfant${childrenCount > 1 ? "s" : ""}`
      : `${adults} adulte${adults > 1 ? "s" : ""}`;

  const activeType =
    TYPE_OPTIONS.find((o) => o.value === type) ?? TYPE_OPTIONS[0]!;

  return (
    <div className="rounded-2xl bg-white p-1.5 shadow-2xl">
      <div className="grid grid-cols-1 items-stretch gap-0.5 sm:grid-cols-[1.4fr_minmax(0,2fr)_1fr_auto]">
        {/* Hébergement — custom popover select */}
        <TypeSelect value={type} activeOption={activeType} onChange={setType} />

        {/* Dates */}
        <div className="px-1">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(r) => {
              setCheckIn(r.checkIn);
              setCheckOut(r.checkOut);
            }}
          />
        </div>

        {/* Voyageurs — portaled centered popover */}
        <GuestsPopover
          adults={adults}
          childrenCount={childrenCount}
          onAdultsChange={setAdults}
          onChildrenChange={setChildrenCount}
          summary={guestsLabel}
        />

        {/* Search CTA */}
        <button
          type="button"
          onClick={submit}
          className="my-1 mx-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-medium text-ivory shadow-sm transition-all hover:-translate-y-px hover:bg-bougainvillier hover:shadow-md sm:my-0"
        >
          <Search className="size-4" />
          <span>Rechercher</span>
        </button>
      </div>
    </div>
  );
}

/* ============================================================
 * Custom type select
 * ========================================================== */

function TypeSelect({
  value,
  activeOption,
  onChange,
}: {
  value: TypeKey;
  activeOption: TypeOption;
  onChange: (v: TypeKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [anchor, setAnchor] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Position the floating dropdown against the trigger's bounding rect.
  // Recomputes on open + on resize/scroll while open so the menu always
  // sits flush under the trigger regardless of section stacking context.
  useEffect(() => {
    if (!open) return;
    function update() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setAnchor({
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
      });
    }
    update();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      const menu = document.getElementById("dy-type-select-menu");
      if (menu?.contains(t)) return;
      setOpen(false);
    }
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(next: TypeKey) {
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-left transition-colors hover:bg-sand",
          open && "bg-sand",
        )}
      >
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Hébergement
          </span>
          <span className="mt-0.5 block truncate text-[15px] font-medium text-charcoal">
            {activeOption.label}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "ml-2 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open &&
        mounted &&
        anchor &&
        createPortal(
          <div
            id="dy-type-select-menu"
            role="listbox"
            className="fixed z-[100] overflow-hidden rounded-2xl border border-line-soft bg-white shadow-2xl"
            style={{
              top: `${anchor.top}px`,
              left: `${anchor.left}px`,
              width: `${anchor.width}px`,
            }}
          >
            {TYPE_OPTIONS.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(option.value)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-sand",
                    active && "bg-sand/70",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex size-9 shrink-0 items-center justify-center rounded-full",
                      active
                        ? "bg-primary text-ivory"
                        : "bg-sand text-charcoal",
                    )}
                    aria-hidden
                  >
                    {option.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-medium text-charcoal">
                      {option.label}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      {option.hint}
                    </span>
                  </span>
                  {active && (
                    <Check
                      className="size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

/* ============================================================
 * Guests popover (portal, centered modal pattern like the date picker)
 * ========================================================== */

function GuestsPopover({
  adults,
  childrenCount,
  onAdultsChange,
  onChildrenChange,
  summary,
}: {
  adults: number;
  childrenCount: number;
  onAdultsChange: (v: number) => void;
  onChildrenChange: (v: number) => void;
  summary: string;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-xl px-4 py-3 text-left transition-colors hover:bg-sand"
      >
        <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          <Users className="mr-1 inline size-3" /> Voyageurs
        </span>
        <span className="mt-0.5 block text-[15px] font-medium text-charcoal">
          {summary}
        </span>
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <div className="relative w-full max-w-sm rounded-3xl border border-line-soft bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-heading text-lg text-charcoal">
                  Voyageurs
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-sand hover:text-charcoal"
                >
                  Fermer
                </button>
              </div>
              <div className="space-y-4">
                <Counter
                  label="Adultes"
                  hint="13 ans et +"
                  value={adults}
                  min={1}
                  max={20}
                  onChange={onAdultsChange}
                />
                <Counter
                  label="Enfants"
                  hint="2 à 12 ans"
                  value={childrenCount}
                  min={0}
                  max={10}
                  onChange={onChildrenChange}
                />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-6 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-ivory transition-colors hover:bg-bougainvillier"
              >
                Valider
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function Counter({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-charcoal">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Moins"
          className="inline-flex size-9 items-center justify-center rounded-full border border-line text-charcoal transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Minus className="size-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Plus"
          className="inline-flex size-9 items-center justify-center rounded-full border border-line text-charcoal transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
