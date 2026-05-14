"use client";

import { Building, CreditCard, Wallet } from "lucide-react";
import { formatTND } from "@/lib/money";
import type { ComputedPricing } from "./types";

export type PaymentMode = "FULL" | "ACOMPTE_30" | "DEFERRED";
export type PaymentMethod = "CARD" | "CASH" | "TRANSFER";

export interface Step4Values {
  /** How much is collected at booking time. */
  mode: PaymentMode;
  /** Which payment method is used (when mode != DEFERRED). */
  method: PaymentMethod;
  /** Internal staff notes attached to the reservation. */
  internalNotes: string;
}

interface Step4PaymentProps {
  /** When inactive the section dims into a teaser. */
  active: boolean;
  values: Step4Values;
  onChange: (next: Step4Values) => void;
  pricing: ComputedPricing | null;
}

/**
 * Step 4 — Paiement & notes.
 *
 * Receptionist picks how the booking gets paid (full / 30% acompte /
 * deferred) and the payment method (cash / card / transfer). The
 * collected amount is shown live based on the pricing computed in
 * step 3. Internal notes flow to `Reservation.internalNotes`.
 */
export function Step4Payment({
  active,
  values,
  onChange,
  pricing,
}: Step4PaymentProps) {
  const total = pricing?.total ?? 0;
  const acompte = Math.round(total * 0.3);
  const isFullyPayable = active && total > 0;

  return (
    <div
      className="step-card"
      style={{
        opacity: active ? 1 : 0.7,
      }}
    >
      <h3>
        <span
          className="num"
          style={{
            background: active ? "var(--primary)" : "var(--bg-surface-3)",
            color: active ? "var(--bg-app)" : "var(--text-muted)",
          }}
        >
          4
        </span>{" "}
        Paiement &amp; notes
      </h3>
      <div className="sub">
        Choisissez le mode de paiement et ajoutez vos notes internes.
      </div>

      {/* Mode tiles (3) */}
      <fieldset
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          marginTop: "12px",
          marginBottom: "16px",
        }}
        disabled={!active}
      >
        <legend
          style={{
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
            marginBottom: "8px",
            fontWeight: 500,
          }}
        >
          Acompte
        </legend>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "8px",
          }}
        >
          <ModeTile
            label="Paiement complet"
            sublabel={isFullyPayable ? `${formatTND(total)} encaissés` : "—"}
            selected={values.mode === "FULL"}
            disabled={!active}
            onClick={() => onChange({ ...values, mode: "FULL" })}
            icon={<Wallet className="size-4" />}
          />
          <ModeTile
            label="Acompte 30%"
            sublabel={isFullyPayable ? `${formatTND(acompte)} encaissés` : "—"}
            selected={values.mode === "ACOMPTE_30"}
            disabled={!active}
            onClick={() => onChange({ ...values, mode: "ACOMPTE_30" })}
            icon={<Wallet className="size-4" />}
          />
          <ModeTile
            label="Différé"
            sublabel="À encaisser à l'arrivée"
            selected={values.mode === "DEFERRED"}
            disabled={!active}
            onClick={() => onChange({ ...values, mode: "DEFERRED" })}
            icon={<Wallet className="size-4" />}
          />
        </div>
      </fieldset>

      {/* Method tiles (only when something is collected) */}
      {values.mode !== "DEFERRED" && (
        <fieldset
          style={{
            border: "none",
            padding: 0,
            margin: 0,
            marginBottom: "16px",
          }}
          disabled={!active}
        >
          <legend
            style={{
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "var(--text-muted)",
              marginBottom: "8px",
              fontWeight: 500,
            }}
          >
            Méthode
          </legend>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "8px",
            }}
          >
            <ModeTile
              label="Carte bancaire"
              selected={values.method === "CARD"}
              disabled={!active}
              onClick={() => onChange({ ...values, method: "CARD" })}
              icon={<CreditCard className="size-4" />}
            />
            <ModeTile
              label="Espèces"
              selected={values.method === "CASH"}
              disabled={!active}
              onClick={() => onChange({ ...values, method: "CASH" })}
              icon={<Wallet className="size-4" />}
            />
            <ModeTile
              label="Virement"
              selected={values.method === "TRANSFER"}
              disabled={!active}
              onClick={() => onChange({ ...values, method: "TRANSFER" })}
              icon={<Building className="size-4" />}
            />
          </div>
        </fieldset>
      )}

      {/* Internal notes */}
      <div>
        <label
          htmlFor="step4-notes"
          style={{
            display: "block",
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
            marginBottom: "8px",
            fontWeight: 500,
          }}
        >
          Notes internes
        </label>
        <textarea
          id="step4-notes"
          className="textarea-admin"
          placeholder="Préférences, demandes spéciales, allergies, anniversaires…"
          value={values.internalNotes}
          onChange={(e) =>
            onChange({ ...values, internalNotes: e.target.value })
          }
          disabled={!active}
          rows={3}
          style={{
            resize: "vertical",
            minHeight: "72px",
          }}
        />
        <p
          style={{
            marginTop: "6px",
            fontSize: "0.75rem",
            color: "var(--text-dim)",
          }}
        >
          Visibles uniquement par l&apos;équipe — jamais transmises au client.
        </p>
      </div>
    </div>
  );
}

function ModeTile({
  label,
  sublabel,
  selected,
  disabled,
  onClick,
  icon,
}: {
  label: string;
  sublabel?: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      style={{
        padding: "12px",
        background: selected ? "var(--primary)" : "var(--bg-surface-2)",
        color: selected ? "var(--bg-app)" : "var(--text)",
        borderRadius: "var(--radius)",
        border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
        textAlign: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all .2s",
      }}
    >
      <div
        style={{
          color: selected ? "var(--bg-app)" : "var(--primary)",
          display: "flex",
          justifyContent: "center",
          marginBottom: "6px",
        }}
        aria-hidden
      >
        {icon}
      </div>
      <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{label}</div>
      {sublabel && (
        <div
          style={{
            marginTop: "4px",
            fontSize: "0.72rem",
            opacity: selected ? 0.85 : 0.6,
          }}
        >
          {sublabel}
        </div>
      )}
    </button>
  );
}
