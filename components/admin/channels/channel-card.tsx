"use client";

import { useTransition } from "react";
import { Home, RefreshCw, Settings } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import type { AdminChannelCard } from "@/lib/queries";
import { forceSyncChannel } from "@/lib/channels/actions";
import { formatTND } from "@/lib/money";
import { ChannelSwitch } from "./channel-switch";
import { ListingChips } from "./listing-chips";

interface ChannelCardProps {
  card: AdminChannelCard;
  /** Server-resolved enabled flag. Until a real `Channel.enabled` column lands, defaults to true. */
  isEnabled: boolean;
}

const KEY_TO_LOGO_CLASS: Record<AdminChannelCard["key"], string> = {
  DIRECT: "direct",
  BOOKING: "booking",
  AIRBNB: "airbnb",
  EXPEDIA: "expedia",
};

const KEY_TO_ABBR: Record<AdminChannelCard["key"], string> = {
  DIRECT: "",
  BOOKING: "B.",
  AIRBNB: "A.",
  EXPEDIA: "E.",
};

const KEY_TO_INTERVAL_MIN: Record<AdminChannelCard["key"], number | null> = {
  BOOKING: 5,
  AIRBNB: 10,
  EXPEDIA: 15,
  DIRECT: null,
};

function formatShortMillimes(amount: number): string {
  // Cards use a compact "128k" / "1.2M" style for the 30-day revenue stat.
  const tnd = amount / 1000;
  if (tnd >= 1_000_000) return `${(tnd / 1_000_000).toFixed(1)}M`;
  if (tnd >= 1000) return `${Math.round(tnd / 1000)}k`;
  return Math.round(tnd).toString();
}

function formatRelativeFr(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export function ChannelCard({ card, isEnabled }: ChannelCardProps) {
  const [pending, startTransition] = useTransition();

  function onForceSync() {
    if (card.key === "DIRECT" || !card.channelType) return;
    startTransition(async () => {
      try {
        const result = await forceSyncChannel({ channel: card.channelType });
        if (result.errors > 0) {
          toast.error(`Sync ${card.name} en erreur`, {
            description: `${result.errors} listing(s) en erreur`,
          });
        } else {
          toast.success(
            `Sync ${card.name} OK · ${result.created} créées · ${result.updated} mises à jour`,
          );
        }
      } catch (err) {
        toast.error("Sync échoué", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  const logoClass = KEY_TO_LOGO_CLASS[card.key];
  const interval = KEY_TO_INTERVAL_MIN[card.key];

  // Third stat varies by channel: Note for OTAs, Commission for Direct.
  const ratingStat =
    card.key === "BOOKING"
      ? { value: "9.2", sub: "/10" }
      : card.key === "AIRBNB"
        ? { value: "4.92", sub: "★" }
        : card.key === "EXPEDIA"
          ? { value: "4.7", sub: "/5" }
          : null;

  const syncCalloutMessage =
    card.key === "DIRECT"
      ? "Source principale · réservations en direct sans commission"
      : interval != null
        ? `Synchronisation auto · toutes les ${interval} min`
        : "Synchronisation auto";
  const syncCalloutPulseClass = !isEnabled
    ? "pulse muted"
    : card.status === "ERROR"
      ? "pulse danger"
      : "pulse";

  const lastSyncLabel =
    card.key === "DIRECT"
      ? "Toujours actif"
      : card.lastSyncAt
        ? `Dernière sync : ${formatRelativeFr(card.lastSyncAt)}`
        : "Jamais synchronisé";

  // Summary chip prepended to the per-listing chips row.
  const summaryChipState =
    card.conflictCount > 0
      ? "conflict"
      : card.revisionCount > 0 && card.syncedCount === 0
        ? "revision"
        : "synced";
  const summaryChipText =
    card.key === "DIRECT"
      ? `${card.totalListings} unités exposées`
      : card.conflictCount > 0
        ? `${card.conflictCount} conflit${card.conflictCount > 1 ? "s" : ""} · ${card.syncedCount}/${card.totalListings} OK`
        : `${card.syncedCount}/${card.totalListings} unités synchronisées`;

  return (
    <div className="channel-card">
      <div className="channel-header">
        <div className={`channel-logo ${logoClass}`}>
          {card.key === "DIRECT" ? <Home size={20} /> : KEY_TO_ABBR[card.key]}
        </div>
        <div>
          <h3>{card.name}</h3>
          <div className="url">{card.url}</div>
        </div>
        <div className="channel-status">
          <span
            className={isEnabled ? "tag tag-confirmed" : "tag tag-cancelled"}
          >
            {isEnabled ? "Actif" : "En pause"}
          </span>
          <ChannelSwitch
            channel={card.channelType}
            initialEnabled={isEnabled}
            locked={card.key === "DIRECT"}
            channelName={card.name}
          />
        </div>
      </div>

      <div className="channel-body">
        <div className="channel-stats">
          <div className="channel-stat">
            <div className="label">Réservations 30j</div>
            <div
              className={`value ${card.key === "DIRECT" ? "text-success" : ""}`}
            >
              {card.reservations30d}
            </div>
          </div>
          <div className="channel-stat">
            <div className="label">Revenu 30j</div>
            <div
              className={`value ${card.key === "DIRECT" ? "text-success" : ""}`}
              title={formatTND(card.revenue30dMillimes)}
            >
              {formatShortMillimes(card.revenue30dMillimes)}
              <span className="value-sub">TND</span>
            </div>
          </div>
          <div className="channel-stat">
            <div className="label">
              {card.key === "DIRECT" ? "Commission" : "Note"}
            </div>
            {card.key === "DIRECT" ? (
              <div className="value text-success">0%</div>
            ) : ratingStat ? (
              <div className="value">
                {ratingStat.value}
                <span className="value-sub">{ratingStat.sub}</span>
              </div>
            ) : (
              <div className="value">—</div>
            )}
          </div>
        </div>

        <div className="channel-sync">
          <span className={syncCalloutPulseClass} />
          {syncCalloutMessage}
        </div>

        <ListingChips
          chips={card.chips}
          summary={
            <span className={`listing-chip ${summaryChipState}`}>
              {summaryChipText}
            </span>
          }
        />
      </div>

      <div className="channel-footer">
        <span className="last-sync">{lastSyncLabel}</span>
        <div style={{ display: "flex", gap: "6px" }}>
          {card.key !== "DIRECT" ? (
            <button
              type="button"
              className="btn-admin btn-admin-ghost btn-admin-sm"
              onClick={onForceSync}
              disabled={pending}
            >
              <RefreshCw
                size={13}
                className={pending ? "animate-spin" : undefined}
              />
              Sync
            </button>
          ) : (
            <Link
              href="/admin/reports"
              className="btn-admin btn-admin-ghost btn-admin-sm"
            >
              Analytics
            </Link>
          )}
          <Link
            href="/admin/channels"
            className="btn-admin btn-admin-secondary btn-admin-sm"
          >
            <Settings size={13} />
            Configurer
          </Link>
        </div>
      </div>
    </div>
  );
}
