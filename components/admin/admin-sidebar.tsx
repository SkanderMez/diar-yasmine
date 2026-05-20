"use client";

import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

type AdminUser = {
  name: string;
  role: string;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  /** Native emoji glyph rendered before the label — padel-style. */
  emoji: string;
  badge?: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    label: "Opérations",
    items: [
      {
        key: "dashboard",
        href: "/admin/dashboard",
        label: "Vue d'ensemble",
        emoji: "🏠",
      },
      {
        key: "calendar",
        href: "/admin/calendar",
        label: "Calendrier",
        emoji: "📅",
      },
      {
        key: "reservations",
        href: "/admin/reservations",
        label: "Réservations",
        emoji: "📋",
        badge: "12",
      },
      {
        key: "new-booking",
        href: "/admin/reservations/new",
        label: "Nouvelle résa",
        emoji: "✨",
      },
      {
        key: "clients",
        href: "/admin/clients",
        label: "Clients",
        emoji: "👥",
      },
    ],
  },
  {
    label: "Inventaire",
    items: [
      {
        key: "units",
        href: "/admin/properties",
        label: "Unités",
        emoji: "🏡",
        badge: "21",
      },
      {
        key: "pricing",
        href: "/admin/pricing",
        label: "Tarification",
        emoji: "🏷️",
      },
      {
        key: "supplements",
        href: "/admin/supplements",
        label: "Suppléments",
        emoji: "🎁",
      },
      {
        key: "promo-codes",
        href: "/admin/promo-codes",
        label: "Codes promo",
        emoji: "🎟️",
      },
      {
        key: "channels",
        href: "/admin/channels",
        label: "Channels",
        emoji: "🌐",
      },
    ],
  },
  {
    label: "Analyse",
    items: [
      {
        key: "analytics",
        href: "/admin/reports",
        label: "Rapports",
        emoji: "📊",
      },
      {
        key: "reviews",
        href: "/admin/reviews",
        label: "Avis",
        emoji: "⭐",
      },
    ],
  },
  {
    label: "Système",
    items: [
      {
        key: "settings",
        href: "/admin/settings",
        label: "Paramètres",
        emoji: "⚙️",
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  // Pathname comes from next-intl `usePathname` and is locale-stripped.
  if (href === pathname) return true;
  return pathname.startsWith(`${href}/`);
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  RECEPTION: "Réception",
  VIEWER: "Lecteur",
};

interface AdminSidebarProps {
  user: AdminUser;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="sidebar">
      <Link href="/admin/dashboard" className="sidebar-brand">
        <Image
          src="/brand/logo-mark.svg"
          alt="Diar Yasmine"
          width={36}
          height={36}
          priority
        />
        <div className="sidebar-brand-text">
          <div className="name">Diar Yasmine</div>
          <div className="sub">PMS</div>
        </div>
      </Link>

      {SECTIONS.map((section) => (
        <div key={section.label} className="sidebar-section">
          <div className="sidebar-label">{section.label}</div>
          {section.items.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                data-nav={item.key}
                className={`nav-item${active ? " active" : ""}`}
              >
                <span className="nav-item-emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="badge">{item.badge}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="sidebar-bottom">
        <div className="user-card">
          <div className="user-avatar">{initials || "?"}</div>
          <div>
            <div className="user-name">{user.name}</div>
            <div className="user-role">
              {ROLE_LABEL[user.role] ?? user.role}
            </div>
          </div>
          <ChevronDown style={{ marginLeft: "auto" }} className="size-3.5" />
        </div>
      </div>
    </aside>
  );
}
