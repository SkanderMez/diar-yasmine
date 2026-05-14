import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { CustomerLoginForm } from "@/components/public/customer-login-form";
import { FadeIn } from "@/components/public/fade-in";

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
    <main className="flex-1 bg-sand pt-32 pb-24">
      <div className="container-x">
        <FadeIn className="mx-auto max-w-md text-center">
          <p className="font-script text-2xl text-primary">Bon retour</p>
          <h1 className="heading-display mt-2 text-4xl text-charcoal sm:text-5xl">
            Connectez-vous à votre compte
          </h1>
          <p className="mt-4 text-sm text-charcoal-soft">
            Retrouvez vos réservations, vos préférences et vos coordonnées.
          </p>
        </FadeIn>

        <FadeIn delay="delay-1" className="mx-auto mt-10 max-w-md">
          <div className="rounded-lg border border-line-soft bg-white p-8 shadow-sm">
            <CustomerLoginForm />
          </div>

          <p className="mt-6 text-center text-sm text-charcoal-soft">
            Pas encore de compte ?{" "}
            <Link
              href="/account/upgrade"
              className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:text-bougainvillier hover:underline"
            >
              Créer mon compte
              <ArrowRight className="size-3.5" />
            </Link>
          </p>
        </FadeIn>
      </div>
    </main>
  );
}
