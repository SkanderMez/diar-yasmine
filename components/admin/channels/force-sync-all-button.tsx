"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { forceSyncAll } from "@/lib/channels/actions";

export function ForceSyncAllButton() {
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      try {
        const result = await forceSyncAll();
        if (result.errors > 0) {
          toast.error("Sync globale en erreur", {
            description: `${result.errors} listing(s) en erreur sur ${
              result.created + result.updated
            } reçu(s)`,
          });
        } else {
          toast.success(
            `Sync globale OK · ${result.created} créées · ${result.updated} mises à jour · ${result.cancelled} annulées`,
          );
        }
      } catch (err) {
        toast.error("Sync globale échouée", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <button
      type="button"
      className="btn-admin btn-admin-ghost"
      onClick={onClick}
      disabled={pending}
      aria-label="Forcer la synchronisation globale"
    >
      <RefreshCw size={14} className={pending ? "animate-spin" : undefined} />
      Forcer sync globale
    </button>
  );
}
