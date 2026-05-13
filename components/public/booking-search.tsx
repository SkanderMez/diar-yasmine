"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Hero booking search — Airbnb-style segmented pill: type + dates +
 * guests + CTA. Submits to /chalets or /bungalows with dates as
 * searchParams (the listing pages preserve them for future filtering).
 */
export function BookingSearch() {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [type, setType] = useState<"chalets" | "bungalows">("chalets");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);

  function submit() {
    const params = new URLSearchParams();
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", String(guests));
    const qs = params.toString();
    router.push(`/${type}${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="rounded-full bg-white/95 p-1.5 shadow-2xl backdrop-blur-sm md:p-2">
      <div className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <Field label="Type">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          >
            <option value="chalets">Chalets</option>
            <option value="bungalows">Bungalows</option>
          </select>
        </Field>

        <Field label="Arrivée" icon={<Calendar className="size-3.5" />}>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>

        <Field label="Départ" icon={<Calendar className="size-3.5" />}>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>

        <Field label="Voyageurs" icon={<Users className="size-3.5" />}>
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent text-sm text-foreground outline-none"
          />
        </Field>

        <Button
          type="button"
          size="lg"
          shape="pill"
          onClick={submit}
          className="m-1 gap-2 sm:m-0"
        >
          <Search className="size-4" />
          <span className="sm:hidden md:inline">Rechercher</span>
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block cursor-pointer rounded-full px-5 py-3 transition-colors hover:bg-secondary/50">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}
