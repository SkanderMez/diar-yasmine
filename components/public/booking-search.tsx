"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./date-range-picker";

/**
 * Hero booking search — pill layout with hébergement select, embedded
 * date range picker (custom), guests counter, and a deep-teal CTA.
 */
export function BookingSearch() {
  const router = useRouter();
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
    <div className="rounded-3xl bg-ivory/95 p-2 shadow-2xl backdrop-blur-md">
      <div className="grid grid-cols-1 items-stretch gap-2 sm:grid-cols-[1.1fr_2fr_1fr_auto]">
        {/* Hébergement */}
        <label className="block cursor-pointer rounded-2xl px-5 py-3 transition-colors hover:bg-bone">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Hébergement
          </span>
          <div className="mt-0.5 flex items-center gap-2">
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
        </label>

        {/* Date range — custom picker */}
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

        {/* Guests */}
        <label className="block cursor-pointer rounded-2xl px-5 py-3 transition-colors hover:bg-bone">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            <Users className="mr-1 inline size-3" /> Voyageurs
          </span>
          <div className="mt-0.5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="inline-flex size-6 items-center justify-center rounded-full border border-border text-foreground hover:bg-bone"
              aria-label="Moins"
            >
              −
            </button>
            <span className="w-6 text-center text-sm font-medium">
              {guests}
            </span>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
              className="inline-flex size-6 items-center justify-center rounded-full border border-border text-foreground hover:bg-bone"
              aria-label="Plus"
            >
              +
            </button>
          </div>
        </label>

        <Button
          type="button"
          size="lg"
          shape="pill"
          onClick={submit}
          className="my-1 mx-1 gap-2 bg-primary text-primary-foreground hover:bg-deep sm:my-0"
        >
          <Search className="size-4" />
          <span>Rechercher</span>
        </Button>
      </div>
    </div>
  );
}
