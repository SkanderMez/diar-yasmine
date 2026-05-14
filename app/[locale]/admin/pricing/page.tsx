import { setRequestLocale } from "next-intl/server";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { TZ } from "@/lib/date";
import { listActiveProperties } from "@/lib/queries";
import { getSetting } from "@/lib/settings";
import { PricingClient } from "@/components/admin/pricing/pricing-client";
import type {
  SeasonRowData,
  SeasonTier,
} from "@/components/admin/pricing/seasons-card";
import type { UnitPickerOption } from "@/components/admin/pricing/unit-picker";

/**
 * /admin/pricing — seasonal pricing editor.
 *
 * Read-side: pulls seasons, supplement & min-stay settings, the property
 * catalog. Computation of the 2-month calendar grid happens client-side so
 * the supplements/multipliers can preview live as the admin edits.
 *
 * Query params:
 *   ?unitId — which property to preview (defaults to first chalet/active)
 *   ?month  — YYYY-MM (defaults to current Africa/Tunis wall-clock month)
 */
export default async function AdminPricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ unitId?: string; month?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const [properties, seasonsRaw, photoRows, settings] = await Promise.all([
    listActiveProperties(),
    prisma.season.findMany({
      orderBy: { startDate: "asc" },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        priceMultiplier: true,
      },
    }),
    prisma.photo.findMany({
      where: { order: 0 },
      select: { propertyId: true, url: true },
    }),
    Promise.all([
      getSetting("pricing.weekend_pct"),
      getSetting("pricing.tn_holidays_pct"),
      getSetting("pricing.ramadan_pct"),
      getSetting("pricing.aid_pct"),
      getSetting("pricing.min_stay_low"),
      getSetting("pricing.min_stay_high"),
      getSetting("pricing.min_stay_peak"),
      getSetting("pricing.longstay_discount_pct"),
      getSetting("pricing.longstay_threshold_nights"),
    ]),
  ]);

  const [
    weekendPct,
    tnHolidaysPct,
    ramadanPct,
    aidPct,
    minStayLow,
    minStayHigh,
    minStayPeak,
    longstayDiscountPct,
    longstayThresholdNights,
  ] = settings;

  const photoByProperty = new Map<string, string>();
  for (const p of photoRows) {
    photoByProperty.set(p.propertyId, p.url);
  }

  // Unit picker options — every active property with its hero thumbnail.
  const units: UnitPickerOption[] = properties.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    photoUrl: photoByProperty.get(p.id) ?? null,
  }));

  // Resolve selected unit. Falls back to the first active property when the
  // query param is missing or stale.
  const selectedId =
    sp.unitId && units.some((u) => u.id === sp.unitId)
      ? sp.unitId
      : (units[0]?.id ?? "");
  const selectedRaw = properties.find((p) => p.id === selectedId);

  // Resolve month. Defaults to the current month in Africa/Tunis.
  const now = new Date();
  const nowZoned = toZonedTime(now, TZ);
  const defaultMonth = `${nowZoned.getFullYear()}-${String(nowZoned.getMonth() + 1).padStart(2, "0")}`;
  const monthKey =
    sp.month && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.month)
      ? sp.month
      : defaultMonth;

  // Build SeasonRowData rows. We classify each season by multiplier into a
  // tier (low/mid/high/peak) so the swatch + cell color match the maquette.
  const seasons: SeasonRowData[] = seasonsRaw.map((s) => {
    const tier = classifyTier(s.priceMultiplier);
    const startZoned = toZonedTime(s.startDate, TZ);
    const endZoned = toZonedTime(s.endDate, TZ);
    return {
      id: s.id,
      name: s.name,
      periodLabel: formatPeriod(startZoned, endZoned),
      multiplier: s.priceMultiplier,
      tier,
      startMonthDay: {
        month: startZoned.getMonth() + 1,
        day: startZoned.getDate(),
      },
      endMonthDay: {
        month: endZoned.getMonth() + 1,
        day: endZoned.getDate(),
      },
    };
  });

  if (!selectedRaw) {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Tarification saisonnière</h1>
            <p>Aucun hébergement actif pour afficher des tarifs.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <PricingClient
      units={units}
      selectedUnit={{
        id: selectedRaw.id,
        name: selectedRaw.name,
        basePrice: selectedRaw.basePrice,
        photoUrl: photoByProperty.get(selectedRaw.id) ?? null,
      }}
      monthKey={monthKey}
      seasons={seasons}
      supplements={{
        weekendPct,
        tnHolidaysPct,
        ramadanPct,
        aidPct,
      }}
      rules={{
        minStayLow,
        minStayHigh,
        minStayPeak,
        longstayDiscountPct,
        longstayThresholdNights,
      }}
    />
  );
}

/**
 * Bucket a basis-points multiplier into one of the 4 visual tiers used in
 * the maquette swatches.
 */
function classifyTier(multiplierBp: number): SeasonTier {
  if (multiplierBp < 900) return "low";
  if (multiplierBp < 1200) return "mid";
  if (multiplierBp < 1600) return "high";
  return "peak";
}

const MONTH_SHORT = [
  "Jan",
  "Fév",
  "Mars",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

function formatPeriod(start: Date, end: Date): string {
  const a = MONTH_SHORT[start.getMonth()] ?? "";
  const b = MONTH_SHORT[end.getMonth()] ?? "";
  if (a === b) return a;
  return `${a} – ${b}`;
}
