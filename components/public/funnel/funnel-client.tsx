"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { createReservation } from "@/lib/reservations";
import { previewPromoCode } from "@/lib/promo-codes-actions";
import { FunnelStepper } from "./funnel-stepper";
import { FunnelStepSummary } from "./funnel-step-summary";
import { FunnelGuestForm, type GuestFormValues } from "./funnel-guest-form";
import {
  FunnelStayDetails,
  type StayDetailsValues,
} from "./funnel-stay-details";
import { FunnelRecapSticky } from "./funnel-recap-sticky";
import { FunnelTrustStrip } from "./funnel-trust-strip";
import { FunnelPaymentPreview } from "./funnel-payment-preview";

interface FunnelClientProps {
  property: {
    id: string;
    slug: string;
    name: string;
    type: "CHALET" | "BUNGALOW";
    photoUrl?: string | null;
    beachfront: boolean;
    hasPrivatePool: boolean;
    basePrice: number;
    cleaningFee: number;
  };
  /** YYYY-MM-DD */
  checkIn: string;
  /** YYYY-MM-DD */
  checkOut: string;
  nights: number;
  adults: number;
  childrenCount: number;
  taxRate: number;
  /** Default promo from search params (not yet validated server-side). */
  promoCode?: string;
  /** Published-review aggregate. Null when the property has none yet. */
  rating?: { avg: number; count: number } | null;
  /** Pre-filled guest fields — sourced from the logged-in customer
   *  session so returning visitors don't retype their identity. */
  initialGuest?: Partial<GuestFormValues>;
  /** Whether a customer is logged in — controls the "déjà inscrit ?"
   *  banner at the top of the funnel. */
  isCustomerLoggedIn?: boolean;
}

/**
 * Client orchestrator for the 3-step public funnel.
 *
 * The visible content is driven by `step`; we keep the form values across
 * step navigation so users can move back and forth without losing data.
 * Final submission still goes through `createReservation` (the existing
 * server action) so the existing booking logic isn't disturbed — DIRECT_WEB
 * stays PENDING until the payment phase ships.
 */
