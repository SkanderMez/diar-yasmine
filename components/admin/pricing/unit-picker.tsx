"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export interface UnitPickerOption {
  id: string;
  name: string;
  type: "CHALET" | "BUNGALOW";
  photoUrl: string | null;
}

interface UnitPickerProps {
  units: UnitPickerOption[];
  selectedId: string;
  month: string;
}

/**
 * Pill-style unit picker for the pricing calendar header. Mirrors the
 * `.unit-pick` pattern from the maquette — small thumbnail + name + chevron.
 */
export function UnitPicker({ units, selectedId, month }: UnitPickerProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const selected = units.find((u) => u.id === selectedId) ?? units[0];

  function pick(id: string) {
    setOpen(false);
    const sp = new URLSearchParams({ unitId: id, month });
    router.push(`/admin/pricing?${sp.toString()}`);
  }

  if (!selected) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="unit-pick"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected.photoUrl ? (
          <Image
            src={selected.photoUrl}
            alt=""
            width={24}
            height={24}
            style={{ borderRadius: 4, objectFit: "cover" }}
          />
        ) : (
          <span
            aria-hidden
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "var(--bg-surface-3)",
            }}
          />
        )}
        <span>{selected.name}</span>
        <ChevronDown size={12} />
      </button>
      {open ? (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 20,
            minWidth: 220,
            maxHeight: 320,
            overflowY: "auto",
            background: "var(--bg-surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: 4,
            boxShadow: "var(--shadow)",
          }}
        >
          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              role="option"
              aria-selected={u.id === selected.id}
              onClick={() => pick(u.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 8px",
                borderRadius: "var(--radius)",
                background:
                  u.id === selected.id ? "var(--bg-surface-3)" : "transparent",
                fontSize: "0.85rem",
                color: "var(--text)",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (u.id !== selected.id) {
                  e.currentTarget.style.background = "var(--bg-hover)";
                }
              }}
              onMouseLeave={(e) => {
                if (u.id !== selected.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {u.photoUrl ? (
                <Image
                  src={u.photoUrl}
                  alt=""
                  width={20}
                  height={20}
                  style={{ borderRadius: 3, objectFit: "cover" }}
                />
              ) : (
                <span
                  aria-hidden
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 3,
                    background: "var(--bg-surface-3)",
                  }}
                />
              )}
              <span style={{ flex: 1 }}>{u.name}</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {u.type === "CHALET" ? "Chalet" : "Bungalow"}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
