"use client";

import { Check, Pencil } from "lucide-react";

interface FunnelStepSummaryProps {
  stepNumber: number;
  title: string;
  summaryLines: string[];
  onEdit?: () => void;
}

/**
 * Maquette `details > summary` collapsed pill — used when a step is already
 * confirmed and we want to show a one-line recap on top of the next step
 * with a "Modifier" affordance.
 */
export function FunnelStepSummary({
  stepNumber,
  title,
  summaryLines,
  onEdit,
}: FunnelStepSummaryProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-md bg-sand px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-ivory">
          <Check className="size-4" strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-success">
            Étape {stepNumber} confirmée — {title}
          </p>
          <p className="truncate text-sm font-medium text-charcoal">
            {summaryLines.join(" · ")}
          </p>
        </div>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-white"
        >
          <Pencil className="size-3.5" />
          <span className="hidden sm:inline">Modifier</span>
        </button>
      )}
    </div>
  );
}
