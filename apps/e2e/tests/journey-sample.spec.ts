import { expect, test } from "@playwright/test";
import { collectErrors, expectAccessible, OWNER } from "./helpers.js";

test.use({ storageState: OWNER.state });

const APP_PAGES = [
  "/app",
  "/app/approvals",
  "/app/copilot",
  "/app/obligations",
  "/app/payments",
  "/app/reserves",
  "/app/treasury",
  "/app/accounts",
  "/app/allocations",
  "/app/recommendations",
  "/app/opportunities",
  "/app/risk",
  "/app/activity",
  "/app/reports",
  "/app/team",
  "/app/settings",
  "/app/help",
];

test.describe.serial("sample workspace", () => {
  test("opens from onboarding and is labelled as simulated everywhere", async ({ page }) => {
    await page.goto("/onboarding/organization");
    await page.getByRole("button", { name: "Open a sample workspace" }).click();
    await page.waitForURL(/\/app$/);
    const banner = page.getByText(/Sample workspace — every balance, obligation and venue figure here is simulated/);
    await expect(banner).toBeVisible();
    for (const path of APP_PAGES.slice(1)) {
      await page.goto(path);
      await expect(page.locator("h1"), path).toHaveCount(1);
      await expect(banner, `${path} must show the sample banner`).toBeVisible();
    }
  });

  for (const scheme of ["light", "dark"] as const) {
    test(`every app page passes axe (${scheme})`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      const errors = collectErrors(page);
      for (const path of APP_PAGES) {
        await page.goto(path);
        await expect(page.locator("h1"), path).toBeVisible();
        // Let data-dependent sections resolve before scanning.
        await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 });
        await expectAccessible(page, `${path} (${scheme})`);
      }
      expect(errors).toEqual([]);
    });
  }

  test("the copilot explains when it is not configured instead of failing", async ({ page }) => {
    await page.goto("/app/copilot");
    await expect(page.getByText("The copilot isn't configured on this deployment")).toBeVisible();
    await expect(page.getByRole("textbox")).toBeDisabled();
  });

  test("the command palette navigates by keyboard", async ({ page }) => {
    await page.goto("/app");
    const dialog = page.getByRole("dialog");
    // The shortcut listener attaches on hydration, which can finish after the first paint on a slow runner.
    await expect(async () => {
      await page.keyboard.press("ControlOrMeta+k");
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    await page.keyboard.type("Reserves");
    await page.keyboard.press("Enter");
    await page.waitForURL(/\/app\/reserves$/);
  });
});
