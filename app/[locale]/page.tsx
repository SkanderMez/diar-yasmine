import { setRequestLocale, getTranslations } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-xl space-y-6 text-center">
        <p className="text-sm font-medium tracking-[0.25em] text-primary uppercase">
          {t("tagline")}
        </p>
        <h1 className="text-5xl font-medium text-charcoal">{t("title")}</h1>
        <p className="font-script text-3xl text-primary-light">
          {t("subtitle")}
        </p>
        <p className="text-muted-foreground">{t("intro")}</p>
      </div>
    </main>
  );
}
