"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Minus, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./date-range-picker";

/**
 * Hero booking search — single pill containing four segments plus the
 * primary CTA. The date range picker uses the custom calendar component
 * so empty states read "Sélectionner" rather than a bare dash.
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
    <div className="rounded-[28px] bg-ivory/97 p-1.5 shadow-2xl ring-1 ring-charcoal/5 backdrop-blur-md">
      <div className="grid grid-cols-1 items-stretch gap-1.5 sm:grid-cols-[1.1fr_2.4fr_1.2fr_auto]">
        <label className="group flex cursor-pointer flex-col justify-center rounded-3xl px-5 py-3 transition-colors hover:bg-bone">
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

        <div className="rounded-3xl bg-transparent transition-colors hover:bg-bone">
          <DateRangePicker
            checkIn={checkIn}
            checkOut={checkOut}
            onChange={(r) => {
              setCheckIn(r.checkIn);
              setCheckOut(r.checkOut);
            }}
          />
        </div>

        <div className="flex cursor-default items-center justify-between gap-2 rounded-3xl px-5 py-3 transition-colors hover:bg-bone">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              <Users className="mr-1 inline size-3" /> Voyageurs
            </span>
            <span className="text-sm font-medium text-foreground">
              {guests} voyageur{guests > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              disabled={guests <= 1}
              className="inline-flex size-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground disabled:opacity-30"
              aria-label="Moins"
            >
              <Minus className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setGuests((g) => Math.min(20, g + 1))}
              disabled={guests >= 20}
              className="inline-flex size-7 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground disabled:opacity-30"
              aria-label="Plus"
            >
              <Plus className="size-3" />
            </button>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          shape="pill"
          onClick={submit}
          className="my-0.5 mx-0.5 gap-2 bg-primary text-primary-foreground hover:bg-deep sm:my-0"
        >
          <Search className="size-4" />
          <span>Rechercher</span>
        </Button>
      </div>
    </div>
  );
}
