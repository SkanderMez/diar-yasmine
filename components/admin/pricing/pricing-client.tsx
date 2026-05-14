"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Download, History } from "lucide-react";
import { toast } from "sonner";
import { toZonedTime } from "date-fns-tz";
import { addDays, startOfMonth } from "date-fns";
import { useRouter } from "@/i18n/navigation";
import {
  computeDayPrice,
  isWeekendLocal,
} from "@/lib/pricing/compute-day-price";
import { TZ, parseLocalDate } from "@/lib/date";
import {
  publishPricing,
  updateMinStayRules,
  updateSeasonMultiplier,
  updateSupplements,
} from "@/lib/pricing-actions";
import { SeasonsCard, type SeasonRowData } from "./seasons-card";
import { SupplementsCard, type SupplementsState } from "./supplements-card";
import { RulesCard, type RulesState } from "./rules-card";
import {
  PricingCalendar,
  type PricingDayCell,
  type PricingMonth,
} from "./pricing-calendar";
import { UnitPicker, type UnitPickerOption } from "./unit-picker";

export interface PricingClientProps {
  units: UnitPickerOption[];
  selectedUnit: {
    id: string;
    name: string;
    basePrice: number;
    photoUrl: string | null;
  };
  /** First month to render (YYYY-MM). */
  monthKey: string;
  seasons: SeasonRowData[];
  supplements: SupplementsState;
  rules: RulesState;
}

const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

interface ParsedSeason {
  id: string;
  name: string;
  tier: SeasonRowData["tier"];
  multiplier: number;
  startMonthDay: { month: number; day: number };
  endMonthDay: { month: number; day: number };
}

/**
 * Resolve which season (if any) a given local YYYY-MM-DD falls under.
 * Seasons are matched by month-day so the same multipliers apply year over
 * year — easier than re-creating Season rows annually.
 */
function findSeasonTier(
  seasons: ParsedSeason[],
  month: number,
  day: number,
): { tier: SeasonRowData["tier"]; multiplier: number } | null {
  const key = month * 100 + day;
  for (const s of seasons) {
    const startKey = s.startMonthDay.month * 100 + s.startMonthDay.day;
    const endKey = s.endMonthDay.month * 100 + s.endMonthDay.day;
    const inRange =
      startKey <= endKey
        ? key >= startKey && key <= endKey
        : key >= startKey || key <= endKey;
    if (inRange) {
      return { tier: s.tier, multiplier: s.multiplier };
    }
  }
  return null;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function shiftMonth(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return monthKey;
  const idx = (y * 12 + (m - 1) + delta + 12000) % 12000;
  return `${Math.floor(idx / 12)}-${pad((idx % 12) + 1)}`;
}

/**
 * Build the 7×N grid for one month, padded with outside cells from the
 * previous and next months so the grid always starts on Monday.
 */
function buildMonth(
  monthKey: string,
  seasons: ParsedSeason[],
  supplements: SupplementsState,
  basePrice: number,
  todayLocal: { year: number; month: number; day: number },
): PricingMonth {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) {
    return { label: monthKey, days: [] };
  }
  const firstOfMonth = parseLocalDate(`${y}-${pad(m)}-01`);
  const firstZoned = toZonedTime(firstOfMonth, TZ);
  // Day-of-week with Monday=0 (the maquette starts on Monday).
  const dowMondayBased = (firstZoned.getDay() + 6) % 7;
  const gridStart = addDays(firstOfMonth, -dowMondayBased);

  // Find the last day of the visible grid. Always render full weeks until
  // we've covered the last day of the month.
  const lastDayOfMonth = startOfMonth(addDays(firstOfMonth, 35));
  const monthEnd = addDays(lastDayOfMonth, -1);
  const monthEndZoned = toZonedTime(monthEnd, TZ);
  // Cells from gridStart through end of week containing month-end.
  const monthLength = monthEndZoned.getDate();
  const totalCells = Math.ceil((dowMondayBased + monthLength) / 7) * 7;

  const days: PricingDayCell[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const day = addDays(gridStart, i);
    const zoned = toZonedTime(day, TZ);
    const cellYear = zoned.getFullYear();
    const cellMonth = zoned.getMonth() + 1;
    const cellDay = zoned.getDate();
    const isOutside = cellMonth !== m;

    const ymd = `${cellYear}-${pad(cellMonth)}-${pad(cellDay)}`;
    const isWeekend = isWeekendLocal(day);
    const seasonHit = findSeasonTier(seasons, cellMonth, cellDay);
    const isToday =
      cellYear === todayLocal.year &&
      cellMonth === todayLocal.month &&
      cellDay === todayLocal.day;

    let price: number | null = null;
    const badges: string[] = [];
    if (!isOutside && seasonHit) {
      price = computeDayPrice({
        basePrice,
        date: day,
        seasonMultiplier: seasonHit.multiplier,
        weekendPct: supplements.weekendPct,
        tnHolidaysPct: supplements.tnHolidaysPct,
        ramadanPct: supplements.ramadanPct,
        aidPct: supplements.aidPct,
      });
      if (isWeekend) badges.push("WE");
    }

    days.push({
      date: ymd,
      dayNumber: cellDay,
      price,
      season: isOutside ? null : (seasonHit?.tier ?? null),
      isWeekend,
      isToday: !isOutside && isToday,
      isOutside,
      badges,
    });
  }

  return {
    label: `${MONTH_LABELS[m - 1]} ${y}`,
    days,
  };
}

