import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://diaryasmine.tn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const properties = await prisma.property
    .findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { slug: true, type: true, updatedAt: true },
    })
    .catch(
      () =>
        [] as { slug: string; type: "CHALET" | "BUNGALOW"; updatedAt: Date }[],
    );

  const staticPaths = [
    "",
    "/chalets",
    "/bungalows",
    "/padel",
    "/about",
    "/contact",
  ];

  const entries: MetadataRoute.Sitemap = [];

  // Locale-prefixed static pages with hreflang alternates.
  for (const path of staticPaths) {
    const alternates: Record<string, string> = {};
    for (const locale of routing.locales) {
      alternates[locale] = `${SITE_URL}/${locale}${path}`;
    }
    entries.push({
      url: `${SITE_URL}/${routing.defaultLocale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === "" ? "weekly" : "monthly",
      priority: path === "" ? 1.0 : 0.7,
      alternates: { languages: alternates },
    });
  }

  // Property detail pages.
  for (const p of properties) {
    const segment = p.type === "CHALET" ? "chalets" : "bungalows";
    const alternates: Record<string, string> = {};
    for (const locale of routing.locales) {
      alternates[locale] = `${SITE_URL}/${locale}/${segment}/${p.slug}`;
    }
    entries.push({
      url: `${SITE_URL}/${routing.defaultLocale}/${segment}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: { languages: alternates },
    });
  }

  return entries;
}