export function FunnelClient({
  property,
  checkIn,
  checkOut,
  nights,
  adults,
  childrenCount,
  taxRate,
  promoCode,
  rating,
  initialGuest,
  isCustomerLoggedIn,
}: FunnelClientProps) {
  const router = useRouter();
  // The funnel currently lives at step 2 — step 1 is summarised on top, step
  // 3 is the dashed preview below. The stepper reflects this fixed state.
  const currentStep = 2 as const;
  // Hydrate guest state with whatever the server knows about the
  // logged-in customer; the local form still lets them edit before
  // submission.
  const [guest, setGuest] = useState<GuestFormValues | null>(
    initialGuest
      ? {
          firstName: initialGuest.firstName ?? "",
          lastName: initialGuest.lastName ?? "",
          email: initialGuest.email ?? "",
          phone: initialGuest.phone ?? "",
          country: initialGuest.country ?? "TN",
          city: initialGuest.city ?? "",
        }
      : null,
  );
  const [stay, setStay] = useState<StayDetailsValues>({
    arrivalWindow: "18-22",
    stayMotif: "",
    specialRequests: "",
    cgvAccepted: false,
  });
  const [appliedPromo, setAppliedPromo] = useState<string | null>(
    promoCode ?? null,
  );
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stayLine = useMemo(() => {
    const ciLabel = format(new Date(`${checkIn}T00:00:00`), "d MMM yyyy", {
      locale: fr,
    });
    const coLabel = format(new Date(`${checkOut}T00:00:00`), "d MMM yyyy", {
      locale: fr,
    });
    const guestsLabel =
      childrenCount > 0
        ? `${adults} adulte${adults > 1 ? "s" : ""}, ${childrenCount} enfant${childrenCount > 1 ? "s" : ""}`
        : `${adults} adulte${adults > 1 ? "s" : ""}`;
    return [
      `${property.name}`,
      `${ciLabel} → ${coLabel}`,
      `${nights} nuit${nights > 1 ? "s" : ""}`,
      guestsLabel,
    ];
  }, [property.name, checkIn, checkOut, nights, adults, childrenCount]);

  function handleGuestSubmit(values: GuestFormValues) {
    setGuest(values);
    if (!stay.cgvAccepted) {
      setError("Vous devez accepter les conditions générales pour continuer.");
      return;
    }
    setError(null);

    const additionalNotes: string[] = [];
    if (stay.arrivalWindow && stay.arrivalWindow !== "18-22") {
      additionalNotes.push(`Arrivée: ${stay.arrivalWindow}`);
    }
    if (stay.stayMotif) {
      additionalNotes.push(`Motif: ${stay.stayMotif}`);
    }
    const guestRequests = [stay.specialRequests.trim(), ...additionalNotes]
      .filter(Boolean)
      .join("\n");

    startTransition(async () => {
      try {
        const result = await createReservation({
          propertyId: property.id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults,
          children: childrenCount,
          source: "DIRECT_WEB",
          guest: {
            firstName: values.firstName,
            lastName: values.lastName,
            phone: values.phone,
            email: values.email || undefined,
            country: values.country || undefined,
          },
          guestRequests: guestRequests || undefined,
        });
        router.push(`/book/confirmed?code=${result.code}`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        setError(msg);
        toast.error("Réservation non confirmée", { description: msg });
      }
    });
  }

  // External submit trigger so the action footer can sit outside the form.
  const formId = "funnel-guest-form";

  return (
    <>
      <FunnelStepper current={currentStep} />

      <div className="container-x">
        <div
          className="grid items-start gap-12 py-8 pb-16 lg:grid-cols-[1.6fr_1fr]"
          style={{ scrollMarginTop: 168 }}
        >
          {/* LEFT — Step content */}
          <div>
            <div className="rounded-lg bg-white p-8">
              {currentStep === 2 && (
                <>
                  <h2
                    className="font-heading text-[1.75rem] font-medium text-charcoal"
                    style={{ scrollMarginTop: 168 }}
                  >
                    Vos informations
                  </h2>
                  <p className="mt-2 text-sm text-charcoal-soft">
                    Nous avons besoin de ces informations pour préparer votre
                    arrivée et émettre votre voucher.
                  </p>
                  {!isCustomerLoggedIn && (
                    <p className="mt-1 mb-6 text-xs text-muted-foreground">
                      Déjà venu chez nous&nbsp;?{" "}
                      <Link
                        href={`/account/login?next=${encodeURIComponent(`/book?propertyId=${property.id}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}&children=${childrenCount}`)}`}
                        className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
                      >
                        Se connecter pour pré-remplir le formulaire
                        <ArrowRight className="size-3" />
                      </Link>
                    </p>
                  )}
                  {isCustomerLoggedIn && (
                    <p className="mt-1 mb-6 text-xs text-muted-foreground">
                      Connecté&nbsp;: vos informations sont pré-remplies.
                    </p>
                  )}

                  <FunnelStepSummary
                    stepNumber={1}
                    title="Hébergement & dates"
                    summaryLines={stayLine}
                    onEdit={() =>
                      router.push(
                        `/${property.type === "CHALET" ? "chalets" : "bungalows"}/${property.slug}`,
                      )
                    }
                  />

                  <FunnelGuestForm
                    formId={formId}
                    initialValues={guest ?? undefined}
                    onSubmit={handleGuestSubmit}
                    submitting={pending}
                    hideSubmit
                  />

                  <FunnelStayDetails
                    initialValues={stay}
                    onChange={(v) => {
                      setStay(v);
                      if (error && v.cgvAccepted) setError(null);
                    }}
                  />

                  {error && (
                    <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-6">
                    <Link
                      href={`/${property.type === "CHALET" ? "chalets" : "bungalows"}/${property.slug}`}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:bg-primary-tint"
                    >
                      <ArrowLeft className="size-4" />
                      Retour
                    </Link>
                    <button
                      type="submit"
                      form={formId}
                      disabled={pending || !stay.cgvAccepted}
                      className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-[1rem] font-medium text-primary-foreground transition-all hover:bg-bougainvillier hover:shadow-md disabled:opacity-50 disabled:hover:bg-primary disabled:hover:shadow-none"
                    >
                      {pending ? "Confirmation…" : "Continuer vers le paiement"}
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            <FunnelPaymentPreview />

            <FunnelTrustStrip />
          </div>

          {/* RIGHT — Sticky recap */}
          <FunnelRecapSticky
            property={{
              name: property.name,
              type: property.type,
              photoUrl: property.photoUrl,
              beachfront: property.beachfront,
              hasPrivatePool: property.hasPrivatePool,
            }}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            adults={adults}
            childrenCount={childrenCount}
            basePrice={property.basePrice}
            cleaningFee={property.cleaningFee}
            taxRate={taxRate}
            rating={
              rating ? { score: rating.avg, count: rating.count } : undefined
            }
            onPromoApply={async (code) => {
              try {
                const res = await previewPromoCode({
                  code,
                  nights,
                  propertyType: property.type,
                  basePriceMillimes: property.basePrice * nights,
                });
                setAppliedPromo(code.toUpperCase());
                setPromoDiscount(res.amountMillimes);
                toast.success(
                  res.label
                    ? `Code appliqué — ${res.label}`
                    : "Code promo appliqué",
                );
              } catch (err) {
                setPromoDiscount(0);
                toast.error(
                  err instanceof Error ? err.message : "Code invalide",
                );
              }
            }}
            promoDiscount={promoDiscount}
            initialPromoCode={appliedPromo ?? undefined}
          />
        </div>
      </div>
    </>
  );
}
