/**
 * Verify the DB EXCLUDE constraint blocks double-bookings, independent of
 * the Server Action business logic. This proves data integrity at the
 * lowest level.
 */
import { prisma } from "../lib/prisma";

async function main() {
  const property = await prisma.property.findFirst({
    where: { slug: "neroli" },
  });
  if (!property) throw new Error("no property");

  const guest = await prisma.guest.create({
    data: {
      firstName: "Audit",
      lastName: "DB",
      phone: "+216" + Math.floor(10000000 + Math.random() * 89999999),
    },
  });

  const ci = new Date("2027-10-01T00:00:00.000Z");
  const co = new Date("2027-10-05T00:00:00.000Z");

  const r1 = await prisma.reservation.create({
    data: {
      code: `DY-AUDIT-${Date.now()}-A`,
      propertyId: property.id,
      guestId: guest.id,
      checkIn: ci,
      checkOut: co,
      nights: 4,
      adults: 2,
      children: 0,
      basePrice: 1000000,
      subtotal: 1000000,
      tax: 190000,
      total: 1190000,
      source: "WALK_IN",
      status: "CONFIRMED",
    },
  });
  console.log("FIRST RESERVATION:", r1.code);

  let blocked = false;
  let errMsg = "";
  try {
    await prisma.reservation.create({
      data: {
        code: `DY-AUDIT-${Date.now()}-B`,
        propertyId: property.id,
        guestId: guest.id,
        checkIn: new Date("2027-10-02T00:00:00.000Z"),
        checkOut: new Date("2027-10-06T00:00:00.000Z"),
        nights: 4,
        adults: 2,
        children: 0,
        basePrice: 1000000,
        subtotal: 1000000,
        tax: 190000,
        total: 1190000,
        source: "WALK_IN",
        status: "CONFIRMED",
      },
    });
  } catch (err) {
    blocked = true;
    errMsg = err instanceof Error ? err.message.slice(0, 200) : String(err);
  }

  console.log(
    "DOUBLE-BOOK BLOCKED BY DB:",
    blocked,
    blocked ? `(${errMsg.split("\n")[0]})` : "— DATA INTEGRITY BROKEN",
  );

  await prisma.reservation.deleteMany({
    where: { code: { startsWith: "DY-AUDIT-" } },
  });
  await prisma.guest.delete({ where: { id: guest.id } });
  console.log("CLEANED UP");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  });
