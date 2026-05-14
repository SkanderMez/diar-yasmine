import type { PropertyType } from "@prisma/client";
import { Phone, Mail } from "lucide-react";
import { formatLocalized } from "@/lib/date";
import type { ReservationDetail } from "@/lib/queries";

interface ReservationStayCardProps {
  reservation: ReservationDetail["reservation"];
}

function propertyEmoji(type: PropertyType): string {
  return type === "CHALET" ? "🏖" : "🌿";
}

function propertyTypeLabel(type: PropertyType): string {
  return type === "CHALET" ? "Chalet" : "Bungalow";
}

/**
 * "Séjour" card — main stay summary identical to the calendar drawer's
 * Séjour + Voyageur blocks. Property line, dates with nights pill,
 * guests count, and the client's name + phone (tel: link).
 */
export function ReservationStayCard({ reservation }: ReservationStayCardProps) {
  const guests =
    `${reservation.adults} adulte${reservation.adults > 1 ? "s" : ""}` +
    (reservation.children > 0
      ? ` · ${reservation.children} enfant${reservation.children > 1 ? "s" : ""}`
      : "");

  return (
    <section className="card-admin reservation-card">
      <header className="card-header">
        <h3>Séjour</h3>
      </header>
      <div className="card-body reservation-stay-body">
        <div className="reservation-stay-grid">
          <div className="reservation-stay-pair">
            <span className="reservation-stay-label">Hébergement</span>
            <span className="reservation-stay-value">
              <span aria-hidden className="reservation-stay-emoji">
                {propertyEmoji(reservation.property.type)}
              </span>
              <span className="reservation-stay-property">
                {reservation.property.name}
                <span className="reservation-stay-property-type">
                  {" · "}
                  {propertyTypeLabel(reservation.property.type)}
                </span>
              </span>
            </span>
          </div>

          <div className="reservation-stay-pair">
            <span className="reservation-stay-label">Dates</span>
            <span className="reservation-stay-value reservation-stay-dates">
              <span>
                {formatLocalized(reservation.checkIn, "EEE d MMM yyyy")} →{" "}
                {formatLocalized(reservation.checkOut, "EEE d MMM yyyy")}
              </span>
              <span className="reservation-stay-nights">
                {reservation.nights} nuit{reservation.nights > 1 ? "s" : ""}
              </span>
            </span>
          </div>

          <div className="reservation-stay-pair">
            <span className="reservation-stay-label">Voyageurs</span>
            <span className="reservation-stay-value">{guests}</span>
          </div>

          <div className="reservation-stay-pair">
            <span className="reservation-stay-label">Client</span>
            <span className="reservation-stay-value reservation-stay-client">
              <span className="reservation-stay-client-name">
                {reservation.guest.firstName} {reservation.guest.lastName}
              </span>
              <span className="reservation-stay-client-contact">
                <a
                  href={`tel:${reservation.guest.phone}`}
                  className="reservation-stay-link"
                >
                  <Phone className="size-3" aria-hidden />
                  {reservation.guest.phone}
                </a>
                {reservation.guest.email ? (
                  <a
                    href={`mailto:${reservation.guest.email}`}
                    className="reservation-stay-link"
                  >
                    <Mail className="size-3" aria-hidden />
                    {reservation.guest.email}
                  </a>
                ) : null}
              </span>
            </span>
          </div>
        </div>

        {reservation.guestRequests ? (
          <div className="reservation-stay-requests">
            <span className="reservation-stay-label">Demandes du client</span>
            <p>{reservation.guestRequests}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
