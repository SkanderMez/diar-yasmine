"use client";

import { Check } from "lucide-react";

export type BulkAction = "email" | "confirm" | "export" | "cancel";

interface ReservationsBulkBarProps {
  selectedCount: number;
  pending: boolean;
  onAction: (action: BulkAction) => void;
}

/**
 * Primary-tinted bar that surfaces the bulk actions when at least one
 * row is selected. Returns null below the threshold so it occupies no
 * vertical space.
 */
export function ReservationsBulkBar({
  selectedCount,
  pending,
  onAction,
}: ReservationsBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-bar" role="region" aria-label="Actions groupées">
      <Check className="size-4" aria-hidden />
      <span>
        {selectedCount} réservation{selectedCount > 1 ? "s" : ""} sélectionnée
        {selectedCount > 1 ? "s" : ""}
      </span>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => onAction("email")}
          disabled={pending}
        >
          Email groupé
        </button>
        <button
          type="button"
          onClick={() => onAction("confirm")}
          disabled={pending}
        >
          Marquer confirmées
        </button>
        <button
          type="button"
          onClick={() => onAction("export")}
          disabled={pending}
        >
          Export
        </button>
        <button
          type="button"
          onClick={() => onAction("cancel")}
          disabled={pending}
          style={{
            background: "rgba(224,116,116,0.2)",
            color: "var(--bg-app)",
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
