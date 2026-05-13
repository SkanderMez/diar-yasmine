import type { ChannelType } from "@prisma/client";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { SyncRow } from "@/components/admin/channels/sync-row";

const SUPPORTED_CHANNELS: ChannelType[] = ["BOOKING", "AIRBNB", "EXPEDIA"];

export default async function ChannelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [properties, syncs] = await Promise.all([
    prisma.property.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, type: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    prisma.channelSync.findMany({
      select: {
        id: true,
        channel: true,
        propertyId: true,
        url: true,
        lastSyncAt: true,
        status: true,
      },
    }),
  ]);

  const syncMap = new Map<string, (typeof syncs)[number]>();
  for (const s of syncs) {
    syncMap.set(`${s.propertyId}:${s.channel}`, s);
  }

  const baseUrl = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-medium text-foreground">Canaux</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Configure les feeds iCal entrants (depuis Booking / Airbnb / Expedia)
          et fournit l&apos;URL sortante de Diar Yasmine aux OTAs pour
          qu&apos;ils bloquent les nuits déjà réservées en direct. La synchro
          entrante tourne toutes les 15 minutes via Vercel Cron.
        </p>
      </header>

      {properties.map((property) => (
        <section key={property.id} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {property.type === "CHALET" ? "🏖️" : "🌿"} {property.name}
          </h2>
          <div className="space-y-2">
            {SUPPORTED_CHANNELS.map((channel) => {
              const existing = syncMap.get(`${property.id}:${channel}`);
              return (
                <SyncRow
                  key={channel}
                  propertyId={property.id}
                  propertyName={property.name}
                  channel={channel}
                  sync={{
                    id: existing?.id ?? null,
                    url: existing?.url ?? null,
                    lastSyncAt: existing?.lastSyncAt ?? null,
                    status: existing?.status ?? null,
                  }}
                  inboundUrl={`${baseUrl}/api/channels/ical/${property.id}`}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
