import type { AdminChannelSyncLogEntry } from "@/lib/queries";
import { TZ } from "@/lib/date";
import { SyncLogFilters } from "./sync-log-filters";

interface SyncLogProps {
  entries: AdminChannelSyncLogEntry[];
}

const CHANNEL_TAG_CLASS: Record<
  AdminChannelSyncLogEntry["channelKey"],
  string
> = {
  direct: "tag-direct",
  booking: "tag-booking",
  airbnb: "tag-airbnb",
  expedia: "tag-expedia",
  conflict: "tag-cancelled",
};

const CHANNEL_TAG_LABEL: Record<
  AdminChannelSyncLogEntry["channelKey"],
  string
> = {
  direct: "Direct",
  booking: "Booking",
  airbnb: "Airbnb",
  expedia: "Expedia",
  conflict: "Conflit",
};

function formatLogTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TZ,
    }).format(date);
  }
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

export function SyncLog({ entries }: SyncLogProps) {
  // Pre-format on the server so the client filter component can stay dumb.
  const serialised = entries.map((e) => ({
    id: e.id,
    timeLabel: formatLogTime(e.timestamp),
    channelKey: e.channelKey,
    channelLabel: CHANNEL_TAG_LABEL[e.channelKey],
    channelTagClass: CHANNEL_TAG_CLASS[e.channelKey],
    description: e.description,
    isDanger: e.isDanger,
    bucket: e.isDanger
      ? "error"
      : e.channelKey === "conflict"
        ? "conflict"
        : "sync",
  }));

  return (
    <div className="sync-log">
      <h4>
        <span>Journal de synchronisation</span>
        <SyncLogFilters />
      </h4>
      {serialised.length === 0 ? (
        <p className="log-empty">Aucune activité récente.</p>
      ) : (
        <div data-sync-log-rows>
          {serialised.map((entry) => (
            <div key={entry.id} className="log-row" data-bucket={entry.bucket}>
              <span className="log-time">{entry.timeLabel}</span>
              <span className={`tag ${entry.channelTagClass}`}>
                {entry.channelLabel}
              </span>
              <span
                className={`log-description ${entry.isDanger ? "is-danger" : ""}`}
              >
                {entry.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
