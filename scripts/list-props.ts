import { prisma } from "../lib/prisma";
async function main() {
  const props = await prisma.property.findMany({
    select: { id: true, slug: true },
    take: 3,
  });
  console.log("PROPS:");
  for (const r of props) console.log(r.id, r.slug);

  const res = await prisma.reservation.findMany({
    select: { id: true, code: true, status: true, propertyId: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  console.log("\nRESERVATIONS:");
  for (const r of res) console.log(r.code, "|", r.status, "|", r.id);

  const guests = await prisma.guest.count();
  const properties = await prisma.property.count();
  const payments = await prisma.payment.count();
  console.log("\nCOUNTS:", {
    guests,
    properties,
    payments,
    reservations: await prisma.reservation.count(),
  });

  const settings = await prisma.setting.findMany();
  console.log("\nSETTINGS:");
  for (const s of settings) console.log(s.key, "=", JSON.stringify(s.value));
}
main().then(() => process.exit(0));
