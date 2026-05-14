import { Download, Plus, SlidersHorizontal } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import {
  findAdminClient,
  listAdminClients,
  type ClientSegment,
} from "@/lib/queries";
import { ClientsClient } from "@/components/admin/clients/clients-client";
import { ClientDetail } from "@/components/admin/clients/client-detail";
import { ClientEmptyState } from "@/components/admin/clients/client-empty-state";

export const dynamic = "force-dynamic";

const SEGMENTS = new Set<ClientSegment>(["all", "vip", "recurrent", "recent"]);

function parseSegment(raw: string | undefined): ClientSegment {
  if (raw && SEGMENTS.has(raw as ClientSegment)) {
    return raw as ClientSegment;
  }
  return "all";
}

export default async function AdminClientsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    segment?: string;
    search?: string;
    id?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const segment = parseSegment(sp.segment);
  const search = sp.search?.trim() ?? "";
  const selectedId = sp.id?.trim() ?? "";

  const [{ list, kpis }, selected] = await Promise.all([
    listAdminClients({
      segment,
      search: search || undefined,
    }),
    selectedId ? findAdminClient(selectedId) : Promise.resolve(null),
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Clients</h1>
          <p>
            {kpis.total.toLocaleString("fr-FR")} client
            {kpis.total > 1 ? "s" : ""} · {kpis.newCount} nouveau
            {kpis.newCount > 1 ? "x" : ""} ce mois · {kpis.recurrentPct}%
            reviennent
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn-admin btn-admin-ghost">
            <SlidersHorizontal className="size-3.5" />
            Segments
          </button>
          <button type="button" className="btn-admin btn-admin-secondary">
            <Download className="size-3.5" />
            Export
          </button>
          <button type="button" className="btn-admin btn-admin-primary">
            <Plus className="size-3.5" />
            Nouveau client
          </button>
        </div>
      </div>

      <ClientsClient
        items={list}
        activeSegment={segment}
        activeId={selectedId || null}
        initialSearch={search}
        kpis={kpis}
        detail={
          selected ? (
            <ClientDetail
              guest={selected.guest}
              stats={selected.stats}
              reservations={selected.reservations}
              preferences={selected.preferences}
              documents={selected.documents}
            />
          ) : (
            <ClientEmptyState />
          )
        }
      />
    </>
  );
}
