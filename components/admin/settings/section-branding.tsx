"use client";

import { useRef } from "react";
import { toast } from "sonner";

interface SectionBrandingProps {
  logoUrl: string | null;
  logoDarkUrl: string | null;
  markUrl: string | null;
}

interface AssetRow {
  key: "logo" | "logo_dark" | "mark";
  label: string;
  sub: string;
}

const ASSET_ROWS: readonly AssetRow[] = [
  {
    key: "logo",
    label: "Logo principal",
    sub: "SVG ou PNG · format paysage",
  },
  {
    key: "logo_dark",
    label: "Logo blanc (dark)",
    sub: "SVG · pour fonds sombres",
  },
  {
    key: "mark",
    label: "Mark (icon only)",
    sub: "Pour favicon, app, vouchers",
  },
];

const PALETTE = [
  "#0E5A6B",
  "#4FB8C4",
  "#F5EFE6",
  "#C44E7A",
  "#7A8F6B",
] as const;

export function SectionBranding({
  logoUrl,
  logoDarkUrl,
  markUrl,
}: SectionBrandingProps) {
  // The plan marks uploads as out-of-scope until a storage backend is wired.
  // We expose a hidden <input type="file"> per row but only stage a toast —
  // updateBranding stays exported by lib/settings-actions and will be wired
  // when the upload pipeline lands.
  const fileRefs = {
    logo: useRef<HTMLInputElement | null>(null),
    logo_dark: useRef<HTMLInputElement | null>(null),
    mark: useRef<HTMLInputElement | null>(null),
  };

  function pick(key: AssetRow["key"]) {
    fileRefs[key].current?.click();
  }

  function onFile(file: File | null, key: AssetRow["key"]) {
    if (!file) return;
    toast.info("Upload bientôt disponible", {
      description: `Asset "${key}" sélectionné (${file.name}). Service de stockage à brancher.`,
    });
  }

  // Prefer the configured dark logo when available; fall back to the bundled
  // white SVG so the preview never breaks.
  const previewSrc = logoDarkUrl ?? "/brand/logo-white.svg";
  void logoUrl;
  void markUrl;

  return (
    <div className="small-card">
      <h3>Branding</h3>
      <div className="sub">
        Identité visuelle utilisée sur le site, les emails et les vouchers
      </div>

      <div className="branding-grid" style={{ marginTop: 16 }}>
        <div
          className="branding-preview"
          style={{
            background: "linear-gradient(135deg, #0E5A6B, #4FB8C4)",
            color: "white",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewSrc}
            alt="Logo Diar Yasmine"
            style={{ height: 110 }}
          />
          <div
            style={{
              marginTop: 16,
              fontFamily: '"Caveat", cursive',
              fontSize: "1.5rem",
            }}
          >
            Tazarka Plage
          </div>
        </div>

        <div>
          {ASSET_ROWS.map((row) => (
            <div key={row.key} className="toggle-row">
              <div>
                <div className="label">{row.label}</div>
                <div className="sub" style={{ margin: 0 }}>
                  {row.sub}
                </div>
              </div>
              <div>
                <input
                  ref={fileRefs[row.key]}
                  type="file"
                  accept="image/svg+xml,image/png"
                  style={{ display: "none" }}
                  onChange={(e) => onFile(e.target.files?.[0] ?? null, row.key)}
                />
                <button
                  type="button"
                  className="btn-admin btn-admin-secondary btn-admin-sm"
                  onClick={() => pick(row.key)}
                >
                  Changer
                </button>
              </div>
            </div>
          ))}

          <h4
            style={{
              marginTop: 20,
              marginBottom: 10,
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Palette
          </h4>
          <div className="color-row">
            {PALETTE.map((hex) => (
              <div key={hex} className="color-swatch">
                <span
                  className="color-dot"
                  style={{ background: hex }}
                  aria-hidden
                />{" "}
                {hex}
              </div>
            ))}
          </div>

          <h4
            style={{
              marginTop: 20,
              marginBottom: 10,
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Typographies
          </h4>
          <div style={{ fontSize: "0.85rem" }}>
            <div style={{ display: "flex", gap: 12, padding: "6px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>Titres</span>
              <span
                style={{
                  fontFamily: '"Fraunces", serif',
                  fontWeight: 500,
                }}
              >
                Fraunces
              </span>
            </div>
            <div style={{ display: "flex", gap: 12, padding: "6px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>Corps</span>
              <span>Inter</span>
            </div>
            <div style={{ display: "flex", gap: 12, padding: "6px 0" }}>
              <span style={{ color: "var(--text-muted)" }}>Script</span>
              <span
                style={{
                  fontFamily: '"Caveat", cursive',
                  fontSize: "1.15rem",
                }}
              >
                Caveat
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
