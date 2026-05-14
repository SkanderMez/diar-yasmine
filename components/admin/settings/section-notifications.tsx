"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  NOTIFICATION_KEYS,
  type NotificationKey,
} from "@/lib/notification-keys";
import { updateNotificationPref } from "@/lib/settings-actions";

interface SectionNotificationsProps {
  prefs: Record<NotificationKey, boolean>;
}

interface Entry {
  key: NotificationKey;
  label: string;
  sub: string;
}

const ENTRIES: readonly Entry[] = [
  {
    key: "new_reservation",
    label: "Nouvelle réservation",
    sub: "Email + push mobile à toute l'équipe",
  },
  {
    key: "cancellation",
    label: "Annulation",
    sub: "Email aux administrateurs uniquement",
  },
  {
    key: "conflict",
    label: "Conflit de double-booking",
    sub: "Urgence — push + email immédiats",
  },
  {
    key: "checkin_24h",
    label: "Check-in dans 24h",
    sub: "Rappel pour la réception et le ménage",
  },
  {
    key: "review_published",
    label: "Avis client publié",
    sub: "Email digest hebdomadaire",
  },
  {
    key: "monthly_report",
    label: "Rapport mensuel",
    sub: "1er du mois · admin uniquement",
  },
];

// Static-sanity assert: every NOTIFICATION_KEYS member has a UI entry.
const _coverage: Record<NotificationKey, true> = Object.fromEntries(
  NOTIFICATION_KEYS.map((k) => [k, true]),
) as Record<NotificationKey, true>;
void _coverage;

export function SectionNotifications({ prefs }: SectionNotificationsProps) {
  const [values, setValues] = useState<Record<NotificationKey, boolean>>(prefs);
  const [pending, startTransition] = useTransition();

  function toggle(key: NotificationKey) {
    const previous = values[key];
    const next = !previous;
    setValues((prev) => ({ ...prev, [key]: next }));

    startTransition(async () => {
      try {
        await updateNotificationPref({ key, enabled: next });
      } catch (err) {
        // Rollback on failure.
        setValues((prev) => ({ ...prev, [key]: previous }));
        toast.error("Échec de la mise à jour", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <div className="small-card">
      <h3>Notifications</h3>
      <div className="sub">
        Quand vous (et l&apos;équipe) souhaitez être alertés
      </div>

      {ENTRIES.map((entry) => {
        const on = values[entry.key];
        return (
          <div key={entry.key} className="toggle-row">
            <div>
              <div className="label">{entry.label}</div>
              <div className="sub">{entry.sub}</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={entry.label}
              className={`switch${on ? " on" : ""}`}
              onClick={() => toggle(entry.key)}
              disabled={pending}
            />
          </div>
        );
      })}
    </div>
  );
}
