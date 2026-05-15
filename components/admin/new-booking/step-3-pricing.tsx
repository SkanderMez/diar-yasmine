"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  Plus,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { formatTND } from "@/lib/money";
import { computePricing } from "./pricing";
import type { PriceLine } from "./types";

interface Step3PricingProps {
  basePriceMillimes: number;
  nights: number;
  lines: PriceLine[];
  onLinesChange: (lines: PriceLine[]) => void;
  onContinue: () => void;
}

const EXTRA_PRESETS = [
  { label: "Frais de ménage final", amount: 80_000 },
  { label: "Padel · 1 session", amount: 60_000 },
  { label: "Transfert aéroport AR", amount: 240_000 },
];

/**
 * Step 3 — Tarification.
 *
 * The pricing editor. Lines are kept in a flat array; the discount line
 * has a %/TND toggle (the critical widget). Extras can be added freely
 * with preset shortcuts. TVA is editable as a percent.
 */
export function Step3Pricing({
  basePriceMillimes,
  nights,
  lines,
  onLinesChange,
  onContinue,
}: Step3PricingProps) {
  const breakdown = useMemo(
    () =>
      computePricing({
        basePriceMillimes,
        nights,
        lines,
      }),
    [basePriceMillimes, nights, lines],
  );

  const discountLine = lines.find((l) => l.kind === "discount");
  const taxLine = lines.find((l) => l.kind === "tax");
  const extras = lines.filter((l) => l.kind === "extra");

  function patchLine(id: string, patch: Partial<PriceLine>) {
    onLinesChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addExtra(preset?: { label: string; amount: number }) {
    const id = `extra-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    onLinesChange([
      ...lines,
      {
        id,
        kind: "extra",
        label: preset?.label ?? "Nouvelle prestation",
        value: preset?.amount ?? 0,
      },
    ]);
  }

  function removeExtra(id: string) {
    onLinesChange(lines.filter((l) => l.id !== id));
  }

  const showLongStayHint = nights >= 5;

  return (
    <div className="step-card">
      <h3>
        <span className="num">3</span> Tarification
      </h3>
      <div className="sub">
        Construisez le tarif final ligne par ligne. Vous pouvez appliquer une
        remise globale en %, ou en montant fixe.
      </div>

      <div className="price-table">
        {/* Base price */}
        <div className="price-row editable">
          <div className="label">
            <CircleDollarSign className="size-3.5" aria-hidden />
            <input
              className="line-label"
              value={`Base · ${nights || 0} nuits × ${formatTND(
                basePriceMillimes,
              )}`}
              readOnly
            />
          </div>
          <input
            className="line-value"
            value={formatTND(breakdown.basePrice)}
            readOnly
          />
        </div>

        {/* Discount with %/TND toggle */}
        {discountLine && (
          <div
            className="price-row editable discount"
            style={{
              padding: "12px 0",
              borderTop: "1px dashed var(--border)",
              borderBottom: "1px dashed var(--border)",
              margin: "8px 0",
            }}
          >
            <div className="label">
              <Tag className="size-3.5" aria-hidden />
              <input
                className="line-label"
                value={discountLine.label}
                onChange={(e) =>
                  patchLine(discountLine.id, { label: e.target.value })
                }
                placeholder="Libellé de la remise"
              />
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div className="discount-toggle">
                <button
                  type="button"
                  className={discountLine.mode === "%" ? "active" : ""}
                  onClick={() =>
                    patchLine(discountLine.id, { mode: "%", value: 0 })
                  }
                >
                  %
                </button>
                <button
                  type="button"
                  className={discountLine.mode === "TND" ? "active" : ""}
                  onClick={() =>
                    patchLine(discountLine.id, { mode: "TND", value: 0 })
                  }
                >
                  TND
                </button>
              </div>
              <input
                className="line-value"
                type="number"
                min={0}
                value={
                  discountLine.mode === "TND"
                    ? // Display millimes as TND for the user.
                      Math.round((discountLine.value / 1000) * 100) / 100
                    : discountLine.value
                }
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  if (discountLine.mode === "TND") {
                    patchLine(discountLine.id, {
                      value: Number.isFinite(raw) ? Math.round(raw * 1000) : 0,
                    });
                  } else {
                    patchLine(discountLine.id, {
                      value: Number.isFinite(raw) ? raw : 0,
                    });
                  }
                }}
                style={{ width: "80px" }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.85rem",
                  color: "var(--success)",
                  minWidth: "100px",
                  textAlign: "right",
                }}
              >
                {breakdown.discountAmount > 0
                  ? `− ${formatTND(breakdown.discountAmount)}`
                  : formatTND(0)}
              </span>
            </div>
          </div>
        )}

        {/* Extras */}
        {extras.map((extra) => (
          <div key={extra.id} className="price-row editable">
            <div className="label">
              <Sparkles className="size-3.5" aria-hidden />
              <input
                className="line-label"
                value={extra.label}
                onChange={(e) => patchLine(extra.id, { label: e.target.value })}
                placeholder="Libellé"
              />
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                className="line-value"
                type="number"
                min={0}
                step="0.001"
                value={Math.round((extra.value / 1000) * 100) / 100}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  patchLine(extra.id, {
                    value: Number.isFinite(raw) ? Math.round(raw * 1000) : 0,
                  });
                }}
              />
              <button
                type="button"
                onClick={() => removeExtra(extra.id)}
                aria-label="Supprimer la ligne"
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
            marginTop: "4px",
          }}
        >
          <button
            type="button"
            className="add-line-btn"
            onClick={() => addExtra()}
          >
            <Plus className="size-3.5" />
            Ajouter une ligne
          </button>
          {EXTRA_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => addExtra(preset)}
              style={{
                fontSize: "0.74rem",
                color: "var(--text-muted)",
                padding: "4px 10px",
                borderRadius: "var(--r-pill)",
                background: "var(--bg-surface-3)",
                border: "1px solid var(--border)",
              }}
            >
              + {preset.label} ({formatTND(preset.amount)})
            </button>
          ))}
        </div>

        {/* Subtotal */}
        <div className="price-row totals">
          <span className="label" style={{ color: "var(--text)" }}>
            Sous-total HT
          </span>
          <span style={{ fontFamily: "var(--font-mono)" }}>
            {formatTND(breakdown.subtotal)}
          </span>
        </div>

        {/* Tax editable % */}
        {taxLine && (
          <div className="price-row editable">
            <div className="label">
              <input
                className="line-label"
                value={taxLine.label}
                onChange={(e) =>
                  patchLine(taxLine.id, { label: e.target.value })
                }
              />
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={taxLine.value}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  patchLine(taxLine.id, {
                    value: Number.isFinite(raw)
                      ? Math.max(0, Math.min(100, raw))
                      : 0,
                  });
                }}
                style={{
                  background: "var(--bg-app)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  width: "60px",
                  textAlign: "right",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.78rem",
                  marginLeft: "4px",
                }}
                aria-label="Taux TVA"
              />
              <span
                style={{
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  marginLeft: "2px",
                }}
              >
                %
              </span>
            </div>
            <span
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}
            >
              {formatTND(breakdown.tax)}
            </span>
          </div>
        )}

        {/* Grand total */}
        <div className="price-row grand-total">
          <span className="label">Total TTC</span>
          <span className="value">{formatTND(breakdown.total)}</span>
        </div>
      </div>

      {showLongStayHint && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            background: "rgba(93, 191, 140, 0.08)",
            border: "1px solid rgba(93, 191, 140, 0.2)",
            borderRadius: "var(--radius)",
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
          }}
        >
          <Check
            className="size-[18px]"
            style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ fontSize: "0.85rem", color: "var(--text)" }}>
            <strong>Remise automatique long séjour</strong> proposée (≥ 5
            nuits). Vous pouvez la désactiver ou modifier sa valeur.
          </div>
        </div>
      )}

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
          onClick={onContinue}
        >
          Continuer vers le paiement
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
