"use client";

import { useMemo } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { ArrowRight, BedDouble, Building2 } from "lucide-react";
import { formatTND } from "@/lib/money";
import { DateRangePicker } from "@/components/public/date-range-picker";
import type { NewBookingProperty } from "./types";

export interface Step1Values {
  propertyId: string | null;
  checkIn: string;
  checkOut: string;
}

interface Step1UnitProps {
  values: Step1Values;
  onChange: (next: Step1Values) => void;
  onContinue: () => void;
  properties: NewBookingProperty[];
}

/**
 * Step 1 — Unit picker + date inputs.
 *
 * Renders a scrollable grid of active units (chalets first then bungalows)
 * with photo, name, capacity and nightly rate. Below the picker, two
 * native date inputs (the admin shell stays compact and dense — we don't
 * use the marketing-style DateRangePicker here).
 */
export function Step1Unit({
  values,
  onChange,
  onContinue,
  properties,
}: Step1UnitProps) {
  const nights = useMemo(() => {
    if (!values.checkIn || !values.checkOut) return 0;
    try {
      const n = differenceInCalendarDays(
        parseISO(values.checkOut),
        parseISO(values.checkIn),
      );
      return n > 0 ? n : 0;
    } catch {
      return 0;
    }
  }, [values.checkIn, values.checkOut]);

  const canContinue =
    !!values.propertyId && !!values.checkIn && !!values.checkOut && nights > 0;

  const chalets = properties.filter((p) => p.type === "CHALET");
  const bungalows = properties.filter((p) => p.type === "BUNGALOW");

  return (
    <div className="step-card">
      <h3>
        <span className="num">1</span> Unité &amp; dates
      </h3>
      <div className="sub">
        Sélectionnez l&apos;hébergement puis les dates du séjour.
      </div>

      {/* Unit grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "10px",
          maxHeight: "360px",
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {chalets.length > 0 && (
          <UnitSectionLabel label="Chalets" count={chalets.length} />
        )}
        {chalets.map((p) => (
          <UnitTile
            key={p.id}
            property={p}
            selected={values.propertyId === p.id}
            onSelect={() => onChange({ ...values, propertyId: p.id })}
          />
        ))}
        {bungalows.length > 0 && (
          <UnitSectionLabel label="Bungalows" count={bungalows.length} />
        )}
        {bungalows.map((p) => (
          <UnitTile
            key={p.id}
            property={p}
            selected={values.propertyId === p.id}
            onSelect={() => onChange({ ...values, propertyId: p.id })}
          />
        ))}
      </div>

      {/* Date inputs — same DateRangePicker as the public site for
       *  consistent UX across the app. The picker handles min-date
       *  internally (no past dates allowed). */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "12px",
          alignItems: "end",
          marginTop: "18px",
        }}
      >
        <DateRangePicker
          checkIn={values.checkIn}
          checkOut={values.checkOut}
          onChange={({ checkIn, checkOut }) =>
            onChange({ ...values, checkIn, checkOut })
          }
        />
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius)",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.88rem",
            color: nights > 0 ? "var(--primary)" : "var(--text-dim)",
            whiteSpace: "nowrap",
          }}
          aria-live="polite"
        >
          {nights > 0 ? `${nights} nuit${nights > 1 ? "s" : ""}` : "— nuit"}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginTop: "18px",
        }}
      >
        <button
          type="button"
          className="btn-admin btn-admin-primary"
          disabled={!canContinue}
          onClick={onContinue}
          style={{ opacity: canContinue ? 1 : 0.55 }}
        >
          Continuer
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function UnitSectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "var(--text-dim)",
        fontWeight: 600,
        padding: "8px 0 2px",
      }}
    >
      {label} <span style={{ color: "var(--text-dim)" }}>({count})</span>
    </div>
  );
}

function UnitTile({
  property,
  selected,
  onSelect,
}: {
  property: NewBookingProperty;
  selected: boolean;
  onSelect: () => void;
}) {
  const metaLabel = property.beachfront
    ? "Front de mer"
    : property.seaView
      ? "Vue mer"
      : property.hasPrivatePool
        ? "Piscine privée"
        : property.type === "CHALET"
          ? "2e ligne"
          : "Jardin";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      style={{
        textAlign: "left",
        padding: "10px",
        background: selected ? "var(--bg-surface-2)" : "var(--bg-surface)",
        border: `1px solid ${selected ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "var(--radius)",
        display: "flex",
        gap: "10px",
        alignItems: "center",
        transition: "border-color 0.15s ease, background 0.15s ease",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "5px",
          background: property.photoUrl
            ? `center / cover no-repeat url(${property.photoUrl})`
            : "linear-gradient(135deg, var(--primary-deep), var(--primary))",
          flexShrink: 0,
        }}
        aria-hidden
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: "0.88rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {property.type === "CHALET" ? (
            <BedDouble
              className="size-3.5"
              style={{ color: "var(--primary)" }}
            />
          ) : (
            <Building2
              className="size-3.5"
              style={{ color: "var(--primary)" }}
            />
          )}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {property.name}
          </span>
        </div>
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            display: "flex",
            justifyContent: "space-between",
            gap: "6px",
            marginTop: "2px",
          }}
        >
          <span>{metaLabel}</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text)",
            }}
          >
            {formatTND(property.basePrice)}
          </span>
        </div>
      </div>
    </button>
  );
}
