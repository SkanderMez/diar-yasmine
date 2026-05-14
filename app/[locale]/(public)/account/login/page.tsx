import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { CustomerLoginForm } from "@/components/public/customer-login-form";

export const metadata: Metadata = {
  title: "Mon compte — connexion",
};

export default async function CustomerLoginPage({
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
            Bon retour parmi nous
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Connectez-vous pour retrouver vos réservations et vos préférences.
          </p>

          <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
            <CustomerLoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              href="/account/upgrade"
              className="inline-flex items-center gap-1 font-medium text-foreground underline-offset-4 hover:underline"
            >
              Créer mon compte
              <ArrowRight className="size-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
