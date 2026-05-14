import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminShellBootstrap } from "@/components/admin/admin-shell-bootstrap";
import { QuickBookProvider } from "@/components/admin/quick-book/provider";
import { QuickBookSheet } from "@/components/admin/quick-book/sheet";
import { listActiveProperties } from "@/lib/queries";
import { getSetting } from "@/lib/settings";

// Admin-only design system. Scoped to this segment; do NOT import in the
// public layout — the public site has its own tokens in app/globals.css.
import "@/app/admin.css";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  MANAGER: "Gestionnaire",
  RECEPTION: "Réception",
  VIEWER: "Lecture seule",
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Defense in depth — proxy already protects /admin/*, but a missing
  // matcher or a Server Action bypass would still hit this layout.
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/signin`);
  }

  // Prefetch shared admin state. listActiveProperties runs once per layout
  // render and feeds both the Quick Book unit picker and (eventually) the
  // calendar grid.
  const [properties, taxRate] = await Promise.all([
    listActiveProperties(),
    getSetting("tax.rate"),
  ]);

  const userName = session.user.name ?? session.user.email ?? "Utilisateur";
  const role = session.user.role;
  const userRole = ROLE_LABELS[role] ?? role;

  return (
    <QuickBookProvider properties={properties}>
      <AdminShellBootstrap />
      <div data-admin-shell className="app">
        <AdminSidebar user={{ name: userName, role: userRole }} />
        <div className="main">
          <AdminTopbar />
          <main className="content">{children}</main>
        </div>
      </div>
      <QuickBookSheet taxRate={taxRate} />
    </QuickBookProvider>
  );
}
