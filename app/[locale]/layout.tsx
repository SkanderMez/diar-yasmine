import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Caveat, Fraunces, Inter, Tajawal } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { routing } from "@/i18n/routing";
import { RTL_LOCALES } from "@/lib/constants";
import "../globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Diar Yasmine — Tazarka Plage",
    template: "%s · Diar Yasmine",
  },
  description:
    "21 chalets et bungalows à Tazarka, Tunisie. Pieds dans l'eau, piscines privées, ambiance méditerranéenne.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    siteName: "Diar Yasmine",
    images: [{ url: "/brand/og-default.svg", width: 1200, height: 630 }],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og-default.svg"],
  },
  alternates: {
    canonical: "/",
    languages: {
      fr: "/fr",
      en: "/en",
      ar: "/ar",
    },
  },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }],
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
  const fontClasses = `${fraunces.variable} ${inter.variable} ${caveat.variable} ${tajawal.variable}`;

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${fontClasses} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
