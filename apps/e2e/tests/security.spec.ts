import { expect, test } from "@playwright/test";
import { E2E } from "../harness/ports.js";
import { MEMBER, OWNER } from "./helpers.js";

test.describe("signed out", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("app routes send you to sign in", async ({ page }) => {
    await page.goto("/app/reserves");
    await page.waitForURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Sign in to TokenIQ" })).toBeVisible();
  });

  test("the API refuses unauthenticated reads", async ({ request }) => {
    expect((await request.get("/api/v1/me")).status()).toBe(401);
  });
});

test.describe("signed in", () => {
  test.use({ storageState: OWNER.state });

  test("state-changing requests from another origin are rejected", async ({ page }) => {
    const res = await page.request.post("/api/v1/orgs", { data: { name: "Cross-site org", preset: "balanced" }, headers: { origin: "https://evil.example" } });
    expect(res.status()).toBe(403);
  });

  test("security headers are set on pages and the API", async ({ page }) => {
    const res = await page.goto("/");
    const h = res!.headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["referrer-policy"]).toBeTruthy();
    const api = await page.request.get("/api/health");
    expect(api.headers()["x-content-type-options"]).toBe("nosniff");
  });
});

test("an organization is invisible to people outside it", async ({ browser }) => {
  const owner = await browser.newContext({ storageState: OWNER.state, baseURL: E2E.webUrl });
  const outsider = await browser.newContext({ storageState: MEMBER.state, baseURL: E2E.webUrl });
  const ownerPage = await owner.newPage();
  const created = await ownerPage.request.post("/api/v1/orgs", { data: { name: "Private Treasury DAO", preset: "balanced" }, headers: { origin: E2E.webUrl } });
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: string };
  const outsiderPage = await outsider.newPage();
  // Not 403: a 404 does not confirm the organization exists.
  expect((await outsiderPage.request.get(`/api/v1/orgs/${id}/treasury`)).status()).toBe(404);
  expect((await outsiderPage.request.get(`/api/v1/orgs/${id}/members`)).status()).toBe(404);
  expect((await ownerPage.request.get(`/api/v1/orgs/${id}/treasury`)).status()).toBe(200);
  await owner.close();
  await outsider.close();
});
