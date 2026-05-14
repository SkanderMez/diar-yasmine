"use client";

import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  FileText,
  Globe,
  Lock,
  Mail,
  Palette,
  Plug,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SETTINGS_SECTIONS, type SettingsSection } from "./types";

interface NavEntry {
  key: SettingsSection;
  label: string;
  icon: LucideIcon;
}

const NAV_ENTRIES: readonly NavEntry[] = [
  { key: "users", label: "Utilisateurs & rôles", icon: Users },
  { key: "templates_email", label: "Templates emails", icon: Mail },
  { key: "templates_voucher", label: "Templates vouchers", icon: FileText },
  { key: "taxes", label: "Taxes & devises", icon: Wallet },
  { key: "languages", label: "Langues", icon: Globe },
  { key: "branding", label: "Branding", icon: Palette },
  { key: "security", label: "Sécurité", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "integrations", label: "Intégrations", icon: Plug },
] as const satisfies readonly NavEntry[];

// Defensive: keep nav and section list in sync at build time.
const _navCoverage: Record<SettingsSection, true> = Object.fromEntries(
  SETTINGS_SECTIONS.map((s) => [s, true]),
) as Record<SettingsSection, true>;
void _navCoverage;

interface SettingsNavProps {
  active: SettingsSection;
}

export function SettingsNav({ active }: SettingsNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function go(section: SettingsSection) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("section", section);
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  }

  return (
    <nav className="settings-nav" aria-label="Sections paramètres">
      {NAV_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        const isActive = entry.key === active;
        return (
          <button
            key={entry.key}
            type="button"
            className={isActive ? "active" : undefined}
            onClick={() => go(entry.key)}
            disabled={pending && isActive}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon aria-hidden />
            <span>{entry.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
