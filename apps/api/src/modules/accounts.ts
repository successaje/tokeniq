import { createRoute, z } from "@hono/zod-openapi";
import { chainName, explorerAddress, getChain, readSafeInfo } from "@tokeniq/chain";
import { and, asc, eq, gt, isNull, schema } from "@tokeniq/db";
import { getAddress, isAddressEqual } from "viem";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan } from "../lib/authz.js";
import { badRequest, conflict, notFound, unavailable, unprocessable } from "../lib/errors.js";
import { Address, body, clientInfo, errors, Id, json, orgParams, requireUser, send } from "../lib/route.js";
import { syncAccount } from "../services/sync.js";

const tags = ["Accounts"];
const PURPOSES = ["operating", "reserve", "grants", "other"] as const;

function accountDto(a: typeof schema.treasuryAccounts.$inferSelect) {
  return {
    id: a.id,
    label: a.label,
    chainId: a.chainId,
    chain: chainName(a.chainId),
    address: getAddress(a.address),
    kind: a.kind,
    purpose: a.purpose,
    includeInTreasury: a.includeInTreasury,
    verified: a.verifiedAt !== null,
    verifiedAt: a.verifiedAt?.toISOString() ?? null,
    verificationMethod: a.verificationMethod,
    verificationSigner: a.verificationSigner,
    safe: a.kind === "safe" ? { owners: a.safeOwners ?? [], threshold: a.safeThreshold, version: a.safeVersion, nonce: a.safeNonce?.toString() ?? null, guard: a.safeGuard, modules: a.safeModules ?? [] } : null,
    lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
    lastSyncError: a.lastSyncError,
    explorer: explorerAddress(a.chainId, a.address),
    createdAt: a.createdAt.toISOString(),
  };
}

function challengeMessage(input: { orgName: string; orgId: string; kind: string; address: string; signer: string; chainId: number; nonce: string; issuedAt: Date; expiresAt: Date }) {
  const what = input.kind === "safe" ? `it is an owner of the Safe ${input.address}` : `this is the address ${input.address}`;
  return [
    "TokenIQ treasury account verification",
    "",
    `I control ${input.signer} and ${what} on ${chainName(input.chainId)} (chain ${input.chainId}).`,
    `I confirm this account belongs to the organization "${input.orgName}" in TokenIQ.`,
    "",
    "This signature does not authorize any transaction, approval or transfer, and costs no gas.",
    "",
    `Organization: ${input.orgId}`,
    `Account: ${input.address}`,
    `Signer: ${input.signer}`,
    `Nonce: ${input.nonce}`,
    `Issued At: ${input.issuedAt.toISOString()}`,
    `Expires At: ${input.expiresAt.toISOString()}`,
  ].join("\n");
}

