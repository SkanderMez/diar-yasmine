import { PrismaClient, PropertyType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const CHALETS = [
  "Albatros",
  "Aquarius",
  "Azur",
  "Corail",
  "Dune",
  "Flamand",
  "Lagune",
  "Marine",
  "Océan",
] as const;

// 7 confirmed bungalow names from the brief + 5 placeholders to be
// replaced by the client (TODO in CLAUDE.md).
const BUNGALOWS = [
  "Amber",
  "Bougainvillier",
  "Géranium",
  "Lavande",
  "Néroli",
  "Orchidée",
  "Tulipe",
  "TBD-1",
  "TBD-2",
  "TBD-3",
  "TBD-4",
  "TBD-5",
] as const;

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const AMENITIES = [
  { slug: "wifi", labelFr: "Wi-Fi gratuit", labelEn: "Free Wi-Fi", icon: "wifi", category: "tech" },
  { slug: "air-conditioning", labelFr: "Climatisation", labelEn: "Air conditioning", icon: "wind", category: "comfort" },
  { slug: "private-pool", labelFr: "Piscine privée", labelEn: "Private pool", icon: "waves", category: "outdoor" },
  { slug: "sea-view", labelFr: "Vue sur la mer", labelEn: "Sea view", icon: "eye", category: "outdoor" },
  { slug: "beachfront", labelFr: "Pieds dans l'eau", labelEn: "Beachfront", icon: "umbrella", category: "outdoor" },
  { slug: "kitchen", labelFr: "Cuisine équipée", labelEn: "Equipped kitchen", icon: "utensils", category: "indoor" },
  { slug: "bbq", labelFr: "Barbecue", labelEn: "BBQ", icon: "flame", category: "outdoor" },
  { slug: "parking", labelFr: "Parking privé", labelEn: "Private parking", icon: "car", category: "service" },
  { slug: "washing-machine", labelFr: "Lave-linge", labelEn: "Washing machine", icon: "shirt", category: "indoor" },
  { slug: "dishwasher", labelFr: "Lave-vaisselle", labelEn: "Dishwasher", icon: "utensils-crossed", category: "indoor" },
  { slug: "garden", labelFr: "Jardin", labelEn: "Garden", icon: "leaf", category: "outdoor" },
  { slug: "terrace", labelFr: "Terrasse", labelEn: "Terrace", icon: "sun", category: "outdoor" },
  { slug: "linens-towels", labelFr: "Draps et serviettes fournis", labelEn: "Linens and towels provided", icon: "bed", category: "service" },
  { slug: "cleaning", labelFr: "Service de ménage", labelEn: "Cleaning service", icon: "sparkles", category: "service" },
];

async function main() {
  console.log("🌱 Seeding Diar Yasmine database...");

  // ---------------------------------------------------------------
  // Amenities
  // ---------------------------------------------------------------
  for (const a of AMENITIES) {
    await prisma.amenity.upsert({
      where: { slug: a.slug },
      update: { labelFr: a.labelFr, labelEn: a.labelEn, icon: a.icon, category: a.category },
      create: a,
    });
  }
  console.log(`  ✓ ${AMENITIES.length} amenities`);

  // ---------------------------------------------------------------
  // Properties — 9 chalets + 12 bungalows
  // ---------------------------------------------------------------
  for (const name of CHALETS) {
    await prisma.property.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        slug: slugify(name),
        name,
        type: PropertyType.CHALET,
        capacity: 6,
        bedrooms: 3,
        bathrooms: 2,
        hasPrivatePool: true,
        seaView: true,
        beachfront: true,
        sizeM2: 120,
        descriptionFr:
          `Chalet ${name} — pieds dans l'eau à Tazarka. Piscine privée, vue mer directe, ` +
          `architecture bois et verre moderne. Capacité 6 personnes.`,
        // Placeholder pricing — the owner will adjust via /admin/pricing.
        basePrice: 350_000, // 350 TND / night
        cleaningFee: 80_000, // 80 TND
        minStay: 2,
      },
    });
  }
  console.log(`  ✓ ${CHALETS.length} chalets`);

  for (const name of BUNGALOWS) {
    const isPlaceholder = name.startsWith("TBD-");
    await prisma.property.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        slug: slugify(name),
        name,
        type: PropertyType.BUNGALOW,
        capacity: 4,
        bedrooms: 2,
        bathrooms: 1,
        hasPrivatePool: !isPlaceholder, // TBD bungalows: confirm pool status when names land
        seaView: false,
        beachfront: false,
        sizeM2: 80,
        descriptionFr:
          `Bungalow ${name} — à 7 minutes à pied de la mer, jardin méditerranéen. ` +
          `Capacité 4 personnes.`,
        basePrice: 180_000, // 180 TND / night
        cleaningFee: 60_000, // 60 TND
        minStay: 2,
      },
    });
  }
  console.log(`  ✓ ${BUNGALOWS.length} bungalows (5 placeholders pending real names)`);

  // ---------------------------------------------------------------
  // Default season — Haute été (July & August)
  // ---------------------------------------------------------------
  const currentYear = new Date().getFullYear();
  await prisma.season.upsert({
    where: { id: `season-haute-ete-${currentYear}` },
    update: {},
    create: {
      id: `season-haute-ete-${currentYear}`,
      name: `Haute saison été ${currentYear}`,
      startDate: new Date(`${currentYear}-07-01T00:00:00Z`),
      endDate: new Date(`${currentYear}-08-31T00:00:00Z`),
      priceMultiplier: 1500, // 1.500x — basis points (see schema comment)
    },
  });
  console.log("  ✓ Default high-season template");

  // ---------------------------------------------------------------
  // Admin user
  // ---------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@diaryasmine.tn";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeMe1234!";
  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrateur",
      hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`  ✓ Admin user: ${adminEmail} (rotate the password in production!)`);

  // ---------------------------------------------------------------
  // Default settings — registry-validated keys only
  // ---------------------------------------------------------------
  await prisma.setting.upsert({
    where: { key: "tax.rate" },
    update: {},
    // 0 = no tax until configured via /admin/settings (registry validates 0..1).
    create: { key: "tax.rate", value: 0 },
  });
  await prisma.setting.upsert({
    where: { key: "currency.code" },
    update: {},
    create: { key: "currency.code", value: "TND" },
  });
  await prisma.setting.upsert({
    where: { key: "timezone" },
    update: {},
    create: { key: "timezone", value: "Africa/Tunis" },
  });
  console.log("  ✓ Default settings (tax.rate=0, currency.code=TND, timezone=Africa/Tunis)");

  console.log("✅ Seed complete.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
