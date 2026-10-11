import { expect, test } from "@playwright/test";
import { collectErrors, expectAccessible } from "./helpers.js";

test.use({ storageState: { cookies: [], origins: [] } });

async function publicPaths(baseURL: string) {
  const xml = await (await fetch(`${baseURL}/sitemap.xml`)).text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  return [...new Set([...paths, "/login", "/signup"])];
}

test("sitemap lists the public site", async ({ baseURL }) => {
  const paths = await publicPaths(baseURL!);
  expect(paths).toEqual(expect.arrayContaining(["/", "/product", "/security", "/pricing", "/docs", "/login"]));
  expect(paths.some((p) => p.startsWith("/app"))).toBe(false);
});

for (const scheme of ["light", "dark"] as const) {
  test(`every public page renders, has one h1 and passes axe (${scheme})`, async ({ page, baseURL }) => {
    test.setTimeout(240_000);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    const errors = collectErrors(page);
    for (const path of await publicPaths(baseURL!)) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
      await expect(page.locator("h1"), `${path} should have exactly one h1`).toHaveCount(1);
      await expectAccessible(page, `${path} (${scheme})`);
    }
    expect(errors).toEqual([]);
  });
}

test("unknown pages return a real 404", async ({ page }) => {
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
  await expect(page.locator("h1")).toBeVisible();
});

test("the landing page makes no claims of audits, customers or TVL", async ({ page }) => {
  await page.goto("/");
  const text = (await page.locator("main").innerText()).toLowerCase();
  for (const phrase of ["audited by", "trusted by", "total value locked", "tvl", "backed by"]) expect(text, phrase).not.toContain(phrase);
});
