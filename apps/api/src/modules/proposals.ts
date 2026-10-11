import { createRoute, z } from "@hono/zod-openapi";
import { buildExecTransactionData, encodeSafeSignatures, explorerTx, readSafeInfo, recoverSafeSigner, simulateSafeTransaction, type SafeInfo } from "@tokeniq/chain";
import { canApprove, decimalString, evaluateApprovals, formatUsd, parseDecimal, validateAction, type ApprovalRecord, type MemberRole, type TreasuryAction } from "@tokeniq/core";
import { and, asc, desc, eq, inArray, schema, sql } from "@tokeniq/db";
import { getAddress, isAddressEqual, type Hex } from "viem";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan, isRole } from "../lib/authz.js";
import { ApiError, badRequest, conflict, isUniqueViolation, notFound, unavailable, unprocessable } from "../lib/errors.js";
import { Address, body, clientInfo, errors, Id, IsoDateString, json, orgParams, requireUser, send, TxHash } from "../lib/route.js";
import { BuildError, buildSafeTxForAction, safeTxFromJson, safeTxToJson, type SafeTxJson } from "../services/build-tx.js";
import { actionFromJson, actionToJson, validationDto, type ActionJson, type RecommendationJson } from "../services/dto.js";
import { notifyRoles } from "../services/notify.js";
import { getPolicies } from "../services/policies.js";
import { ACTIVE_PROPOSAL_STATUSES, loadOrgState, type OrgState } from "../services/state.js";

const tags = ["Proposals & approvals"];

/**
 * Lifecycle (three independent tracks, never conflated):
 *   internal approval:   pending_approval → approved | rejected | expired | cancelled
 *   cryptographic auth:  approved → awaiting_signatures → ready_to_execute (threshold of Safe owner signatures)
 *   on-chain execution:  ready_to_execute → submitted → executed | failed   (or stale if the Safe nonce moved)
 */
export type ProposalStatus =
  | "pending_approval"
  | "approved"
  | "rejected"
  | "expired"
  | "cancelled"
  | "awaiting_signatures"
  | "ready_to_execute"
  | "submitted"
  | "executed"
  | "failed"
  | "stale";

type ProposalRow = typeof schema.proposals.$inferSelect;

const UINT256_MAX = 2n ** 256n - 1n;
/** Positive integer token amount in base units that fits a uint256 (no signs, hex, whitespace or leading zeros). */
const RawAmountInput = z
  .string()
  .regex(/^[1-9]\d{0,77}$/, "Enter the token amount as a positive integer in base units")
  .refine((v) => BigInt(v) <= UINT256_MAX, "Token amount is too large");

/** Structured actions accepted from clients. Unknown types and extra fields are rejected. */
const ActionInput = z.discriminatedUnion("type", [
  z
    .object({ type: z.literal("allocate"), accountId: Id, opportunityId: z.string().min(1).max(128), amountUsd: decimalString, assetAmountRaw: RawAmountInput })
    .strict(),
  z
    .object({ type: z.literal("withdraw"), accountId: Id, positionId: z.string().min(1).max(200), amountUsd: decimalString, assetAmountRaw: RawAmountInput })
    .strict(),
  z
    .object({
      type: z.literal("payment"),
      accountId: Id,
      obligationId: Id,
      dueDate: IsoDateString,
      amountUsd: decimalString,
      assetAmountRaw: RawAmountInput,
      assetSymbol: z.string().min(1).max(16),
      recipient: Address,
    })
    .strict(),
]);

function validationContext(state: OrgState, action: TreasuryAction) {
  const holding = state.holdings.find((h) => h.accountId === action.accountId && (action.type === "payment" ? h.asset.symbol === action.assetSymbol : action.type === "allocate" ? state.opportunities.find((o) => o.id === action.opportunityId)?.asset.address.toLowerCase() === h.asset.address.toLowerCase() : false));
  const unsettled = new Map<string, bigint>();
  for (const o of state.reserve.obligations.occurrences) if (o.usd !== null) unsettled.set(`${o.obligationId}|${o.dueDate}`, o.usd);
  const paymentTerms = new Map(
    state.obligationRows.map((o) => [o.id, { recipient: o.recipientAddress, chainId: o.recipientChainId, assetSymbol: o.paymentAsset }]),
  );
  return {
    // The token being moved and its quote, so the engine can bind amountUsd to assetAmountRaw (withdrawals use the position).
    actionAsset: action.type === "withdraw" ? undefined : holding ? { asset: holding.asset, price: holding.price } : null,
    paymentTerms,
    nowSec: state.nowSec,
    policy: state.policy,
    treasury: state.treasury,
    reserve: state.reserve,
    accounts: state.accounts,
    positions: state.positions,
    opportunities: state.opportunities,
    accountAssetBalanceRaw: holding ? holding.raw : null,
    unsettledOccurrences: unsettled,
  };
}

