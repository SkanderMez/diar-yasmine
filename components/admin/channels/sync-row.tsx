"use client";

import { useState, useTransition } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { ChannelType, ChannelSyncStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { upsertChannelSync, runChannelSyncNow } from "@/lib/channels/actions";

interface SyncRowProps {
  propertyId: string;
  propertyName: string;
  channel: ChannelType;
  sync: {
    id: string | null;
    url: string | null;
    lastSyncAt: Date | null;
    status: ChannelSyncStatus | null;
  };
  inboundUrl: string;
}

const CHANNEL_LABEL: Record<ChannelType, string> = {
  BOOKING: "Booking.com",
  AIRBNB: "Airbnb",
  EXPEDIA: "Expedia",
  OTHER: "Autre",
};

export function SyncRow({
  propertyId,
  propertyName,
  channel,
  sync,
  inboundUrl,
}: SyncRowProps) {
  const [url, setUrl] = useState(sync.url ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      try {
        await upsertChannelSync({
          propertyId,
          channel,
          url: url.trim() || null,
        });
        toast.success(`${CHANNEL_LABEL[channel]} : URL enregistrée`);
      } catch (err) {
        toast.error("Échec", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  function syncNow() {
    if (!sync.id) {
      toast.error("Enregistre d'abord l'URL avant de lancer un sync");
      return;
    }
    startTransition(async () => {
      try {
        const summary = await runChannelSyncNow({ syncId: sync.id! });
        if (summary.error) {
          toast.error("Sync en erreur", { description: summary.error });
        } else {
          toast.success(
            `Sync OK : ${summary.fetched} fetched · ${summary.created} créées · ${summary.updated} mises à jour · ${summary.cancelled} annulées`,
          );
        }
      } catch (err) {
        toast.error("Sync échoué", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  async function copyOutbound() {
    try {
      await navigator.clipboard.writeText(inboundUrl);
      toast.success("URL copiée — collez-la dans le dashboard OTA");
    } catch {
      toast.error("Copie impossible");
    }
  }

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-card p-4 sm:grid-cols-[1fr_2fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-medium text-foreground">{propertyName}</p>
        <p className="text-xs text-muted-foreground">
          {CHANNEL_LABEL[channel]}
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={`URL iCal entrante (${CHANNEL_LABEL[channel]})`}
            type="url"
          />
          <Button size="sm" variant="outline" onClick={save} disabled={pending}>
            Enregistrer
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>URL sortante :</span>
          <code className="rounded bg-secondary px-1.5 py-0.5 font-mono">
            {inboundUrl}
          </code>
          <button
            type="button"
            onClick={copyOutbound}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <Copy className="size-3" /> copier
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        {sync.status ? (
          <Badge
            variant={
              sync.status === "ERROR"
                ? "destructive"
                : sync.status === "SYNCING"
                  ? "outline"
                  : "secondary"
            }
            className="text-[10px]"
          >
            {sync.status}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            non configuré
          </Badge>
        )}
        {sync.lastSyncAt && (
          <span className="text-[10px] text-muted-foreground">
            {new Date(sync.lastSyncAt).toLocaleString("fr-FR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        )}
        <Button
          size="xs"
          variant="ghost"
          onClick={syncNow}
          disabled={pending || !sync.id}
          className="gap-1"
        >
          <RefreshCw className={`size-3 ${pending ? "animate-spin" : ""}`} />
          Sync now
        </Button>
      </div>
    </div>
  );
}
