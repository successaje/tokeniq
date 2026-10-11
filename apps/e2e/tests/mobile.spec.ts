import { expect, test } from "@playwright/test";
import { E2E } from "../harness/ports.js";
import { expectNoHorizontalScroll, OWNER } from "./helpers.js";

test.describe("phone layout, signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  for (const path of ["/", "/product", "/security", "/pricing", "/login"]) {
    test(`${path} fits the screen`, async ({ page }) => {
      await page.goto(path);
      await expectNoHorizontalScroll(page, path);
    });
  }
});

test.describe("phone layout, signed in", () => {
  test.use({ storageState: OWNER.state });
  // Independent of other projects: make sure the person has a workspace to look at.
  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: OWNER.state, baseURL: E2E.webUrl });
    const res = await ctx.request.post("/api/v1/sample-workspace", { data: {}, headers: { origin: E2E.webUrl } });
    expect(res.status()).toBeLessThan(300);
    await ctx.close();
  });
  for (const path of ["/app", "/app/approvals", "/app/obligations", "/app/reserves", "/app/treasury", "/app/activity", "/app/settings"]) {
    test(`${path} fits the screen`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await expectNoHorizontalScroll(page, path);
    });
  }

  test("navigation is reachable from a menu button", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("button", { name: "More" }).click();
    const sheet = page.getByRole("dialog", { name: "All sections" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: /Reserves/ }).click();
    await page.waitForURL(/\/app\/reserves$/);
  });
});
