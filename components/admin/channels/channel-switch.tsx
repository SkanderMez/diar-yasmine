"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ChannelType } from "@prisma/client";
import { toggleChannel } from "@/lib/channels/actions";

interface ChannelSwitchProps {
  channel: ChannelType | null;
  initialEnabled: boolean;
  /** When the channel has no toggleable backing (e.g. Direct), the switch is locked on. */
  locked?: boolean;
  channelName: string;
}

export function ChannelSwitch({
  channel,
  initialEnabled,
  locked = false,
  channelName,
}: ChannelSwitchProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (locked || !channel) return;
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      try {
        await toggleChannel({ channel, enabled: next });
        toast.success(
          next ? `${channelName} activé` : `${channelName} mis en pause`,
        );
      } catch (err) {
        setEnabled(!next);
        toast.error("Échec du basculement", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={`Activer ${channelName}`}
      className={`channel-switch ${enabled ? "on" : ""}`}
      onClick={onClick}
      disabled={pending || locked}
    />
  );
}
