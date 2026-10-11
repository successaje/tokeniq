import { createRoute, z } from "@hono/zod-openapi";
import { chainName, explorerTx, findTokenBySymbol, verifyErc20Transfer } from "@tokeniq/chain";
import { addDays, dueDatesBetween, fromWad, parseDecimal } from "@tokeniq/core";
import { and, desc, eq, schema } from "@tokeniq/db";
import { getAddress, type Hex } from "viem";
import type { App, Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { assertCan } from "../lib/authz.js";
import { badRequest, conflict, isUniqueViolation, notFound, unavailable, unprocessable } from "../lib/errors.js";
import { body, clientInfo, errors, Id, IsoDateString, json, orgParams, requireUser, send, TxHash } from "../lib/route.js";
import { obligationFromRow } from "../services/state.js";

const tags = ["Payments"];

type PaymentRow = typeof schema.payments.$inferSelect;

function paymentDto(p: PaymentRow, title?: string) {
  return {
    id: p.id,
    obligationId: p.obligationId,
    title: title ?? null,
    dueDate: p.dueDate,
    status: p.status,
    amount: p.amount,
    assetSymbol: p.assetSymbol,
    tokenAmountRaw: p.tokenAmountRaw,
    chainId: p.chainId,
    chain: p.chainId ? chainName(p.chainId) : null,
    txHash: p.txHash,
    explorer: p.chainId && p.txHash ? explorerTx(p.chainId, p.txHash) : null,
    fromAddress: p.fromAddress,
    toAddress: p.toAddress,
    verifiedAt: p.verifiedAt?.toISOString() ?? null,
    verification: p.verification,
    note: p.note,
    createdAt: p.createdAt.toISOString(),
  };
}

/**
 * Minimum token amount a transfer must carry to settle the obligation. Amounts are checked 1:1 when the
 * token is pegged to the obligation's currency (USD obligations in USD stablecoins, EUR obligations in
 * EUR stablecoins); other combinations verify the recipient and token but not the amount.
 */
export function minimumPaymentRaw(ob: { currency: string; amount: string }, token: { decimals: number; pegCurrency?: string }): bigint | undefined {
  if (!token.pegCurrency || token.pegCurrency !== ob.currency) return undefined;
  return fromWad(parseDecimal(ob.amount), token.decimals, "up");
}

/**
 * Verify a payment transaction against the obligation: the configured asset was
 * transferred to the recorded recipient for at least the obligation amount (see minimumPaymentRaw).
 */
async function verifyPayment(deps: Deps, ob: typeof schema.obligations.$inferSelect, input: { chainId: number; txHash: string; assetSymbol: string }) {
  const client = deps.clientFor(input.chainId);
  if (!client) throw unavailable("chain_unavailable", "No RPC connection is configured for this network.");
  if (!ob.recipientAddress) throw unprocessable("no_recipient", "Add the recipient's address to the obligation so TokenIQ can check the transfer on-chain.");
  const token = findTokenBySymbol(input.chainId, input.assetSymbol);
  if (!token || token.address === "native")
    throw badRequest("unsupported_asset", `${input.assetSymbol} on ${chainName(input.chainId)} is not a supported payment asset.`);
  const minAmountRaw = minimumPaymentRaw(ob, token);
  const amountChecked = minAmountRaw !== undefined;
  const result = await verifyErc20Transfer(client, {
    chainId: input.chainId,
    txHash: input.txHash as Hex,
    token: token.address,
    to: ob.recipientAddress,
    ...(minAmountRaw ? { minAmountRaw } : {}),
  });
  return { result, token, amountChecked };
}

/** Map unique violations to clear conflicts: one record per occurrence, and one on-chain transfer per occurrence. */
function settlementConflict(err: unknown) {
  if (isUniqueViolation(err, "payments_transfer_uq"))
    return conflict("transfer_already_used", "That on-chain transfer already settles another obligation payment. Each transfer can settle one occurrence.");
  if (isUniqueViolation(err, "payments_obligation_due_uq")) return conflict("already_settled", "This occurrence is already recorded.");
  return err;
}

export function registerPayments(app: App, deps: Deps) {
  const { db } = deps;

  app.openapi(
    createRoute({ method: "get", path: "/api/v1/orgs/{orgId}/payments", tags, summary: "Recorded payments (newest due date first)", request: { params: orgParams }, responses: { 200: json(z.any()), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const rows = await db.select({ p: schema.payments, title: schema.obligations.title }).from(schema.payments).innerJoin(schema.obligations, eq(schema.obligations.id, schema.payments.obligationId)).where(eq(schema.payments.organizationId, m.organizationId)).orderBy(desc(schema.payments.dueDate)).limit(500);
      return send(c, { payments: rows.map((r) => paymentDto(r.p, r.title)) });
    },
  );

  app.openapi(
    createRoute({
      method: "post",
      path: "/api/v1/orgs/{orgId}/payments",
      tags,
      summary: "Record an obligation occurrence as paid (optionally verified on-chain) or skipped",
      description:
        "With a transaction hash, TokenIQ decodes the receipt's Transfer logs: `paid_verified` requires the asset to reach the obligation's recipient (and, for USD obligations paid in USD stablecoins, at least the obligation amount) with enough confirmations. Without a hash the payment is recorded as `paid_unverified` (someone says it was paid).",
      request: {
        params: orgParams,
        ...body(
          z.object({
            obligationId: Id,
            dueDate: IsoDateString,
            status: z.enum(["paid", "skipped"]),
            txHash: TxHash.optional(),
            chainId: z.number().int().optional(),
            assetSymbol: z.string().max(16).optional(),
            note: z.string().trim().max(1000).optional(),
          }),
        ),
      },
      responses: { 201: json(z.any()), ...errors },
    }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "payments.record");
      const input = c.req.valid("json");
      const [ob] = await db.select().from(schema.obligations).where(and(eq(schema.obligations.id, input.obligationId), eq(schema.obligations.organizationId, m.organizationId))).limit(1);
      if (!ob) throw notFound("Obligation");
      const occurs = dueDatesBetween(obligationFromRow(ob), addDays(input.dueDate, -1), addDays(input.dueDate, 1)).some((d) => d.date === input.dueDate);
      if (!occurs) throw badRequest("no_such_occurrence", `This obligation has no payment due on ${input.dueDate}.`);
      const [already] = await db.select({ id: schema.payments.id, status: schema.payments.status }).from(schema.payments).where(and(eq(schema.payments.obligationId, ob.id), eq(schema.payments.dueDate, input.dueDate))).limit(1);
      if (already) throw conflict("already_settled", `This occurrence is already recorded as ${already.status.replace(/_/g, " ")}.`);

      let status: "paid_verified" | "paid_unverified" | "skipped" = input.status === "skipped" ? "skipped" : "paid_unverified";
      let verification: Record<string, unknown> | null = null;
      let extra: Partial<PaymentRow> = {};
      if (input.status === "paid" && input.txHash) {
        if (!input.chainId) throw badRequest("chain_required", "Choose the network the payment was sent on.");
        const assetSymbol = input.assetSymbol ?? ob.paymentAsset ?? "USDC";
        const { result, token, amountChecked } = await verifyPayment(deps, ob, { chainId: input.chainId, txHash: input.txHash, assetSymbol });
        if (result.status === "mismatch" || result.status === "reverted" || result.status === "not_found") {
          throw unprocessable(`transfer_${result.status}`, result.status === "not_found" ? "That transaction was not found on this network. Check the hash and network." : result.status === "reverted" ? "That transaction reverted, so no payment was made." : `The transaction does not contain a matching transfer: ${result.reason}`, { status: result.status, reason: result.reason });
        }
        verification = { status: result.status, reason: result.reason, confirmations: result.confirmations, requiredConfirmations: result.requiredConfirmations, amountChecked, matched: result.matched ? { from: result.matched.from, to: result.matched.to, amountRaw: result.matched.amountRaw.toString(), logIndex: result.matched.logIndex } : null };
        status = result.status === "verified" ? "paid_verified" : "paid_unverified";
        extra = {
          chainId: input.chainId,
          txHash: input.txHash.toLowerCase(),
          assetSymbol: token.symbol,
          tokenAmountRaw: result.matched?.amountRaw.toString() ?? null,
          transferLogIndex: result.matched?.logIndex ?? null,
          fromAddress: result.matched?.from.toLowerCase() ?? null,
          toAddress: result.matched?.to.toLowerCase() ?? (ob.recipientAddress ? getAddress(ob.recipientAddress).toLowerCase() : null),
          verifiedAt: result.status === "verified" ? deps.now() : null,
        };
      }
      const [row] = await db
        .transaction(async (tx) => {
          const r = await tx
            .insert(schema.payments)
            .values({
              organizationId: m.organizationId,
              obligationId: ob.id,
              dueDate: input.dueDate,
              status,
              amount: ob.currency === "USD" ? ob.amount : null,
              verification,
              note: input.note ?? null,
              recordedBy: user.id,
              ...extra,
            })
            .returning();
          if (ob.recurrence && (ob.recurrence as { freq: string }).freq === "once" && status !== "skipped")
            await tx.update(schema.obligations).set({ status: "completed" }).where(eq(schema.obligations.id, ob.id));
          await audit(tx, {
            organizationId: m.organizationId,
            actorUserId: user.id,
            action: `payment.${status}`,
            targetType: "obligation",
            targetId: ob.id,
            data: { title: ob.title, dueDate: input.dueDate, txHash: input.txHash ?? null, chainId: input.chainId ?? null, verification },
            ...clientInfo(c),
          });
          return r;
        })
        .catch((err) => {
          throw settlementConflict(err);
        });
      await deps.boss?.send("evaluate-org", { orgId: m.organizationId }, { singletonKey: m.organizationId, singletonSeconds: 30 }).catch(() => undefined);
      return send(c, { payment: paymentDto(row!, ob.title) }, 201);
    },
  );

  app.openapi(
    createRoute({ method: "post", path: "/api/v1/orgs/{orgId}/payments/{id}/verify", tags, summary: "Re-check an unverified payment on-chain", request: { params: orgParams.extend({ id: Id }) }, responses: { 200: json(z.any()), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "payments.record");
      const { id } = c.req.valid("param");
      const [p] = await db.select().from(schema.payments).where(and(eq(schema.payments.id, id), eq(schema.payments.organizationId, m.organizationId))).limit(1);
      if (!p) throw notFound("Payment");
      if (p.status === "paid_verified") return send(c, { payment: paymentDto(p) });
      if (!p.txHash || !p.chainId) throw unprocessable("no_transaction", "This payment has no transaction hash to verify. Record the hash to verify it.");
      const [ob] = await db.select().from(schema.obligations).where(eq(schema.obligations.id, p.obligationId));
      const { result, amountChecked } = await verifyPayment(deps, ob!, { chainId: p.chainId, txHash: p.txHash, assetSymbol: p.assetSymbol ?? "USDC" });
      const verification = { status: result.status, reason: result.reason, confirmations: result.confirmations, requiredConfirmations: result.requiredConfirmations, amountChecked };
      const [row] = await db
        .update(schema.payments)
        .set({
          verification,
          status: result.status === "verified" ? "paid_verified" : p.status,
          verifiedAt: result.status === "verified" ? deps.now() : null,
          transferLogIndex: result.matched?.logIndex ?? p.transferLogIndex,
        })
        .where(eq(schema.payments.id, id))
        .returning()
        .catch((err) => {
          throw settlementConflict(err);
        });
      if (result.status === "verified")
        await audit(db, {
          organizationId: m.organizationId,
          actorUserId: user.id,
          action: "payment.paid_verified",
          targetType: "obligation",
          targetId: p.obligationId,
          data: { txHash: p.txHash },
          ...clientInfo(c),
        });
      return send(c, { payment: paymentDto(row!) });
    },
  );

  app.openapi(
    createRoute({ method: "delete", path: "/api/v1/orgs/{orgId}/payments/{id}", tags, summary: "Undo a payment record that is not verified on-chain", request: { params: orgParams.extend({ id: Id }), ...body(z.object({ reason: z.string().trim().min(3).max(500) })) }, responses: { 200: json(z.object({ ok: z.boolean() })), ...errors } }),
    async (c) => {
      const m = c.get("member");
      const user = requireUser(c);
      assertCan(m.role, "payments.record");
      const { id } = c.req.valid("param");
      const [p] = await db.select().from(schema.payments).where(and(eq(schema.payments.id, id), eq(schema.payments.organizationId, m.organizationId))).limit(1);
      if (!p) throw notFound("Payment");
      if (p.status === "paid_verified") throw conflict("verified_payment", "Payments verified on-chain cannot be undone.");
      await db.transaction(async (tx) => {
        await tx.delete(schema.payments).where(eq(schema.payments.id, id));
        await audit(tx, { organizationId: m.organizationId, actorUserId: user.id, action: "payment.undone", targetType: "obligation", targetId: p.obligationId, data: { dueDate: p.dueDate, previousStatus: p.status, reason: c.req.valid("json").reason }, ...clientInfo(c) });
      });
      return c.json({ ok: true }, 200);
    },
  );
}
