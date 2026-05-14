import {
  Calendar,
  CreditCard,
  Globe,
  Home,
  LineChart,
  Settings,
  Sparkles,
  Tags,
  Users,
  ClipboardList,
  Building2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/shared/logo";

type NavItem = {
  key: string;
  href: string;
  // Lucide icon component
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    href: "/admin/dashboard",
    icon: Home,
    label: "Tableau de bord",
  },
  {
    key: "calendar",
    href: "/admin/calendar",
    icon: Calendar,
    label: "Calendrier",
  },
  {
    key: "reservations",
    href: "/admin/reservations",
    icon: ClipboardList,
    label: "Réservations",
  },
  {
    key: "properties",
    href: "/admin/properties",
    icon: Building2,
    label: "Hébergements",
  },
  {
    key: "amenities",
    href: "/admin/amenities",
    icon: Sparkles,
    label: "Équipements",
  },
  { key: "pricing", href: "/admin/pricing", icon: Tags, label: "Tarification" },
  { key: "guests", href: "/admin/guests", icon: Users, label: "Clients" },
  { key: "channels", href: "/admin/channels", icon: Globe, label: "Canaux" },
  {
    key: "payments",
    href: "/admin/payments",
    icon: CreditCard,
    label: "Paiements",
  },
  {
    key: "reports",
    href: "/admin/reports",
    icon: LineChart,
    label: "Rapports",
  },
  {
    key: "settings",
    href: "/admin/settings",
    icon: Settings,
    label: "Paramètres",
  },
];

export function Sidebar() {
  return (
    <aside className="hidden h-full w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center border-b border-border px-4">
        <Logo variant="mark" href="/admin/dashboard" />
        <span className="ml-3 text-sm font-medium text-foreground">PMS</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-foreground/80 transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