export function PricingClient({
  units,
  selectedUnit,
  monthKey,
  seasons,
  supplements,
  rules,
}: PricingClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [seasonState, setSeasonState] = useState(seasons);
  const [supplementsState, setSupplementsState] = useState(supplements);
  const [rulesState, setRulesState] = useState(rules);

  // Pre-parse season ranges (month/day extracted from the underlying ISO).
  const parsedSeasons = useMemo<ParsedSeason[]>(
    () =>
      seasonState.map((s) => ({
        id: s.id,
        name: s.name,
        tier: s.tier,
        multiplier: s.multiplier,
        startMonthDay: s.startMonthDay,
        endMonthDay: s.endMonthDay,
      })),
    [seasonState],
  );

  const months = useMemo(() => {
    const now = new Date();
    const nowZoned = toZonedTime(now, TZ);
    const todayLocal = {
      year: nowZoned.getFullYear(),
      month: nowZoned.getMonth() + 1,
      day: nowZoned.getDate(),
    };
    const nextMonthKey = shiftMonth(monthKey, 1);
    return [
      buildMonth(
        monthKey,
        parsedSeasons,
        supplementsState,
        selectedUnit.basePrice,
        todayLocal,
      ),
      buildMonth(
        nextMonthKey,
        parsedSeasons,
        supplementsState,
        selectedUnit.basePrice,
        todayLocal,
      ),
    ];
  }, [monthKey, parsedSeasons, supplementsState, selectedUnit.basePrice]);

  const headerLabel = useMemo(() => {
    const a = months[0]?.label.split(" ")[0] ?? "";
    const b = months[1]?.label.split(" ")[0] ?? "";
    const yearB = months[1]?.label.split(" ")[1] ?? "";
    return `${a} – ${b} ${yearB}`;
  }, [months]);

  function navigateMonth(delta: number) {
    const nextKey = shiftMonth(monthKey, delta);
    const sp = new URLSearchParams({
      unitId: selectedUnit.id,
      month: nextKey,
    });
    router.push(`/admin/pricing?${sp.toString()}`);
  }

  function handleSeasonChange(id: string, multiplier: number) {
    setSeasonState((prev) =>
      prev.map((s) => (s.id === id ? { ...s, multiplier } : s)),
    );
  }

  function handlePublish() {
    startTransition(async () => {
      try {
        // 1. Save season multipliers that changed.
        const seasonChanges = seasonState.filter((s) => {
          const original = seasons.find((o) => o.id === s.id);
          return original && original.multiplier !== s.multiplier;
        });
        for (const s of seasonChanges) {
          await updateSeasonMultiplier({
            seasonId: s.id,
            multiplier: s.multiplier,
          });
        }
        // 2. Save supplements + rules.
        await updateSupplements(supplementsState);
        await updateMinStayRules(rulesState);
        // 3. Mark published.
        await publishPricing();
        toast.success("Tarifs publiés");
        router.refresh();
      } catch (err) {
        toast.error("Publication échouée", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  function handleApply() {
    startTransition(async () => {
      try {
        await updateSupplements(supplementsState);
        await updateMinStayRules(rulesState);
        const seasonChanges = seasonState.filter((s) => {
          const original = seasons.find((o) => o.id === s.id);
          return original && original.multiplier !== s.multiplier;
        });
        for (const s of seasonChanges) {
          await updateSeasonMultiplier({
            seasonId: s.id,
            multiplier: s.multiplier,
          });
        }
        toast.success("Changements appliqués");
        router.refresh();
      } catch (err) {
        toast.error("Échec", {
          description: err instanceof Error ? err.message : "Erreur",
        });
      }
    });
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tarification saisonnière</h1>
          <p>Tarifs dynamiques par unité, saison, week-end et événements</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-admin btn-admin-ghost">
            <History className="size-3.5" />
            Historique
          </button>
          <button type="button" className="btn-admin btn-admin-secondary">
            <Download className="size-3.5" />
            Export
          </button>
          <button
            type="button"
            className="btn-admin btn-admin-primary"
            onClick={handlePublish}
            disabled={pending}
          >
            {pending ? "Publication…" : "Publier les tarifs"}
          </button>
        </div>
      </div>

      <div className="pricing-grid">
        <div>
          <SeasonsCard seasons={seasonState} onChange={handleSeasonChange} />
          <SupplementsCard
            value={supplementsState}
            onChange={setSupplementsState}
          />
          <RulesCard value={rulesState} onChange={setRulesState} />
        </div>

        <div className="pricing-cal">
          <div className="pricing-cal-head">
            <UnitPicker
              units={units}
              selectedId={selectedUnit.id}
              month={monthKey}
            />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigateMonth(-1)}
                aria-label="Mois précédent"
              >
                <ChevronLeft size={14} />
              </button>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "0.95rem",
                  minWidth: 180,
                  textAlign: "center",
                }}
              >
                {headerLabel}
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => navigateMonth(1)}
                aria-label="Mois suivant"
              >
                <ChevronRight size={14} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="btn-admin btn-admin-secondary btn-admin-sm"
                disabled={pending}
              >
                Édition en masse
              </button>
              <button
                type="button"
                className="btn-admin btn-admin-primary btn-admin-sm"
                onClick={handleApply}
                disabled={pending}
              >
                Appliquer changements
              </button>
            </div>
          </div>

          <PricingCalendar
            months={months}
            unitName={selectedUnit.name}
            unitBasePrice={selectedUnit.basePrice}
          />
        </div>
      </div>
    </>
  );
}
