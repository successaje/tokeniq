import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  applyBps,
  floorTo,
  formatBps,
  formatDecimal,
  formatUsd,
  fromWad,
  mulDiv,
  parseDecimal,
  ratioBps,
  toWad,
  valueOf,
  wad,
  WAD,
} from "../src/money.js";

describe("parseDecimal / formatDecimal", () => {
  it("parses plain decimals exactly", () => {
    expect(parseDecimal("1234.56", 2)).toBe(123456n);
    expect(parseDecimal("0.000001", 6)).toBe(1n);
    expect(parseDecimal("-1.5", 1)).toBe(-15n);
    expect(wad("1")).toBe(WAD);
  });

  it("rejects malformed input instead of guessing", () => {
    for (const bad of ["1e6", "1,000", "", ".5", "1.", "abc", "0x10", "1.2.3", "+1"]) {
      expect(() => parseDecimal(bad, 6)).toThrow();
    }
  });

  it("rejects excess precision unless a rounding mode is chosen", () => {
    expect(() => parseDecimal("1.0000001", 6)).toThrow();
    expect(parseDecimal("1.0000001", 6, "down")).toBe(1_000_000n);
    expect(parseDecimal("1.0000001", 6, "up")).toBe(1_000_001n);
    expect(parseDecimal("-1.0000001", 6, "down")).toBe(-1_000_001n);
    expect(parseDecimal("-1.0000001", 6, "up")).toBe(-1_000_000n);
  });

  it("round-trips any scaled integer", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(10n ** 40n), max: 10n ** 40n }), fc.integer({ min: 0, max: 30 }), (value, decimals) => {
        expect(parseDecimal(formatDecimal(value, decimals), decimals)).toBe(value);
      }),
    );
  });

  it("formats with grouping and display rounding", () => {
    expect(formatDecimal(123456789n, 2, { grouping: true })).toBe("1,234,567.89");
    expect(formatDecimal(1999n, 3, { maxFractionDigits: 2 })).toBe("2");
    expect(formatDecimal(1995n, 3, { maxFractionDigits: 2, minFractionDigits: 2 })).toBe("2.00");
    expect(formatDecimal(1994n, 3, { maxFractionDigits: 2, minFractionDigits: 2 })).toBe("1.99");
  });
});

describe("mulDiv rounding", () => {
  it("rounds toward -inf for down and +inf for up, including negatives", () => {
    expect(mulDiv(7n, 1n, 2n, "down")).toBe(3n);
    expect(mulDiv(7n, 1n, 2n, "up")).toBe(4n);
    expect(mulDiv(-7n, 1n, 2n, "down")).toBe(-4n);
    expect(mulDiv(-7n, 1n, 2n, "up")).toBe(-3n);
    expect(() => mulDiv(1n, 1n, 0n)).toThrow();
  });

  it("brackets the exact quotient", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: -(10n ** 30n), max: 10n ** 30n }), fc.bigInt({ min: -(10n ** 20n), max: 10n ** 20n }), fc.bigInt({ min: 1n, max: 10n ** 20n }), (a, b, d) => {
        const down = mulDiv(a, b, d, "down");
        const up = mulDiv(a, b, d, "up");
        expect(down * d <= a * b).toBe(true);
        expect(up * d >= a * b).toBe(true);
        expect(up - down === 0n || up - down === 1n).toBe(true);
      }),
    );
  });
});

describe("token conversions", () => {
  it("values balances exactly", () => {
    // 1,234.567891 USDC at $0.99980000 (8-dec feed) = 1234.567891 - 0.2469135782
    const v = valueOf(1_234_567_891n, 6, 99_980_000n, 8);
    expect(formatDecimal(v, 18)).toBe("1234.3209774218");
  });

  it("toWad/fromWad are inverse for <= 18 decimals", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 30n }), fc.integer({ min: 0, max: 18 }), (raw, decimals) => {
        expect(fromWad(toWad(raw, decimals), decimals)).toBe(raw);
      }),
    );
  });

  it("fromWad never rounds a payout up when asked for down", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 10n ** 30n }), fc.integer({ min: 0, max: 18 }), (w, decimals) => {
        expect(toWad(fromWad(w, decimals, "down"), decimals) <= w).toBe(true);
        expect(toWad(fromWad(w, decimals, "up"), decimals) >= w).toBe(true);
      }),
    );
  });
});

describe("bps helpers", () => {
  it("applies and measures basis points", () => {
    expect(applyBps(wad(1000), 250)).toBe(wad(25));
    expect(ratioBps(wad(1), wad(4))).toBe(2500n);
    expect(ratioBps(1n, 0n)).toBeNull();
    expect(formatBps(512n)).toBe("5.12%");
    expect(formatBps(1000, 0)).toBe("10%");
  });

  it("floors to steps", () => {
    expect(floorTo(wad("12345.67"), wad(1000))).toBe(wad(12000));
  });
});

describe("formatUsd", () => {
  it("formats standard and compact values", () => {
    expect(formatUsd(wad("1234567.891"))).toBe("$1,234,567.89");
    expect(formatUsd(wad("0"))).toBe("$0.00");
    expect(formatUsd(-wad("12.5"))).toBe("−$12.50");
    expect(formatUsd(wad("12.5"), { signed: true })).toBe("+$12.50");
    expect(formatUsd(wad("250000"), { compact: true })).toBe("$250K");
    expect(formatUsd(wad("1250000"), { compact: true })).toBe("$1.25M");
    expect(formatUsd(wad("999"), { compact: true })).toBe("$999.00");
  });
});

describe("decimalString bounds (security review BE-12)", () => {
  it("rejects amounts that would overflow numeric(38,18) storage", async () => {
    const { decimalString } = await import("../src/policy.js");
    expect(decimalString.safeParse("99999999999999999999.5").success).toBe(true);
    expect(decimalString.safeParse("100000000000000000000").success).toBe(false);
    expect(decimalString.safeParse("-1").success).toBe(false);
    expect(decimalString.safeParse("1e6").success).toBe(false);
  });
});
