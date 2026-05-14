"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import type { ReservationListFilter } from "@/lib/queries";
import type { ReservationRow } from "@/lib/queries";
import { ReservationsFilterChips } from "./reservations-filter-chips";
import { ReservationsBulkBar, type BulkAction } from "./reservations-bulk-bar";
import { ReservationsTable } from "./reservations-table";

interface ReservationsClientProps {
  rows: ReservationRow[];
  counts: Record<ReservationListFilter, number>;
  activeFilter: ReservationListFilter;
  initialSearch: string;
  pagination: React.ReactNode;
}

/**
 * Glues the filter chips, search input, bulk-action bar and table together
 * on the /admin/reservations page. Owns:
 *   - selection state (kept in memory, scoped to the current page)
 *   - debounced search → URL sync
 *   - bulk-action dispatch + toast feedback
 */
export function ReservationsClient({
  rows,
  counts,
  activeFilter,
  initialSearch,
  pagination,
}: ReservationsClientProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [rawSelectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState(initialSearch);
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRender = useRef(true);

  // Derive the effective selection from the current row set. After a
  // filter switch or a bulk action revalidates the page, the previous
  // ids may no longer be visible — drop them silently rather than
  // surfacing stale counts in the bulk-action bar.
  const selectedIds = useMemo(() => {
    const visible = new Set(rows.map((r) => r.id));
    const next = new Set<string>();
    for (const id of rawSelectedIds) {
      if (visible.has(id)) next.add(id);
    }
    return next;
  }, [rows, rawSelectedIds]);

  // Debounced search → URL sync.
  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(sp?.toString());
      const trimmed = search.trim();
      if (trimmed) params.set("search", trimmed);
      else params.delete("search");
      params.delete("page");
      router.push(`?${params.toString()}`);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function dispatchBulk(action: BulkAction) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === "export") {
      // GET endpoint — let the browser stream the file.
      const params = new URLSearchParams({ ids: ids.join(",") });
      window.location.href = `/api/admin/reservations/export?${params.toString()}`;
      return;
    }

    startTransition(async () => {
      try {
        if (action === "email") {
          const res = await fetch("/api/admin/reservations/bulk-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, template: "default" }),
          });
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as { queued?: number };
          toast.success(`Email programmé : ${data.queued ?? ids.length} résa`);
          return;
        }

        const status = action === "confirm" ? "CONFIRMED" : "CANCELLED";
        const res = await fetch("/api/admin/reservations/bulk-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, status }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { count?: number };
        toast.success(
          status === "CONFIRMED"
            ? `${data.count ?? ids.length} réservation${(data.count ?? 0) > 1 ? "s" : ""} confirmée${(data.count ?? 0) > 1 ? "s" : ""}`
            : `${data.count ?? ids.length} réservation${(data.count ?? 0) > 1 ? "s" : ""} annulée${(data.count ?? 0) > 1 ? "s" : ""}`,
        );
        setSelectedIds(new Set());
        router.refresh();
      } catch (err) {
        toast.error("Action groupée échouée", {
          description: err instanceof Error ? err.message : "Erreur inconnue",
        });
      }
    });
  }

  return (
    <>
      <div className="filter-row">
        <ReservationsFilterChips counts={counts} activeFilter={activeFilter} />

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <div className="search-bar" style={{ maxWidth: 240 }}>
            <Search
              className="size-3.5"
              style={{ color: "var(--text-dim)" }}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-admin btn-admin-secondary btn-admin-sm"
          >
            <Filter className="size-3.5" />
            Filtrer
          </button>
        </div>
      </div>

      <ReservationsBulkBar
        selectedCount={selectedIds.size}
        pending={pending}
        onAction={dispatchBulk}
      />

      <div className="table-wrap">
        <ReservationsTable
          rows={rows}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
        {pagination}
      </div>
    </>
  );
}
