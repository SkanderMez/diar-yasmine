"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import type {
  ClientListItem,
  ClientListKpis,
  ClientSegment,
} from "@/lib/queries";

interface ClientsListProps {
  items: ClientListItem[];
  activeSegment: ClientSegment;
  activeId: string | null;
  kpis: ClientListKpis;
  /** Slot for the search input (kept on the parent for state ownership). */
  searchSlot: React.ReactNode;
}

interface TabDef {
  key: ClientSegment;
  label: string;
  count: number;
}

function initialsOf(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  return `${f}${l}` || "?";
}

/**
 * Cheap deterministic accent tint for the avatar so the list doesn't read
 * as a wall of grey. Hashes the guest id to one of 4 palette buckets.
 */
function avatarStyle(id: string, isVip: boolean): React.CSSProperties {
  if (isVip) {
    return { background: "rgba(229,185,104,0.16)", color: "var(--warning)" };
  }
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  switch (h % 4) {
    case 0:
      return { background: "rgba(46,91,186,0.18)", color: "#6e8edf" };
    case 1:
      return {
        background: "rgba(224,116,116,0.15)",
        color: "var(--ch-airbnb)",
      };
    case 2:
      return { background: "rgba(122,143,107,0.18)", color: "#a8b998" };
    default:
      return {};
  }
}

export function ClientsList({
  items,
  activeSegment,
  activeId,
  kpis,
  searchSlot,
}: ClientsListProps) {
  const router = useRouter();
  const sp = useSearchParams();

  const tabs: TabDef[] = useMemo(() => {
    const vipCount = items.filter((c) => c.isVip).length;
    const recurrentCount = items.filter((c) => c.staysCount >= 2).length;
    const recentSegmentCount =
      activeSegment === "recent" ? items.length : kpis.newCount;
    return [
      { key: "all", label: "Tous", count: kpis.total },
      { key: "vip", label: "VIP", count: vipCount },
      { key: "recurrent", label: "Récurrents", count: recurrentCount },
      { key: "recent", label: "Récents", count: recentSegmentCount },
    ];
  }, [items, kpis, activeSegment]);

  function selectSegment(key: ClientSegment) {
    const params = new URLSearchParams(sp?.toString());
    if (key === "all") params.delete("segment");
    else params.set("segment", key);
    params.delete("id");
    router.push(`?${params.toString()}`);
  }

  function selectClient(id: string) {
    const params = new URLSearchParams(sp?.toString());
    params.set("id", id);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="client-list-card">
      <div className="client-list-head">{searchSlot}</div>
      <div
        className="client-list-tabs"
        role="tablist"
        aria-label="Segment de clients"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === activeSegment}
            className={tab.key === activeSegment ? "active" : undefined}
            onClick={() => selectSegment(tab.key)}
          >
            {tab.label} · {tab.count}
          </button>
        ))}
      </div>

      <div className="client-list" role="listbox" aria-label="Clients">
        {items.length === 0 ? (
          <div className="client-list-empty">Aucun client ne correspond.</div>
        ) : (
          items.map((c) => {
            const selected = c.id === activeId;
            const country = [c.country].filter(Boolean).join(" · ");
            return (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`client-item${selected ? " selected" : ""}`}
                onClick={() => selectClient(c.id)}
              >
                <div
                  className="client-avatar-md"
                  style={avatarStyle(c.id, c.isVip)}
                  aria-hidden
                >
                  {initialsOf(c.firstName, c.lastName)}
                </div>
                <div className="client-info">
                  <div className="name">
                    {c.firstName} {c.lastName}
                  </div>
                  {country ? <div className="meta">{country}</div> : null}
                  <div className="last">
                    {c.isVip ? (
                      <Star
                        className="size-2.5"
                        fill="currentColor"
                        aria-hidden
                      />
                    ) : null}
                    {c.lastActivity}
                  </div>
                </div>
                {c.isVip ? (
                  <span className="client-vip" aria-label="Client VIP">
                    <Star
                      className="size-3.5"
                      fill="currentColor"
                      aria-hidden
                    />
                  </span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
