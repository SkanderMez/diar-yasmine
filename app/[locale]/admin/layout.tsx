import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { auth } from "@/auth";
import { Sidebar } from "@/components/admin/sidebar";
import { Topbar } from "@/components/admin/topbar";

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

  return (
    <div className="flex h-full min-h-screen flex-1">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={session.user} />
        <main className="flex-1 overflow-y-auto bg-secondary/30 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
