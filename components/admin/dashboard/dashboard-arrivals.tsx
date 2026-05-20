import { CheckCircle2, ChevronRight, Phone } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { Link } from "@/i18n/navigation";
import { TZ } from "@/lib/date";
import { formatTND } from "@/lib/money";
import type { DashboardArrival } from "@/lib/queries";
import {
  channelKeyFromSource,
  paymentBucket,
} from "@/components/admin/calendar/types";

interface DashboardArrivalsProps {
  arrivals: DashboardArrival[];
}

const CHANNEL_TAG_CLASS: Record<string, string> = {
  direct: "tag-direct",
  booking: "tag-booking",
  airbnb: "tag-airbnb",
  expedia: "tag-expedia",
  walkin: "tag-walkin",
};

const CHANNEL_LABEL: Record<string, string> = {
  direct: "Direct",
  booking: "Booking",
  airbnb: "Airbnb",
  expedia: "Expedia",
  walkin: "Walk-in",
};

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

/**
 * Today's check-in list — Server Component. Each row links to the
 * reservation detail page; the title in the panel-head goes to the
 * filtered reservations list.
 */
export function DashboardArrivals({ arrivals }: DashboardArrivalsProps) {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel-head">
        <h3>
          <span className="dashboard-panel-emoji" aria-hidden="true">
            🛬
          </span>
          Arrivées du jour
        </h3>
        <Link
          href="/admin/reservations?filter=checkin_today"
          className="dashboard-panel-link"
        >
          Tout voir
          <ChevronRight className="size-3.5" />
        </Link>
      </header>

      {arrivals.length === 0 ? (
        <div className="dashboard-empty">
          <CheckCircle2 className="size-5" aria-hidden="true" />
          <p>Aucune arrivée aujourd&apos;hui.</p>
        </div>
      ) : (
        <ul className="dashboard-arrival-list">
          {arrivals.map((r) => {
            const channel = channelKeyFromSource(r.source);
            const bucket = paymentBucket(r.total, r.paidAmount);
            const checkInLabel = formatInTimeZone(r.checkIn, TZ, "HH:mm");
            return (
              <li key={r.id} className="dashboard-arrival">
                <Link
                  href={`/admin/reservations/${r.code}`}
                  className="dashboard-arrival-link"
                >
                  <div className="dashboard-arrival-thumb" aria-hidden="true">
                    {r.propertyPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.propertyPhotoUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span>{r.propertyName.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="dashboard-arrival-body">
                    <div className="dashboard-arrival-line">
                      <span className="dashboard-arrival-name">
                        {r.guestFirstName} {r.guestLastName}
                      </span>
                      <span
                        className={`tag ${CHANNEL_TAG_CLASS[channel]}`}
                        data-channel={channel}
                      >
                        {CHANNEL_LABEL[channel]}
                      </span>
                    </div>
                    <div className="dashboard-arrival-meta">
                      <span>{r.propertyName}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {r.nights} nuit{r.nights > 1 ? "s" : ""}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {r.adults}
                        {r.children > 0 ? `+${r.children}` : ""} voy.
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-arrival-side">
                    <div className="dashboard-arrival-time">{checkInLabel}</div>
                    <div className={`dashboard-pay-pill pay-${bucket}`}>
                      {formatTND(r.total)}
                    </div>
                  </div>
                </Link>

                <div className="dashboard-arrival-actions">
                  <a
                    href={`tel:${r.guestPhone}`}
                    className="dashboard-arrival-action"
                    aria-label={`Appeler ${r.guestFirstName} ${r.guestLastName}`}
                    title="Appeler"
                  >
                    <Phone className="size-3.5" />
                  </a>
                  <span className="dashboard-arrival-avatar" aria-hidden="true">
                    {initials(r.guestFirstName, r.guestLastName)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
