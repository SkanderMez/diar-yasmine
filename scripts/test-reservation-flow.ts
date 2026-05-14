/**
 * Smoke test the reservation creation flow via the same helper the
 * Server Action calls. Uses source=DIRECT_WEB so it doesn't need staff
 * authentication.
 */
import { prisma } from "../lib/prisma";
import { createReservation } from "../lib/reservations";

async function main() {
  const property = await prisma.property.findFirst({
    where: { slug: "lavande" },
  });
  if (!property) throw new Error("no property");

  // Pick dates far in the future to avoid conflicts.
  const checkInDate = "2027-09-01";
  const checkOutDate = "2027-09-05";

  const out = await createReservation({
    propertyId: property.id,
    guest: {
      firstName: "Audit",
      lastName: "Test",
      phone: "+216" + Math.floor(10000000 + Math.random() * 89999999),
      email: `audit${Date.now()}@example.tn`,
    },
    checkInDate,
    checkOutDate,
    adults: 2,
    children: 0,
    source: "DIRECT_WEB",
    extras: [],
    discount: { type: "NONE", value: 0 },
    voucherChannel: "NONE",
  });

  console.log("CREATED:", out.code, "id:", out.id);

  // Try to double-book — must throw
  let caught: string | null = null;
  try {
    await createReservation({
      propertyId: property.id,
      guest: {
        firstName: "Double",
        lastName: "Book",
        phone: "+216" + Math.floor(10000000 + Math.random() * 89999999),
      },
      checkInDate,
      checkOutDate,
      adults: 2,
      children: 0,
      source: "DIRECT_WEB",
      extras: [],
      discount: { type: "NONE", value: 0 },
      voucherChannel: "NONE",
    });
  } catch (err) {
    caught = err instanceof Error ? err.message : String(err);
  }
  console.log("DOUBLE-BOOK BLOCKED:", caught ?? "NO — BUG!");

  // Clean up
  await prisma.reservation.delete({ where: { id: out.id } });
  console.log("CLEANED UP");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  });
