import { describe, it, expect } from "vitest";
import { buildSupplementExtras, calculateReservationTotal } from "./index";

const TND = 1000; // 1 TND = 1000 millimes

const property = {
  basePrice: 350 * TND, // 350 TND / night
  cleaningFee: 80 * TND, // 80 TND
};

describe("calculateReservationTotal — happy path", () => {
  it("computes nights × base + cleaning + tax with no discount", () => {
    const out = calculateReservationTotal({
      property,
      nights: 3,
      taxRate: 0.19,
    });
    // 3 × 350 = 1050 TND base; + 80 cleaning = 1130; tax 19% = 214.7 → 214.700 (rounded)
    expect(out.nightlyPrice).toBe(350 * TND);
    expect(out.basePrice).toBe(1050 * TND);
    expect(out.cleaningFee).toBe(80 * TND);
    expect(out.extrasTotal).toBe(0);
    expect(out.discountAmount).toBe(0);
    expect(out.subtotal).toBe(1130 * TND);
    // tax: round(1_130_000 * 0.19) = round(214_700) = 214_700
    expect(out.tax).toBe(214_700);
    expect(out.total).toBe(1130 * TND + 214_700);
  });

  it("applies a season multiplier in basis points", () => {
    const out = calculateReservationTotal({
      property,
      nights: 2,
      seasonMultiplierBp: 1500, // 1.5x
      taxRate: 0,
    });
    // nightly: round(350_000 * 1500 / 1000) = 525_000
    expect(out.nightlyPrice).toBe(525 * TND);
    expect(out.basePrice).toBe(1050 * TND);
    expect(out.total).toBe(1050 * TND + 80 * TND);
  });

  it("sums extras and includes them in the taxable subtotal", () => {
    const out = calculateReservationTotal({
      property,
      nights: 1,
      extras: [
        { label: "Padel session", amount: 30 * TND },
        { label: "Beach pass", amount: 5 * TND },
      ],
      taxRate: 0,
    });
    expect(out.extrasTotal).toBe(35 * TND);
    // 350 + 80 + 35 = 465 TND
    expect(out.subtotal).toBe(465 * TND);
    expect(out.total).toBe(465 * TND);
  });
});

describe("calculateReservationTotal — discounts", () => {
  it("applies a PERCENT discount to basePrice only (not cleaning/extras)", () => {
    const out = calculateReservationTotal({
      property,
      nights: 2,
      discount: { type: "PERCENT", value: 20 },
      taxRate: 0,
    });
    // base 700, discount 20% = 140, cleaning 80, subtotal = 700 - 140 + 80 = 640
    expect(out.discountAmount).toBe(140 * TND);
    expect(out.subtotal).toBe(640 * TND);
  });

  it("applies a FIXED discount in millimes", () => {
    const out = calculateReservationTotal({
      property,
      nights: 2,
      discount: { type: "FIXED", value: 100 * TND },
      taxRate: 0,
    });
    expect(out.discountAmount).toBe(100 * TND);
    expect(out.subtotal).toBe(700 * TND - 100 * TND + 80 * TND);
  });

  it("clamps a FIXED discount that exceeds basePrice", () => {
    const out = calculateReservationTotal({
      property,
      nights: 1,
      discount: { type: "FIXED", value: 9_999 * TND },
      taxRate: 0,
    });
    // basePrice = 350_000, discount clamped to 350_000
    expect(out.discountAmount).toBe(350 * TND);
    // subtotal = 350 - 350 + 80 = 80 TND (never negative)
    expect(out.subtotal).toBe(80 * TND);
  });

  it("rounds PERCENT discount half-to-even-ish (Math.round)", () => {
    // base = 350_001 millimes, 50% = 175_000.5 → 175_001
    const out = calculateReservationTotal({
      property: { basePrice: 350_001, cleaningFee: 0 },
      nights: 1,
      discount: { type: "PERCENT", value: 50 },
      taxRate: 0,
    });
    expect(out.discountAmount).toBe(175_001);
  });

  it("NONE discount leaves the base untouched", () => {
    const out = calculateReservationTotal({
      property,
      nights: 1,
      discount: { type: "NONE", value: 999 },
      taxRate: 0,
    });
    expect(out.discountAmount).toBe(0);
  });
});

