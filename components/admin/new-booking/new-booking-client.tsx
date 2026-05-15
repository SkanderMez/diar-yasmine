"use client";

import { useMemo, useState, useTransition } from "react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Link, useRouter } from "@/i18n/navigation";
import { createReservation } from "@/lib/reservations";
import { WizardStepper, type WizardStep } from "./wizard-stepper";
import { Step1Unit, type Step1Values } from "./step-1-unit";
import { Step2Client, type Step2Values } from "./step-2-client";
import { Step3Pricing } from "./step-3-pricing";
import { Step4Payment, type Step4Values } from "./step-4-payment";
import { SummaryAside } from "./summary-aside";
import { buildInitialLines, computePricing } from "./pricing";
import type { NewBookingProperty, PriceLine } from "./types";

interface NewBookingClientProps {
  properties: NewBookingProperty[];
  taxRate: number;
  prefill: {
    propertyId: string | null;
    checkIn: string | null;
    checkOut: string | null;
  };
}

type StepKey = "unit" | "client" | "pricing" | "payment";

/**
 * Client orchestrator for the 4-step admin wizard.
 *
 * Holds the wizard state for every step, derives nights / pricing, and
 * submits to the existing `createReservation` Server Action. Done steps
 * collapse into pill summaries that you can re-open with the "Modifier"
 * pencil. Source defaults to WALK_IN (the most common admin-driven case).
 */
