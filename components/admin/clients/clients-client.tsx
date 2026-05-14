"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type {
  ClientListItem,
  ClientListKpis,
  ClientSegment,
} from "@/lib/queries";
import { ClientsList } from "./clients-list";

interface ClientsClientProps {
  items: ClientListItem[];
  activeSegment: ClientSegment;
  activeId: string | null;
  initialSearch: string;
  kpis: ClientListKpis;
  detail: React.ReactNode;
}

/**
 * Glues the master list and the detail card together on /admin/clients.
 * Owns the debounced search → URL sync. Selection itself (which client is
 * focused on the right) is driven by `?id=` and read on the server, so we
 * just propagate clicks here.
 */
export function ClientsClient({
  items,
  activeSegment,
  activeId,
  initialSearch,
  kpis,
  detail,
}: ClientsClientProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRender = useRef(true);

  // Debounced search → URL sync (drops the current `?id=` so the right
  // panel stays in step with the filtered list).
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
      params.delete("id");
      router.push(`?${params.toString()}`);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="crm-grid">
      <ClientsList
        items={items}
        activeSegment={activeSegment}
        activeId={activeId}
        kpis={kpis}
        searchSlot={
          <div className="search-bar" style={{ maxWidth: "none" }}>
            <Search
              className="size-3.5"
              style={{ color: "var(--text-dim)" }}
              aria-hidden
            />
            <input
              type="search"
              placeholder="Nom, email, téléphone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Rechercher un client"
            />
          </div>
        }
      />

      <div className="client-detail">{detail}</div>
    </div>
  );
}
