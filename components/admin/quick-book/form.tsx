"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { differenceInCalendarDays, format } from "date-fns";
import type { z } from "zod";
import { createReservationSchema } from "@/lib/schemas/reservation";
import { createReservation } from "@/lib/reservations";
import type { PricingExtra } from "@/lib/pricing";

// Use the schema's *input* type (before .default() is applied) so the form
// values match react-hook-form's expectations. The Server Action re-parses
// and applies defaults, so we can pass these values straight through.
type QuickBookFormValues = z.input<typeof createReservationSchema>;
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriceSummary } from "./price-summary";
import { useQuickBook } from "./provider";

const SOURCES = [
  { value: "PHONE", label: "📞 Téléphone" },
  { value: "WALK_IN", label: "🚶 Walk-in" },
  { value: "PARTNER", label: "🤝 Partenaire" },
  { value: "DIRECT_WEB", label: "🌐 Site direct" },
  { value: "BOOKING", label: "Booking.com" },
  { value: "AIRBNB", label: "Airbnb" },
  { value: "EXPEDIA", label: "Expedia" },
  { value: "OTHER", label: "Autre" },
] as const;

const PAYMENT_METHODS = [
  { value: "CASH", label: "Espèces" },
  { value: "CARD", label: "Carte (manuel)" },
  { value: "TRANSFER", label: "Virement" },
  { value: "FLOUCI", label: "Flouci" },
  { value: "OTHER", label: "Autre" },
] as const;

interface QuickBookFormProps {
  taxRate: number;
}