export function NewBookingClient({
  properties,
  taxRate,
  prefill,
}: NewBookingClientProps) {
  const router = useRouter();

  const [step1, setStep1] = useState<Step1Values>(() => ({
    propertyId: prefill.propertyId ?? null,
    checkIn: prefill.checkIn ?? "",
    checkOut: prefill.checkOut ?? "",
  }));

  const [step2, setStep2] = useState<Step2Values>(() => ({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    country: "Tunisie",
    adults: 2,
    children: 0,
  }));

  // Active step — starts on the first incomplete one.
  const [activeStep, setActiveStep] = useState<StepKey>(
    prefill.propertyId && prefill.checkIn && prefill.checkOut
      ? "client"
      : "unit",
  );

  const property = useMemo(
    () => properties.find((p) => p.id === step1.propertyId) ?? null,
    [properties, step1.propertyId],
  );

  const nights = useMemo(() => {
    if (!step1.checkIn || !step1.checkOut) return 0;
    try {
      const n = differenceInCalendarDays(
        parseISO(step1.checkOut),
        parseISO(step1.checkIn),
      );
      return n > 0 ? n : 0;
    } catch {
      return 0;
    }
  }, [step1.checkIn, step1.checkOut]);

  // Pricing lines — seeded once with the long-stay default. After that the
  // staff member owns the lines. We rebuild the defaults when leaving step 1
  // for the first time (handled in `handleStep1Continue`) so nights are
  // known by then.
  const [lines, setLines] = useState<PriceLine[]>(() =>
    buildInitialLines({ nights, defaultTaxRate: taxRate }),
  );
  const [linesInitialized, setLinesInitialized] = useState(nights > 0);

  function handleStep1Continue() {
    if (!linesInitialized && nights > 0) {
      setLines(buildInitialLines({ nights, defaultTaxRate: taxRate }));
      setLinesInitialized(true);
    }
    goTo("client");
  }

  const [source, setSource] = useState<
    "WALK_IN" | "PHONE" | "PARTNER" | "DIRECT_WEB" | "OTHER"
  >("WALK_IN");

  const [step4, setStep4] = useState<Step4Values>({
    mode: "DEFERRED",
    method: "CARD",
    internalNotes: "",
  });

  /* Computed pricing surfaced to step 4 so it can display the live total /
   * acompte. Same computation Step 3's preview uses — kept in sync. */
  const pricing = useMemo(() => {
    if (!property || nights <= 0) return null;
    return computePricing({
      lines,
      basePriceMillimes: property.basePrice,
      nights,
    });
  }, [lines, nights, property]);

  const [pending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const step1Complete =
    !!step1.propertyId && !!step1.checkIn && !!step1.checkOut && nights > 0;
  const step2Complete =
    step2.firstName.trim().length > 0 &&
    step2.lastName.trim().length > 0 &&
    step2.phone.trim().length >= 6;

  const steps: WizardStep[] = [
    {
      key: "unit",
      label: "Unité & dates",
      done: step1Complete && activeStep !== "unit",
      active: activeStep === "unit",
    },
    {
      key: "client",
      label: "Client",
      done: step2Complete && activeStep !== "client" && activeStep !== "unit",
      active: activeStep === "client",
    },
    {
      key: "pricing",
      label: "Tarification",
      done: activeStep === "payment",
      active: activeStep === "pricing",
    },
    {
      key: "payment",
      label: "Paiement",
      done: false,
      active: activeStep === "payment",
    },
  ];

  function goTo(step: StepKey) {
    setActiveStep(step);
  }

  function submit() {
    if (!step1Complete || !step2Complete || !property) {
      setSubmitError("Complétez les informations avant de confirmer.");
      return;
    }
    setSubmitError(null);

    // Build the server-side payload from the editable lines.
    const discountLine = lines.find((l) => l.kind === "discount");
    const discount = (() => {
      if (!discountLine || discountLine.value <= 0) {
        return { type: "NONE" as const, value: 0 };
      }
      return discountLine.mode === "%"
        ? {
            type: "PERCENT" as const,
            value: Math.round(discountLine.value),
          }
        : {
            type: "FIXED" as const,
            value: Math.max(0, Math.round(discountLine.value)),
          };
    })();

    const extras = lines
      .filter((l) => l.kind === "extra")
      .map((l) => ({
        label: l.label || "Prestation",
        amount: Math.max(0, Math.round(l.value)),
      }))
      .filter((e) => e.amount > 0);

    /* Translate the step-4 mode into an immediate-payment payload.
     * DEFERRED → no payment row; FULL → collect the grand total; ACOMPTE_30
     * → collect 30% rounded to the nearest millime. Method maps 1:1 to
     * Prisma's PaymentMethod enum. */
    const methodMap = {
      CARD: "CARD",
      CASH: "CASH",
      TRANSFER: "TRANSFER",
    } as const;
    const grandTotal = pricing?.total ?? 0;
    const paymentAmount =
      step4.mode === "FULL"
        ? grandTotal
        : step4.mode === "ACOMPTE_30"
          ? Math.round(grandTotal * 0.3)
          : 0;
    const payment =
      step4.mode === "DEFERRED" || paymentAmount <= 0
        ? undefined
        : { amount: paymentAmount, method: methodMap[step4.method] };

    startTransition(async () => {
      try {
        const result = await createReservation({
          propertyId: property.id,
          checkInDate: step1.checkIn,
          checkOutDate: step1.checkOut,
          adults: step2.adults,
          children: step2.children,
          source,
          guest: {
            firstName: step2.firstName.trim(),
            lastName: step2.lastName.trim(),
            phone: step2.phone.trim(),
            email: step2.email.trim() || undefined,
            country: step2.country || undefined,
          },
          discount,
          extras,
          internalNotes: step4.internalNotes.trim() || undefined,
          payment,
        });
        toast.success("Réservation créée", {
          description: `${result.code} — voucher prêt à générer`,
        });
        router.push(`/admin/reservations/${result.code}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue";
        setSubmitError(message);
        toast.error("Création échouée", { description: message });
      }
    });
  }

  const dateRangeLabel =
    step1.checkIn && step1.checkOut
      ? `${format(parseISO(step1.checkIn), "d MMM", {
          locale: fr,
        })} → ${format(parseISO(step1.checkOut), "d MMM yyyy", {
          locale: fr,
        })}`
      : "";

  const partyLabel =
    step2.children > 0
      ? `${step2.adults} ad. + ${step2.children} enf.`
      : `${step2.adults} ad.`;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Nouvelle réservation</h1>
          <p>Créer une réservation directe et générer le voucher</p>
        </div>
        <div className="page-actions">
          <Link href="/admin/calendar" className="btn-admin btn-admin-ghost">
            Annuler
          </Link>
          <button type="button" className="btn-admin btn-admin-secondary">
            Enregistrer brouillon
          </button>
          <button
            type="button"
            className="btn-admin btn-admin-primary"
            onClick={submit}
            disabled={pending || !step1Complete || !step2Complete}
            style={{
              opacity: pending || !step1Complete || !step2Complete ? 0.6 : 1,
            }}
          >
            <Check className="size-3.5" />
            {pending ? "Création…" : "Confirmer & générer voucher"}
          </button>
        </div>
      </div>

      <WizardStepper steps={steps} onSelect={(key) => goTo(key as StepKey)} />

      <div className="new-grid">
        {/* LEFT — Step cards */}
        <div>
          {/* Step 1 */}
          {activeStep === "unit" ? (
            <Step1Unit
              values={step1}
              onChange={setStep1}
              onContinue={handleStep1Continue}
              properties={properties}
            />
          ) : (
            <CollapsedStep
              done={step1Complete}
              label="Étape 1 · Unité & dates"
              summary={
                property ? (
                  <span className="tag tag-direct">
                    {property.name} · {dateRangeLabel} · {nights} nuit
                    {nights > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="tag tag-direct">À compléter</span>
                )
              }
              onEdit={() => goTo("unit")}
            />
          )}

          {/* Step 2 */}
          {activeStep === "client" ? (
            <Step2Client
              values={step2}
              onChange={setStep2}
              onContinue={() => goTo("pricing")}
            />
          ) : (
            <CollapsedStep
              done={step2Complete}
              label="Étape 2 · Voyageur principal"
              summary={
                step2Complete ? (
                  <span className="tag tag-direct">
                    {step2.firstName} {step2.lastName}
                    {step2.email ? ` · ${step2.email}` : ""} · {partyLabel}
                  </span>
                ) : (
                  <span className="tag tag-direct">À compléter</span>
                )
              }
              onEdit={() => goTo("client")}
            />
          )}

          {/* Source picker — visible from step 2 onward */}
          {(activeStep === "pricing" || activeStep === "payment") &&
            step1Complete &&
            step2Complete && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  marginBottom: "12px",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: "0.82rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>Source :</span>
                <select
                  className="select-admin"
                  value={source}
                  onChange={(e) => setSource(e.target.value as typeof source)}
                  style={{ width: "auto", padding: "4px 8px" }}
                >
                  <option value="WALK_IN">Walk-in</option>
                  <option value="PHONE">Téléphone</option>
                  <option value="PARTNER">Partenaire</option>
                  <option value="DIRECT_WEB">Site direct</option>
                  <option value="OTHER">Autre</option>
                </select>
              </div>
            )}

          {/* Step 3 */}
          {activeStep === "pricing" && property && nights > 0 ? (
            <Step3Pricing
              basePriceMillimes={property.basePrice}
              nights={nights}
              lines={lines}
              onLinesChange={setLines}
              onContinue={() => goTo("payment")}
            />
          ) : activeStep !== "pricing" && step1Complete && step2Complete ? (
            <CollapsedStep
              done={activeStep === "payment"}
              label="Étape 3 · Tarification"
              summary={
                <span className="tag tag-direct">
                  {lines.filter((l) => l.kind === "extra").length} extra
                  {lines.filter((l) => l.kind === "extra").length > 1
                    ? "s"
                    : ""}{" "}
                  · TVA {lines.find((l) => l.kind === "tax")?.value ?? 0}%
                </span>
              }
              onEdit={() => goTo("pricing")}
            />
          ) : null}

          {/* Step 4 */}
          <Step4Payment
            active={activeStep === "payment"}
            values={step4}
            onChange={setStep4}
            pricing={pricing}
          />

          {submitError && (
            <div
              role="alert"
              style={{
                marginTop: "12px",
                padding: "10px 12px",
                background: "rgba(224, 116, 116, 0.1)",
                border: "1px solid rgba(224, 116, 116, 0.3)",
                borderRadius: "var(--radius)",
                color: "var(--danger)",
                fontSize: "0.85rem",
              }}
            >
              {submitError}
            </div>
          )}
        </div>

        {/* RIGHT — Sticky summary */}
        <SummaryAside
          property={property}
          checkIn={step1.checkIn}
          checkOut={step1.checkOut}
          nights={nights}
          guest={{
            firstName: step2.firstName,
            lastName: step2.lastName,
            email: step2.email,
            phone: step2.phone,
            adults: step2.adults,
            children: step2.children,
          }}
          source={source}
          lines={lines}
        />
      </div>
    </>
  );
}

function CollapsedStep({
  done,
  label,
  summary,
  onEdit,
}: {
  done: boolean;
  label: string;
  summary: React.ReactNode;
  onEdit: () => void;
}) {
  return (
    <div className="step-card collapsed">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <h3 style={{ margin: 0 }}>
          <span
            className="num"
            style={{
              background: done ? "var(--success)" : "var(--bg-surface-3)",
              color: done ? "var(--bg-app)" : "var(--text-muted)",
            }}
          >
            {done ? <Check className="size-3" /> : "•"}
          </span>{" "}
          {label}
        </h3>
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          {summary}
          <button
            type="button"
            className="btn-admin btn-admin-ghost btn-admin-sm"
            onClick={onEdit}
          >
            <Pencil className="size-3" />
            Modifier
          </button>
        </div>
      </div>
    </div>
  );
}
