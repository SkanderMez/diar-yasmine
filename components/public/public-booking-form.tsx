"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { differenceInCalendarDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatTND } from "@/lib/money";
import { calculateReservationTotal } from "@/lib/pricing";
import { createReservation } from "@/lib/reservations";

interface PublicBookingFormProps {
  propertyId: string;
  propertyName: string;
  propertyType: "CHALET" | "BUNGALOW";
  basePrice: number;
  cleaningFee: number;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  childrenCount: number;
  taxRate: number;
}

export function PublicBookingForm(props: PublicBookingFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [guestRequests, setGuestRequests] = useState("");
  const [country, setCountry] = useState("");

  const nights = useMemo(
    () =>
      differenceInCalendarDays(
        new Date(`${props.checkOutDate}T00:00:00`),
        new Date(`${props.checkInDate}T00:00:00`),
      ),
    [props.checkInDate, props.checkOutDate],
  );

  const breakdown = useMemo(
    () =>
      calculateReservationTotal({
        property: {
          basePrice: props.basePrice,
          cleaningFee: props.cleaningFee,
        },
        nights,
        taxRate: props.taxRate,
      }),
    [props.basePrice, props.cleaningFee, nights, props.taxRate],
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await createReservation({
          propertyId: props.propertyId,
          checkInDate: props.checkInDate,
          checkOutDate: props.checkOutDate,
          adults: props.adults,
          children: props.childrenCount,
          source: "DIRECT_WEB",
          guest: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email: email.trim() || undefined,
            country: country.trim() || undefined,
          },
          guestRequests: guestRequests.trim() || undefined,
        });
        router.push(`/book/confirmed?code=${result.code}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setError(msg);
        toast.error("Réservation non confirmée", { description: msg });
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="space-y-2">
          <h2 className="text-xl font-medium text-foreground">
            Vos informations
          </h2>
          <p className="text-sm text-muted-foreground">
            Téléphone obligatoire. Email recommandé pour recevoir le voucher.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="firstName"
            label="Prénom"
            required
            value={firstName}
            onChange={setFirstName}
          />
          <Field
            id="lastName"
            label="Nom"
            required
            value={lastName}
            onChange={setLastName}
          />
          <Field
            id="phone"
            label="Téléphone (avec indicatif)"
            placeholder="+216 ..."
            required
            type="tel"
            value={phone}
            onChange={setPhone}
          />
          <Field
            id="email"
            label="Email (facultatif)"
            type="email"
            value={email}
            onChange={setEmail}
          />
          <div className="sm:col-span-2">
            <Field
              id="country"
              label="Pays de résidence (facultatif)"
              value={country}
              onChange={setCountry}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="requests">
            Demandes particulières{" "}
            <span className="text-muted-foreground">(facultatif)</span>
          </Label>
          <Textarea
            id="requests"
            value={guestRequests}
            onChange={(e) => setGuestRequests(e.target.value)}
            placeholder="Heure d'arrivée, allergies, accès handicapé, etc."
            rows={3}
            maxLength={2000}
          />
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <p className="max-w-md text-xs text-muted-foreground">
            En confirmant, vous acceptez nos conditions générales. La
            réservation passe en statut <strong>En attente</strong> jusqu&apos;à
            réception du paiement. Notre équipe vous contactera dans les heures
            qui suivent.
          </p>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Confirmation…" : "Confirmer la réservation"}
          </Button>
        </div>
      </div>

      <aside className="space-y-4 self-start rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
        <header>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Récapitulatif
          </p>
          <h3 className="mt-1 text-lg font-medium text-foreground">
            {props.propertyType === "CHALET" ? "🏖️ " : "🌿 "}
            {props.propertyName}
          </h3>
        </header>

        <dl className="space-y-1.5 text-sm">
          <Row label="Arrivée" value={props.checkInDate} />
          <Row label="Départ" value={props.checkOutDate} />
          <Row
            label="Voyageurs"
            value={`${props.adults} adulte${props.adults > 1 ? "s" : ""}${props.childrenCount ? ` · ${props.childrenCount} enfant${props.childrenCount > 1 ? "s" : ""}` : ""}`}
          />
        </dl>

        <div className="space-y-1.5 border-t border-border pt-3 text-sm">
          <Row
            label={`${nights} × ${formatTND(breakdown.nightlyPrice)}`}
            value={formatTND(breakdown.basePrice)}
          />
          {breakdown.cleaningFee > 0 && (
            <Row
              label="Frais de ménage"
              value={formatTND(breakdown.cleaningFee)}
              muted
            />
          )}
          <Row label="Sous-total" value={formatTND(breakdown.subtotal)} muted />
          {breakdown.tax > 0 && (
            <Row
              label={`TVA (${(props.taxRate * 100).toFixed(0)}%)`}
              value={formatTND(breakdown.tax)}
              muted
            />
          )}
        </div>

        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="text-sm font-medium">Total</span>
          <span className="text-2xl font-medium text-primary">
            {formatTND(breakdown.total)}
          </span>
        </div>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Input
        id={id}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  const tone = muted ? "text-muted-foreground" : "text-foreground";
  return (
    <div className={`flex items-baseline justify-between ${tone}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
