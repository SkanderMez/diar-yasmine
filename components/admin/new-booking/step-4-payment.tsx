"use client";

import { Building, CreditCard, Wallet } from "lucide-react";

interface Step4PaymentProps {
  /** When false the section is dashed/opaque (visual teaser). */
  active?: boolean;
}

/**
 * Step 4 — Paiement & notes (preview).
 *
 * Visual teaser only: shows three payment-method tiles. The actual payment
 * capture happens in /admin/reservations/[code] after confirmation; we
 * still render this step so receptionists see where the flow is heading.
 */
export function Step4Payment({ active = false }: Step4PaymentProps) {
  return (
    <div
      className="step-card"
      style={{
        opacity: active ? 1 : 0.55,
        borderStyle: active ? "solid" : "dashed",
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
        Acompte, méthode de paiement et notes internes — à finaliser à la
        confirmation.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
          marginBottom: "4px",
        }}
      >
        <PaymentTile
          icon={<CreditCard className="size-5" />}
          label="Carte bancaire"
        />
        <PaymentTile icon={<Wallet className="size-5" />} label="Acompte 30%" />
        <PaymentTile icon={<Building className="size-5" />} label="Virement" />
      </div>
    </div>
  );
}

function PaymentTile({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      style={{
        padding: "12px",
        background: "var(--bg-surface-2)",
        borderRadius: "var(--radius)",
        textAlign: "center",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          color: "var(--primary)",
          display: "flex",
          justifyContent: "center",
          marginBottom: "6px",
        }}
        aria-hidden
      >
        {icon}
      </div>
      <div style={{ fontSize: "0.85rem", fontWeight: 500 }}>{label}</div>
    </div>
  );
}
