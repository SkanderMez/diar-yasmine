"use client";

import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { formatTND } from "@/lib/money";
import { computePricing } from "./pricing";
import type { NewBookingProperty, PriceLine } from "./types";

interface SummaryAsideProps {
  property: NewBookingProperty | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    adults: number;
    children: number;
  };
  source: string;
  lines: PriceLine[];
}

const SOURCE_LABEL: Record<string, string> = {
  DIRECT_WEB: "Site direct",
  WALK_IN: "Walk-in",
  PHONE: "Téléphone",
  PARTNER: "Partenaire",
  BOOKING: "Booking.com",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  OTHER: "Autre",
};

/**
 * Sticky right-column recap. Mirrors every editable line from Step 3 so the
 * receptionist sees what the guest will receive at confirmation. Computes
 * the 30% acompte target as a helper for the payment step.
 */
export function SummaryAside({
  property,
  checkIn,
  checkOut,
  nights,
  guest,
  source,
  lines,
}: SummaryAsideProps) {
  const breakdown = useMemo(
    () =>
      property
        ? computePricing({
            basePriceMillimes: property.basePrice,
            nights,
            lines,
          })
        : null,
    [property, nights, lines],
  );

  const checkInLabel = checkIn
    ? format(parseISO(checkIn), "d MMM yyyy", { locale: fr })
    : "—";
  const checkOutLabel = checkOut
    ? format(parseISO(checkOut), "d MMM yyyy", { locale: fr })
    : "—";

  const acompte30 = breakdown ? Math.round(breakdown.total * 0.3) : 0;
  const fullName =
    [guest.firstName, guest.lastName].filter(Boolean).join(" ") || "—";

  const propertyLabel = property
    ? property.beachfront
      ? `${property.type === "CHALET" ? "Chalet" : "Bungalow"} · Front de mer`
      : property.seaView
        ? `${property.type === "CHALET" ? "Chalet" : "Bungalow"} · Vue mer`
        : property.hasPrivatePool
          ? `${property.type === "CHALET" ? "Chalet" : "Bungalow"} · Piscine privée`
          : property.type === "CHALET"
            ? "Chalet"
            : "Bungalow"
    : "";

  const discountLine = lines.find((l) => l.kind === "discount");
  const taxLine = lines.find((l) => l.kind === "tax");
  const extras = lines.filter((l) => l.kind === "extra");

  return (
    <aside
      className="summary"
      style={{
        position: "sticky",
        top: 72,
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <div
        className="summary-image"
        style={{
          aspectRatio: "16 / 10",
          background: property?.photoUrl
            ? `center / cover no-repeat url(${property.photoUrl})`
            : "linear-gradient(135deg, var(--primary-deep), var(--primary))",
          position: "relative",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, transparent 50%, rgba(13,18,22,0.7))",
            borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "16px",
            color: "#fff",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.2rem",
            }}
          >
            {property?.name ?? "Sélectionnez une unité"}
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.78)" }}>
            {propertyLabel}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>
        <Section title="Séjour">
          <Line label="Du" value={checkInLabel} />
          <Line label="Au" value={checkOutLabel} />
          <Line
            label="Durée"
            value={nights > 0 ? `${nights} nuit${nights > 1 ? "s" : ""}` : "—"}
          />
          <Line
            label="Voyageurs"
            value={
              guest.adults > 0
                ? guest.children > 0
                  ? `${guest.adults} ad. + ${guest.children} enf.`
                  : `${guest.adults} adulte${guest.adults > 1 ? "s" : ""}`
                : "—"
            }
          />
          <Line
            label="Source"
            value={
              <span className="tag tag-direct">
                {SOURCE_LABEL[source] ?? source}
              </span>
            }
          />
        </Section>

        <Section title="Client">
          <Line label="Nom" value={fullName} />
          <Line label="Téléphone" value={guest.phone || "—"} />
          {guest.email && <Line label="Email" value={guest.email} />}
        </Section>

        <Section title="Tarification">
          {breakdown && property && nights > 0 ? (
            <>
              <Line
                label={`Base ${nights} × ${formatTND(property.basePrice)}`}
                value={formatTND(breakdown.basePrice)}
              />
              {breakdown.discountAmount > 0 && discountLine && (
                <Line
                  label={
                    <span style={{ color: "var(--success)" }}>
                      {discountLine.label}
                      {discountLine.mode === "%"
                        ? ` (${discountLine.value}%)`
                        : ""}
                    </span>
                  }
                  value={
                    <span style={{ color: "var(--success)" }}>
                      − {formatTND(breakdown.discountAmount)}
                    </span>
                  }
                />
              )}
              {extras.map((extra) => (
                <Line
                  key={extra.id}
                  label={extra.label}
                  value={formatTND(Math.max(0, Math.round(extra.value)))}
                />
              ))}
              <Line
                label="Sous-total HT"
                value={formatTND(breakdown.subtotal)}
              />
              {taxLine && breakdown.tax > 0 && (
                <Line
                  label={`TVA ${taxLine.value}%`}
                  value={`+ ${formatTND(breakdown.tax)}`}
                />
              )}

              <div
                style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                }}
              >
                <span style={{ color: "var(--text)", fontWeight: 600 }}>
                  Total TTC
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.5rem",
                    color: "var(--primary)",
                    fontWeight: 500,
                  }}
                >
                  {formatTND(breakdown.total)}
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginTop: "4px",
                  textAlign: "right",
                }}
              >
                Acompte 30% : {formatTND(acompte30)}
              </div>
            </>
          ) : (
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                padding: "8px 0",
              }}
            >
              Renseignez l&apos;unité et les dates pour voir le tarif.
            </p>
          )}
        </Section>
      </div>
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="summary-section"
      style={{
        padding: "10px 0",
        borderBottom: "1px dashed var(--border)",
      }}
    >
      <h5
        style={{
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-dim)",
          fontWeight: 600,
          marginBottom: "6px",
        }}
      >
        {title}
      </h5>
      {children}
    </div>
  );
}

function Line({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "2px 0",
        fontSize: "0.85rem",
        gap: "8px",
      }}
    >
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontWeight: 500, fontFamily: "var(--font-mono)" }}>
        {value}
      </span>
    </div>
  );
}
