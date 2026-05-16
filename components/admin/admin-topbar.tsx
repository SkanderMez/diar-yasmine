"use client";

import {
  Bell,
  Building2,
  ChevronDown,
  MessageCircle,
  Moon,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";

type Theme = "light" | "dark";

const THEME_KEY = "dy-admin-theme";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const fromAttr = document.documentElement.dataset.theme;
  if (fromAttr === "light" || fromAttr === "dark") return fromAttr;
  return "light";
}

export function AdminTopbar() {
  const [theme, setTheme] = useState<Theme>("light");
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Sync component state with the bootstrap-set <html data-theme> on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(readInitialTheme());
  }, []);

  const applyTheme = useCallback((next: Theme) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // ignore — Safari private mode etc.
    }
  }, []);

  // ⌘K / Ctrl+K focuses the search input.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="topbar">
      <div className="search-bar">
        <Search className="size-4" style={{ color: "var(--text-dim)" }} />
        <input
          ref={searchRef}
          type="search"
          placeholder="Rechercher une résa, un client, un voucher…"
          aria-label="Rechercher"
        />
        <span className="kbd">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button type="button" className="property-pill">
          <Building2 className="size-3.5" />
          Diar Yasmine Tazarka
          <ChevronDown className="size-3" />
        </button>

        <div
          className="theme-toggle"
          role="tablist"
          aria-label="Choisir le thème"
        >
          <button
            type="button"
            role="tab"
            aria-selected={theme === "light"}
            aria-label="Thème clair"
            title="Thème clair"
            className={theme === "light" ? "active" : ""}
            onClick={() => applyTheme("light")}
          >
            <Sun className="size-3.5" />
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={theme === "dark"}
            aria-label="Thème sombre"
            title="Thème sombre"
            className={theme === "dark" ? "active" : ""}
            onClick={() => applyTheme("dark")}
          >
            <Moon className="size-3.5" />
          </button>
        </div>

        <button type="button" className="icon-btn" title="Messages">
          <MessageCircle className="size-[18px]" />
          <span className="dot" />
        </button>
        <button type="button" className="icon-btn" title="Notifications">
          <Bell className="size-[18px]" />
          <span className="dot" />
        </button>

        <Link
          href="/admin/reservations/new"
          className="btn-admin btn-admin-primary"
        >
          <Plus className="size-3.5" />
          Nouvelle résa
        </Link>
      </div>
    </header>
  );
}
