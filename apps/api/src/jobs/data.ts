import { fetchAaveOpportunities, fetchMorphoVaults, findTokenBySymbol, isListed, readFeeds, readSafeExecution, readSequencerStatus, SUPPORTED_CHAINS, TOKENS, type PriceFeedRef } from "@tokeniq/chain";
import type { Opportunity } from "@tokeniq/core";
import { and, eq, isNull, schema, sql } from "@tokeniq/db";
import type { PgBoss } from "pg-boss";
import type { Hex } from "viem";
import type { Deps } from "../context.js";
import { audit } from "../lib/audit.js";
import { opportunityToJson } from "../services/dto.js";
import { notifyRoles } from "../services/notify.js";
import { recordProviderResult } from "../services/providers.js";
import { syncAccount } from "../services/sync.js";
import { EVALUATE_ORG } from "./evaluate.js";

export const SYNC_ALL = "sync-all-accounts";
export const SYNC_ACCOUNT = "sync-account";
export const REFRESH_PRICES = "refresh-prices";
export const REFRESH_OPPORTUNITIES = "refresh-opportunities";
export const TRACK_EXECUTION = "track-execution";
export const TRACK_ALL_EXECUTIONS = "track-all-executions";

/** EUR/USD feeds used to convert EUR obligations (verified in docs/research/integration-facts.md). */
export const FX_FEEDS: Array<PriceFeedRef & { chainId: number }> = [
  { chainId: 1, address: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1", pair: "EUR / USD", decimals: 8, heartbeatSec: 86400 },
  { chainId: 8453, address: "0xc91D87E81faB8f93699ECf7Ee9B44D11e1D53F0F", pair: "EUR / USD", decimals: 8, heartbeatSec: 3600 },
];

/** Read every configured Chainlink feed and L2 sequencer status; store observations idempotently by round. */
export async function refreshPrices(deps: Deps) {
  for (const chain of SUPPORTED_CHAINS) {
    const client = deps.clientFor(chain.id);
    if (!client) continue;
    const feeds = new Map<string, PriceFeedRef>();
    for (const t of TOKENS.filter((x) => x.chainId === chain.id && x.feed)) feeds.set(t.feed!.address.toLowerCase(), t.feed!);
    for (const f of FX_FEEDS.filter((x) => x.chainId === chain.id)) feeds.set(f.address.toLowerCase(), f);
    if (feeds.size === 0) continue;
    const started = Date.now();
    try {
      const reads = await readFeeds(client, [...feeds.values()]);
      for (const r of reads) {
        if (!r.ok) continue;
        await deps.db
          .insert(schema.priceObservations)
          .values({ chainId: chain.id, feed: r.feed.address, pair: r.feed.pair, answer: r.answer.toString(), decimals: r.decimals, roundId: r.roundId.toString(), updatedAt: new Date(Number(r.updatedAt) * 1000) })
          .onConflictDoNothing();
      }
      const failed = reads.filter((r) => !r.ok);
      await recordProviderResult(deps, `chainlink:${chain.id}`, failed.length === 0, Date.now() - started, failed.length ? `${failed.length} feed read(s) failed` : undefined);
      if (chain.isL2 && !chain.testnet) {
        const seq = await readSequencerStatus(client, chain.id);
        await recordProviderResult(deps, `sequencer:${chain.id}`, seq.pricesUsable, 0, seq.pricesUsable ? undefined : seq.up ? "Sequencer recovered recently (grace period)" : "Sequencer is down");
      }
    } catch (err) {
      await recordProviderResult(deps, `chainlink:${chain.id}`, false, Date.now() - started, (err as Error).message.split("\n")[0]);
    }
  }
}

/** Refresh venue data. Listing is always decided by code (isListed), never by the data source. */
export async function refreshOpportunities(deps: Deps) {
  const nowSec = Math.floor(deps.now().getTime() / 1000);
  const collected: Opportunity[] = [];
  const morphoStarted = Date.now();
  const morpho = await fetchMorphoVaults({ chainIds: [8453, 1], assetSymbols: ["USDC"], minTvlUsd: 10_000_000, nowSec });
  if (morpho.ok) {
    collected.push(...morpho.opportunities);
    await recordProviderResult(deps, "morpho-api", true, Date.now() - morphoStarted);
  } else {
    await recordProviderResult(deps, "morpho-api", false, Date.now() - morphoStarted, `${morpho.error.kind}: ${morpho.error.message}`);
  }
  const aaveStarted = Date.now();
  const mainnets = new Map([...deps.clients].filter(([id]) => [1, 8453, 42161, 10].includes(id)));
  const aave = await fetchAaveOpportunities(mainnets, { assets: ["USDC"], nowSec });
  collected.push(...aave.opportunities);
  await recordProviderResult(deps, "aave-onchain", aave.errors.length === 0, Date.now() - aaveStarted, aave.errors.length ? aave.errors.map((e) => `${e.chainId}: ${e.error}`).join("; ") : undefined);

  for (const opp of collected) {
    const listed = isListed(opp.id);
    const o = { ...opp, listed };
    const fetchedAt = new Date(o.source.fetchedAt * 1000);
    await deps.db
      .insert(schema.opportunities)
      .values({ id: o.id, protocol: o.protocol, chainId: o.chainId, address: o.address.toLowerCase(), name: o.name, assetSymbol: o.asset.symbol, listed, data: opportunityToJson(o), fetchedAt })
      .onConflictDoUpdate({ target: schema.opportunities.id, set: { name: o.name, listed, data: opportunityToJson(o), fetchedAt, updatedAt: deps.now() } });
    await deps.db
      .insert(schema.opportunitySnapshots)
      .values({ opportunityId: o.id, netApyBps: o.apy.netBps, tvlUsd: opportunityToJson(o).tvlUsd, liquidityUsd: opportunityToJson(o).availableLiquidityUsd, fetchedAt })
      .onConflictDoNothing();
  }
  return { count: collected.length, morphoOk: morpho.ok, aaveErrors: aave.errors.length };
}

/**
 * Track a submitted execution: receipt status, the Safe's ExecutionSuccess /
 * ExecutionFailure event and confirmations. Moves the proposal forward only;
 * on success the account is re-synced so balances reconcile with the execution.
 */
export async function trackExecution(deps: Deps, proposalId: string) {
  const [p] = await deps.db.select().from(schema.proposals).where(eq(schema.proposals.id, proposalId)).limit(1);
  if (!p || p.status !== "submitted") return;
  const execs = await deps.db.select().from(schema.executions).where(and(eq(schema.executions.proposalId, proposalId), eq(schema.executions.status, "submitted")));
  const [account] = await deps.db.select().from(schema.treasuryAccounts).where(eq(schema.treasuryAccounts.id, p.accountId));
  const client = deps.clientFor(p.chainId);
  if (!client || !account) return;
  for (const e of execs) {
    const r = await readSafeExecution(client, { txHash: e.txHash as Hex, safe: account.address, safeTxHash: (p.safeTxHash ?? undefined) as Hex | undefined });
    if (r.status !== "mined") continue;
    const succeeded = r.success === true && r.safeSuccess === true;
    const chainConfirmations = SUPPORTED_CHAINS.find((c) => c.id === p.chainId)?.confirmations ?? 3;
    if (succeeded && r.confirmations < chainConfirmations) continue; // wait for finality depth
    await deps.db.transaction(async (tx) => {
      await tx
        .update(schema.executions)
        .set({ status: succeeded ? "confirmed" : "reverted", blockNumber: r.blockNumber, gasUsed: r.gasUsed?.toString() ?? null, effectiveGasPrice: r.effectiveGasPrice?.toString() ?? null, safeSuccess: r.safeSuccess, receipt: { success: r.success, safeSuccess: r.safeSuccess, confirmations: r.confirmations } })
        .where(eq(schema.executions.id, e.id));
      await tx.update(schema.proposals).set({ status: succeeded ? "executed" : "failed" }).where(and(eq(schema.proposals.id, p.id), eq(schema.proposals.status, "submitted")));
      await audit(tx, { organizationId: p.organizationId, actorUserId: null, actorType: "system", action: succeeded ? "proposal.executed" : "proposal.failed", targetType: "proposal", targetId: p.id, data: { txHash: e.txHash, blockNumber: r.blockNumber?.toString() ?? null, receiptSuccess: r.success, safeSuccess: r.safeSuccess } });
    });
    await notifyRoles(deps, p.organizationId, ["owner", "admin", "finance", "approver"], {
      kind: succeeded ? "proposal.executed" : "proposal.failed",
      title: succeeded ? `Executed: ${p.title}` : `Execution failed: ${p.title}`,
      body: succeeded ? "Confirmed on-chain. Balances are being reconciled." : r.success ? "The transaction was mined but the Safe reported ExecutionFailure. No funds moved by the inner call; gas was spent." : "The transaction reverted. No funds moved; gas was spent.",
      link: `/app/approvals/${p.id}`,
      dedupeKey: `proposal:${p.id}:${succeeded ? "executed" : "failed"}:${e.txHash}`,
    });
    if (succeeded) {
      await syncAccount(deps, account);
      // Payment proposals settle their obligation occurrence once the transfer is confirmed.
      const action = p.action as { type: string; obligationId?: string; dueDate?: string; assetSymbol?: string; assetAmountRaw?: string; recipient?: string };
      if (action.type === "payment" && action.obligationId && action.dueDate) {
        const token = findTokenBySymbol(p.chainId, action.assetSymbol ?? "USDC");
        await deps.db
          .insert(schema.payments)
          .values({ organizationId: p.organizationId, obligationId: action.obligationId, dueDate: action.dueDate, status: "paid_verified", amount: p.amountUsd, assetSymbol: token?.symbol ?? null, tokenAmountRaw: action.assetAmountRaw ?? null, chainId: p.chainId, txHash: e.txHash, fromAddress: account.address, toAddress: action.recipient?.toLowerCase() ?? null, verifiedAt: deps.now(), proposalId: p.id, verification: { status: "verified", source: "safe_execution", safeTxHash: p.safeTxHash } })
          .onConflictDoNothing();
      }
    }
    await deps.boss?.send(EVALUATE_ORG, { orgId: p.organizationId }, { singletonKey: p.organizationId, singletonSeconds: 30 }).catch(() => undefined);
    return;
  }
}

export async function registerDataJobs(boss: PgBoss, deps: Deps) {
  for (const q of [SYNC_ALL, SYNC_ACCOUNT, REFRESH_PRICES, REFRESH_OPPORTUNITIES, TRACK_EXECUTION, TRACK_ALL_EXECUTIONS]) await boss.createQueue(q);

  await boss.work<{ accountId: string }>(SYNC_ACCOUNT, { batchSize: 1 }, async (jobs) => {
    for (const job of jobs) {
      const [a] = await deps.db.select().from(schema.treasuryAccounts).where(and(eq(schema.treasuryAccounts.id, job.data.accountId), isNull(schema.treasuryAccounts.archivedAt)));
      if (!a || a.verificationMethod === "sample") continue;
      await syncAccount(deps, a);
      await boss.send(EVALUATE_ORG, { orgId: a.organizationId }, { singletonKey: a.organizationId, singletonSeconds: 60 });
    }
  });
  await boss.work(SYNC_ALL, async () => {
    if (deps.env.disabled.has("sync")) return;
    const rows = await deps.db
      .select({ id: schema.treasuryAccounts.id })
      .from(schema.treasuryAccounts)
      .where(and(isNull(schema.treasuryAccounts.archivedAt), sql`coalesce(${schema.treasuryAccounts.verificationMethod}, '') <> 'sample'`));
    for (const r of rows) await boss.send(SYNC_ACCOUNT, { accountId: r.id }, { singletonKey: r.id, singletonSeconds: 240 });
  });
  await boss.work(REFRESH_PRICES, async () => refreshPrices(deps));
  await boss.work(REFRESH_OPPORTUNITIES, async () => {
    if (deps.env.disabled.has("opportunities")) return;
    await refreshOpportunities(deps);
  });
  await boss.work<{ proposalId: string }>(TRACK_EXECUTION, async (jobs) => {
    for (const job of jobs) await trackExecution(deps, job.data.proposalId);
  });
  await boss.work(TRACK_ALL_EXECUTIONS, async () => {
    const rows = await deps.db.select({ id: schema.proposals.id }).from(schema.proposals).where(eq(schema.proposals.status, "submitted"));
    for (const r of rows) await boss.send(TRACK_EXECUTION, { proposalId: r.id }, { singletonKey: r.id, singletonSeconds: 30 });
  });

  await boss.schedule(SYNC_ALL, "*/5 * * * *");
  await boss.schedule(REFRESH_PRICES, "*/5 * * * *");
  await boss.schedule(REFRESH_OPPORTUNITIES, "*/15 * * * *");
  await boss.schedule(TRACK_ALL_EXECUTIONS, "* * * * *");
  // Warm start so a fresh install has prices and venue data within a minute.
  await boss.send(REFRESH_PRICES, {}, { singletonKey: "boot", singletonSeconds: 120 });
  await boss.send(REFRESH_OPPORTUNITIES, {}, { singletonKey: "boot", singletonSeconds: 300 });
}
