import { Plus } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listAdminPropertyCards, type AdminUnitCard } from "@/lib/queries";
import {
  UnitsFilters,
  type UnitsFilterDefaults,
} from "@/components/admin/units/units-filters";
import { UnitsGrid } from "@/components/admin/units/units-grid";

export const dynamic = "force-dynamic";

function parseSearchParam(raw: string | string[] | undefined): string {
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) return raw[0] ?? "";
  return "";
}

function matchPosition(unit: AdminUnitCard, position: string): boolean {
  switch (position) {
    case "beachfront":
      return unit.beachfront;
    case "pool":
      return unit.hasPrivatePool;
    case "seaview":
      return unit.seaView;
    case "garden":
      return (
        unit.type === "BUNGALOW" && !unit.beachfront && !unit.hasPrivatePool
      );
    default:
      return true;
  }
}

function matchCapacity(unit: AdminUnitCard, capacity: string): boolean {
  if (!capacity || capacity === "all") return true;
  if (capacity === "8") return unit.capacity >= 8;
  const n = Number(capacity);
  if (!Number.isFinite(n)) return true;
  return unit.capacity === n;
}

function matchStatus(unit: AdminUnitCard, status: string): boolean {
  if (!status || status === "all") return true;
  return unit.status === status;
}

function matchSearch(unit: AdminUnitCard, query: string): boolean {
  if (!query) return true;
  return unit.name.toLowerCase().includes(query.toLowerCase());
}

function sortUnits(units: AdminUnitCard[], sort: string): AdminUnitCard[] {
  const sorted = [...units];
  switch (sort) {
    case "price":
      sorted.sort((a, b) => b.basePrice - a.basePrice);
      break;
    case "occupancy":
      sorted.sort((a, b) => b.occupancyPct - a.occupancyPct);
      break;
    case "rating":
      sorted.sort((a, b) => b.demoRating.value - a.demoRating.value);
      break;
    case "name":
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name, "fr"));
      break;
  }
  return sorted;
}

export default async function AdminUnitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string | string[];
    capacity?: string | string[];
    status?: string | string[];
    position?: string | string[];
    sort?: string | string[];
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const defaults: UnitsFilterDefaults = {
    search: parseSearchParam(sp.q),
    capacity: parseSearchParam(sp.capacity) || "all",
    status: parseSearchParam(sp.status) || "all",
    position: parseSearchParam(sp.position) || "all",
    sort: parseSearchParam(sp.sort) || "name",
  };

  const allUnits = await listAdminPropertyCards();

  const filtered = allUnits.filter(
    (u) =>
      matchSearch(u, defaults.search) &&
      matchCapacity(u, defaults.capacity) &&
      matchStatus(u, defaults.status) &&
      matchPosition(u, defaults.position),
  );
  const sorted = sortUnits(filtered, defaults.sort);

  const totalChalets = allUnits.filter((u) => u.type === "CHALET").length;
  const totalBungalows = allUnits.filter((u) => u.type === "BUNGALOW").length;

  const chalets = sorted.filter((u) => u.type === "CHALET");
  const bungalows = sorted.filter((u) => u.type === "BUNGALOW");

  const occupancyAvg = allUnits.length
    ? Math.round(
        allUnits.reduce((sum, u) => sum + u.occupancyPct, 0) / allUnits.length,
      )
    : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Unités</h1>
          <p>
            {allUnits.length} hébergements · {totalChalets} chalets,{" "}
            {totalBungalows} bungalows · taux d&apos;occupation {occupancyAvg}%
          </p>
        </div>
        <div className="page-actions">
          <Link
            href="/admin/properties/new"
            className="btn-admin btn-admin-primary"
          >
            <Plus className="size-3.5" />
            Nouvelle unité
          </Link>
        </div>
      </div>

      <UnitsFilters filterDefaults={defaults} />

      <UnitsGrid
        units={chalets}
        title="Les Chalets de la Méditerranée"
        count={totalChalets}
        showAllHref="/admin/properties?sort=name"
      />

      <UnitsGrid
        units={bungalows}
        title="Les Bungalows du jardin"
        count={totalBungalows}
        showAllHref="/admin/properties?sort=name"
      />
    </>
  );
}
