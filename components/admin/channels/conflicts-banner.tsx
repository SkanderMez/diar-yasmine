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

export function ConflictsBanner({ conflicts }: ConflictsBannerProps) {
  if (conflicts.length === 0) return null;

  const total = conflicts.length;
  const heading =
    total === 1
      ? "1 conflit de double réservation détecté"
      : `${total} conflits de double réservation détectés`;

  return (
    <div className="conflicts-card" role="alert">
      <h4>
        <AlertTriangle size={16} />
        {heading}
      </h4>
      {conflicts.map((c) => (
        <div key={c.id} className="conflict-row">
          <strong>
            {c.propertyName} · {c.rangeLabel}
          </strong>
          <span style={{ color: "var(--text-muted)" }}>
            {c.primary.guestLabel} ({SOURCE_LABEL[c.primary.source]})
            <strong style={{ color: "var(--text)" }}> vs </strong>
            {c.secondary.guestLabel} ({SOURCE_LABEL[c.secondary.source]})
          </span>
          <span className="tag tag-cancelled">Conflit</span>
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
