import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import {
  NOTIFICATION_KEYS,
  type NotificationKey,
} from "@/lib/notification-keys";
import { SettingsNav } from "@/components/admin/settings/settings-nav";
import {
  SectionUsers,
  type UserRow,
} from "@/components/admin/settings/section-users";
import { SectionTaxes } from "@/components/admin/settings/section-taxes";
import { SectionLanguages } from "@/components/admin/settings/section-languages";
import { SectionBranding } from "@/components/admin/settings/section-branding";
import { SectionNotifications } from "@/components/admin/settings/section-notifications";
import { SectionPlaceholder } from "@/components/admin/settings/section-placeholder";
import {
  isSettingsSection,
  type SettingsSection,
} from "@/components/admin/settings/types";
import frMessages from "@/messages/fr.json";
import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

export const dynamic = "force-dynamic";

type Locale = "fr" | "en" | "ar";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ section?: string }>;
}

export default async function AdminSettingsPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { section: sectionParam } = await searchParams;
  const section: SettingsSection =
    sectionParam && isSettingsSection(sectionParam) ? sectionParam : "users";

  // Defense in depth: the proxy gates /admin/*, the layout checks session,
  // and we re-check the role here so even a Server Action bypass cannot
  // render sensitive data.
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <>
        <div className="page-head">
          <div>
            <h1>Paramètres</h1>
            <p>Configuration générale, utilisateurs, taxes, branding</p>
          </div>
        </div>
        <UnauthorizedNotice />
      </>
    );
  }

  const sectionContent = await renderSection(section, session.user.id);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Paramètres</h1>
          <p>Configuration générale, utilisateurs, taxes, branding</p>
        </div>
      </div>

      <div className="settings-grid">
        <SettingsNav active={section} />
        <div className="settings-content">{sectionContent}</div>
      </div>
    </>
  );
}

async function renderSection(
  section: SettingsSection,
  currentUserId: string,
): Promise<React.ReactNode> {
  switch (section) {
    case "users": {
      const rows = await prisma.user.findMany({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          lastLoginAt: true,
          createdAt: true,
        },
      });
      const users: UserRow[] = rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        lastLoginAt: u.lastLoginAt,
        isCurrent: u.id === currentUserId,
      }));
      return <SectionUsers users={users} />;
    }

    case "taxes": {
      const [
        primaryCurrency,
        displayedCurrencies,
        taxRate,
        staySejourMillimes,
      ] = await Promise.all([
        getSetting("currency.primary"),
        getSetting("currency.displayed"),
        getSetting("tax.rate"),
        getSetting("tax.stay_sejour_millimes"),
      ]);
      return (
        <SectionTaxes
          primaryCurrency={primaryCurrency}
          displayedCurrencies={displayedCurrencies}
          taxRate={taxRate}
          staySejourMillimes={staySejourMillimes}
        />
      );
    }

    case "languages": {
      const enabled = await getSetting("languages.enabled");
      const completion = computeLocaleCompletion();
      return <SectionLanguages enabled={enabled} completion={completion} />;
    }

    case "branding": {
      const [logoUrl, logoDarkUrl, markUrl] = await Promise.all([
        getSetting("branding.logo_url"),
        getSetting("branding.logo_dark_url"),
        getSetting("branding.mark_url"),
      ]);
      return (
        <SectionBranding
          logoUrl={logoUrl}
          logoDarkUrl={logoDarkUrl}
          markUrl={markUrl}
        />
      );
    }

    case "notifications": {
      const values = await Promise.all([
        getSetting("notifications.new_reservation"),
        getSetting("notifications.cancellation"),
        getSetting("notifications.conflict"),
        getSetting("notifications.checkin_24h"),
        getSetting("notifications.review_published"),
        getSetting("notifications.monthly_report"),
      ]);
      const prefs: Record<NotificationKey, boolean> = {
        new_reservation: values[0],
        cancellation: values[1],
        conflict: values[2],
        checkin_24h: values[3],
        review_published: values[4],
        monthly_report: values[5],
      };
      // Static-sanity: every NotificationKey is filled in above.
      void NOTIFICATION_KEYS;
      return <SectionNotifications prefs={prefs} />;
    }

    case "templates_email":
      return <SectionPlaceholder title="Templates emails" />;
    case "templates_voucher":
      return <SectionPlaceholder title="Templates vouchers" />;
    case "security":
      return <SectionPlaceholder title="Sécurité" />;
    case "integrations":
      return <SectionPlaceholder title="Intégrations" />;
  }
}

function UnauthorizedNotice() {
  return (
    <div className="small-card">
      <h3>Accès restreint</h3>
      <div className="sub">
        Cette page est réservée aux administrateurs. Si vous avez besoin
        d&apos;accès, contactez votre administrateur principal.
      </div>
    </div>
  );
}

// =============================================================================
// LOCALE COMPLETION
// =============================================================================
// Compare the leaf-key count of each locale's JSON to French (the reference).
// Synchronous: the JSON modules are imported at the top of the file and bundled
// at build time, so no I/O happens here.

type JsonNode =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonNode }
  | JsonNode[];

function flattenKeys(node: JsonNode, prefix = ""): string[] {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    return prefix ? [prefix] : [];
  }
  const out: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      out.push(...flattenKeys(value as JsonNode, next));
    } else {
      out.push(next);
    }
  }
  return out;
}

function computeLocaleCompletion(): Record<Locale, number> {
  const frKeys = flattenKeys(frMessages as JsonNode);
  const total = frKeys.length || 1;

  function pctFor(messages: JsonNode): number {
    const ownKeys = new Set(flattenKeys(messages));
    let covered = 0;
    for (const key of frKeys) {
      if (ownKeys.has(key)) covered += 1;
    }
    return Math.round((covered / total) * 100);
  }

  return {
    fr: 100,
    en: pctFor(enMessages as JsonNode),
    ar: pctFor(arMessages as JsonNode),
  };
}
