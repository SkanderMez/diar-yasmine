import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { UpgradeFlow } from "@/components/public/upgrade-flow";

export const metadata: Metadata = {
  title: "Créer mon compte",
};

export default async function AccountUpgradePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const existing = await getCustomerSession();
  if (existing) redirect(`/${locale}/account`);

  return (
    <main className="flex-1 bg-ivory pt-28 text-foreground">
      <div className="container-x section-y">
        <div className="mx-auto max-w-md">
          <p className="eyebrow">Mon compte</p>
          <h1 className="mt-3 heading-display text-4xl text-foreground sm:text-5xl">
            Créer mon compte
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Si vous avez déjà séjourné chez nous, vos réservations seront
            automatiquement liées à votre compte.
          </p>

          <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
            <UpgradeFlow />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link
              href="/account/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
