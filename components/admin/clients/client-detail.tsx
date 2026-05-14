import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Baby,
  Calendar,
  Check,
  CircleAlert,
  Clock,
  Eye,
  FileText,
  Heart,
  Home,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  User as UserIcon,
} from "lucide-react";
import type {
  Guest,
  ReservationSource,
  ReservationStatus,
} from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { formatTND } from "@/lib/money";
import { formatLocalized } from "@/lib/date";
import type {
  ClientDocuments,
  ClientPreference,
  ClientStats,
  ClientStayHistory,
} from "@/lib/queries";
import { channelKeyFromSource } from "@/components/admin/calendar/types";

interface ClientDetailProps {
  guest: Guest;
  stats: ClientStats;
  reservations: ClientStayHistory[];
  preferences: ClientPreference[];
  documents: ClientDocuments;
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

const SOURCE_TAG_CLASS: Record<
  ReturnType<typeof channelKeyFromSource>,
  string
> = {
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
  CHECKED_IN: "En cours",
  CHECKED_OUT: "Terminée",
  CANCELLED: "Annulée",
  NO_SHOW: "No-show",
};

function avatarInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return `${f}${l}` || "?";
}

function travellersLabel(adults: number, children: number): string {
  if (children > 0) return `${adults} ad. + ${children} enf.`;
  return `${adults} ad.`;
}

