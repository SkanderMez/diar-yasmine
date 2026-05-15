"use client";

import Image from "next/image";
import {
  Building2,
  Calendar,
  ChevronDown,
  ClipboardList,
  Globe,
  Home,
  LineChart,
  Plus,
  Settings,
  Sparkles,
  Star,
  Tags,
  Ticket,
  Users,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";

type AdminUser = {
  name: string;
  role: string;
};

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
        icon: Home,
      },
      {
        key: "calendar",
        href: "/admin/calendar",
        label: "Calendrier",
        icon: Calendar,
      },
      {
        key: "reservations",
        href: "/admin/reservations",
        label: "Réservations",
        icon: ClipboardList,
        badge: "12",
      },
      {
        key: "new-booking",
        href: "/admin/reservations/new",
        label: "Nouvelle résa",
        icon: Plus,
      },
      {
        key: "clients",
        href: "/admin/clients",
        label: "Clients",
        icon: Users,
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
        icon: Building2,
        badge: "21",
      },
      {
        key: "pricing",
        href: "/admin/pricing",
        label: "Tarification",
        icon: Tags,
      },
      {
        key: "supplements",
        href: "/admin/supplements",
        label: "Suppléments",
        icon: Sparkles,
      },
      {
        key: "promo-codes",
        href: "/admin/promo-codes",
        label: "Codes promo",
        icon: Ticket,
      },
      {
        key: "channels",
        href: "/admin/channels",
        label: "Channels",
        icon: Globe,
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
        icon: LineChart,
      },
      {
        key: "reviews",
        href: "/admin/reviews",
        label: "Avis",
        icon: Star,
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
        icon: Settings,
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  // Pathname comes from next-intl `usePathname` and is locale-stripped.
  if (href === pathname) return true;
  return pathname.startsWith(`${href}/`);
}

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
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                data-nav={item.key}
                className={`nav-item${active ? " active" : ""}`}
              >
                <Icon className="size-4" />
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
            <div className="user-role">{user.role}</div>
          </div>
          <ChevronDown style={{ marginLeft: "auto" }} className="size-3.5" />
        </div>
      </div>
    </aside>
  );
}
