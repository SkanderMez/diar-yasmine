"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

export interface UnitsFilterDefaults {
  search: string;
  capacity: string;
  status: string;
  position: string;
  sort: string;
}

interface UnitsFiltersProps {
  filterDefaults: UnitsFilterDefaults;
}

export function UnitsFilters({ filterDefaults }: UnitsFiltersProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const [search, setSearch] = useState(filterDefaults.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  function pushUpdate(updates: Record<string, string>) {
    const params = new URLSearchParams(sp?.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`?${params.toString()}`);
  }

  // Debounce the search input — URL sync after 300 ms idle.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushUpdate({ q: search.trim() });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="units-filter-bar">
      <div className="search-bar">
        <Search
          className="size-3.5"
          style={{ color: "var(--text-dim)" }}
          aria-hidden
        />
        <input
          type="search"
          placeholder="Rechercher une unité…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <select
        className="select-admin"
        value={filterDefaults.capacity}
        onChange={(e) => pushUpdate({ capacity: e.target.value })}
        aria-label="Capacité"
      >
        <option value="all">Capacité : toutes</option>
        <option value="2">2 voyageurs</option>
        <option value="4">4 voyageurs</option>
        <option value="6">6 voyageurs</option>
        <option value="8">8+ voyageurs</option>
      </select>

      <select
        className="select-admin"
        value={filterDefaults.status}
        onChange={(e) => pushUpdate({ status: e.target.value })}
        aria-label="Statut"
      >
        <option value="all">Statut : tous</option>
        <option value="ACTIVE">Actif</option>
        <option value="INACTIVE">Inactif</option>
        <option value="MAINTENANCE">Maintenance</option>
      </select>

      <select
        className="select-admin"
        value={filterDefaults.position}
        onChange={(e) => pushUpdate({ position: e.target.value })}
        aria-label="Position"
      >
        <option value="all">Position : toutes</option>
        <option value="beachfront">Front de mer</option>
        <option value="garden">Jardin</option>
        <option value="pool">Piscine</option>
        <option value="seaview">Vue mer</option>
      </select>

      <div className="units-sort">
        <span>Tri :</span>
        <select
          className="select-admin"
          value={filterDefaults.sort}
          onChange={(e) => pushUpdate({ sort: e.target.value })}
          aria-label="Trier par"
        >
          <option value="name">Nom</option>
          <option value="price">Tarif</option>
          <option value="occupancy">Occupation</option>
          <option value="rating">Note</option>
        </select>
      </div>
    </div>
  );
}
