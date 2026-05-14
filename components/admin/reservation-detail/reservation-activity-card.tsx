import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  Check,
  CreditCard,
  FileText,
  LogIn,
  LogOut,
  Pencil,
  Plus,
  UserX,
  XCircle,
} from "lucide-react";
import type { ReservationDetail } from "@/lib/queries";

interface ReservationActivityCardProps {
  audit: ReservationDetail["audit"];
}

const ACTION_LABEL: Record<string, string> = {
  "reservation.created": "Réservation créée",
  "reservation.confirmed": "Confirmée",
  "reservation.status_changed": "Statut modifié",
  "reservation.cancelled": "Annulée",
  "reservation.checked_in": "Arrivée enregistrée",
  "reservation.checked_out": "Départ enregistré",
  "reservation.no_show": "No-show enregistré",
  "reservation.updated": "Réservation modifiée",
  "reservation.notes_updated": "Notes internes modifiées",
  "reservation.imported_from_channel": "Importée d'un canal",
  "reservation.updated_via_channel_sync": "Synchronisée depuis canal",
  "reservation.cancelled_via_channel_sync": "Annulée via canal",
  "payment.received": "Paiement reçu",
  "payment.refunded": "Paiement remboursé",
  "voucher.generated": "Voucher généré",
  "voucher.sent": "Voucher envoyé",
};

const ACTION_ICON: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "reservation.created": Plus,
  "reservation.confirmed": Check,
  "reservation.status_changed": Pencil,
  "reservation.cancelled": XCircle,
  "reservation.checked_in": LogIn,
  "reservation.checked_out": LogOut,
  "reservation.no_show": UserX,
  "reservation.updated": Pencil,
  "reservation.notes_updated": Pencil,
  "reservation.imported_from_channel": Plus,
  "reservation.updated_via_channel_sync": Activity,
  "reservation.cancelled_via_channel_sync": XCircle,
  "payment.received": CreditCard,
  "payment.refunded": CreditCard,
  "voucher.generated": FileText,
  "voucher.sent": FileText,
};

function labelForAction(action: string): string {
  return ACTION_LABEL[action] ?? action;
}

function iconForAction(
  action: string,
): React.ComponentType<{ className?: string }> {
  return ACTION_ICON[action] ?? Activity;
}

/**
 * Historique card — feed of audit-log entries scoped to this reservation
 * (and its payments). Uses the same row layout as the dashboard's
 * activity feed (icon, label, relative time, user).
 */
export function ReservationActivityCard({
  audit,
}: ReservationActivityCardProps) {
  return (
    <section className="card-admin reservation-card reservation-activity-card">
      <header className="card-header">
        <h3>
          <Activity className="size-4" aria-hidden />
          Historique
        </h3>
        <span className="reservation-activity-meta-count">
          {audit.length} événement{audit.length > 1 ? "s" : ""}
        </span>
      </header>

      <div className="card-body reservation-activity-body">
        {audit.length === 0 ? (
          <p className="reservation-activity-empty">
            Aucune activité enregistrée.
          </p>
        ) : (
          <ol className="reservation-activity-feed">
            {audit.map((entry) => {
              const Icon = iconForAction(entry.action);
              return (
                <li key={entry.id} className="reservation-activity-row">
                  <span
                    className="reservation-activity-icon"
                    aria-hidden="true"
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="reservation-activity-content">
                    <div className="reservation-activity-title">
                      {labelForAction(entry.action)}
                    </div>
                    <div className="reservation-activity-meta">
                      {entry.user?.name ? (
                        <>
                          <span>{entry.user.name}</span>
                          <span aria-hidden>·</span>
                        </>
                      ) : null}
                      <time
                        dateTime={entry.timestamp.toISOString()}
                        title={entry.timestamp.toLocaleString("fr-FR")}
                      >
                        {formatDistanceToNow(entry.timestamp, {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
