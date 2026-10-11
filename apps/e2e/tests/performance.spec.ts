import { mkdirSync, writeFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { E2E } from "../harness/ports.js";
import { OWNER } from "./helpers.js";

/**
 * Lab measurements on the production build (next start, gzip), desktop Chrome, no throttling.
 * Budgets are generous ceilings that catch regressions; they are not field Core Web Vitals.
 */
const BUDGET = { lcpMs: 2500, cls: 0.1, scriptKb: 450 };

interface Metrics {
  path: string;
  lcpMs: number;
  cls: number;
  scriptKb: number;
  requests: number;
  domContentLoadedMs: number;
}

const results: Metrics[] = [];

async function measure(page: Page, path: string): Promise<Metrics> {
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: number; __cls: number };
    w.__lcp = 0;
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__lcp = Math.max(w.__lcp, e.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean }>) if (!e.hadRecentInput) w.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  return page.evaluate((p) => {
    const w = window as unknown as { __lcp: number; __cls: number };
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const scripts = resources.filter((r) => r.initiatorType === "script" || r.name.endsWith(".js"));
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    return {
      path: p,
      lcpMs: Math.round(w.__lcp),
      cls: Number(w.__cls.toFixed(4)),
      scriptKb: Math.round(scripts.reduce((s, r) => s + (r.transferSize || r.encodedBodySize), 0) / 1024),
      requests: resources.length + 1,
      domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd),
    };
  }, path);
}

test.describe.serial("performance budgets", () => {
  test.afterAll(() => {
    mkdirSync("test-results", { recursive: true });
    writeFileSync("test-results/performance.json", JSON.stringify({ measuredAt: new Date().toISOString(), budget: BUDGET, results }, null, 2));
    console.table(results);
  });

  test.describe("public", () => {
    test.use({ storageState: { cookies: [], origins: [] } });
    for (const path of ["/", "/product", "/pricing", "/login"]) {
      test(`${path} stays within budget`, async ({ page }) => {
        const m = await measure(page, path);
        results.push(m);
        expect(m.lcpMs, `${path} LCP`).toBeLessThan(BUDGET.lcpMs);
        expect(m.cls, `${path} CLS`).toBeLessThan(BUDGET.cls);
        expect(m.scriptKb, `${path} JavaScript transferred (KB)`).toBeLessThan(BUDGET.scriptKb);
      });
    }
  });

  test.describe("app", () => {
    test.use({ storageState: OWNER.state });
    test.beforeAll(async ({ browser }) => {
      const ctx = await browser.newContext({ storageState: OWNER.state, baseURL: E2E.webUrl });
      expect((await ctx.request.post("/api/v1/sample-workspace", { data: {}, headers: { origin: E2E.webUrl } })).status()).toBeLessThan(300);
      await ctx.close();
    });
    for (const path of ["/app", "/app/reserves", "/app/approvals"]) {
      test(`${path} stays within budget`, async ({ page }) => {
        const m = await measure(page, path);
        results.push(m);
        expect(new URL(page.url()).pathname, "measured the app page, not a redirect").toBe(path);
        expect(m.lcpMs, `${path} LCP`).toBeLessThan(BUDGET.lcpMs);
        expect(m.cls, `${path} CLS`).toBeLessThan(BUDGET.cls);
        // The signed-in app also loads wallet libraries (wagmi/viem), so it gets a larger allowance.
        expect(m.scriptKb, `${path} JavaScript transferred (KB)`).toBeLessThan(BUDGET.scriptKb * 2);
      });
    }
  });
});
