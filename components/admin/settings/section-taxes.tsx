"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTaxesAndCurrency } from "@/lib/settings-actions";

type Currency = "TND" | "EUR" | "USD";

interface SectionTaxesProps {
  primaryCurrency: Currency;
  displayedCurrencies: readonly Currency[];
  /** Decimal in [0, 1]; e.g. 0.19 = 19%. */
  taxRate: number;
  /** Stay/sejour tax in millimes per guest per night. */
  staySejourMillimes: number;
}

const CURRENCY_OPTIONS: readonly { value: Currency; label: string }[] = [
  { value: "TND", label: "TND (Dinar)" },
  { value: "EUR", label: "EUR" },
  { value: "USD", label: "USD" },
] as const;

const ALL_CURRENCIES: readonly Currency[] = ["TND", "EUR", "USD"] as const;

export function SectionTaxes({
  primaryCurrency,
  displayedCurrencies,
  taxRate,
  staySejourMillimes,
}: SectionTaxesProps) {
  const router = useRouter();
  const [primary, setPrimary] = useState<Currency>(primaryCurrency);
  // Stored as decimal, displayed as percent.
  const [taxPercent, setTaxPercent] = useState<string>(
    (taxRate * 100).toString(),
  );
  // Stored as millimes, displayed as TND.
  const [sejourTnd, setSejourTnd] = useState<string>(
    (staySejourMillimes / 1000).toString(),
  );
  const [displayed, setDisplayed] = useState<Set<Currency>>(
    new Set<Currency>(displayedCurrencies),
  );
  const [pending, startTransition] = useTransition();

  function toggleDisplayed(currency: Currency) {
    // The current primary cannot be unchecked; the input is disabled anyway,
    // but we guard here too in case the click slips through.
    if (currency === primary) return;
    setDisplayed((prev) => {
      const next = new Set(prev);
      if (next.has(currency)) {
        next.delete(currency);
      } else {
        next.add(currency);
      }
      return next;
    });
  }

  function onPrimaryChange(next: Currency) {
    setPrimary(next);
    // Ensure the new primary is part of the displayed set.
    setDisplayed((prev) => {
      const set = new Set(prev);
      set.add(next);
      return set;
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const percentValue = Number.parseFloat(taxPercent);
    const sejourValue = Number.parseFloat(sejourTnd);

    if (
      !Number.isFinite(percentValue) ||
      percentValue < 0 ||
      percentValue > 100
    ) {
      toast.error("TVA invalide", {
        description: "Valeur attendue entre 0 et 100.",
      });
      return;
    }
    if (!Number.isFinite(sejourValue) || sejourValue < 0) {
      toast.error("Taxe de séjour invalide", {
        description: "La valeur doit être positive.",
      });
      return;
    }
    if (!displayed.has(primary)) {
      toast.error("Configuration incohérente", {
        description: "La devise principale doit être affichée.",
      });
      return;
    }

    const orderedDisplayed: Currency[] = ALL_CURRENCIES.filter((c) =>
      displayed.has(c),
    );

    startTransition(async () => {
      try {
        await updateTaxesAndCurrency({
          primaryCurrency: primary,
          displayedCurrencies: orderedDisplayed,
          taxRate: percentValue / 100,
          // Convert TND → millimes; round to int.
          staySejourMillimes: Math.round(sejourValue * 1000),
        });
        toast.success("Paramètres enregistrés");
        router.refresh();
      } catch (err) {
        toast.error("Échec de l'enregistrement", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <form onSubmit={submit} className="branding-grid">
      <div className="small-card">
        <h3>Taxes &amp; devises</h3>
        <div className="sub">Configuration fiscale du domaine</div>

        <div className="toggle-row">
          <div>
            <div className="label">Devise principale</div>
            <div className="sub" style={{ margin: 0 }}>
              Utilisée par défaut sur le site et le PMS
            </div>
          </div>
          <select
            className="select-admin"
            style={{ width: 140 }}
            value={primary}
            onChange={(e) => onPrimaryChange(e.target.value as Currency)}
          >
            {CURRENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="toggle-row">
          <div>
            <div className="label">TVA appliquée</div>
            <div className="sub" style={{ margin: 0 }}>
              Taux global sur hébergement (%)
            </div>
          </div>
          <input
            className="input-admin"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={taxPercent}
            onChange={(e) => setTaxPercent(e.target.value)}
            style={{ width: 100 }}
            aria-label="TVA en pourcentage"
          />
        </div>

        <div className="toggle-row">
          <div>
            <div className="label">Taxe de séjour</div>
            <div className="sub" style={{ margin: 0 }}>
              Par personne et par nuit (TND)
            </div>
          </div>
          <input
            className="input-admin"
            type="number"
            min={0}
            step={0.001}
            value={sejourTnd}
            onChange={(e) => setSejourTnd(e.target.value)}
            style={{ width: 120 }}
            aria-label="Taxe de séjour en TND"
          />
        </div>

        <div
          style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}
        >
          <button
            type="submit"
            className="btn-admin btn-admin-primary"
            disabled={pending}
          >
            {pending ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="small-card">
        <h3>Devises affichées</h3>
        <div className="sub">Conversion automatique sur le site public</div>

        {ALL_CURRENCIES.map((currency) => {
          const isPrimary = currency === primary;
          const isChecked = displayed.has(currency);
          return (
            <label key={currency} className="toggle-row">
              <div>
                <div className="label">{currency}</div>
                <div className="sub" style={{ margin: 0 }}>
                  {isPrimary
                    ? "Devise principale — toujours active"
                    : "Cocher pour afficher aux visiteurs"}
                </div>
              </div>
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isPrimary}
                onChange={() => toggleDisplayed(currency)}
                aria-label={`Afficher ${currency}`}
              />
            </label>
          );
        })}
      </div>
    </form>
  );
}