export function QuickBookForm({ taxRate }: QuickBookFormProps) {
  const { properties, prefill, closeQuickBook } = useQuickBook();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<QuickBookFormValues>({
    resolver: zodResolver(createReservationSchema) as never,
    defaultValues: {
      propertyId: prefill.propertyId ?? "",
      checkInDate: prefill.checkInDate ?? "",
      checkOutDate: prefill.checkOutDate ?? "",
      adults: 2,
      children: 0,
      source: "PHONE",
      extras: [],
      discount: { type: "NONE", value: 0 },
      voucherChannel: "NONE",
      guest: {
        firstName: "",
        lastName: "",
        phone: "",
      },
    },
  });

  const watched = useWatch({ control: form.control });
  const property = properties.find((p) => p.id === watched.propertyId);

  const nights = useMemo(() => {
    if (!watched.checkInDate || !watched.checkOutDate) return null;
    try {
      const a = new Date(`${watched.checkInDate}T00:00:00`);
      const b = new Date(`${watched.checkOutDate}T00:00:00`);
      const n = differenceInCalendarDays(b, a);
      return n > 0 ? n : null;
    } catch {
      return null;
    }
  }, [watched.checkInDate, watched.checkOutDate]);

  // Phase 2 simplification: we don't read season per-range live; the
  // Server Action recomputes the multiplier from the DB at submit time.
  // The price summary reflects standard pricing (×1.0).
  const seasonMultiplierBp = 1000;

  // Ctrl/Cmd+Enter to submit.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  function onSubmit(values: QuickBookFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        const result = await createReservation(values);
        toast.success(`Réservation créée : ${result.code}`, {
          description: `Total ${(result.total / 1000).toFixed(3)} TND`,
        });
        form.reset();
        closeQuickBook();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setServerError(message);
        toast.error("Création échouée", { description: message });
      }
    });
  }

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid h-full gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_360px]"
    >
      <div className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Séjour
          </h3>

          <div className="space-y-2">
            <Label htmlFor="propertyId">Hébergement</Label>
            <Select
              value={form.watch("propertyId") ?? ""}
              onValueChange={(v) =>
                form.setValue("propertyId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger id="propertyId">
                <SelectValue placeholder="Sélectionner une unité" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.type === "CHALET" ? "🏖️ " : "🌿 "}
                    {p.name}{" "}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({(p.basePrice / 1000).toFixed(0)} TND/nuit)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={form.formState.errors.propertyId?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="checkInDate">Arrivée</Label>
              <Input
                id="checkInDate"
                type="date"
                min={today}
                {...form.register("checkInDate")}
              />
              <FieldError
                message={form.formState.errors.checkInDate?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checkOutDate">Départ</Label>
              <Input
                id="checkOutDate"
                type="date"
                min={watched.checkInDate || today}
                {...form.register("checkOutDate")}
              />
              <FieldError
                message={form.formState.errors.checkOutDate?.message}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="adults">Adultes</Label>
              <Input
                id="adults"
                type="number"
                min={1}
                max={20}
                {...form.register("adults", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="children">Enfants</Label>
              <Input
                id="children"
                type="number"
                min={0}
                max={20}
                {...form.register("children", { valueAsNumber: true })}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Client
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" {...form.register("guest.firstName")} />
              <FieldError
                message={form.formState.errors.guest?.firstName?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" {...form.register("guest.lastName")} />
              <FieldError
                message={form.formState.errors.guest?.lastName?.message}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+216 ..."
                {...form.register("guest.phone")}
              />
              <FieldError
                message={form.formState.errors.guest?.phone?.message}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email{" "}
                <span className="text-muted-foreground">(facultatif)</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...form.register("guest.email")}
              />
              <FieldError
                message={form.formState.errors.guest?.email?.message}
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Source & remise
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Select
                value={form.watch("source") ?? "PHONE"}
                onValueChange={(v) =>
                  form.setValue("source", v as QuickBookFormValues["source"])
                }
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountType">Remise</Label>
              <Select
                value={form.watch("discount.type") ?? "NONE"}
                onValueChange={(v) =>
                  form.setValue(
                    "discount.type",
                    v as NonNullable<QuickBookFormValues["discount"]>["type"],
                  )
                }
              >
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Aucune</SelectItem>
                  <SelectItem value="PERCENT">% (0-100)</SelectItem>
                  <SelectItem value="FIXED">Fixe (TND)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {watched.discount?.type !== "NONE" && (
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                {watched.discount?.type === "PERCENT"
                  ? "% de remise"
                  : "Montant remise (millimes)"}
              </Label>
              <Input
                id="discountValue"
                type="number"
                min={0}
                {...form.register("discount.value", { valueAsNumber: true })}
              />
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Paiement à la création
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="payAmount">Acompte (millimes, 0 = aucun)</Label>
              <Input
                id="payAmount"
                type="number"
                min={0}
                {...form.register("payment.amount", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payMethod">Méthode</Label>
              <Select
                value={form.watch("payment.method") ?? "CASH"}
                onValueChange={(v) =>
                  form.setValue(
                    "payment.method",
                    v as NonNullable<QuickBookFormValues["payment"]>["method"],
                  )
                }
              >
                <SelectTrigger id="payMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Notes
          </h3>
          <Textarea
            placeholder="Notes internes (non visible client)"
            {...form.register("internalNotes")}
            rows={2}
          />
          <Textarea
            placeholder="Demandes du client (visible sur voucher)"
            {...form.register("guestRequests")}
            rows={2}
          />
        </section>

        {serverError && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {serverError}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" onClick={closeQuickBook}>
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Création…" : "Confirmer la réservation"}
            <kbd className="ml-2 hidden rounded bg-primary-foreground/10 px-1.5 py-0.5 text-[10px] sm:inline">
              ⌘ ↵
            </kbd>
          </Button>
        </div>
      </div>

      <PriceSummary
        property={property}
        nights={nights}
        extras={
          // Filter to entries with defined label + amount so the pricing
          // engine's strict types are satisfied (the UI doesn't expose
          // extras yet in Phase 2 — this list stays empty).
          (watched.extras ?? []).flatMap<PricingExtra>((e) =>
            e?.label && typeof e?.amount === "number"
              ? [{ label: e.label, amount: e.amount, category: e.category }]
              : [],
          )
        }
        discount={{
          type: watched.discount?.type ?? "NONE",
          value:
            typeof watched.discount?.value === "number"
              ? watched.discount.value
              : 0,
        }}
        taxRate={taxRate}
        seasonMultiplierBp={seasonMultiplierBp}
      />
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}
