import { Download, Plus, SlidersHorizontal } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import type { ReservationSource } from "@prisma/client";
import {
  getReservationsFilterCounts,
  getReservationsKpis,
  listReservations,
  type ReservationListFilter,
} from "@/lib/queries";
import { Link } from "@/i18n/navigation";
import { ReservationsClient } from "@/components/admin/reservations/reservations-client";
import { ReservationsPagination } from "@/components/admin/reservations/reservations-pagination";

export const dynamic = "force-dynamic";

const FILTER_KEYS = new Set<ReservationListFilter>([
  "all",
  "confirmed",
  "option",
  "checkin_today",
  "checkout_today",
  "upcoming",
  "completed",
  "cancelled",
  "unpaid",
  "deposit",
]);

const SOURCE_KEYS: ReservationSource[] = [
  "DIRECT_WEB",
  "WALK_IN",
  "PHONE",
  "PARTNER",
  "BOOKING",
  "AIRBNB",
  "EXPEDIA",
  "OTHER",
];

const PER_PAGE = 25;

function parseFilter(raw: string | undefined): ReservationListFilter {
  if (raw && FILTER_KEYS.has(raw as ReservationListFilter)) {
    return raw as ReservationListFilter;
  }
  return "all";
}

function parseSource(raw: string | undefined): ReservationSource | undefined {
  if (!raw) return undefined;
  return SOURCE_KEYS.includes(raw as ReservationSource)
    ? (raw as ReservationSource)
    : undefined;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export default async function AdminReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    filter?: string;
    search?: string;
    source?: string;
    page?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const filter = parseFilter(sp.filter);
  const source = parseSource(sp.source);
  const page = parsePage(sp.page);
  const search = sp.search?.trim() ?? "";

  const [kpis, counts, list] = await Promise.all([
    getReservationsKpis(),
    getReservationsFilterCounts(),
    listReservations({
      filter,
      search: search || undefined,
      source,
      page,
      perPage: PER_PAGE,
    }),
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Réservations</h1>
          <p>
            {kpis.total} réservation{kpis.total > 1 ? "s" : ""} · {kpis.active}{" "}
            active{kpis.active > 1 ? "s" : ""} · {kpis.newToday} nouvelle
            {kpis.newToday > 1 ? "s" : ""} aujourd&apos;hui
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-admin btn-admin-ghost">
            <Download className="size-3.5" />
            Export CSV
          </button>
          <button type="button" className="btn-admin btn-admin-secondary">
            <SlidersHorizontal className="size-3.5" />
            Filtres avancés
          </button>
          <Link
            href="/admin/reservations/new"
            className="btn-admin btn-admin-primary"
          >
            <Plus className="size-3.5" />
            Nouvelle résa
          </Link>
        </div>
      </div>

      <ReservationsClient
        rows={list.rows}
        counts={counts}
        activeFilter={filter}
        initialSearch={search}
        pagination={
          <ReservationsPagination
            page={list.page}
            perPage={list.perPage}
            total={list.total}
            baseParams={{
              filter: filter === "all" ? undefined : filter,
              search: search || undefined,
              source: source ?? undefined,
            }}
          />
        }
      />
    </>
  );
}