export function registerAccounts(app: App, deps: Deps) {
  const { db } = deps;

  async function getAccount(orgId: string, id: string) {
    const [a] = await db.select().from(schema.treasuryAccounts).where(and(eq(schema.treasuryAccounts.id, id), eq(schema.treasuryAccounts.organizationId, orgId), isNull(schema.treasuryAccounts.archivedAt))).limit(1);
    if (!a) throw notFound("Account");
    return a;
  }

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}/accounts", tags, summary: "Treasury accounts", request: { params: orgParams }, responses: { 200: json(z.any()), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const rows = await db.select().from(schema.treasuryAccounts).where(and(eq(schema.treasuryAccounts.organizationId, m.organizationId), isNull(schema.treasuryAccounts.archivedAt))).orderBy(asc(schema.treasuryAccounts.createdAt));
      return send(c, { accounts: rows.map(accountDto) });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/accounts",
      tags,
      summary: "Add a Safe or wallet (read-only until verified)",
      description: "TokenIQ reads the address on-chain to detect whether it is a Safe, a contract or an externally owned account. Added accounts are watch-only and excluded from reserve maths until a member proves control by signing a challenge.",
      request: { params: orgParams, ...body(z.object({ chainId: z.number().int(), address: Address, label: z.string().trim().min(1).max(60), purpose: z.enum(PURPOSES).default("operating") })) },
      responses: { 201: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "accounts.manage");
      const input = c.req.valid("json");
      const chain = getChain(input.chainId);
      if (!chain) throw badRequest("unsupported_chain", "That network is not supported yet.");
      const client = deps.clientFor(input.chainId);
      if (!client) throw unavailable("chain_unavailable", "No RPC connection is configured for this network.");
      const address = getAddress(input.address);
      const [dupe] = await db.select({ id: schema.treasuryAccounts.id, archivedAt: schema.treasuryAccounts.archivedAt }).from(schema.treasuryAccounts).where(and(eq(schema.treasuryAccounts.organizationId, m.organizationId), eq(schema.treasuryAccounts.chainId, input.chainId), eq(schema.treasuryAccounts.address, address.toLowerCase()))).limit(1);
      if (dupe && !dupe.archivedAt) throw conflict("duplicate_account", "This address is already tracked on that network.");

      let kind: "safe" | "eoa" | "contract";
      let safeFields: Partial<typeof schema.treasuryAccounts.$inferInsert> = {};
      try {
        const info = await readSafeInfo(client, address);
        if (info.isSafe) {
          kind = "safe";
          safeFields = { safeOwners: info.safe.owners, safeThreshold: info.safe.threshold, safeVersion: info.safe.version, safeNonce: info.safe.nonce, safeGuard: info.safe.guard, safeModules: info.safe.modules };
        } else kind = info.reason === "no_code" ? "eoa" : "contract";
      } catch (err) {
        throw unavailable("chain_read_failed", `Couldn't read the address from ${chain.name} right now (${(err as Error).message.split("\n")[0]}). Nothing was added; try again shortly.`);
      }
      const values = { organizationId: m.organizationId, chainId: input.chainId, address: address.toLowerCase(), kind, label: input.label, purpose: input.purpose, createdBy: user.id, ...safeFields };
      const row = await db.transaction(async (tx) => {
        let r;
        if (dupe) {
          [r] = await tx.update(schema.treasuryAccounts).set({ ...values, archivedAt: null, verifiedAt: null, verifiedBy: null, verificationMethod: null, verificationSigner: null }).where(eq(schema.treasuryAccounts.id, dupe.id)).returning();
        } else {
          [r] = await tx.insert(schema.treasuryAccounts).values(values).returning();
        }
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "account.added", targetType: "account", targetId: r!.id, data: { chainId: input.chainId, address, kind, label: input.label }, ...clientInfo(c) });
        return r!;
      });
      // First sync inline so the person sees balances immediately; failures are recorded, not thrown.
      const sync = await syncAccount(deps, row);
      const [fresh] = await db.select().from(schema.treasuryAccounts).where(eq(schema.treasuryAccounts.id, row.id));
      await deps.boss?.send("evaluate-org", { orgId: m.organizationId }, { singletonKey: m.organizationId, singletonSeconds: 30 }).catch(() => undefined);
      return send(c, { account: accountDto(fresh!), sync }, 201);
    },
  );

  app.openapi(
    createRoute({
      method: "patch",
      path: "/api/v1/orgs/{orgId}/accounts/{id}",
      tags,
      summary: "Rename, change purpose, or include/exclude from treasury maths",
      request: { params: orgParams.extend({ id: Id }), ...body(z.object({ label: z.string().trim().min(1).max(60).optional(), purpose: z.enum(PURPOSES).optional(), includeInTreasury: z.boolean().optional() })) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "accounts.manage");
      const { id } = c.req.valid("param");
      const input = c.req.valid("json");
      const before = await getAccount(m.organizationId, id);
      const [row] = await db.transaction(async (tx) => {
        const r = await tx.update(schema.treasuryAccounts).set(input).where(eq(schema.treasuryAccounts.id, id)).returning();
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "account.updated", targetType: "account", targetId: id, data: { changed: Object.fromEntries(Object.entries(input).map(([k, v]) => [k, { from: (before as Record<string, unknown>)[k], to: v }])) }, ...clientInfo(c) });
        return r;
      });
      return send(c, { account: accountDto(row!) });
    },
  );

  app.openapi(
    createRoute({ method: "delete", path: "/api/v1/orgs/{orgId}/accounts/{id}", tags, summary: "Stop tracking an account (history is kept)", request: { params: orgParams.extend({ id: Id }) }, responses: { 200: json(z.object({ ok: z.boolean() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "accounts.manage");
      const { id } = c.req.valid("param");
      const a = await getAccount(m.organizationId, id);
      await db.transaction(async (tx) => {
        await tx.update(schema.treasuryAccounts).set({ archivedAt: deps.now() }).where(eq(schema.treasuryAccounts.id, id));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "account.archived", targetType: "account", targetId: id, data: { label: a.label, address: a.address }, ...clientInfo(c) });
      });
      return c.json({ ok: true }, 200);
    },
  );

  app.openapi(
    createRoute({ method: "post", path: "/api/v1/orgs/{orgId}/accounts/{id}/sync", tags, summary: "Read balances now", request: { params: orgParams.extend({ id: Id }) }, responses: { 200: json(z.any()), ...errors } }),
    async (c) => {
      const m = c.get("member");
      if (deps.env.disabled.has("sync")) throw unavailable("sync_disabled", "Balance sync is temporarily disabled by an operator.");
      const { id } = c.req.valid("param");
      const a = await getAccount(m.organizationId, id);
      if (a.verificationMethod === "sample") throw conflict("sample_workspace", "Sample accounts hold simulated balances and are not read from the chain.");
      const result = await syncAccount(deps, a);
      await deps.boss?.send("evaluate-org", { orgId: m.organizationId }, { singletonKey: m.organizationId, singletonSeconds: 30 }).catch(() => undefined);
      return send(c, result);
    },
  );

  // --- Verification ----------------------------------------------------------------

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/accounts/{id}/verify/challenge",
      tags,
      summary: "Get a message to sign proving control of the account",
      description: "For a Safe, the signer must be a current owner. For a wallet, the signer must be the wallet itself. The message is single-use, bound to this organization, account and signer, and expires in 10 minutes.",
      request: { params: orgParams.extend({ id: Id }), ...body(z.object({ signer: Address })) },
      responses: { 200: json(z.object({ challengeId: z.string(), message: z.string(), expiresAt: z.string() })), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "accounts.verify");
      const { id } = c.req.valid("param");
      const signer = getAddress(c.req.valid("json").signer);
      const a = await getAccount(m.organizationId, id);
      if (a.verificationMethod === "sample") throw conflict("sample_workspace", "Sample accounts cannot be verified.");
      const client = deps.clientFor(a.chainId);
      if (!client) throw unavailable("chain_unavailable", "No RPC connection is configured for this network.");
      if (a.kind === "safe") {
        const info = await readSafeInfo(client, a.address);
        if (!info.isSafe) throw unprocessable("not_a_safe", "The address no longer reads as a Safe.");
        if (!info.safe.owners.some((o) => isAddressEqual(o, signer))) throw unprocessable("not_an_owner", `${signer} is not a current owner of this Safe. Connect an owner wallet.`);
      } else if (!isAddressEqual(getAddress(a.address), signer)) {
        throw unprocessable("wrong_signer", "Connect the wallet whose address you added. Only that wallet can prove control of it.");
      }
      const [org] = await db.select({ name: schema.organizations.name }).from(schema.organizations).where(eq(schema.organizations.id, m.organizationId));
      const nonce = crypto.randomUUID().replace(/-/g, "");
      const issuedAt = deps.now();
      const expiresAt = new Date(issuedAt.getTime() + 10 * 60_000);
      const message = challengeMessage({ orgName: org?.name ?? "", orgId: m.organizationId, kind: a.kind, address: getAddress(a.address), signer, chainId: a.chainId, nonce, issuedAt, expiresAt });
      const [row] = await db.insert(schema.addressChallenges).values({ organizationId: m.organizationId, userId: user.id, accountId: a.id, chainId: a.chainId, address: signer.toLowerCase(), nonce, message, expiresAt }).returning({ id: schema.addressChallenges.id });
      return c.json({ challengeId: row!.id, message, expiresAt: expiresAt.toISOString() }, 200);
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/accounts/{id}/verify",
      tags,
      summary: "Submit the signed challenge",
      request: { params: orgParams.extend({ id: Id }), ...body(z.object({ challengeId: Id, signature: z.string().regex(/^0x[0-9a-fA-F]+$/) })) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "accounts.verify");
      const { id } = c.req.valid("param");
      const { challengeId, signature } = c.req.valid("json");
      const a = await getAccount(m.organizationId, id);
      const [ch] = await db
        .select()
        .from(schema.addressChallenges)
        .where(and(eq(schema.addressChallenges.id, challengeId), eq(schema.addressChallenges.organizationId, m.organizationId), eq(schema.addressChallenges.accountId, a.id), eq(schema.addressChallenges.userId, user.id), isNull(schema.addressChallenges.usedAt), gt(schema.addressChallenges.expiresAt, deps.now())))
        .limit(1);
      if (!ch) throw conflict("challenge_invalid", "This verification request expired or was already used. Start again.");
      // Consume first so a signature can never be replayed, even if verification fails.
      const consumed = await db.update(schema.addressChallenges).set({ usedAt: deps.now() }).where(and(eq(schema.addressChallenges.id, ch.id), isNull(schema.addressChallenges.usedAt))).returning({ id: schema.addressChallenges.id });
      if (!consumed.length) throw conflict("challenge_invalid", "This verification request was already used.");
      const client = deps.clientFor(a.chainId)!;
      const signer = getAddress(ch.address);
      const valid = await client.verifyMessage({ address: signer, message: ch.message, signature: signature as `0x${string}` }).catch(() => false);
      if (!valid) throw unprocessable("bad_signature", "The signature does not match the connected wallet and message. Nothing was changed.");
      if (a.kind === "safe") {
        const info = await readSafeInfo(client, a.address);
        if (!info.isSafe || !info.safe.owners.some((o) => isAddressEqual(o, signer))) throw unprocessable("not_an_owner", "The signer is no longer an owner of this Safe.");
      }
      const method = a.kind === "safe" ? "siwe_owner" : "siwe_address";
      const [row] = await db.transaction(async (tx) => {
        const r = await tx.update(schema.treasuryAccounts).set({ verifiedAt: deps.now(), verifiedBy: user.id, verificationMethod: method, verificationSigner: signer }).where(eq(schema.treasuryAccounts.id, a.id)).returning();
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "account.verified", targetType: "account", targetId: a.id, data: { signer, method, chainId: a.chainId }, ...clientInfo(c) });
        return r;
      });
      await deps.boss?.send("evaluate-org", { orgId: m.organizationId }, { singletonKey: m.organizationId, singletonSeconds: 30 }).catch(() => undefined);
      return send(c, { account: accountDto(row!) });
    },
  );
}
