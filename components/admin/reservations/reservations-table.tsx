"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MoreVertical, Pencil, Eye, XCircle } from "lucide-react";
import type { ReservationSource, ReservationStatus } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTND } from "@/lib/money";
import type { ReservationRow } from "@/lib/queries";
import {
  channelKeyFromSource,
  paymentBucket,
  type ChannelKey,
} from "@/components/admin/calendar/types";

interface ReservationsTableProps {
  rows: ReservationRow[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
}

const SOURCE_LABEL: Record<ReservationSource, string> = {
  DIRECT_WEB: "Direct",
  WALK_IN: "Walk-in",
  PHONE: "Direct",
  PARTNER: "Direct",
  BOOKING: "Booking",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  OTHER: "Direct",
};

const SOURCE_TAG_CLASS: Record<ChannelKey, string> = {
  direct: "tag-direct",
  booking: "tag-booking",
  airbnb: "tag-airbnb",
  expedia: "tag-expedia",
  walkin: "tag-walkin",
};

const STATUS_TAG_CLASS: Record<ReservationStatus, string> = {
  PENDING: "tag-option",
  CONFIRMED: "tag-confirmed",
  CHECKED_IN: "tag-checkin",
  CHECKED_OUT: "tag-checkout",
  CANCELLED: "tag-cancelled",
  NO_SHOW: "tag-cancelled",
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "Option",
  CONFIRMED: "Confirmée",
  CHECKED_IN: "Check-in",
  CHECKED_OUT: "Terminée",
  CANCELLED: "Annulée",
  NO_SHOW: "No-show",
};

function initials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return `${f}${l}` || "?";
}

/**
 * Inline avatar style: a light tint of the channel color so the eye can
 * read source at a glance even before reaching the source tag column.
 */
function avatarStyle(source: ReservationSource): React.CSSProperties {
  const key = channelKeyFromSource(source);
  switch (key) {
    case "booking":
      return {
        background: "rgba(46,91,186,0.2)",
        color: "#6e8edf",
      };
    case "airbnb":
      return {
        background: "rgba(224,116,116,0.15)",
        color: "var(--ch-airbnb)",
      };
    case "expedia":
      return {
        background: "rgba(224,176,116,0.18)",
        color: "var(--warning)",
      };
    case "walkin":
      return {
        background: "rgba(122,143,107,0.18)",
        color: "var(--ch-walkin-tint-fg)",
      };
    case "direct":
    default:
      return {};
  }
}

function paymentTag(
  total: number,
  paid: number,
): {
  className: string;
  label: string;
} {
  const bucket = paymentBucket(total, paid);
  switch (bucket) {
    case "paid":
      return { className: "tag tag-paid", label: "Payée" };
    case "deposit":
      return { className: "tag tag-deposit", label: "Acompte" };
    case "unpaid":
      return { className: "tag tag-unpaid", label: "Non payée" };
    case "refunded":
      return { className: "tag tag-refunded", label: "Remboursée" };
  }
}

export function ReservationsTable({
  rows,
  selectedIds,
  onSelectionChange,
}: ReservationsTableProps) {
  const allChecked = useMemo(
    () => rows.length > 0 && rows.every((r) => selectedIds.has(r.id)),
    [rows, selectedIds],
  );
  const someChecked = useMemo(
    () => rows.some((r) => selectedIds.has(r.id)),
    [rows, selectedIds],
  );

  function toggleAll() {
    if (allChecked) {
      const next = new Set(selectedIds);
      for (const r of rows) next.delete(r.id);
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      for (const r of rows) next.add(r.id);
      onSelectionChange(next);
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  }

  if (rows.length === 0) {
    return (
      <div style={{ padding: "40px 14px", textAlign: "center" }}>
        <p className="text-muted-admin" style={{ fontSize: "0.9rem" }}>
          Aucune réservation ne correspond aux filtres.
        </p>
      </div>
    );
  }

  return (
    <table className="table-admin res-table">
      <thead>
        <tr>
          <th style={{ width: 40 }}>
            <input
              type="checkbox"
              className="checkbox"
              aria-label="Tout sélectionner"
              checked={allChecked}
              ref={(el) => {
                if (el) el.indeterminate = !allChecked && someChecked;
              }}
              onChange={toggleAll}
            />
          </th>
          <th>Référence</th>
          <th>Client</th>
          <th>Unité</th>
          <th>Arrivée</th>
          <th>Départ</th>
          <th>Nuits</th>
          <th>Voy.</th>
          <th style={{ textAlign: "right" }}>Total TTC</th>
          <th>Paiement</th>
          <th>Statut</th>
          <th>Source</th>
          <th style={{ width: 40 }} aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const checked = selectedIds.has(r.id);
          const pay = paymentTag(r.total, r.paidAmount);
          const channelKey = channelKeyFromSource(r.source);
          const guestMeta = [r.guest.country, r.guest.email].filter(Boolean);
          const travellers =
            r.children > 0
              ? `${r.adults} ad. + ${r.children} enf.`
              : `${r.adults} ad.`;

          return (
            <tr key={r.id}>
              <td onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  className="checkbox"
                  aria-label={`Sélectionner ${r.code}`}
                  checked={checked}
                  onChange={() => toggleOne(r.id)}
                />
              </td>
              <td className="id-col">
                <Link
                  href={`/admin/reservations/${r.code}`}
                  style={{ color: "inherit" }}
                >
                  #{r.code}
                </Link>
              </td>
              <td>
                <div className="client-cell">
                  <div className="client-avatar" style={avatarStyle(r.source)}>
                    {initials(r.guest.firstName, r.guest.lastName)}
                  </div>
                  <div>
                    <div className="client-name">
                      {r.guest.firstName} {r.guest.lastName}
                    </div>
                    {guestMeta.length > 0 ? (
                      <div className="client-meta">{guestMeta.join(" · ")}</div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td>{r.property.name}</td>
              <td>{format(r.checkIn, "dd MMM", { locale: fr })}</td>
              <td>{format(r.checkOut, "dd MMM", { locale: fr })}</td>
              <td>{r.nights}</td>
              <td>{travellers}</td>
              <td className="amount" style={{ textAlign: "right" }}>
                {formatTND(r.total)}
              </td>
              <td>
                <span className={pay.className}>{pay.label}</span>
              </td>
              <td>
                <span className={`tag ${STATUS_TAG_CLASS[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
              </td>
              <td>
                <span className={`tag ${SOURCE_TAG_CLASS[channelKey]}`}>
                  {SOURCE_LABEL[r.source]}
                </span>
              </td>
              <td onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="action-menu-btn"
                      aria-label={`Actions pour ${r.code}`}
                    >
                      <MoreVertical className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/reservations/${r.code}`}>
                        <Eye className="size-4" />
                        Voir le détail
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/reservations/${r.code}`}>
                        <Pencil className="size-4" />
                        Modifier
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/reservations/${r.code}`}>
                        <XCircle className="size-4" />
                        Annuler
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
