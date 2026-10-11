import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { addDays, addMonths, diffDays, parseIsoDate } from "../src/dates.js";
import { wad } from "../src/money.js";
import { dueDatesBetween, expandOccurrences, itemizedMonthlyBurn, nextDueDate } from "../src/obligations.js";
import { obligation } from "./fixtures.js";

describe("calendar arithmetic", () => {
  it("clamps month ends but keeps the anchor day", () => {
    expect(addMonths("2025-01-31", 1)).toBe("2025-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2025-01-31", 2)).toBe("2025-03-31");
    expect(addMonths("2025-12-15", 1)).toBe("2026-01-15");
    expect(addMonths("2025-03-31", -1)).toBe("2025-02-28");
  });

  it("validates dates strictly", () => {
    expect(() => parseIsoDate("2025-02-30")).toThrow();
    expect(() => parseIsoDate("2025-2-3")).toThrow();
    expect(() => parseIsoDate("2025-13-01")).toThrow();
  });

  it("addDays and diffDays are consistent", () => {
    fc.assert(
      fc.property(fc.integer({ min: -5000, max: 5000 }), (n) => {
        expect(diffDays(addDays("2025-06-15", n), "2025-06-15")).toBe(n);
      }),
    );
  });
});

describe("recurrence expansion", () => {
  it("expands monthly obligations anchored at month end", () => {
    const ob = obligation({ id: "payroll", amount: wad(1), firstDueDate: "2025-01-31", recurrence: { freq: "monthly", interval: 1 } });
    expect(dueDatesBetween(ob, "2025-01-01", "2025-05-31").map((d) => d.date)).toEqual(["2025-01-31", "2025-02-28", "2025-03-31", "2025-04-30", "2025-05-31"]);
  });

  it("honours count and until", () => {
    const counted = obligation({ id: "a", amount: wad(1), firstDueDate: "2025-01-01", recurrence: { freq: "weekly", interval: 2, count: 3 } });
    expect(dueDatesBetween(counted, "2024-01-01", "2026-01-01").map((d) => d.date)).toEqual(["2025-01-01", "2025-01-15", "2025-01-29"]);
    const until = obligation({ id: "b", amount: wad(1), firstDueDate: "2025-01-10", recurrence: { freq: "quarterly", interval: 1, until: "2025-08-01" } });
    expect(dueDatesBetween(until, "2025-01-01", "2026-12-31").map((d) => d.date)).toEqual(["2025-01-10", "2025-04-10", "2025-07-10"]);
  });

  it("returns every date in the window and nothing outside it", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 4 }), fc.integer({ min: 0, max: 400 }), fc.integer({ min: 0, max: 400 }), (interval, a, b) => {
        const ob = obligation({ id: "x", amount: wad(1), firstDueDate: "2025-01-31", recurrence: { freq: "monthly", interval } });
        const from = addDays("2025-01-01", Math.min(a, b));
        const to = addDays("2025-01-01", Math.max(a, b));
        for (const d of dueDatesBetween(ob, from, to)) {
          expect(d.date >= from && d.date <= to).toBe(true);
        }
      }),
    );
  });
});

describe("expandOccurrences", () => {
  it("skips settled occurrences, flags overdue ones, and ignores history before trackFrom", () => {
    const ob = obligation({ id: "rent", amount: wad(5000), firstDueDate: "2025-06-01", recurrence: { freq: "monthly", interval: 1 }, trackFrom: "2025-09-15" });
    const occ = expandOccurrences([ob], { asOf: "2025-10-09", through: "2025-12-31", settled: [{ obligationId: "rent", dueDate: "2025-11-01" }] });
    expect(occ.map((o) => [o.dueDate, o.overdue])).toEqual([
      ["2025-10-01", true],
      ["2025-12-01", false],
    ]);
  });

  it("converts foreign currency conservatively and reports missing rates", () => {
    const eur = obligation({ id: "eur", amount: wad(1000), currency: "EUR", firstDueDate: "2025-10-20" });
    const withFx = expandOccurrences([eur], { asOf: "2025-10-09", through: "2025-12-31", fx: { EUR: { usdPerUnit: wad("1.0812"), asOf: "t", source: "test" } } });
    expect(withFx[0]!.usd).toBe(wad("1081.2"));
    const withoutFx = expandOccurrences([eur], { asOf: "2025-10-09", through: "2025-12-31" });
    expect(withoutFx[0]!.usd).toBeNull();
  });

  it("excludes paused and cancelled obligations", () => {
    const ob = obligation({ id: "p", amount: wad(1), status: "paused", firstDueDate: "2025-10-20" });
    expect(expandOccurrences([ob], { asOf: "2025-10-09", through: "2025-12-31" })).toHaveLength(0);
  });
});

describe("burn", () => {
  it("normalises recurring outflows to monthly, rounding up", () => {
    const obs = [
      obligation({ id: "w", amount: wad(1200), recurrence: { freq: "weekly", interval: 1 } }),
      obligation({ id: "m", amount: wad(10000), recurrence: { freq: "monthly", interval: 1 } }),
      obligation({ id: "q", amount: wad(3000), recurrence: { freq: "quarterly", interval: 1 } }),
      obligation({ id: "y", amount: wad(12000), recurrence: { freq: "yearly", interval: 1 } }),
      obligation({ id: "once", amount: wad(99999) }),
      obligation({ id: "in", amount: wad(5000), direction: "inflow", recurrence: { freq: "monthly", interval: 1 } }),
    ];
    // 1200*52/12 = 5200; + 10000 + 1000 + 1000
    expect(itemizedMonthlyBurn(obs, {}).monthly).toBe(wad(17200));
  });

  it("finds the next unsettled due date", () => {
    const ob = obligation({ id: "n", amount: wad(1), firstDueDate: "2025-09-01", recurrence: { freq: "monthly", interval: 1 } });
    expect(nextDueDate(ob, "2025-10-09")).toBe("2025-11-01");
    expect(nextDueDate(ob, "2025-10-09", [{ obligationId: "n", dueDate: "2025-11-01" }])).toBe("2025-12-01");
  });
});
