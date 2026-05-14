import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Activity,
  Building2,
  CreditCard,
  Settings,
  Tag,
  User,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DashboardActivityEntry } from "@/lib/queries";

interface DashboardActivityFeedProps {
  entries: DashboardActivityEntry[];
}

const ENTITY_ICON: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Reservation: Tag,
  Payment: CreditCard,
  Property: Building2,
  Guest: User,
  Setting: Settings,
  Amenity: Tag,
  PriceRule: Tag,
  Season: Tag,
};

function relative(date: Date): string {
  return formatDistanceToNow(date, { addSuffix: true, locale: fr });
}

/**
 * Activity feed — last 10 AuditLog entries. Server Component.
 * Each row is a deep link when the entity maps to an admin page.
 */
export function DashboardActivityFeed({ entries }: DashboardActivityFeedProps) {
  return (
    <section className="dashboard-panel">
      <header className="dashboard-panel-head">
        <h3>
          <Activity className="size-4" />
          Activité récente
        </h3>
        <span className="dashboard-panel-sub">10 derniers événements</span>
      </header>

      {entries.length === 0 ? (
        <div className="dashboard-empty">
          <p>Aucune activité enregistrée pour le moment.</p>
        </div>
      ) : (
        <ol className="dashboard-activity-feed">
          {entries.map((entry) => {
            const Icon = ENTITY_ICON[entry.entity] ?? Activity;
            const content = (
              <>
                <span className="dashboard-activity-icon" aria-hidden="true">
                  <Icon className="size-3.5" />
                </span>
                <div className="dashboard-activity-body">
                  <div className="dashboard-activity-title">{entry.label}</div>
                  <div className="dashboard-activity-meta">
                    {entry.sublabel ? (
                      <>
                        <span className="dashboard-activity-sub">
                          {entry.sublabel}
                        </span>
                        <span aria-hidden="true">·</span>
                      </>
                    ) : null}
                    {entry.userName ? (
                      <>
                        <span>{entry.userName}</span>
                        <span aria-hidden="true">·</span>
                      </>
                    ) : null}
                    <time
                      dateTime={entry.timestamp.toISOString()}
                      title={entry.timestamp.toLocaleString("fr-FR")}
                    >
                      {relative(entry.timestamp)}
                    </time>
                  </div>
                </div>
              </>
            );

            return (
              <li key={entry.id} className="dashboard-activity-row">
                {entry.href ? (
                  <Link href={entry.href} className="dashboard-activity-link">
                    {content}
                  </Link>
                ) : (
                  <div className="dashboard-activity-link is-static">
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
