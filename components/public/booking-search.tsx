"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar, ChevronDown, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Hero booking search bar — Airbnb-inspired pill layout. Five segments
 * separated by vertical dividers; the right-most CTA is honey-coloured
 * and casts a luminous shadow.
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
    <div className="rounded-full bg-ivory/95 p-2 shadow-2xl backdrop-blur-md">
      <div className="grid grid-cols-1 items-stretch divide-y divide-border sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto] sm:divide-x sm:divide-y-0">
        <Field label="Hébergement">
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full appearance-none bg-transparent text-sm font-medium text-foreground outline-none"
            >
              <option value="chalets">Chalets bord de mer</option>
              <option value="bungalows">Bungalows jardin</option>
            </select>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </div>
        </Field>

        <Field label="Arrivée" icon={<Calendar className="size-3.5" />}>
          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none [color-scheme:light]"
          />
        </Field>

        <Field label="Départ" icon={<Calendar className="size-3.5" />}>
          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none [color-scheme:light]"
          />
        </Field>

        <Field label="Voyageurs" icon={<Users className="size-3.5" />}>
          <input
            type="number"
            min={1}
            max={20}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none"
          />
        </Field>

        <Button
          type="button"
          size="lg"
          shape="pill"
          onClick={submit}
          className="my-1 mx-1 gap-2 bg-honey text-charcoal shadow-md hover:bg-honey-light hover:text-charcoal sm:my-0"
        >
          <Search className="size-4" />
          <span>Rechercher</span>
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
    <label className="block cursor-pointer rounded-full px-5 py-3 transition-colors hover:bg-bone/70">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {icon}
        {label}
      </span>
      <div className="mt-0.5">{children}</div>
    </label>
  );
}
