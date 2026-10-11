import { expect, test } from "@playwright/test";
import { E2E } from "../harness/ports.js";
import { collectErrors, MEMBER, OWNER } from "./helpers.js";

test.use({ storageState: MEMBER.state });

test.describe.serial("a real organization from onboarding to a second member", () => {
  let orgId = "";

  test("onboarding: organization, skip accounts, one obligation, policy, done", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/onboarding/organization");
    await page.getByLabel("Organization name").fill("Northwind DAO");
    await page.getByRole("button", { name: "Create organization" }).click();
    await page.waitForURL(/\/onboarding\/treasury$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Add your first treasury account");

    await page.getByRole("button", { name: "Skip for now" }).click();
    await page.waitForURL(/\/onboarding\/obligations$/);
    // A new organization starts with one empty commitment row.
    await expect(page.getByRole("button", { name: /Add another/ })).toBeVisible();
    await page.getByLabel("Title").first().fill("Core contributors payroll");
    await page.getByLabel("Amount").first().fill("42000");
    await page.getByRole("button", { name: /Save and continue/ }).click();
    await page.waitForURL(/\/onboarding\/policy$/);

    await page.getByRole("button", { name: /Finish setup/ }).click();
    await page.waitForURL(/\/onboarding\/complete$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Northwind DAO is set up");
    expect(errors).toEqual([]);

    const me = (await (await page.request.get("/api/v1/me")).json()) as { organizations: Array<{ id: string; name: string }> };
    orgId = me.organizations.find((o) => o.name === "Northwind DAO")!.id;
  });

  test("the obligation drives the reserve, and nothing is counted from unverified money", async ({ page }) => {
    await page.goto("/app/obligations");
    await expect(page.getByText("Core contributors payroll").first()).toBeVisible();
    const overview = (await (await page.request.get(`/api/v1/orgs/${orgId}/treasury`)).json()) as { reserve: { required: string; available: string }; treasury: { gross: string } };
    // $42,000 a month × 6 months of runway (balanced default) is at least $252,000 protected.
    expect(Number(overview.reserve.required)).toBeGreaterThanOrEqual(252_000);
    expect(Number(overview.reserve.available)).toBe(0);
    await page.goto("/app/reserves");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("every step is in the audit trail", async ({ page }) => {
    const res = await page.request.get(`/api/v1/orgs/${orgId}/activity?limit=200`);
    const actions = ((await res.json()) as { events: Array<{ action: string }> }).events.map((e) => e.action);
    expect(actions).toEqual(expect.arrayContaining(["organization.created", "obligation.created"]));
    await page.goto("/app/activity");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("an invitation is emailed and accepted by the right person", async ({ page, browser }) => {
    await page.goto("/app/team");
    await page.getByRole("button", { name: /Invite member/ }).click();
    await page.getByLabel("Email address").fill(OWNER.email);
    await page.getByRole("radio", { name: /Approver/ }).click();
    await page.getByRole("button", { name: "Send invitation" }).click();
    await expect(page.getByText(/sent|invited/i).first()).toBeVisible();

    const mail = (await (await fetch(`http://127.0.0.1:${E2E.codesPort}/mail/${encodeURIComponent(OWNER.email)}`)).json()) as { body: string };
    const link = /https?:\/\/[^\s]+\/invite\/[0-9a-f-]{36}/.exec(mail.body)?.[0];
    expect(link, "invitation email contains a link").toBeTruthy();

    const owner = await browser.newContext({ storageState: OWNER.state, baseURL: E2E.webUrl });
    const ownerPage = await owner.newPage();
    await ownerPage.goto(new URL(link!).pathname);
    await ownerPage.getByRole("button", { name: "Accept and join" }).click();
    await ownerPage.waitForURL(/\/app/);
    const me = (await (await ownerPage.request.get("/api/v1/me")).json()) as { organizations: Array<{ id: string; role: string }> };
    expect(me.organizations.find((o) => o.id === orgId)?.role).toBe("approver");

    // Approvers cannot change policy.
    const current = (await (await ownerPage.request.get(`/api/v1/orgs/${orgId}/policies`)).json()) as { treasury: Record<string, unknown>; treasuryVersion: number };
    const policy = await ownerPage.request.put(`/api/v1/orgs/${orgId}/policies/treasury`, { data: { policy: { ...current.treasury, runwayMonths: 1 }, reason: "Lower the runway", expectedVersion: current.treasuryVersion }, headers: { origin: E2E.webUrl } });
    expect(policy.status()).toBe(403);
    await owner.close();
  });
});
