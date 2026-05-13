"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users } from "lucide-react";
import { differenceInCalendarDays, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatTND } from "@/lib/money";

interface BookingWidgetProps {
  propertyId: string;
  propertySlug: string;
  basePrice: number; // millimes
  cleaningFee: number;
  capacity: number;
  taxRate: number;
}

/**
 * Sticky booking widget on the property detail page.
 *
 * Phase 3 MVP: collects dates + guests and forwards to /book?... where
 * the funnel computes the real tariff (with seasonal multiplier) and
 * collects guest details + payment.
 */
export function BookingWidget({
  propertyId,
  propertySlug,
  basePrice,
  cleaningFee,
  capacity,
  taxRate,
}: BookingWidgetProps) {
  const router = useRouter();
  const today = format(new Date(), "yyyy-MM-dd");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return null;
    const n = differenceInCalendarDays(
      new Date(`${checkOut}T00:00:00`),
      new Date(`${checkIn}T00:00:00`),
    );
    return n > 0 ? n : null;
  }, [checkIn, checkOut]);

  const totalEstimate = useMemo(() => {
    if (!nights) return null;
    const base = basePrice * nights;
    const subtotal = base + cleaningFee;
    const tax = Math.round(subtotal * taxRate);
    return subtotal + tax;
  }, [nights, basePrice, cleaningFee, taxRate]);

  const tooManyGuests = adults + children > capacity;

  function submit() {
    if (!checkIn || !checkOut || !nights || tooManyGuests) return;
    const params = new URLSearchParams({
      propertyId,
      propertySlug,
      checkIn,
      checkOut,
      adults: String(adults),
      children: String(children),
    });
    router.push(`/book?${params.toString()}`);
  }

  return (
    <aside className="sticky top-24 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-md">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-medium text-primary">
          {formatTND(basePrice)}
        </span>
        <span className="text-xs text-muted-foreground">par nuit</span>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="ci" className="text-xs">
              Arrivée
            </Label>
            <Input
              id="ci"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co" className="text-xs">
              Départ
            </Label>
            <Input
              id="co"
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="ad" className="text-xs">
              Adultes
            </Label>
            <Input
              id="ad"
              type="number"
              min={1}
              max={capacity}
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ch" className="text-xs">
              Enfants
            </Label>
            <Input
              id="ch"
              type="number"
              min={0}
              max={capacity}
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {nights ? (
        <dl className="space-y-1 border-t border-border pt-3 text-sm">
          <div className="flex items-baseline justify-between">
            <dt>
              {nights} × {formatTND(basePrice)}
            </dt>
            <dd>{formatTND(basePrice * nights)}</dd>
          </div>
          {cleaningFee > 0 && (
            <div className="flex items-baseline justify-between text-muted-foreground">
              <dt>Frais de ménage</dt>
              <dd>{formatTND(cleaningFee)}</dd>
            </div>
          )}
          {totalEstimate !== null && (
            <div className="flex items-baseline justify-between border-t border-border pt-2 font-medium">
              <dt>Total estimé</dt>
              <dd className="text-primary">{formatTND(totalEstimate)}</dd>
            </div>
          )}
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground">
          <Calendar className="mr-1 inline size-3.5" /> Choisissez vos dates
          pour voir le tarif.
        </p>
      )}

      {tooManyGuests && (
        <p className="text-xs text-destructive">
          <Users className="mr-1 inline size-3.5" /> Capacité maximum :{" "}
          {capacity} personnes.
        </p>
      )}

      <Button
        type="button"
        className="w-full"
        onClick={submit}
        disabled={!nights || tooManyGuests}
      >
        Continuer la réservation
      </Button>

      <p className="text-[10px] text-muted-foreground">
        Tarif définitif calculé à l&apos;étape suivante (saison, TVA, remises).
      </p>
    </aside>
  );
}
