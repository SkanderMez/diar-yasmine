import { describe, expect, it } from "vitest";
import {
  applyPercentDiscount,
  assertMillimes,
  clampDiscountToAmount,
  formatTND,
  millimesToTnd,
  sumMillimes,
  tndToMillimes,
} from "./money";

describe("tndToMillimes", () => {
  it("converts integer TND to millimes", () => {
    expect(tndToMillimes(100)).toBe(100_000);
    expect(tndToMillimes(0)).toBe(0);
    expect(tndToMillimes(1.5)).toBe(1_500);
  });

  it("rounds away float precision", () => {
    expect(tndToMillimes(0.1 + 0.2)).toBe(300);
  });

  it("throws on NaN / Infinity", () => {
    expect(() => tndToMillimes(NaN)).toThrow();
    expect(() => tndToMillimes(Infinity)).toThrow();
  });
});

describe("millimesToTnd", () => {
  it("converts integer millimes to TND", () => {
    expect(millimesToTnd(100_000)).toBe(100);
    expect(millimesToTnd(1_500)).toBe(1.5);
  });

  it("throws on non-integer millimes", () => {
    expect(() => millimesToTnd(0.5)).toThrow();
  });
});

describe("applyPercentDiscount", () => {
  it("applies a percent discount", () => {
    expect(applyPercentDiscount(100_000, 10)).toBe(10_000);
    expect(applyPercentDiscount(100_000, 0)).toBe(0);
    expect(applyPercentDiscount(100_000, 100)).toBe(100_000);
  });

  it("rounds to integer millimes", () => {
    expect(applyPercentDiscount(333, 33)).toBe(110);
  });

  it("throws on out-of-range percent", () => {
    expect(() => applyPercentDiscount(100_000, -1)).toThrow();
    expect(() => applyPercentDiscount(100_000, 101)).toThrow();
  });
});

describe("clampDiscountToAmount", () => {
  it("clamps the discount to [0, amount]", () => {
    expect(clampDiscountToAmount(50_000, 100_000)).toBe(50_000);
    expect(clampDiscountToAmount(-100, 100_000)).toBe(0);
    expect(clampDiscountToAmount(120_000, 100_000)).toBe(100_000);
  });
});

describe("sumMillimes", () => {
  it("sums an array of millimes", () => {
    expect(sumMillimes([100, 50, 25])).toBe(175);
    expect(sumMillimes([])).toBe(0);
  });

  it("throws on non-integer entries", () => {
    expect(() => sumMillimes([100, 50.5])).toThrow();
  });
});

describe("formatTND", () => {
  // Intl.NumberFormat("fr-FR") uses a NARROW NO-BREAK SPACE (U+202F)
  // as the thousands separator, not a regular space.
  const nnbsp = String.fromCharCode(0x202f);

  it("formats an integer millimes amount with French spacing and comma", () => {
    const out = formatTND(5_531_680, { locale: "fr" });
    expect(out).toBe(`5${nnbsp}531,68 TND`);
  });

  it("strips trailing ,00 for whole amounts", () => {
    // 350_000 millimes = 350.000 TND → "350 TND" (cleaner).
    expect(formatTND(350_000, { locale: "fr" })).toBe("350 TND");
    expect(formatTND(2_500_000, { locale: "fr" })).toBe(`2${nnbsp}500 TND`);
  });

  it("keeps decimals when present", () => {
    expect(formatTND(2_330, { locale: "fr" })).toBe("2,33 TND");
    expect(formatTND(1_500_500, { locale: "fr" })).toBe(`1${nnbsp}500,50 TND`);
  });

  it("formats with English locale (dot decimal, comma thousands)", () => {
    const out = formatTND(5_531_680, { locale: "en" });
    expect(out).toContain("5,531.68");
    expect(out).toMatch(/TND$/);
  });

  it("rejects non-integers", () => {
    expect(() => formatTND(0.5)).toThrow();
  });
});

describe("assertMillimes", () => {
  it("accepts integers", () => {
    expect(() => assertMillimes(0)).not.toThrow();
    expect(() => assertMillimes(123_456)).not.toThrow();
    expect(() => assertMillimes(-50)).not.toThrow();
  });

  it("rejects floats", () => {
    expect(() => assertMillimes(0.5)).toThrow();
    expect(() => assertMillimes(1.0001)).toThrow();
  });
});
