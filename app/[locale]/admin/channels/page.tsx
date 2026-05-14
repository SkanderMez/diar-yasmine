import { setRequestLocale } from "next-intl/server";
import {
  detectChannelConflicts,
  listAdminChannels,
  listChannelSyncLog,
} from "@/lib/queries";
import { ChannelCard } from "@/components/admin/channels/channel-card";
import { ConflictsBanner } from "@/components/admin/channels/conflicts-banner";
import { SyncLog } from "@/components/admin/channels/sync-log";
import { ForceSyncAllButton } from "@/components/admin/channels/force-sync-all-button";

export const dynamic = "force-dynamic";

export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [cards, conflicts, log] = await Promise.all([
    listAdminChannels(),
    detectChannelConflicts({ lookbackDays: 90 }),
    listChannelSyncLog(30),
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Channel Manager</h1>
          <p>Synchronisation avec les plateformes de distribution</p>
        </div>
        <div className="page-actions">
          <ForceSyncAllButton />
          <button
            type="button"
            className="btn-admin btn-admin-primary"
            aria-label="Connecter un nouveau canal"
          >
            + Connecter un canal
          </button>
        </div>
      </div>

      <ConflictsBanner conflicts={conflicts} />

      <div className="channels-grid">
        {cards.map((card) => (
          <ChannelCard key={card.key} card={card} isEnabled={true} />
        ))}
      </div>

      <SyncLog entries={log} />
    </>
  );
}
