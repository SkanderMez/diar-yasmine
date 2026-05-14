"use client";

import { useId } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export interface StayDetailsValues {
  arrivalWindow: string;
  stayMotif: string;
  specialRequests: string;
  cgvAccepted: boolean;
}

interface FunnelStayDetailsProps {
  initialValues?: Partial<StayDetailsValues>;
  onChange: (values: StayDetailsValues) => void;
}

const ARRIVAL_WINDOWS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "before-18", label: "Avant 18h" },
  { value: "18-22", label: "Entre 18h et 22h" },
  { value: "after-22", label: "Après 22h (contactez-nous)" },
  { value: "specific", label: "Heure précise (à préciser ci-dessous)" },
];

const MOTIFS: ReadonlyArray<{ value: string; label: string }> = [
  { value: "vacances", label: "Vacances" },
  { value: "famille", label: "Famille" },
  { value: "couple", label: "Couple" },
  { value: "anniversaire", label: "Anniversaire" },
  { value: "lune-de-miel", label: "Lune de miel" },
  { value: "travail", label: "Travail" },
];

/**
 * Maquette "Détails du séjour" — arrival window, single-select motif pills,
 * special requests textarea, and the mandatory CGV checkbox row. Notifies
 * the parent on every change so the parent can keep its own state in sync
 * (used to gate the "Continuer" CTA on `cgvAccepted`).
 */
export function FunnelStayDetails({
  initialValues,
  onChange,
}: FunnelStayDetailsProps) {
  const baseId = useId();
  const arrivalId = `${baseId}-arrival`;
  const requestsId = `${baseId}-requests`;
  const cgvId = `${baseId}-cgv`;

  const values: StayDetailsValues = {
    arrivalWindow: initialValues?.arrivalWindow ?? "18-22",
    stayMotif: initialValues?.stayMotif ?? "",
    specialRequests: initialValues?.specialRequests ?? "",
    cgvAccepted: initialValues?.cgvAccepted ?? false,
  };

  function update(patch: Partial<StayDetailsValues>) {
    onChange({ ...values, ...patch });
  }

  return (
    <div className="mt-8">
      <h3 className="mb-4 font-sans text-[1.05rem] font-semibold text-charcoal">
        Détails du séjour
      </h3>

      <div className="mb-4">
        <label
          htmlFor={arrivalId}
          className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          Heure d&apos;arrivée approximative
        </label>
        <select
          id={arrivalId}
          value={values.arrivalWindow}
          onChange={(e) => update({ arrivalWindow: e.target.value })}
          className="w-full appearance-none rounded-md border border-line bg-white bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2020%2020%22%20fill=%22none%22%20stroke=%22%236b7a80%22%20stroke-width=%221.6%22><polyline%20points=%225,8%2010,13%2015,8%22/></svg>')] bg-[length:14px] bg-[right_16px_center] bg-no-repeat px-[18px] py-[14px] pr-10 text-[0.95rem] text-charcoal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-turquoise/15"
        >
          {ARRIVAL_WINDOWS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Motif du séjour (optionnel)
        </p>
        <div className="flex flex-wrap gap-2">
          {MOTIFS.map((m) => {
            const selected = values.stayMotif === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={selected}
                onClick={() => update({ stayMotif: selected ? "" : m.value })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-all",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-line bg-white text-charcoal hover:border-primary",
                )}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <label
          htmlFor={requestsId}
          className="mb-1.5 block text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
        >
          Demandes spéciales (optionnel)
        </label>
        <textarea
          id={requestsId}
          rows={4}
          value={values.specialRequests}
          onChange={(e) => update({ specialRequests: e.target.value })}
          placeholder="Lit bébé, allergies alimentaires, vol arrivée tardif…"
          maxLength={2000}
          className="min-h-20 w-full rounded-md border border-line bg-white px-[18px] py-[14px] text-[0.95rem] text-charcoal outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-turquoise/15"
        />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-md bg-sand p-4">
        <input
          id={cgvId}
          type="checkbox"
          checked={values.cgvAccepted}
          onChange={(e) => update({ cgvAccepted: e.target.checked })}
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-sm border-[1.5px] border-primary accent-primary"
        />
        <label
          htmlFor={cgvId}
          className="cursor-pointer text-sm text-charcoal-soft"
        >
          J&apos;accepte les{" "}
          <Link
            href="/cgv"
            className="text-primary underline underline-offset-2 hover:text-bougainvillier"
          >
            conditions générales de vente
          </Link>{" "}
          de Diar Yasmine et la{" "}
          <Link
            href="/privacy"
            className="text-primary underline underline-offset-2 hover:text-bougainvillier"
          >
            politique de confidentialité
          </Link>
          .
        </label>
      </div>
    </div>
  );
}
