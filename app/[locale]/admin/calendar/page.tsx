import { addDays, format, isValid, parseISO } from "date-fns";
import { setRequestLocale } from "next-intl/server";
import {
  listActiveProperties,
  listReservationsForCalendar,
} from "@/lib/queries";
import { parseLocalDate } from "@/lib/date";
import { CalendarGrid } from "@/components/admin/calendar/grid";
import { ViewSwitcher } from "@/components/admin/calendar/view-switcher";
import { SourceLegend } from "@/components/admin/calendar/legend";

const DEFAULT_DAYS = 30;
const ALLOWED_DAYS = new Set([14, 30, 90]);

export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ start?: string; days?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const parsedStart = sp.start ? parseISO(sp.start) : null;
  const startDate =
    parsedStart && isValid(parsedStart)
      ? parseLocalDate(sp.start!)
      : parseLocalDate(format(new Date(), "yyyy-MM-dd"));
  const daysParam = Number(sp.days);
  const days = ALLOWED_DAYS.has(daysParam) ? daysParam : DEFAULT_DAYS;
  const endDate = addDays(startDate, days);

  const [properties, reservations] = await Promise.all([
    listActiveProperties(),
    listReservationsForCalendar(startDate, endDate),
  ]);

  const startLabel = format(startDate, "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-foreground">Calendrier</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {format(startDate, "d MMM yyyy")} →{" "}
            {format(addDays(endDate, -1), "d MMM yyyy")} · {days} jours ·{" "}
            {reservations.length} réservation
            {reservations.length === 1 ? "" : "s"}
          </p>
        </div>
        <ViewSwitcher start={startLabel} days={days} />
      </header>

      <SourceLegend />

      <CalendarGrid
        startDate={startDate}
        days={days}
        properties={properties}
        reservations={reservations}
      />

      <p className="text-xs text-muted-foreground">
        Astuce : clique une cellule vide pour ouvrir Quick Book pré-rempli. Le
        drag & drop arrive en Phase 2.5.
      </p>
    </div>
  );
}
