import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";
import { QuickBookProvider } from "@/components/admin/quick-book/provider";
import { QuickBookSheet } from "@/components/admin/quick-book/sheet";
import { listActiveProperties } from "@/lib/queries";
import { getSetting } from "@/lib/settings";

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

  return (
    <QuickBookProvider properties={properties}>
      <div className="flex h-full min-h-screen flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={session.user} />
          <main className="flex-1 overflow-y-auto bg-secondary/30 p-6">
            {children}
          </main>
        </div>
      </div>
      <QuickBookSheet taxRate={taxRate} />
    </QuickBookProvider>
  );
}