describe("calculateReservationTotal — input validation", () => {
  it("rejects zero or negative nights", () => {
    expect(() =>
      calculateReservationTotal({ property, nights: 0, taxRate: 0 }),
    ).toThrow();
    expect(() =>
      calculateReservationTotal({ property, nights: -1, taxRate: 0 }),
    ).toThrow();
  });

  it("rejects non-integer nights", () => {
    expect(() =>
      calculateReservationTotal({ property, nights: 1.5, taxRate: 0 }),
    ).toThrow();
  });

  it("rejects out-of-range tax rate", () => {
    expect(() =>
      calculateReservationTotal({ property, nights: 1, taxRate: -0.01 }),
    ).toThrow();
    expect(() =>
      calculateReservationTotal({ property, nights: 1, taxRate: 1.5 }),
    ).toThrow();
  });

  it("rejects out-of-range PERCENT discount", () => {
    expect(() =>
      calculateReservationTotal({
        property,
        nights: 1,
        discount: { type: "PERCENT", value: 150 },
        taxRate: 0,
      }),
    ).toThrow();
  });

  it("rejects non-integer FIXED discount", () => {
    expect(() =>
      calculateReservationTotal({
        property,
        nights: 1,
        discount: { type: "FIXED", value: 100.5 },
        taxRate: 0,
      }),
    ).toThrow();
  });

  it("rejects negative season multiplier", () => {
    expect(() =>
      calculateReservationTotal({
        property,
        nights: 1,
        seasonMultiplierBp: -100,
        taxRate: 0,
      }),
    ).toThrow();
  });
});

describe("calculateReservationTotal — Tunisian VAT scenario", () => {
  it("matches a typical 5-night stay with PERCENT discount and one extra", () => {
    const out = calculateReservationTotal({
      property: { basePrice: 350 * TND, cleaningFee: 80 * TND },
      nights: 5,
      extras: [{ label: "Beach pass", amount: 3 * TND }],
      discount: { type: "PERCENT", value: 10 },
      taxRate: 0.19,
    });
    expect(out.basePrice).toBe(1750 * TND);
    expect(out.discountAmount).toBe(175 * TND);
    expect(out.cleaningFee).toBe(80 * TND);
    expect(out.extrasTotal).toBe(3 * TND);
    expect(out.subtotal).toBe(1750 * TND - 175 * TND + 80 * TND + 3 * TND);
    // subtotal = 1_658_000
    expect(out.tax).toBe(Math.round(1_658_000 * 0.19)); // 315_020
    expect(out.total).toBe(1_658_000 + 315_020);
  });
});

describe("buildSupplementExtras", () => {
  const catalog = [
    {
      id: "sup_cleaning",
      slug: "menage-final",
      labelFr: "Ménage final",
      priceMillimes: 80_000,
    },
    {
      id: "sup_padel",
      slug: "padel-session",
      labelFr: "Padel · 1 session",
      priceMillimes: 60_000,
    },
  ];

  it("resolves selected IDs preserving order", () => {
    const out = buildSupplementExtras(catalog, ["sup_padel", "sup_cleaning"]);
    expect(out).toHaveLength(2);
    expect(out[0]?.supplementId).toBe("sup_padel");
    expect(out[0]?.label).toBe("Padel · 1 session");
    expect(out[0]?.amount).toBe(60_000);
    expect(out[0]?.category).toBe("supplement");
    expect(out[1]?.supplementId).toBe("sup_cleaning");
  });

  it("silently drops unknown IDs", () => {
    const out = buildSupplementExtras(catalog, ["sup_cleaning", "sup_ghost"]);
    expect(out).toHaveLength(1);
    expect(out[0]?.supplementId).toBe("sup_cleaning");
  });

  it("plugs into calculateReservationTotal as extras", () => {
    const extras = buildSupplementExtras(catalog, ["sup_cleaning"]);
    const out = calculateReservationTotal({
      property: { basePrice: 350_000, cleaningFee: 0 },
      nights: 2,
      extras,
      taxRate: 0,
    });
    expect(out.extrasTotal).toBe(80_000);
    expect(out.total).toBe(700_000 + 80_000);
  });
});