function titleFor(action: TreasuryAction, state: OrgState): string {
  if (action.type === "allocate") return `Deploy ${formatUsd(action.amountUsd, { decimals: 0 })} into ${state.opportunities.find((o) => o.id === action.opportunityId)?.name ?? "venue"}`;
  if (action.type === "withdraw") return `Withdraw ${formatUsd(action.amountUsd, { decimals: 0 })} from ${state.positions.find((p) => p.id === action.positionId)?.venueName ?? "position"}`;
  return `Pay ${formatUsd(action.amountUsd)} for ${state.obligationRows.find((o) => o.id === action.obligationId)?.title ?? "obligation"}`;
}

function approvalRecords(rows: Array<typeof schema.approvals.$inferSelect>): ApprovalRecord[] {
  return rows.filter((r) => isRole(r.role)).map((r) => ({ memberId: r.userId, role: r.role as MemberRole, decision: r.decision as "approve" | "reject", at: Math.floor(r.createdAt.getTime() / 1000) }));
}

export function registerProposals(app: App, deps: Deps) {
  const { db } = deps;

  async function getProposal(orgId: string, id: string): Promise<ProposalRow> {
    const [p] = await db.select().from(schema.proposals).where(and(eq(schema.proposals.id, id), eq(schema.proposals.organizationId, orgId))).limit(1);
    if (!p) throw notFound("Proposal");
    return p;
  }

  async function setStatus(tx: Pick<typeof db, "update">, id: string, from: ProposalStatus[], to: ProposalStatus, extra: Partial<ProposalRow> = {}) {
    const res = await tx
      .update(schema.proposals)
      .set({ status: to, ...extra })
      .where(and(eq(schema.proposals.id, id), inArray(schema.proposals.status, from)))
      .returning({ id: schema.proposals.id });
    if (!res.length) throw conflict("proposal_state_changed", "This proposal changed while you were working on it. Reload to see its current state.");
  }

  function requireExecutionAllowed(state: OrgState) {
    if (deps.env.disabled.has("signatures")) throw unavailable("signatures_disabled", "Signing and execution are temporarily disabled by an operator. Nothing has been changed.");
    if (state.isSample) throw conflict("sample_workspace", "This is a sample workspace with simulated accounts. Nothing here can be signed or executed.");
  }

  async function liveSafe(state: OrgState, accountId: string): Promise<{ safe: SafeInfo; account: OrgState["accountRows"][number] }> {
    const account = state.accountRows.find((a) => a.id === accountId);
    if (!account) throw notFound("Account");
    if (account.kind !== "safe" || !account.verifiedAt) throw unprocessable("account_not_eligible", "Transactions can only be prepared for verified Safe accounts.");
    const client = deps.clientFor(account.chainId);
    if (!client) throw unavailable("chain_unavailable", "No RPC connection is configured for this network.");
    const info = await readSafeInfo(client, account.address);
    if (!info.isSafe) throw unprocessable("not_a_safe", `The account is no longer readable as a Safe: ${info.detail}`);
    if (!info.safe.supported) throw unprocessable("unsupported_safe_version", `Safe version ${info.safe.version} is not supported. TokenIQ prepares transactions for Safe 1.3.0 and later.`);
    return { safe: info.safe, account };
  }

  // --- Create -------------------------------------------------------------------

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/proposals",
      tags,
      summary: "Create a proposal from a recommendation or a structured action",
      description:
        "The action is re-validated by the deterministic policy engine against current data. Invalid actions are rejected with the failing checks. Creating a proposal never moves funds: it starts internal approval, after which Safe owners must sign in their own wallets.",
      request: {
        params: orgParams,
        ...body(
          z.object({
            recommendationId: Id.optional(),
            action: ActionInput.optional(),
            idempotencyKey: z.string().min(8).max(100),
            note: z.string().trim().max(1000).optional(),
          }),
        ),
      },
      responses: { 201: json(z.any()), 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "proposals.create");
      if (deps.env.disabled.has("proposals")) throw unavailable("proposals_disabled", "Creating proposals is temporarily disabled by an operator.");
      const input = c.req.valid("json");

      const [existing] = await db.select().from(schema.proposals).where(and(eq(schema.proposals.organizationId, m.organizationId), eq(schema.proposals.idempotencyKey, input.idempotencyKey))).limit(1);
      if (existing) return send(c, { id: existing.id, status: existing.status, duplicate: true }, 200);

      let actionJson: ActionJson | null = null;
      let recommendationId: string | null = null;
      if (input.recommendationId) {
        const [rec] = await db.select().from(schema.recommendations).where(and(eq(schema.recommendations.id, input.recommendationId), eq(schema.recommendations.organizationId, m.organizationId))).limit(1);
        if (!rec) throw notFound("Recommendation");
        if (rec.status !== "open") throw conflict("recommendation_not_open", `This recommendation is ${rec.status}.`);
        const payload = rec.payload as RecommendationJson;
        if (!payload.action) throw unprocessable("no_action", "This recommendation has no executable action.");
        actionJson = payload.action;
        recommendationId = rec.id;
      } else if (input.action) {
        actionJson = input.action as ActionJson;
      } else {
        throw badRequest("action_required", "Provide a recommendationId or an action.");
      }

      let action: TreasuryAction;
      try {
        action = actionFromJson(actionJson);
      } catch {
        throw badRequest("invalid_action", "The action could not be read.");
      }
      const state = await loadOrgState(db, m.organizationId, deps.now());
      const validation = validateAction(action, validationContext(state, action));
      if (!validation.valid) {
        throw new ApiError(422, "policy_check_failed", "The action no longer passes every policy check with current data.", validationDto(validation));
      }
      const account = state.accountRows.find((a) => a.id === action.accountId)!;
      const ttl = state.approvalPolicy.proposalTtlHours;
      const id = crypto.randomUUID();
      const title = titleFor(action, state);
      try {
        await db.transaction(async (tx) => {
          await tx.insert(schema.proposals).values({
            id,
            organizationId: m.organizationId,
            recommendationId,
            kind: action.type,
            title,
            status: "pending_approval",
            action: actionToJson(action),
            amountUsd: actionToJson(action).amountUsd,
            accountId: account.id,
            chainId: account.chainId,
            validation: validationDto(validation),
            proposerId: user.id,
            idempotencyKey: input.idempotencyKey,
            expiresAt: new Date(deps.now().getTime() + ttl * 3600_000),
          });
          if (recommendationId) {
            await tx
              .update(schema.recommendations)
              .set({ status: "accepted", resolvedAt: deps.now(), resolvedBy: user.id, resolution: `Proposal ${id}` })
              .where(eq(schema.recommendations.id, recommendationId));
          }
          if (input.note)
            await tx.insert(schema.proposalComments).values({ organizationId: m.organizationId, proposalId: id, userId: user.id, body: input.note });
          await audit(tx, {
            organizationId: m.organizationId,
            actorUserId: user.id,
            action: "proposal.created",
            targetType: "proposal",
            targetId: id,
            data: { title, amountUsd: actionToJson(action).amountUsd, kind: action.type, recommendationId, policyVersion: state.policyVersion },
            ...clientInfo(c),
          });
        });
      } catch (err) {
        // A concurrent request with the same idempotency key won the race: answer as a duplicate, not a 500.
        if (!isUniqueViolation(err, "proposals_org_idempotency_uq")) throw err;
        const [winner] = await db
          .select()
          .from(schema.proposals)
          .where(and(eq(schema.proposals.organizationId, m.organizationId), eq(schema.proposals.idempotencyKey, input.idempotencyKey)))
          .limit(1);
        if (!winner) throw err;
        return send(c, { id: winner.id, status: winner.status, duplicate: true }, 200);
      }
      await notifyRoles(deps, m.organizationId, ["owner", "admin", "finance", "approver"], { kind: "proposal.created", title: `Review: ${title}`, body: `Proposed by ${user.name || user.email}. Needs internal approval.`, link: `/app/approvals/${id}`, dedupeKey: `proposal:${id}:created` }, user.id);
      return send(c, { id, status: "pending_approval", duplicate: false }, 201);
    },
  );

  // --- Read ---------------------------------------------------------------------

  app.openapi(
    createRoute({
      method: "get",
      path: "/api/v1/orgs/{orgId}/proposals",
      tags,
      summary: "List proposals",
      request: { params: orgParams, query: z.object({ status: z.enum(["active", "closed", "all"]).default("active") }) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const { status } = c.req.valid("query");
      await expireStale(m.organizationId);
      const active = [...ACTIVE_PROPOSAL_STATUSES] as string[];
      const where =
        status === "active"
          ? and(eq(schema.proposals.organizationId, m.organizationId), inArray(schema.proposals.status, active))
          : status === "closed"
            ? and(eq(schema.proposals.organizationId, m.organizationId), sql`${schema.proposals.status} not in (${sql.join(active.map((s) => sql`${s}`), sql`, `)})`)
            : eq(schema.proposals.organizationId, m.organizationId);
      const rows = await db.select({ p: schema.proposals, proposer: schema.users.name }).from(schema.proposals).innerJoin(schema.users, eq(schema.users.id, schema.proposals.proposerId)).where(where).orderBy(desc(schema.proposals.createdAt)).limit(200);
      const ids = rows.map((r) => r.p.id);
      const approvals = ids.length ? await db.select().from(schema.approvals).where(inArray(schema.approvals.proposalId, ids)) : [];
      const sigs = ids.length ? await db.select({ proposalId: schema.safeSignatures.proposalId, signer: schema.safeSignatures.signer }).from(schema.safeSignatures).where(inArray(schema.safeSignatures.proposalId, ids)) : [];
      const { approval: policy } = await getPolicies(db, m.organizationId);
      return send(c, {
        proposals: rows.map(({ p, proposer }) => {
          const ev = evaluateApprovals({ policy, amountUsd: parseDecimal(p.amountUsd), proposerId: p.proposerId, createdAt: Math.floor(p.createdAt.getTime() / 1000), nowSec: Math.floor(deps.now().getTime() / 1000), records: approvalRecords(approvals.filter((a) => a.proposalId === p.id)) });
          const mine = approvals.find((a) => a.proposalId === p.id && a.userId === user.id);
          return {
            id: p.id,
            title: p.title,
            kind: p.kind,
            status: p.status,
            amountUsd: p.amountUsd,
            chainId: p.chainId,
            proposer,
            proposerIsYou: p.proposerId === user.id,
            createdAt: p.createdAt.toISOString(),
            expiresAt: p.expiresAt.toISOString(),
            approvals: { have: ev.approvals, need: ev.requiredApprovals, roleRequirementMet: ev.roleRequirementMet, needs: ev.needs },
            yourDecision: mine?.decision ?? null,
            signatures: sigs.filter((s) => s.proposalId === p.id).length,
          };
        }),
      });
    },
  );

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}/proposals/summary", tags, summary: "Counts for navigation badges", request: { params: orgParams }, responses: { 200: json(z.object({ needsAttention: z.number(), active: z.number() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const rows = await db
        .select({ id: schema.proposals.id, status: schema.proposals.status, proposerId: schema.proposals.proposerId })
        .from(schema.proposals)
        .where(and(eq(schema.proposals.organizationId, m.organizationId), inArray(schema.proposals.status, [...ACTIVE_PROPOSAL_STATUSES])));
      const decided = rows.length ? await db.select({ proposalId: schema.approvals.proposalId }).from(schema.approvals).where(and(inArray(schema.approvals.proposalId, rows.map((r) => r.id)), eq(schema.approvals.userId, user.id))) : [];
      const decidedSet = new Set(decided.map((d) => d.proposalId));
      const canDecide = ["owner", "admin", "finance", "approver"].includes(m.role);
      const needsAttention = rows.filter((r) => (r.status === "pending_approval" && canDecide && r.proposerId !== user.id && !decidedSet.has(r.id)) || r.status === "awaiting_signatures" || r.status === "ready_to_execute").length;
      return c.json({ needsAttention, active: rows.length }, 200);
    },
  );

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}/proposals/{id}", tags, summary: "Proposal with approvals, signatures, executions and a fresh policy check", request: { params: orgParams.extend({ id: Id }) }, responses: { 200: json(z.any()), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const { id } = c.req.valid("param");
      await expireStale(m.organizationId);
      const p = await getProposal(m.organizationId, id);
      const [approvalRows, comments, sigs, execs, state] = await Promise.all([
        db.select({ a: schema.approvals, name: schema.users.name, email: schema.users.email }).from(schema.approvals).innerJoin(schema.users, eq(schema.users.id, schema.approvals.userId)).where(eq(schema.approvals.proposalId, id)).orderBy(asc(schema.approvals.createdAt)),
        db.select({ c: schema.proposalComments, name: schema.users.name }).from(schema.proposalComments).innerJoin(schema.users, eq(schema.users.id, schema.proposalComments.userId)).where(eq(schema.proposalComments.proposalId, id)).orderBy(asc(schema.proposalComments.createdAt)),
        db.select().from(schema.safeSignatures).where(eq(schema.safeSignatures.proposalId, id)).orderBy(asc(schema.safeSignatures.createdAt)),
        db.select().from(schema.executions).where(eq(schema.executions.proposalId, id)).orderBy(asc(schema.executions.submittedAt)),
        loadOrgState(db, m.organizationId, deps.now()),
      ]);
      const [proposer] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, p.proposerId));
      const action = actionFromJson(p.action as ActionJson);
      const live = validateAction(action, validationContext(state, action));
      const ev = evaluateApprovals({ policy: state.approvalPolicy, amountUsd: parseDecimal(p.amountUsd), proposerId: p.proposerId, createdAt: Math.floor(p.createdAt.getTime() / 1000), nowSec: state.nowSec, records: approvalRecords(approvalRows.map((r) => r.a)), cancelled: p.status === "cancelled" });
      const account = state.accountRows.find((a) => a.id === p.accountId);
      const you = canApprove({ role: m.role, memberId: user.id, proposerId: p.proposerId, policy: state.approvalPolicy });
      const myDecision = approvalRows.find((r) => r.a.userId === user.id)?.a.decision ?? null;
      return send(c, {
        id: p.id,
        title: p.title,
        kind: p.kind,
        status: p.status,
        amountUsd: p.amountUsd,
        chainId: p.chainId,
        action: p.action,
        createdAt: p.createdAt.toISOString(),
        expiresAt: p.expiresAt.toISOString(),
        proposer: { id: p.proposerId, name: proposer?.name ?? "", isYou: p.proposerId === user.id },
        recommendationId: p.recommendationId,
        isSample: state.isSample,
        account: account ? { id: account.id, label: account.label, address: account.address, chainId: account.chainId, safeThreshold: account.safeThreshold, safeOwners: account.safeOwners ?? [], safeVersion: account.safeVersion, verified: !!account.verifiedAt } : null,
        validationAtCreation: p.validation,
        validationNow: validationDto(live),
        approval: { state: ev.state, requiredApprovals: ev.requiredApprovals, approvals: ev.approvals, remaining: ev.remaining, roleRequirementMet: ev.roleRequirementMet, requiredRole: ev.tier.requiredRole, needs: ev.needs, expiresAt: new Date(ev.expiresAt * 1000).toISOString() },
        you: { canApprove: you.allowed && p.status === "pending_approval" && !myDecision, reason: myDecision ? `You already ${myDecision === "approve" ? "approved" : "rejected"} this proposal` : you.reason, decision: myDecision, canCreate: ["owner", "admin", "finance"].includes(m.role) },
        approvals: approvalRows.map((r) => ({ id: r.a.id, user: r.name || r.email, role: r.a.role, decision: r.a.decision, comment: r.a.comment, at: r.a.createdAt.toISOString() })),
        comments: comments.map((r) => ({ id: r.c.id, user: r.name, body: r.c.body, at: r.c.createdAt.toISOString() })),
        safeTx: p.safeTx,
        safeTxHash: p.safeTxHash,
        simulation: p.simulation,
        signatures: sigs.map((s) => ({ signer: s.signer, at: s.createdAt.toISOString() })),
        executions: execs.map((e) => ({ txHash: e.txHash, status: e.status, submittedAt: e.submittedAt.toISOString(), blockNumber: e.blockNumber?.toString() ?? null, safeSuccess: e.safeSuccess, explorer: explorerTx(e.chainId, e.txHash) })),
      });
    },
  );

  // --- Internal approval ----------------------------------------------------------

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/proposals/{id}/decision",
      tags,
      summary: "Approve or reject (internal approval; not a Safe signature)",
      request: { params: orgParams.extend({ id: Id }), ...body(z.object({ decision: z.enum(["approve", "reject"]), comment: z.string().trim().max(1000).optional() })) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "proposals.approve");
      const { id } = c.req.valid("param");
      const { decision, comment } = c.req.valid("json");
      if (decision === "reject" && !comment) throw badRequest("comment_required", "Explain why you are rejecting so the proposer can act on it.");
      const p = await getProposal(m.organizationId, id);
      const state = await loadOrgState(db, m.organizationId, deps.now());
      const allowed = canApprove({ role: m.role, memberId: user.id, proposerId: p.proposerId, policy: state.approvalPolicy });
      if (!allowed.allowed) throw new ApiError(403, "cannot_approve", allowed.reason);
      if (p.status !== "pending_approval") throw conflict("not_pending", `This proposal is ${p.status.replace(/_/g, " ")} and no longer accepts decisions.`);
      if (p.expiresAt <= deps.now()) throw conflict("expired", "This proposal expired before it was fully approved.");
      const [prior] = await db.select().from(schema.approvals).where(and(eq(schema.approvals.proposalId, id), eq(schema.approvals.userId, user.id))).limit(1);
      if (prior) throw conflict("already_decided", "You have already recorded a decision on this proposal.");

      const result = await db
        .transaction(async (tx) => {
          // Serialize decisions on this proposal: concurrent requests (the same member twice, or two members
          // completing the tier together) are evaluated one after another against committed rows.
          const [locked] = await tx
            .select({ status: schema.proposals.status, expiresAt: schema.proposals.expiresAt })
            .from(schema.proposals)
            .where(eq(schema.proposals.id, id))
            .for("update");
          if (!locked || locked.status !== "pending_approval")
            throw conflict("not_pending", `This proposal is ${(locked?.status ?? "gone").replace(/_/g, " ")} and no longer accepts decisions.`);
          if (locked.expiresAt <= deps.now()) throw conflict("expired", "This proposal expired before it was fully approved.");
          const [again] = await tx
            .select({ id: schema.approvals.id })
            .from(schema.approvals)
            .where(and(eq(schema.approvals.proposalId, id), eq(schema.approvals.userId, user.id)))
            .limit(1);
          if (again) throw conflict("already_decided", "You have already recorded a decision on this proposal.");
          await tx
            .insert(schema.approvals)
            .values({ organizationId: m.organizationId, proposalId: id, userId: user.id, role: m.role, decision, comment: comment ?? null });
          const rows = await tx.select().from(schema.approvals).where(eq(schema.approvals.proposalId, id));
          const ev = evaluateApprovals({
            policy: state.approvalPolicy,
            amountUsd: parseDecimal(p.amountUsd),
            proposerId: p.proposerId,
            createdAt: Math.floor(p.createdAt.getTime() / 1000),
            nowSec: state.nowSec,
            records: approvalRecords(rows),
          });
          if (ev.state === "approved") await setStatus(tx, id, ["pending_approval"], "approved");
          if (ev.state === "rejected") await setStatus(tx, id, ["pending_approval"], "rejected");
          await audit(tx, {
            organizationId: m.organizationId,
            actorUserId: user.id,
            action: decision === "approve" ? "proposal.approved" : "proposal.rejected",
            targetType: "proposal",
            targetId: id,
            data: { title: p.title, comment, state: ev.state, approvals: ev.approvals, required: ev.requiredApprovals },
            ...clientInfo(c),
          });
          return ev;
        })
        .catch((err) => {
          if (isUniqueViolation(err, "approvals_proposal_user_uq")) throw conflict("already_decided", "You have already recorded a decision on this proposal.");
          throw err;
        });
      if (result.state === "approved") {
        await notifyRoles(deps, m.organizationId, ["owner", "admin", "finance", "approver"], { kind: "proposal.approved", title: `Approved: ${p.title}`, body: "Internal approval is complete. Safe owners can now prepare and sign the transaction.", link: `/app/approvals/${id}`, dedupeKey: `proposal:${id}:approved` });
      } else if (result.state === "rejected") {
        await notifyRoles(deps, m.organizationId, ["owner", "admin", "finance"], { kind: "proposal.rejected", title: `Rejected: ${p.title}`, body: comment ?? "", link: `/app/approvals/${id}`, dedupeKey: `proposal:${id}:rejected` });
      }
      return send(c, { state: result.state, needs: result.needs });
    },
  );

  app.openapi(
    createRoute({ method: "post", path: "/api/v1/orgs/{orgId}/proposals/{id}/comments", tags, summary: "Comment on a proposal", request: { params: orgParams.extend({ id: Id }), ...body(z.object({ body: z.string().trim().min(1).max(2000) })) }, responses: { 201: json(z.object({ id: z.string() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const { id } = c.req.valid("param");
      await getProposal(m.organizationId, id);
      const [row] = await db.insert(schema.proposalComments).values({ organizationId: m.organizationId, proposalId: id, userId: user.id, body: c.req.valid("json").body }).returning({ id: schema.proposalComments.id });
      await audit(db, { organizationId: m.organizationId, actorUserId: user.id, action: "proposal.commented", targetType: "proposal", targetId: id, ...clientInfo(c) });
      return c.json({ id: row!.id }, 201);
    },
  );

  app.openapi(
    createRoute({ method: "post", path: "/api/v1/orgs/{orgId}/proposals/{id}/cancel", tags, summary: "Cancel a proposal that has not been submitted on-chain", request: { params: orgParams.extend({ id: Id }), ...body(z.object({ reason: z.string().trim().min(3).max(500) })) }, responses: { 200: json(z.object({ ok: z.boolean() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      const { id } = c.req.valid("param");
      const p = await getProposal(m.organizationId, id);
      if (p.proposerId !== user.id && !["owner", "admin"].includes(m.role)) throw new ApiError(403, "forbidden", "Only the proposer or an admin can cancel this proposal");
      await db.transaction(async (tx) => {
        await setStatus(tx, id, ["pending_approval", "approved", "awaiting_signatures", "ready_to_execute", "stale"], "cancelled");
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "proposal.cancelled", targetType: "proposal", targetId: id, data: { reason: c.req.valid("json").reason, previousStatus: p.status }, ...clientInfo(c) });
      });
      return c.json({ ok: true }, 200);
    },
  );

  // --- Cryptographic authorization (Safe signatures) -----------------------------

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/proposals/{id}/prepare",
      tags,
      summary: "Build and simulate the Safe transaction owners will sign",
      description: "Re-validates the action with fresh data, reads the Safe live (version, owners, threshold, nonce), builds calldata from code-defined addresses only, computes the EIP-712 safeTxHash and simulates it via Safe's simulateAndRevert. Changing the nonce or calldata invalidates previous signatures.",
      request: { params: orgParams.extend({ id: Id }) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "proposals.sign");
      const { id } = c.req.valid("param");
      const p = await getProposal(m.organizationId, id);
      const state = await loadOrgState(db, m.organizationId, deps.now());
      requireExecutionAllowed(state);
      if (!["approved", "awaiting_signatures", "stale"].includes(p.status)) throw conflict("not_approved", "The transaction can be prepared only after internal approval is complete.");
      const action = actionFromJson(p.action as ActionJson);
      const live = validateAction(action, validationContext(state, action));
      if (!live.valid) throw new ApiError(422, "policy_check_failed", "The action no longer passes every policy check with current data. Create a new proposal from fresh figures.", validationDto(live));
      const { safe } = await liveSafe(state, p.accountId);
      const client = deps.clientFor(safe.chainId)!;
      let built;
      try {
        built = await buildSafeTxForAction({ client, chainId: safe.chainId, safe, action, venueIdForPosition: action.type === "withdraw" ? state.positions.find((x) => x.id === action.positionId)?.venueId : undefined });
      } catch (err) {
        if (err instanceof BuildError) throw unprocessable("cannot_build", err.message);
        throw err;
      }
      const meta = { to: built.safeTx.to, value: built.safeTx.value, data: built.safeTx.data, operation: built.safeTx.operation };
      const sim = await simulateSafeTransaction(client, safe.address, meta, { version: safe.version });
      const simulation = { success: sim.success, gasUsed: sim.gasUsed.toString(), error: sim.error, accessor: sim.accessor, at: deps.now().toISOString(), blockNumber: safe.blockNumber.toString() };
      await db.transaction(async (tx) => {
        // A re-prepare with a new nonce or calldata invalidates previous signatures (different safeTxHash).
        await tx
          .update(schema.proposals)
          .set({ safeTx: { ...safeTxToJson(built.safeTx), calls: built.calls, typedData: JSON.parse(JSON.stringify(built.typedData, (_k, v) => (typeof v === "bigint" ? v.toString() : v))), safeVersion: safe.version, safeAddress: safe.address, threshold: safe.threshold, owners: safe.owners }, safeTxHash: built.safeTxHash, simulation, status: sim.success ? "awaiting_signatures" : p.status === "stale" ? "stale" : "approved" })
          .where(and(eq(schema.proposals.id, id), inArray(schema.proposals.status, ["approved", "awaiting_signatures", "stale"])));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "proposal.prepared", targetType: "proposal", targetId: id, data: { safeTxHash: built.safeTxHash, nonce: safe.nonce.toString(), simulation }, ...clientInfo(c) });
      });
      if (!sim.success) throw unprocessable("simulation_failed", `Simulation failed: ${sim.error}. Nothing was signed or sent.`, simulation);
      return send(c, { safeTxHash: built.safeTxHash, calls: built.calls, simulation, nonce: safe.nonce.toString(), threshold: safe.threshold, owners: safe.owners });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/proposals/{id}/signatures",
      tags,
      summary: "Submit a Safe owner's signature over the safeTxHash",
      description: "The signer is recovered from the signature and must be a current owner of the Safe (read on-chain). TokenIQ stores the signature; it never holds keys.",
      request: { params: orgParams.extend({ id: Id }), ...body(z.object({ signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/, "Expected a 65-byte hex signature") })) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "proposals.sign");
      const { id } = c.req.valid("param");
      const p = await getProposal(m.organizationId, id);
      if (p.status !== "awaiting_signatures" && p.status !== "ready_to_execute") throw conflict("not_signable", "This proposal is not collecting signatures.");
      if (!p.safeTxHash || !p.safeTx) throw conflict("not_prepared", "Prepare the transaction first.");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      requireExecutionAllowed(state);
      const recovered = await recoverSafeSigner(p.safeTxHash as Hex, c.req.valid("json").signature as Hex);
      if (!recovered.ok) throw unprocessable("unsupported_signature", recovered.reason);
      const { safe } = await liveSafe(state, p.accountId);
      const stored = safeTxFromJson(p.safeTx as SafeTxJson);
      if (safe.nonce !== stored.nonce) {
        await setStatus(db, id, ["awaiting_signatures", "ready_to_execute"], "stale");
        throw conflict("nonce_moved", "Another transaction used this Safe nonce first. Prepare the transaction again; earlier signatures no longer apply.");
      }
      if (!safe.owners.some((o) => isAddressEqual(o, recovered.signer))) throw unprocessable("not_an_owner", `${recovered.signer} is not a current owner of this Safe.`);
      await db.insert(schema.safeSignatures).values({ organizationId: m.organizationId, proposalId: id, safeTxHash: p.safeTxHash, signer: getAddress(recovered.signer), signature: recovered.signature, submittedBy: user.id }).onConflictDoNothing();
      const sigs = await db.select().from(schema.safeSignatures).where(and(eq(schema.safeSignatures.proposalId, id), eq(schema.safeSignatures.safeTxHash, p.safeTxHash)));
      const validOwners = sigs.filter((s) => safe.owners.some((o) => isAddressEqual(o, s.signer as `0x${string}`)));
      const ready = validOwners.length >= safe.threshold;
      if (ready && p.status === "awaiting_signatures") await setStatus(db, id, ["awaiting_signatures"], "ready_to_execute");
      await audit(db, { organizationId: m.organizationId, actorUserId: user.id, action: "proposal.signed", targetType: "proposal", targetId: id, data: { signer: recovered.signer, signatures: validOwners.length, threshold: safe.threshold }, ...clientInfo(c) });
      return send(c, { signer: recovered.signer, signatures: validOwners.length, threshold: safe.threshold, ready });
    },
  );

  // --- On-chain execution -----------------------------------------------------------

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/proposals/{id}/execution-data",
      tags,
      summary: "Calldata for execTransaction with collected signatures (any wallet may submit it)",
      request: { params: orgParams.extend({ id: Id }) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      assertCan(m.role, "proposals.execute");
      const { id } = c.req.valid("param");
      const p = await getProposal(m.organizationId, id);
      if (p.status !== "ready_to_execute") throw conflict("not_ready", "The proposal does not have enough owner signatures yet.");
      const state = await loadOrgState(db, m.organizationId, deps.now());
      requireExecutionAllowed(state);
      const action = actionFromJson(p.action as ActionJson);
      const live = validateAction(action, validationContext(state, action));
      if (!live.valid) throw new ApiError(422, "policy_check_failed", "Conditions changed and the action no longer passes policy. Do not execute; cancel and re-propose.", validationDto(live));
      const { safe } = await liveSafe(state, p.accountId);
      const stored = safeTxFromJson(p.safeTx as SafeTxJson);
      if (safe.nonce !== stored.nonce) {
        await setStatus(db, id, ["ready_to_execute"], "stale");
        throw conflict("nonce_moved", "Another transaction used this Safe nonce first. Prepare and sign again.");
      }
      const sigs = await db.select().from(schema.safeSignatures).where(and(eq(schema.safeSignatures.proposalId, id), eq(schema.safeSignatures.safeTxHash, p.safeTxHash!)));
      const owned = sigs.filter((s) => safe.owners.some((o) => isAddressEqual(o, s.signer as `0x${string}`)));
      if (owned.length < safe.threshold) throw conflict("threshold_changed", `The Safe now needs ${safe.threshold} signatures; ${owned.length} valid owner signatures are collected.`);
      const signatures = encodeSafeSignatures(owned.slice(0, safe.threshold).map((s) => ({ signer: s.signer, signature: s.signature as Hex })));
      const client = deps.clientFor(safe.chainId)!;
      const sim = await simulateSafeTransaction(client, safe.address, { to: stored.to, value: stored.value, data: stored.data, operation: stored.operation }, { version: safe.version });
      if (!sim.success) throw unprocessable("simulation_failed", `A fresh simulation fails: ${sim.error}. Do not submit this transaction.`);
      return send(c, { chainId: safe.chainId, to: safe.address, data: buildExecTransactionData(stored, signatures), value: "0", simulation: { success: true, gasUsed: sim.gasUsed.toString() } });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/proposals/{id}/executions",
      tags,
      summary: "Record a submitted execution transaction hash for tracking",
      description: "Submitting is not success: the proposal becomes `submitted` and a background job tracks the receipt, the Safe's ExecutionSuccess/ExecutionFailure event and confirmations.",
      request: { params: orgParams.extend({ id: Id }), ...body(z.object({ txHash: TxHash })) },
      responses: { 200: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "proposals.execute");
      const { id } = c.req.valid("param");
      const { txHash } = c.req.valid("json");
      const p = await getProposal(m.organizationId, id);
      if (!["ready_to_execute", "submitted", "failed"].includes(p.status)) throw conflict("not_ready", "This proposal is not ready to execute.");
      await db.transaction(async (tx) => {
        await tx.insert(schema.executions).values({ organizationId: m.organizationId, proposalId: id, chainId: p.chainId, txHash: txHash.toLowerCase(), status: "submitted", submittedBy: user.id }).onConflictDoNothing();
        await tx.update(schema.proposals).set({ status: "submitted" }).where(and(eq(schema.proposals.id, id), inArray(schema.proposals.status, ["ready_to_execute", "submitted", "failed"])));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "proposal.submitted", targetType: "proposal", targetId: id, data: { txHash }, ...clientInfo(c) });
      });
      await deps.boss?.send("track-execution", { proposalId: id }, { singletonKey: id, singletonSeconds: 5 }).catch(() => undefined);
      return send(c, { status: "submitted", explorer: explorerTx(p.chainId, txHash) });
    },
  );

  async function expireStale(orgId: string) {
    await db
      .update(schema.proposals)
      .set({ status: "expired" })
      .where(and(eq(schema.proposals.organizationId, orgId), eq(schema.proposals.status, "pending_approval"), sql`${schema.proposals.expiresAt} <= ${deps.now()}`));
  }
}
