import { describe, it, expect } from "vitest";
import {
  tndToMillimes,
  millimesToTnd,
  applyPercentDiscount,
  clampDiscountToAmount,
  sumMillimes,
  formatTND,
  assertMillimes,
} from "./money";

describe("tndToMillimes", () => {
  it("converts whole TND to millimes", () => {
    expect(tndToMillimes(350)).toBe(350_000);
    expect(tndToMillimes(0)).toBe(0);
    expect(tndToMillimes(1)).toBe(1000);
  });

  it("rounds fractional TND to nearest millime", () => {
    expect(tndToMillimes(0.001)).toBe(1);
    expect(tndToMillimes(0.0005)).toBe(1); // banker's rounding edge — Math.round rounds half-up
    expect(tndToMillimes(0.0004)).toBe(0);
    expect(tndToMillimes(12.345)).toBe(12_345);
  });

  it("throws on non-finite inputs", () => {
    expect(() => tndToMillimes(Number.NaN)).toThrow();
    expect(() => tndToMillimes(Number.POSITIVE_INFINITY)).toThrow();
    expect(() => tndToMillimes(Number.NEGATIVE_INFINITY)).toThrow();
  });
});

describe("millimesToTnd", () => {
  it("round-trips", () => {
    expect(millimesToTnd(350_000)).toBe(350);
    expect(millimesToTnd(12_345)).toBe(12.345);
    expect(millimesToTnd(1)).toBe(0.001);
  });

  it("rejects non-integers", () => {
    expect(() => millimesToTnd(1.5)).toThrow();
    expect(() => millimesToTnd(Number.NaN)).toThrow();
  });
});

describe("applyPercentDiscount", () => {
  it("computes percent of an int millimes amount", () => {
    expect(applyPercentDiscount(350_000, 10)).toBe(35_000);
    expect(applyPercentDiscount(350_000, 0)).toBe(0);
    expect(applyPercentDiscount(350_000, 100)).toBe(350_000);
  });

  it("rounds half to nearest millime", () => {
    // 100,001 * 50% = 50,000.5 → 50,001 (Math.round half-up)
    expect(applyPercentDiscount(100_001, 50)).toBe(50_001);
  });

  it("throws on out-of-range percent", () => {
    expect(() => applyPercentDiscount(1000, -1)).toThrow();
    expect(() => applyPercentDiscount(1000, 101)).toThrow();
    expect(() => applyPercentDiscount(1000, Number.NaN)).toThrow();
  });

  it("throws on non-integer amount", () => {
    expect(() => applyPercentDiscount(1000.5, 10)).toThrow();
  });
});

describe("clampDiscountToAmount", () => {
  it("clamps oversized discounts to the amount", () => {
    expect(clampDiscountToAmount(500_000, 350_000)).toBe(350_000);
  });

  it("clamps negative discounts to zero", () => {
    expect(clampDiscountToAmount(-100, 350_000)).toBe(0);
  });

  it("passes through valid discounts", () => {
    expect(clampDiscountToAmount(50_000, 350_000)).toBe(50_000);
  });
});

describe("sumMillimes", () => {
  it("sums integers", () => {
    expect(sumMillimes([100_000, 50_000, 25_000])).toBe(175_000);
    expect(sumMillimes([])).toBe(0);
  });

  it("rejects non-integer entries", () => {
    expect(() => sumMillimes([100, 50.5])).toThrow();
  });
});

describe("formatTND", () => {
  it("formats an integer millimes amount with French spacing and comma", () => {
    const out = formatTND(5_531_680, { locale: "fr" });
    expect(out).toContain("5");
    expect(out).toContain("531");
    expect(out).toContain(",68");
    expect(out).toMatch(/TND$/);
  });

  it("rounds millimes precision to 2 decimals", () => {
    // 350_000 millimes = 350.000 TND → displays as "350,00 TND"
    expect(formatTND(350_000, { locale: "fr" })).toContain("350,00");
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
    expect(() => assertMillimes(1_000_000)).not.toThrow();
  });

  it("rejects floats, NaN, Infinity", () => {
    expect(() => assertMillimes(1.5)).toThrow();
    expect(() => assertMillimes(Number.NaN)).toThrow();
    expect(() => assertMillimes(Number.POSITIVE_INFINITY)).toThrow();
  });
});
