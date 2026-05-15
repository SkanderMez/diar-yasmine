import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import {
  findReservationByCode,
  listInternalNotesForReservation,
} from "@/lib/queries";
import { ReservationPageHead } from "@/components/admin/reservation-detail/reservation-page-head";
import { ReservationStayCard } from "@/components/admin/reservation-detail/reservation-stay-card";
import { ReservationTariffCard } from "@/components/admin/reservation-detail/reservation-tariff-card";
import { ReservationPaymentsCard } from "@/components/admin/reservation-detail/reservation-payments-card";
import { ReservationNotesCard } from "@/components/admin/reservation-detail/reservation-notes-card";
import { InternalNotesThread } from "@/components/admin/reservation-detail/internal-notes-thread";
import { ReservationActivityCard } from "@/components/admin/reservation-detail/reservation-activity-card";
import { ReservationActions } from "@/components/admin/reservation-detail/reservation-actions";

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);

  const data = await findReservationByCode(code);
  if (!data) notFound();

  const { reservation, audit } = data;
  const internalNotes = await listInternalNotesForReservation(reservation.id);

  return (
    <>
      <ReservationPageHead
        reservation={reservation}
        actions={
          <ReservationActions
            reservationId={reservation.id}
            code={reservation.code}
            currentStatus={reservation.status}
          />
        }
      />

      <div className="reservation-detail-grid">
        <div className="reservation-detail-main">
          <ReservationStayCard reservation={reservation} />
          <ReservationTariffCard reservation={reservation} />
          <ReservationPaymentsCard reservation={reservation} />
          <ReservationNotesCard
            reservationId={reservation.id}
            initialNotes={reservation.internalNotes}
          />
          <InternalNotesThread
            scope={{ reservationId: reservation.id }}
            initial={internalNotes}
          />
        </div>

        <div className="reservation-detail-side">
          <ReservationActivityCard audit={audit} />
        </div>
      </div>
    </>
  );
}
