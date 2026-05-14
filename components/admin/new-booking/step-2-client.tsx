"use client";

import { useState, useTransition } from "react";
import {
  ArrowRight,
  Minus,
  Plus,
  Search,
  User as UserIcon,
} from "lucide-react";
import { searchGuests } from "@/lib/guests-actions";

export interface Step2Values {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country: string;
  adults: number;
  children: number;
}

interface Step2ClientProps {
  values: Step2Values;
  onChange: (next: Step2Values) => void;
  onContinue: () => void;
}

const COUNTRIES = [
  "Tunisie",
  "Algérie",
  "Maroc",
  "Libye",
  "France",
  "Italie",
  "Allemagne",
  "Espagne",
  "Belgique",
  "Suisse",
  "Royaume-Uni",
  "Autre",
];

interface GuestSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  country: string | null;
}

/**
 * Step 2 — Voyageur principal.
 *
 * Includes a phone-prefix lookup against existing Guests (server action)
 * so receptionists never duplicate a returning guest. If the entered phone
 * matches an existing guest the form auto-fills; otherwise the staff
 * captures the basics inline. Phone is required, email is optional.
 */
export function Step2Client({
  values,
  onChange,
  onContinue,
}: Step2ClientProps) {
  const [matches, setMatches] = useState<GuestSearchResult[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  const [searching, startSearch] = useTransition();
  const [lookupError, setLookupError] = useState<string | null>(null);

  function performLookup() {
    const trimmed = values.phone.trim();
    if (trimmed.length < 4) {
      setLookupError("Saisissez au moins 4 caractères pour la recherche.");
      return;
    }
    setLookupError(null);
    startSearch(async () => {
      try {
        const results = (await searchGuests(trimmed)) as GuestSearchResult[];
        setMatches(results);
        setShowMatches(true);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Recherche impossible";
        setLookupError(message);
      }
    });
  }

  function applyMatch(g: GuestSearchResult) {
    onChange({
      ...values,
      firstName: g.firstName,
      lastName: g.lastName,
      phone: g.phone,
      email: g.email ?? "",
      country: g.country ?? values.country,
    });
    setShowMatches(false);
  }

  const canContinue =
    values.firstName.trim().length > 0 &&
    values.lastName.trim().length > 0 &&
    values.phone.trim().length >= 6 &&
    values.adults >= 1;

  return (
    <div className="step-card">
      <h3>
        <span className="num">2</span> Voyageur principal
      </h3>
      <div className="sub">
        Saisissez le téléphone pour retrouver un client existant, ou créez-le à
        la volée.
      </div>

      {/* Phone lookup row */}
      <div className="field" style={{ marginBottom: "12px" }}>
        <label htmlFor="nb-phone">Téléphone *</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            id="nb-phone"
            type="tel"
            className="input-admin"
            placeholder="+216 ..."
            value={values.phone}
            onChange={(e) => onChange({ ...values, phone: e.target.value })}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            className="btn-admin btn-admin-secondary"
            onClick={performLookup}
            disabled={searching}
          >
            <Search className="size-3.5" />
            {searching ? "Recherche…" : "Rechercher"}
          </button>
        </div>
        {lookupError && (
          <p
            style={{
              marginTop: "6px",
              fontSize: "0.78rem",
              color: "var(--danger)",
            }}
          >
            {lookupError}
          </p>
        )}
        {showMatches && (
          <div
            style={{
              marginTop: "8px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: "var(--bg-surface-2)",
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            {matches.length === 0 ? (
              <div
                style={{
                  padding: "10px 12px",
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                }}
              >
                Aucun client existant — un nouveau dossier sera créé.
              </div>
            ) : (
              matches.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => applyMatch(g)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    borderBottom: "1px solid var(--border)",
                    background: "transparent",
                  }}
                >
                  <span
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, var(--primary), var(--primary-deep))",
                      color: "var(--bg-app)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                    aria-hidden
                  >
                    {(
                      g.firstName.charAt(0) + g.lastName.charAt(0)
                    ).toUpperCase()}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.firstName} {g.lastName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {g.phone}
                      {g.email ? ` · ${g.email}` : ""}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="row-2" style={{ display: "grid", gap: "12px" }}>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="nb-firstname">Prénom *</label>
          <input
            id="nb-firstname"
            type="text"
            className="input-admin"
            value={values.firstName}
            onChange={(e) => onChange({ ...values, firstName: e.target.value })}
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="nb-lastname">Nom *</label>
          <input
            id="nb-lastname"
            type="text"
            className="input-admin"
            value={values.lastName}
            onChange={(e) => onChange({ ...values, lastName: e.target.value })}
          />
        </div>
      </div>

      <div
        className="row-2"
        style={{ display: "grid", gap: "12px", marginTop: "12px" }}
      >
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="nb-email">Email</label>
          <input
            id="nb-email"
            type="email"
            className="input-admin"
            placeholder="(facultatif)"
            value={values.email}
            onChange={(e) => onChange({ ...values, email: e.target.value })}
          />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="nb-country">Pays</label>
          <select
            id="nb-country"
            className="select-admin"
            value={values.country}
            onChange={(e) => onChange({ ...values, country: e.target.value })}
          >
            <option value="">—</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          background: "var(--bg-surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            fontWeight: 600,
            marginBottom: "8px",
          }}
        >
          Voyageurs
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <CounterField
            label="Adultes"
            value={values.adults}
            min={1}
            max={20}
            onChange={(v) => onChange({ ...values, adults: v })}
          />
          <CounterField
            label="Enfants"
            value={values.children}
            min={0}
            max={20}
            onChange={(v) => onChange({ ...values, children: v })}
          />
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
          <UserIcon className="size-3.5" />
          Continuer
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function CounterField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.72rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--text-muted)",
          fontWeight: 600,
          marginBottom: "6px",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--bg-app)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "4px 6px",
        }}
      >
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Diminuer ${label.toLowerCase()}`}
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "4px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            background: "transparent",
            opacity: value <= min ? 0.4 : 1,
          }}
        >
          <Minus className="size-3.5" />
        </button>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: "0.9rem",
          }}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Augmenter ${label.toLowerCase()}`}
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "4px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            background: "transparent",
            opacity: value >= max ? 0.4 : 1,
          }}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