function formatBigTnd(millimes: number): string {
  // Compact display for the KPI tile — the maquette shows "28,4k" with
  // the "TND" unit underneath. We keep it integer-TND.
  const tnd = millimes / 1000;
  if (Math.abs(tnd) >= 10000) {
    return `${(tnd / 1000).toFixed(1).replace(".", ",")}k`;
  }
  return tnd.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

function PreferenceIcon({ icon }: { icon: ClientPreference["icon"] }) {
  switch (icon) {
    case "home":
      return <Home className="size-3.5" />;
    case "eye":
      return <Eye className="size-3.5" />;
    case "alert":
      return <CircleAlert className="size-3.5" />;
    case "baby":
      return <Baby className="size-3.5" />;
    case "user":
      return <UserIcon className="size-3.5" />;
    case "check":
      return <Check className="size-3.5" />;
  }
}

export function ClientDetail({
  guest,
  stats,
  reservations,
  preferences,
  documents,
}: ClientDetailProps) {
  const fullName = `${guest.firstName} ${guest.lastName}`.trim();
  const initials = avatarInitials(guest.firstName, guest.lastName);
  const memberSinceLabel = formatLocalized(guest.createdAt, "MMMM yyyy");
  // Primary source pill in the badge row — pick the most recent reservation's
  // source if we have one, otherwise default to Direct.
  const primarySource = reservations[0]?.source ?? "DIRECT_WEB";
  const primaryChannel = channelKeyFromSource(primarySource);

  const showLoyalty = stats.staysCount >= 3;

  return (
    <>
      <div className="detail-head">
        <div className="detail-head-top">
          <div className="client-avatar-xl" aria-hidden>
            {initials}
          </div>
          <div className="detail-head-name">
            <h2>
              {fullName}
              {stats.isVip ? (
                <Star
                  className="size-5"
                  fill="var(--warning)"
                  stroke="var(--warning)"
                  aria-label="Client VIP"
                />
              ) : null}
            </h2>
            <div className="badges">
              <span className={`tag ${SOURCE_TAG_CLASS[primaryChannel]}`}>
                {SOURCE_LABEL[primarySource]}
              </span>
              {stats.isVip ? (
                <span
                  className="tag"
                  style={{
                    background: "rgba(224,176,116,0.15)",
                    color: "var(--warning)",
                  }}
                >
                  <Star className="size-3" fill="currentColor" aria-hidden />{" "}
                  VIP
                </span>
              ) : null}
              {showLoyalty ? (
                <span className="tag tag-confirmed">Client fidèle</span>
              ) : null}
            </div>
            <div className="contact-line">
              {guest.email ? (
                <div>
                  <Mail className="size-3.5" />{" "}
                  <a href={`mailto:${guest.email}`}>{guest.email}</a>
                </div>
              ) : null}
              <div>
                <Phone className="size-3.5" />{" "}
                <a href={`tel:${guest.phone.replace(/\s/g, "")}`}>
                  {guest.phone}
                </a>
              </div>
              {guest.country ? (
                <div>
                  <MapPin className="size-3.5" /> {guest.country}
                </div>
              ) : null}
              <div>Client depuis {memberSinceLabel}</div>
            </div>
          </div>
          <div className="detail-head-actions">
            {guest.email ? (
              <a
                href={`mailto:${guest.email}`}
                className="btn-admin btn-admin-secondary btn-admin-sm"
              >
                <Mail className="size-3.5" />
                Email
              </a>
            ) : (
              <button
                type="button"
                className="btn-admin btn-admin-secondary btn-admin-sm"
                disabled
                aria-disabled
                style={{ opacity: 0.6, cursor: "not-allowed" }}
              >
                <Mail className="size-3.5" />
                Email
              </button>
            )}
            <Link
              href="/admin/reservations/new"
              className="btn-admin btn-admin-primary btn-admin-sm"
            >
              <Plus className="size-3.5" />
              Nouvelle résa
            </Link>
          </div>
        </div>

        <div className="detail-kpis">
          <div className="detail-kpi">
            <div className="label">Séjours</div>
            <div className="value">{stats.staysCount}</div>
            <div className="sub">
              {stats.upcomingCount > 0
                ? `+${stats.upcomingCount} à venir`
                : "Aucun à venir"}
            </div>
          </div>
          <div className="detail-kpi">
            <div className="label">Dépense totale</div>
            <div className="value">{formatBigTnd(stats.totalSpent)}</div>
            <div className="sub">TND</div>
          </div>
          <div className="detail-kpi">
            <div className="label">Panier moyen</div>
            <div className="value">{formatBigTnd(stats.avgBasket)}</div>
            <div className="sub">TND / séjour</div>
          </div>
          <div className="detail-kpi">
            <div className="label">Note moyenne</div>
            <div className="value text-success">
              ★ {stats.avgRating.toFixed(1)}
            </div>
            <div className="sub">
              {stats.reviewsCount > 0
                ? `${stats.reviewsCount} avis`
                : "Pas encore d'avis"}
            </div>
          </div>
        </div>
      </div>

      <div className="detail-body">
        <section className="detail-section">
          <h3>
            <Clock className="size-3.5" />
            Historique des séjours
          </h3>
          {reservations.length === 0 ? (
            <p className="text-muted-admin" style={{ fontSize: "0.85rem" }}>
              Aucun séjour enregistré pour ce client.
            </p>
          ) : (
            reservations.map((r) => (
              <Link
                key={r.id}
                href={`/admin/reservations/${r.code}`}
                className="stay-row"
                style={{ color: "inherit" }}
              >
                <div
                  className="stay-thumb"
                  style={
                    r.photoUrl
                      ? {
                          backgroundImage: `url(${JSON.stringify(r.photoUrl)})`,
                        }
                      : undefined
                  }
                  aria-hidden
                />
                <div className="stay-info">
                  <div className="name">
                    {r.propertyName} ·{" "}
                    {format(r.checkIn, "d MMM", { locale: fr })} –{" "}
                    {format(r.checkOut, "d MMM yyyy", { locale: fr })}
                  </div>
                  <div className="dates">
                    {r.nights} nuit{r.nights > 1 ? "s" : ""} ·{" "}
                    {travellersLabel(r.adults, r.children)}
                  </div>
                </div>
                <span className={`tag ${STATUS_TAG_CLASS[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                <div className="stay-amount">{formatTND(r.total)}</div>
              </Link>
            ))
          )}
        </section>

        <section className="detail-section">
          <h3>
            <FileText className="size-3.5" />
            Notes internes
          </h3>
          {guest.notes ? (
            <div className="note-card">
              {guest.notes}
              <div className="meta">
                Mise à jour le {formatLocalized(guest.updatedAt, "d MMM yyyy")}
              </div>
            </div>
          ) : (
            <p className="text-muted-admin" style={{ fontSize: "0.85rem" }}>
              Pas encore de note interne pour ce client.
            </p>
          )}
        </section>

        <section className="detail-section">
          <h3>
            <Heart className="size-3.5" />
            Préférences
          </h3>
          <div className="pref-grid">
            {preferences.map((p) => (
              <div key={p.label} className="pref-row">
                <PreferenceIcon icon={p.icon} />
                {p.label}
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h3>
            <FileText className="size-3.5" />
            Documents
          </h3>
          <div className="doc-grid">
            <div className="doc-card">
              <FileText className="size-5" />
              <div>
                <div className="doc-name">Pièce d&apos;identité</div>
                <div className="doc-sub">
                  {documents.hasIdDocument ? "Vérifiée" : "Non fournie"}
                </div>
              </div>
            </div>
            <div className="doc-card">
              <FileText className="size-5" />
              <div>
                <div className="doc-name">
                  Factures ({documents.invoicesCount})
                </div>
                <div className="doc-sub">Voir tout</div>
              </div>
            </div>
            <div className="doc-card">
              <Calendar className="size-5" />
              <div>
                <div className="doc-name">
                  Vouchers ({documents.vouchersCount})
                </div>
                <div className="doc-sub">Voir tout</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
