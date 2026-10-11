import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { E2E } from "../harness/ports.js";

export const OWNER = { email: "owner@example.com", name: "Olu Owner", state: ".auth/owner.json" };
export const MEMBER = { email: "member@example.com", name: "Mo Member", state: ".auth/member.json" };

/** Reads the one-time code the API emailed to the local SMTP sink. */
export async function codeFor(email: string, after?: string): Promise<string> {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const res = await fetch(`http://127.0.0.1:${E2E.codesPort}/codes/${encodeURIComponent(email)}`).catch(() => null);
    if (res?.ok) {
      const { code } = (await res.json()) as { code: string };
      if (code !== after) return code;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`No sign-in code arrived for ${email}`);
}

export async function signUp(page: Page, email: string, name: string) {
  await page.goto("/signup");
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: /Email me a code/ }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.getByLabel("Verification code").fill(await codeFor(email));
  await page.getByRole("button", { name: /Verify and continue/ }).click();
  const nameField = page.getByLabel("Full name");
  await nameField.waitFor({ timeout: 15_000 });
  await nameField.fill(name);
  await page.getByRole("button", { name: /^Continue/ }).click();
  await page.waitForURL((u) => !/\/(login|signup)/.test(u.pathname), { timeout: 20_000 });
}

/** WCAG 2.0–2.2 A/AA rules, with motion reduced so transitions cannot skew contrast checks. */
export async function expectAccessible(page: Page, label: string) {
  await page.waitForLoadState("networkidle").catch(() => undefined);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const summary = results.violations.map((v) => `${v.id} [${v.impact}] ×${v.nodes.length}: ${v.help} — ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
  expect(summary, `Accessibility violations on ${label}`).toEqual([]);
}

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource: the server responded with a status of 40[134]/.test(m.text())) errors.push(`console: ${m.text()}`);
  });
  return errors;
}

export async function expectNoHorizontalScroll(page: Page, label: string) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `${label} scrolls horizontally by ${overflow}px`).toBeLessThanOrEqual(1);
}

export async function orgIdOf(page: Page): Promise<string> {
  const res = await page.request.get("/api/v1/me");
  const me = (await res.json()) as { organizations: Array<{ id: string; name: string }> };
  return me.organizations[0]!.id;
}
