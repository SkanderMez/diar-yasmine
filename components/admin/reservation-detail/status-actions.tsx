"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Check,
  DoorOpen,
  FileDown,
  FileText,
  LogIn,
  LogOut,
  UserX,
  XCircle,
} from "lucide-react";
import type { ReservationStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cancelReservation, updateReservationStatus } from "@/lib/reservations";

/**
 * Status / lifecycle actions for the reservation detail page.
 *
 * Phase 2 enforces the allowed transitions in the UI only (button visibility).
 * The Server Action runs without explicit transition checks — Phase 2.5 will
 * add a state-machine guard so a misclick can't push a reservation into an
 * impossible state.
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
  PENDING: <Check className="size-4" />,
  CONFIRMED: <Check className="size-4" />,
  CHECKED_IN: <LogIn className="size-4" />,
  CHECKED_OUT: <LogOut className="size-4" />,
  CANCELLED: <XCircle className="size-4" />,
  NO_SHOW: <UserX className="size-4" />,
};

const LABELS: Record<ReservationStatus, string> = {
  PENDING: "Mettre en attente",
  CONFIRMED: "Confirmer",
  CHECKED_IN: "Check-in",
  CHECKED_OUT: "Check-out",
  CANCELLED: "Annuler",
  NO_SHOW: "No-show",
};

interface StatusActionsProps {
  reservationId: string;
  code: string;
  currentStatus: ReservationStatus;
}

export function StatusActions({
  reservationId,
  code,
  currentStatus,
}: StatusActionsProps) {
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

  if (next.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        <VoucherPreviewButton code={code} />
        <VoucherPdfButton code={code} />
        <p className="basis-full text-xs text-muted-foreground">
          Cette réservation est dans un état terminal. Aucune action de
          transition disponible.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next.map((s) => (
        <Button
          key={s}
          variant={s === "CANCELLED" || s === "NO_SHOW" ? "outline" : "default"}
          size="sm"
          onClick={() => run(s)}
          disabled={pending}
          className="gap-2"
        >
          {busyAction === s ? (
            <span className="size-4 animate-pulse">…</span>
          ) : (
            ICONS[s]
          )}
          {LABELS[s]}
        </Button>
      ))}
      <VoucherPreviewButton code={code} />
      <VoucherPdfButton code={code} />
    </div>
  );
}

function VoucherPreviewButton({ code }: { code: string }) {
  return (
    <Button asChild variant="default" size="sm" className="gap-2">
      <Link href={`/admin/reservations/${code}/voucher`}>
        <FileText className="size-4" />
        Voucher
      </Link>
    </Button>
  );
}

function VoucherPdfButton({ code }: { code: string }) {
  return (
    <Button asChild variant="ghost" size="sm" className="gap-2">
      <a
        href={`/api/vouchers/${code}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FileDown className="size-4" />
        Voucher PDF
      </a>
    </Button>
  );
}

// Lint-quiet re-export so it's used if needed in icons-only header variants.
export const STATUS_ICON_FOR_TESTS = DoorOpen;
