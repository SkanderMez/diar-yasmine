import { AlertTriangle } from "lucide-react";
import type { ReservationSource } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import type { AdminChannelConflict } from "@/lib/queries";

interface ConflictsBannerProps {
  conflicts: AdminChannelConflict[];
}

const SOURCE_LABEL: Record<ReservationSource, string> = {
  DIRECT_WEB: "Direct",
  WALK_IN: "Walk-in",
  PHONE: "Téléphone",
  PARTNER: "Partenaire",
  BOOKING: "Booking",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  OTHER: "Autre",
};

const SEVERITY_LABEL: Record<AdminChannelConflict["severity"], string> = {
  imminent: "Imminent",
  current: "En cours",
  future: "À venir",
  past: "Passé",
};

const SEVERITY_TAG: Record<AdminChannelConflict["severity"], string> = {
  imminent: "tag-cancelled",
  current: "tag-cancelled",
  future: "tag-confirmed",
  past: "tag-direct",
};

function severitySubtitle(c: AdminChannelConflict): string {
  if (c.severity === "imminent") {
    return c.daysUntilStart <= 0
      ? "démarre aujourd'hui"
      : `dans ${c.daysUntilStart} j`;
  }
  if (c.severity === "current") return "séjour en cours";
  if (c.severity === "past") return `il y a ${Math.abs(c.daysUntilStart)} j`;
  return `dans ${c.daysUntilStart} j`;
}

export function ConflictsBanner({ conflicts }: ConflictsBannerProps) {
  if (conflicts.length === 0) return null;

  const total = conflicts.length;
  const imminentCount = conflicts.filter(
    (c) => c.severity === "imminent" || c.severity === "current",
  ).length;
  const heading =
    total === 1
      ? "1 conflit de double réservation détecté"
      : `${total} conflits de double réservation détectés${
          imminentCount > 0
            ? ` (${imminentCount} urgent${imminentCount > 1 ? "s" : ""})`
            : ""
        }`;

  return (
    <div className="conflicts-card" role="alert">
      <h4>
        <AlertTriangle size={16} />
        {heading}
      </h4>
      {conflicts.map((c) => (
        <div key={c.id} className={`conflict-row severity-${c.severity}`}>
          <strong>
            {c.propertyName} · {c.rangeLabel}
          </strong>
          <span style={{ color: "var(--text-muted)" }}>
            {c.primary.guestLabel} ({SOURCE_LABEL[c.primary.source]})
            <strong style={{ color: "var(--text)" }}> vs </strong>
            {c.secondary.guestLabel} ({SOURCE_LABEL[c.secondary.source]})
            <span
              style={{
                marginLeft: 8,
                fontSize: "0.75rem",
                color: "var(--text-dim)",
              }}
            >
              · {severitySubtitle(c)}
            </span>
          </span>
          <span className={`tag ${SEVERITY_TAG[c.severity]}`}>
            {SEVERITY_LABEL[c.severity]}
          </span>
          <div className="conflict-actions">
            <Link
              href="/admin/reservations"
              className="btn-admin btn-admin-secondary btn-admin-sm"
            >
              Résoudre
            </Link>
            <button
              type="button"
              className="btn-admin btn-admin-ghost btn-admin-sm"
            >
              Ignorer
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
