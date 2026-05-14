import { Globe } from "lucide-react";

interface GuestOriginProps {
  countries: { code: string; label: string; pct: number }[];
}

/**
 * Convert a 2-letter ISO country code to its flag emoji using the
 * regional-indicator Unicode block (e.g. "TN" → 🇹🇳). Returns null if
 * the code is missing or has a non-letter character so the caller can
 * fall back to a globe glyph.
 */
function countryCodeToFlag(code: string): string | null {
  if (code.length !== 2) return null;
  const upper = code.toUpperCase();
  const codePoints: number[] = [];
  for (let i = 0; i < 2; i++) {
    const c = upper.charCodeAt(i);
    if (c < 65 || c > 90) return null;
    codePoints.push(0x1f1e6 + (c - 65));
  }
  return String.fromCodePoint(...codePoints);
}

export function GuestOrigin({ countries }: GuestOriginProps) {
  return (
    <div className="chart-card">
      <h3>Origine clientèle</h3>
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {countries.length === 0 ? (
          <p
            style={{
              padding: "12px 0",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
            }}
          >
            Aucune origine connue sur cette période.
          </p>
        ) : null}
        {countries.map((c) => {
          const isOther = c.code === "OTHER" || c.code === "—";
          const flag = isOther ? null : countryCodeToFlag(c.code);
          return (
            <div key={c.code} className="country-bar">
              <span className="label">
                {flag ? (
                  <span style={{ marginRight: 6 }}>{flag}</span>
                ) : (
                  <Globe
                    size={14}
                    aria-hidden
                    style={{
                      marginRight: 6,
                      verticalAlign: "middle",
                      color: "var(--text-muted)",
                    }}
                  />
                )}
                {c.label}
              </span>
              <div className="track">
                <div className="fill" style={{ width: `${c.pct}%` }} />
              </div>
              <span className="pct">{`${Math.round(c.pct)}%`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
