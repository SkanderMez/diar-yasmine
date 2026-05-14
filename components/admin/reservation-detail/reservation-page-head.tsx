import { formatLocalized } from "@/lib/date";
import {
  CHANNEL_LABEL,
  channelKeyFromSource,
  paymentBucket,
  RESERVATION_STATUS_LABEL,
} from "@/components/admin/calendar/types";
import type { ReservationDetail } from "@/lib/queries";

interface ReservationPageHeadProps {
  reservation: ReservationDetail["reservation"];
  actions: React.ReactNode;
}

/**
 * Top "page-head" block of the reservation detail page.
 *
 * Mirrors the admin design system used by /admin/dashboard and the
 * calendar drawer: title row with reservation code in mono + status /
 * channel / payment tags, subtitle with the creation timestamp + staff
 * member, and an actions slot on the right.
 */
export function ReservationPageHead({
  reservation,
  actions,
}: ReservationPageHeadProps) {
  const channel = channelKeyFromSource(reservation.source);
  const channelLabel = CHANNEL_LABEL[channel];
  const statusLabel = RESERVATION_STATUS_LABEL[reservation.status];
  const pay = paymentBucket(reservation.total, reservation.paidAmount);

  const channelTagClass =
    channel === "direct"
      ? "tag-direct"
      : channel === "booking"
        ? "tag-booking"
        : channel === "airbnb"
          ? "tag-airbnb"
          : channel === "expedia"
            ? "tag-expedia"
            : "tag-walkin";

  const statusTagClass =
    reservation.status === "PENDING"
      ? "tag-option"
      : reservation.status === "CHECKED_IN"
        ? "tag-checkin"
        : reservation.status === "CHECKED_OUT"
          ? "tag-checkout"
          : reservation.status === "CANCELLED" ||
              reservation.status === "NO_SHOW"
            ? "tag-cancelled"
            : "tag-confirmed";

  const payTagClass =
    pay === "paid"
      ? "tag-paid"
      : pay === "deposit"
        ? "tag-deposit"
        : pay === "refunded"
          ? "tag-refunded"
          : "tag-unpaid";

  const payTagLabel =
    pay === "paid"
      ? "Réglée"
      : pay === "deposit"
        ? "Acompte reçu"
        : pay === "refunded"
          ? "Remboursée"
          : "Non payée";

  return (
    <div className="page-head reservation-page-head">
      <div className="reservation-page-head-title">
        <div className="reservation-page-head-row">
          <h1 className="reservation-code">{reservation.code}</h1>
          <span className={`tag ${statusTagClass}`}>{statusLabel}</span>
          <span className={`tag ${channelTagClass}`}>{channelLabel}</span>
          <span className={`tag ${payTagClass}`}>{payTagLabel}</span>
        </div>
        <p>
          Créée le{" "}
          {formatLocalized(reservation.createdAt, "d MMM yyyy 'à' HH:mm")}
          {reservation.createdBy ? ` par ${reservation.createdBy.name}` : null}
        </p>
      </div>
      <div className="page-actions reservation-page-actions">{actions}</div>
    </div>
  );
}
