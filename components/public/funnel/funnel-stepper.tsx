"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelStepperProps {
  current: 1 | 2 | 3;
}

const STEPS: ReadonlyArray<{ id: 1 | 2 | 3; label: string }> = [
  { id: 1, label: "Hébergement & dates" },
  { id: 2, label: "Vos informations" },
  { id: 3, label: "Paiement" },
];

/**
 * Maquette `.stepper` — sticky row above the funnel showing the 3 steps.
 * Done step = primary bg circle + check icon. Active = primary bg circle
 * + number + soft sand pill background around. Inactive = line-soft circle
 * + muted text. Lines between steps are primary for done segments, line
 * for the rest.
 */
export function FunnelStepper({ current }: FunnelStepperProps) {
  return (
    <div className="sticky top-[88px] z-40 border-b border-line-soft bg-white">
      <div className="container-x py-4">
        <ol className="flex items-center justify-center gap-3 sm:gap-4">
          {STEPS.map((step, idx) => {
            const status: "done" | "active" | "todo" =
              step.id < current
                ? "done"
                : step.id === current
                  ? "active"
                  : "todo";
            const isLast = idx === STEPS.length - 1;
            const segmentDone = step.id < current;
            return (
              <li key={step.id} className="flex items-center gap-3 sm:gap-4">
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 transition-colors sm:px-4",
                    status === "active" && "bg-sand",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[0.85rem] font-semibold",
                      status === "todo" && "bg-line-soft text-muted-foreground",
                      status === "active" &&
                        "bg-primary text-primary-foreground",
                      status === "done" && "bg-success text-ivory",
                    )}
                  >
                    {status === "done" ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden text-sm font-medium sm:inline",
                      status === "todo" && "text-muted-foreground",
                      status === "active" && "text-charcoal",
                      status === "done" && "text-success",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      "h-px w-6 sm:w-10",
                      segmentDone ? "bg-success" : "bg-line",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
