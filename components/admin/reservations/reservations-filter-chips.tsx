"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReservationListFilter } from "@/lib/queries";

interface ChipDef {
  key: ReservationListFilter;
  label: string;
  /** Optional colored dot — used by "Non payées" / "Acompte" chips. */
  dot?: "unpaid" | "deposit";
}

const CHIPS: ChipDef[] = [
  { key: "all", label: "Toutes" },
  { key: "confirmed", label: "Confirmées" },
  { key: "option", label: "En option" },
  { key: "checkin_today", label: "Check-in aujourd'hui" },
  { key: "checkout_today", label: "Check-out aujourd'hui" },
  { key: "upcoming", label: "À venir" },
  { key: "completed", label: "Terminées" },
  { key: "cancelled", label: "Annulées" },
  { key: "unpaid", label: "Non payées", dot: "unpaid" },
  { key: "deposit", label: "Acompte", dot: "deposit" },
];

interface ReservationsFilterChipsProps {
  counts: Record<ReservationListFilter, number>;
  activeFilter: ReservationListFilter;
}

export function ReservationsFilterChips({
  counts,
  activeFilter,
}: ReservationsFilterChipsProps) {
  const router = useRouter();
  const sp = useSearchParams();

  function selectFilter(key: ReservationListFilter) {
    const params = new URLSearchParams(sp?.toString());
    if (key === "all") {
      params.delete("filter");
    } else {
      params.set("filter", key);
    }
    // Reset to page 1 when the filter changes — otherwise we'd land on
    // an out-of-range page in the new result set.
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  return (
    <>
      {CHIPS.map((chip) => {
        const active = chip.key === activeFilter;
        const dotColor =
          chip.dot === "unpaid"
            ? "var(--pay-unpaid)"
            : chip.dot === "deposit"
              ? "var(--pay-deposit)"
              : undefined;
        const inactiveDotStyle =
          !active && dotColor
            ? {
                borderColor:
                  chip.dot === "unpaid"
                    ? "rgba(224,116,116,0.5)"
                    : "rgba(229,185,104,0.5)",
                color: dotColor,
              }
            : undefined;

        return (
          <button
            key={chip.key}
            type="button"
            className={`fchip${active ? " active" : ""}`}
            onClick={() => selectFilter(chip.key)}
            style={inactiveDotStyle}
          >
            {dotColor ? (
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: dotColor,
                  display: "inline-block",
                }}
              />
            ) : null}
            {chip.label}
            <span className="num">{counts[chip.key] ?? 0}</span>
          </button>
        );
      })}
    </>
  );
}
