"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Check,
  FileDown,
  FileText,
  LogIn,
  LogOut,
  MoreVertical,
  UserX,
  XCircle,
} from "lucide-react";
import type { ReservationStatus } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { cancelReservation, updateReservationStatus } from "@/lib/reservations";

/**
 * Allowed lifecycle transitions. Mirrors the previous StatusActions
 * implementation so business logic / RBAC stays untouched — only the
 * presentation switches to the admin design system (.btn-admin*).
 */
const TRANSITIONS: Partial<Record<ReservationStatus, ReservationStatus[]>> = {
  PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED", "NO_SHOW"],
  CHECKED_IN: ["CHECKED_OUT"],
  CHECKED_OUT: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const ICONS: Record<ReservationStatus, React.ReactNode> = {
  PENDING: <Check className="size-3.5" aria-hidden />,
  CONFIRMED: <Check className="size-3.5" aria-hidden />,
  CHECKED_IN: <LogIn className="size-3.5" aria-hidden />,
  CHECKED_OUT: <LogOut className="size-3.5" aria-hidden />,
  CANCELLED: <XCircle className="size-3.5" aria-hidden />,
  NO_SHOW: <UserX className="size-3.5" aria-hidden />,
};

const LABELS: Record<ReservationStatus, string> = {
  PENDING: "Mettre en attente",
  CONFIRMED: "Confirmer",
  CHECKED_IN: "Check-in",
  CHECKED_OUT: "Check-out",
  CANCELLED: "Annuler",
  NO_SHOW: "No-show",
};

function variantFor(target: ReservationStatus): string {
  if (target === "CANCELLED" || target === "NO_SHOW") return "btn-admin-danger";
  if (target === "CHECKED_IN" || target === "CHECKED_OUT")
    return "btn-admin-primary";
  return "btn-admin-secondary";
}

interface ReservationActionsProps {
  reservationId: string;
  code: string;
  currentStatus: ReservationStatus;
}

export function ReservationActions({
  reservationId,
  code,
  currentStatus,
}: ReservationActionsProps) {
  const [pending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<ReservationStatus | null>(null);
  const next = TRANSITIONS[currentStatus] ?? [];

  function run(targetStatus: ReservationStatus) {
    setBusyAction(targetStatus);
    startTransition(async () => {
      try {
        if (targetStatus === "CANCELLED") {
          await cancelReservation({ id: reservationId });
        } else {
          await updateReservationStatus({
            id: reservationId,
            status: targetStatus,
          });
        }
        toast.success(`Statut mis à jour : ${LABELS[targetStatus]}`);
      } catch (err) {
        toast.error("Échec du changement de statut", {
          description: err instanceof Error ? err.message : "Erreur inconnue",
        });
      } finally {
        setBusyAction(null);
      }
    });
  }

  return (
    <>
      {next.map((status) => (
        <button
          key={status}
          type="button"
          className={`btn-admin ${variantFor(status)} btn-admin-sm`}
          onClick={() => run(status)}
          disabled={pending}
        >
          {busyAction === status ? (
            <span className="reservation-actions-spinner" aria-hidden>
              …
            </span>
          ) : (
            ICONS[status]
          )}
          {LABELS[status]}
        </button>
      ))}

      <Link
        href={`/admin/reservations/${code}/voucher`}
        className="btn-admin btn-admin-secondary btn-admin-sm"
      >
        <FileText className="size-3.5" aria-hidden />
        Voucher
      </Link>
      <a
        href={`/api/vouchers/${code}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-admin btn-admin-ghost btn-admin-sm"
      >
        <FileDown className="size-3.5" aria-hidden />
        Voucher PDF
      </a>
      <button
        type="button"
        className="icon-btn"
        aria-label="Plus d'actions"
        disabled
        title="Plus d'actions (à venir)"
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>
    </>
  );
}
