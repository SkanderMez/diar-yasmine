import { describe, it, expect } from "vitest";
import {
  parseLocalDate,
  formatLocalized,
  nightsBetween,
  rangeOverlaps,
} from "./date";

describe("parseLocalDate", () => {
  it("interprets YYYY-MM-DD as midnight Africa/Tunis (UTC+1)", () => {
    // 2026-07-12 midnight in Tunis = 2026-07-11T23:00:00Z UTC.
    const utc = parseLocalDate("2026-07-12");
    expect(utc.toISOString()).toBe("2026-07-11T23:00:00.000Z");
  });

  it("is stable across runs (DST-free zone)", () => {
    const winter = parseLocalDate("2026-01-15");
    const summer = parseLocalDate("2026-07-15");
    // Tunisia abolished DST in 2009 — both should be UTC+1.
    expect(winter.toISOString()).toBe("2026-01-14T23:00:00.000Z");
    expect(summer.toISOString()).toBe("2026-07-14T23:00:00.000Z");
  });
});

describe("nightsBetween", () => {
  it("counts calendar nights in Africa/Tunis", () => {
    const checkIn = parseLocalDate("2026-07-10");
    const checkOut = parseLocalDate("2026-07-15");
    expect(nightsBetween(checkIn, checkOut)).toBe(5);
  });

  it("works for a single night", () => {
    const checkIn = parseLocalDate("2026-07-10");
    const checkOut = parseLocalDate("2026-07-11");
    expect(nightsBetween(checkIn, checkOut)).toBe(1);
  });

  it("throws on same-day check-in/out", () => {
    const d = parseLocalDate("2026-07-10");
    expect(() => nightsBetween(d, d)).toThrow();
  });

  it("throws when checkout precedes check-in", () => {
    const checkIn = parseLocalDate("2026-07-15");
    const checkOut = parseLocalDate("2026-07-10");
    expect(() => nightsBetween(checkIn, checkOut)).toThrow();
  });
});

describe("rangeOverlaps (half-open intervals)", () => {
  const a = parseLocalDate("2026-07-10");
  const b = parseLocalDate("2026-07-15");
  const c = parseLocalDate("2026-07-15");
  const d = parseLocalDate("2026-07-20");

  it("returns false when ranges meet exactly (checkout = next checkin)", () => {
    // [a, b) = [10, 15), [c, d) = [15, 20). They touch but don't overlap.
    expect(rangeOverlaps(a, b, c, d)).toBe(false);
  });

  it("returns true when ranges overlap by a day", () => {
    const overlap = parseLocalDate("2026-07-14");
    expect(rangeOverlaps(a, b, overlap, d)).toBe(true);
  });

  it("returns true when one range is contained inside the other", () => {
    const innerStart = parseLocalDate("2026-07-11");
    const innerEnd = parseLocalDate("2026-07-14");
    expect(rangeOverlaps(a, b, innerStart, innerEnd)).toBe(true);
  });

  it("returns false for fully disjoint ranges", () => {
    const futureStart = parseLocalDate("2026-08-01");
    const futureEnd = parseLocalDate("2026-08-05");
    expect(rangeOverlaps(a, b, futureStart, futureEnd)).toBe(false);
  });
});

describe("formatLocalized", () => {
  it("renders an ISO timestamp in Africa/Tunis", () => {
    // 2026-07-12T00:00:00 Tunis = 2026-07-11T23:00:00 UTC.
    const utc = new Date("2026-07-11T23:00:00.000Z");
    const out = formatLocalized(utc, "yyyy-MM-dd HH:mm");
    expect(out).toBe("2026-07-12 00:00");
  });
});
