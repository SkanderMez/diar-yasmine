"use client";

import { Check } from "lucide-react";

export interface WizardStep {
  key: string;
  label: string;
  done?: boolean;
  active?: boolean;
}

interface WizardStepperProps {
  steps: WizardStep[];
  onSelect?: (stepKey: string) => void;
}

/**
 * Compact admin stepper — pills with chevron separators. Smaller than the
 * public funnel stepper to fit the dense admin chrome.
 */
export function WizardStepper({ steps, onSelect }: WizardStepperProps) {
  return (
    <div className="stepper-row" role="tablist" aria-label="Étapes">
      {steps.map((step, idx) => {
        const isActive = !!step.active;
        const isDone = !!step.done;
        const interactive = !!onSelect && (isDone || isActive);
        return (
          <div key={step.key} style={{ display: "contents" }}>
            <button
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={!interactive}
              onClick={() => interactive && onSelect?.(step.key)}
              className={`stp${isActive ? " active" : ""}${
                isDone ? " done" : ""
              }`}
              style={{
                cursor: interactive ? "pointer" : "default",
                background: "none",
              }}
            >
              <span className="n" aria-hidden>
                {isDone ? <Check className="size-3" /> : idx + 1}
              </span>
              {step.label}
            </button>
            {idx < steps.length - 1 && (
              <span className="arrow" aria-hidden>
                ›
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
