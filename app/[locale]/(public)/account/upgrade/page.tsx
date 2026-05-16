import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCustomerSession } from "@/lib/customer-auth";
import { UpgradeFlow } from "@/components/public/upgrade-flow";
import { FadeIn } from "@/components/public/fade-in";

export const metadata: Metadata = {
  title: "Créer mon compte",
};

export default async function AccountUpgradePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const existing = await getCustomerSession();
  if (existing) redirect(`/${locale}/account`);

  const initialPhone =
    typeof sp.phone === "string" && /^\+?\d[\d\s]{4,}$/.test(sp.phone)
      ? sp.phone
      : undefined;

  return (
    <main className="flex-1 bg-sand pt-32 pb-24">
      <div className="container-x">
        <FadeIn className="mx-auto max-w-md text-center">
          <p className="font-script text-2xl text-primary">
            Restons en contact
          </p>
          <h1 className="heading-display mt-2 text-4xl text-charcoal sm:text-5xl">
            Créer mon compte
          </h1>
          <p className="mt-4 text-sm text-charcoal-soft">
            Si vous avez déjà séjourné chez nous, vos réservations seront
            automatiquement liées à votre compte.
          </p>
        </FadeIn>

        <FadeIn delay="delay-1" className="mx-auto mt-10 max-w-md">
          <div className="rounded-lg border border-line-soft bg-white p-8 shadow-sm">
            <UpgradeFlow initialPhone={initialPhone} />
          </div>

          <p className="mt-6 text-center text-sm text-charcoal-soft">
            Déjà un compte ?{" "}
            <Link
              href="/account/login"
              className="font-medium text-primary underline-offset-4 hover:text-bougainvillier hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </FadeIn>
      </div>
    </main>
  );
}
